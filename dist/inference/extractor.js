import { validateClaim } from '../contracts/v1/claim.js';
import { AMDInferenceClient } from './client.js';
import { extractClaimsFallback } from './fallback.js';
import { buildExtractionMessages, sanitizeAdCopyInput, } from './prompts.js';
/**
 * Strips markdown code blocks and preambles from raw LLM output to extract pure JSON.
 */
function cleanJsonOutput(raw) {
    let cleaned = raw.trim();
    // Strip markdown ```json ... ``` code fences
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
    }
    // If there's leading or trailing text around JSON object, find outermost { ... }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }
    return cleaned;
}
/**
 * Aligns and verifies character span coordinates against the actual ad copy string.
 * Adjusts shifted indices or clamps to ensure TextSpanSchema validity.
 */
function alignSpanCoordinates(rawSpan, sourceText) {
    const { startIndex, endIndex, text } = rawSpan;
    // Case 1: Exact match at provided coordinates
    if (sourceText.slice(startIndex, endIndex) === text) {
        return { startIndex, endIndex, text };
    }
    // Case 2: Substring exists elsewhere in the text (model hallucinated or shifted index)
    const foundIndex = sourceText.indexOf(text);
    if (foundIndex !== -1) {
        return {
            startIndex: foundIndex,
            endIndex: foundIndex + text.length,
            text,
        };
    }
    // Case 3: Fuzzy recovery - if indices are within bounds and span has non-zero length
    const safeStart = Math.max(0, Math.min(startIndex, sourceText.length - 1));
    const safeEnd = Math.max(safeStart + 1, Math.min(endIndex, sourceText.length));
    const actualSlice = sourceText.slice(safeStart, safeEnd);
    return {
        startIndex: safeStart,
        endIndex: safeEnd,
        text: actualSlice.length > 0 ? actualSlice : sourceText.slice(0, Math.min(10, sourceText.length)),
    };
}
/**
 * Extracts structured claims from retail ad copy using AMD ROCm / vLLM.
 * Enforces strict schema constraints, DEC-009 policy authority restrictions,
 * and fail-closed malformed output recovery.
 */
export async function extractClaims(copyText, options) {
    const startTime = Date.now();
    const warnings = [];
    const client = options?.client ?? new AMDInferenceClient({ useFallback: true });
    const sanitizedCopy = sanitizeAdCopyInput(copyText);
    const wasSanitized = sanitizedCopy !== copyText;
    // If empty or pure whitespace copy provided
    if (sanitizedCopy.trim().length === 0) {
        return {
            claims: [],
            metadata: {
                extractionTimeMs: Date.now() - startTime,
                source: 'RULE_BASED',
                fallbackUsed: false,
                model: client.config.modelName,
                sanitized: wasSanitized,
            },
            warnings: ['Empty or whitespace-only ad copy provided. Zero claims extracted.'],
        };
    }
    let response;
    let fallbackUsed = client.isFallbackActive();
    try {
        const messages = buildExtractionMessages(sanitizedCopy);
        response = await client.generateChatCompletion({
            messages,
            model: client.config.modelName,
            temperature: 0.0,
            response_format: { type: 'json_object' },
        }, options?.correlationContext);
    }
    catch (err) {
        // If client failed and fallback recovery is permitted
        if (options?.failClosedOnMalformed !== false) {
            warnings.push(`Inference call failed: ${err.message}. Activating deterministic fallback adapter.`);
            const fallbackClaims = extractClaimsFallback(sanitizedCopy, { source: 'RULE_BASED' });
            return {
                claims: fallbackClaims,
                metadata: {
                    extractionTimeMs: Date.now() - startTime,
                    source: 'RULE_BASED',
                    fallbackUsed: true,
                    model: client.config.modelName,
                    sanitized: wasSanitized,
                },
                warnings,
            };
        }
        throw err;
    }
    const rawContent = response.choices[0]?.message?.content ?? '';
    let parsedJson;
    try {
        const cleaned = cleanJsonOutput(rawContent);
        parsedJson = JSON.parse(cleaned);
    }
    catch (parseErr) {
        warnings.push(`Malformed JSON from LLM: ${parseErr.message}. Recovering via fail-closed safe fallback.`);
        // Fail-closed recovery: Extract via fallback adapter to avoid system crash
        const fallbackClaims = extractClaimsFallback(sanitizedCopy, { source: 'RULE_BASED' });
        if (fallbackClaims.length === 0) {
            // If even fallback finds no factual patterns, route whole copy to OUT_OF_SCOPE
            fallbackClaims.push(validateClaim({
                claimId: 'claim-malformed-fallback',
                claimClass: 'OUT_OF_SCOPE',
                rawSpan: {
                    startIndex: 0,
                    endIndex: Math.min(sanitizedCopy.length, 500),
                    text: sanitizedCopy.slice(0, Math.min(sanitizedCopy.length, 500)),
                },
                normalizedStatement: 'Unparseable LLM output routed to human review',
                extractedParameters: {},
                extractorConfidence: 0.0,
                extractionSource: 'RULE_BASED',
            }));
        }
        return {
            claims: fallbackClaims,
            metadata: {
                extractionTimeMs: Date.now() - startTime,
                source: 'RULE_BASED',
                fallbackUsed: true,
                model: client.config.modelName,
                sanitized: wasSanitized,
            },
            warnings,
        };
    }
    // Enforce DEC-009: Strip any attempted smuggled verdict or approval flags
    if ('verdict' in parsedJson || 'status' in parsedJson || 'isApproved' in parsedJson) {
        warnings.push('DEC-009 ENFORCEMENT: Model attempted to grant approval or verdict. Removed authority flags.');
        delete parsedJson.verdict;
        delete parsedJson.status;
        delete parsedJson.isApproved;
    }
    const rawClaimsList = Array.isArray(parsedJson.claims) ? parsedJson.claims : [];
    const validatedClaims = [];
    for (let i = 0; i < rawClaimsList.length; i++) {
        const rawClaim = rawClaimsList[i];
        // DEC-009: Strip approval from individual claim objects
        delete rawClaim.verdict;
        delete rawClaim.status;
        delete rawClaim.approved;
        // Span alignment verification
        if (rawClaim.rawSpan && typeof rawClaim.rawSpan === 'object') {
            const span = rawClaim.rawSpan;
            rawClaim.rawSpan = alignSpanCoordinates(span, sanitizedCopy);
        }
        else {
            // Create a valid default span if missing
            rawClaim.rawSpan = {
                startIndex: 0,
                endIndex: Math.min(sanitizedCopy.length, 10),
                text: sanitizedCopy.slice(0, Math.min(sanitizedCopy.length, 10)),
            };
        }
        // Default extraction source to MODEL_GENERATED
        if (!rawClaim.extractionSource) {
            rawClaim.extractionSource = 'MODEL_GENERATED';
        }
        try {
            const validated = validateClaim(rawClaim);
            validatedClaims.push(validated);
        }
        catch (schemaErr) {
            warnings.push(`Claim #${i + 1} rejected by schema: ${schemaErr.message}. Dropping invalid claim.`);
        }
    }
    // If the model produced zero valid claims but the copy is non-empty, check fallback
    if (validatedClaims.length === 0 && sanitizedCopy.trim().length > 0) {
        const fallbackClaims = extractClaimsFallback(sanitizedCopy, { source: 'RULE_BASED' });
        if (fallbackClaims.length > 0) {
            warnings.push('LLM produced 0 claims; recovered factual claims via deterministic fallback adapter.');
            validatedClaims.push(...fallbackClaims);
            fallbackUsed = true;
        }
    }
    return {
        claims: validatedClaims,
        metadata: {
            extractionTimeMs: Date.now() - startTime,
            source: validatedClaims[0]?.extractionSource === 'RULE_BASED'
                ? 'RULE_BASED'
                : (validatedClaims[0]?.extractionSource === 'MODEL_GENERATED'
                    ? 'MODEL_GENERATED'
                    : (fallbackUsed ? 'RULE_BASED' : 'MODEL_GENERATED')),
            fallbackUsed,
            model: client.config.modelName,
            sanitized: wasSanitized,
            rawTokens: response.usage
                ? {
                    promptTokens: response.usage.prompt_tokens,
                    completionTokens: response.usage.completion_tokens,
                    totalTokens: response.usage.total_tokens,
                }
                : undefined,
        },
        warnings,
    };
}
