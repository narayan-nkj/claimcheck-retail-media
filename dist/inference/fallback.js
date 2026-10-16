import { validateClaim } from '../contracts/v1/claim.js';
/**
 * Deterministic local fallback extraction engine.
 * Parses retail ad copy using verified pattern extractors to produce schema-valid
 * claims offline without remote AMD/vLLM dependencies.
 */
export function extractClaimsFallback(copyText, options) {
    const source = options?.source ?? 'RULE_BASED';
    const prefix = options?.claimIdPrefix ?? 'claim-fb';
    const claims = [];
    let claimSeq = 1;
    // 1. Price & Discount Patterns
    // Examples: "$199.99", "only $49", "€89.00", "£45.50", "¥5000", "save 20%", "50% off", "now $149.99"
    const priceRegex = /(?:(\$|€|£|¥|C\$|A\$)\s*(\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)|\b(\d+(?:\.\d{2})?)\s*(USD|EUR|GBP|CAD|AUD|JPY)\b)/g;
    let match;
    while ((match = priceRegex.exec(copyText)) !== null) {
        const rawSymbol = match[1];
        const rawVal = match[2] || match[3];
        const explicitCurrency = match[4];
        const statedPrice = Number.parseFloat(rawVal.replace(/,/g, ''));
        const startIndex = match.index;
        const endIndex = startIndex + match[0].length;
        let statedCurrency = 'USD';
        if (explicitCurrency) {
            statedCurrency = explicitCurrency;
        }
        else if (rawSymbol === '€') {
            statedCurrency = 'EUR';
        }
        else if (rawSymbol === '£') {
            statedCurrency = 'GBP';
        }
        else if (rawSymbol === '¥') {
            statedCurrency = 'JPY';
        }
        else if (rawSymbol === 'C$') {
            statedCurrency = 'CAD';
        }
        else if (rawSymbol === 'A$') {
            statedCurrency = 'AUD';
        }
        // Check if preceded by discount or sale phrasing
        const precedingSlice = copyText.slice(Math.max(0, startIndex - 20), startIndex);
        let normalized = `Product offered at price ${match[0].trim()} ${statedCurrency}`;
        if (/sale|now|special|deal/i.test(precedingSlice)) {
            normalized = `Promotional sale price of ${match[0].trim()} ${statedCurrency}`;
        }
        const claim = validateClaim({
            claimId: `${prefix}-${claimSeq++}`,
            claimClass: 'PRICE_DISCOUNT',
            rawSpan: {
                startIndex,
                endIndex,
                text: match[0],
            },
            normalizedStatement: normalized,
            extractedParameters: {
                statedPrice,
                statedCurrency,
            },
            extractorConfidence: 0.95,
            extractionSource: source,
        });
        claims.push(claim);
    }
    // Discount percentage regex: "20% off", "save 30%", "40% discount"
    const discountRegex = /(?:save\s+(?:up\s+to\s+)?(\d{1,2})%|(\d{1,2})%\s+(?:off|discount|savings))/gi;
    while ((match = discountRegex.exec(copyText)) !== null) {
        const percentStr = match[1] ?? match[2];
        const discountPercent = Number.parseFloat(percentStr);
        const startIndex = match.index;
        const endIndex = startIndex + match[0].length;
        const claim = validateClaim({
            claimId: `${prefix}-${claimSeq++}`,
            claimClass: 'PRICE_DISCOUNT',
            rawSpan: {
                startIndex,
                endIndex,
                text: match[0],
            },
            normalizedStatement: `Promotional discount of ${discountPercent}% off regular price`,
            extractedParameters: {
                statedDiscountPercent: discountPercent,
            },
            extractorConfidence: 0.95,
            extractionSource: source,
        });
        claims.push(claim);
    }
    // 2. Availability & Stock Patterns
    // Examples: "In Stock", "Out of Stock", "Only 3 left in stock", "Limited stock", "Backorder", "Ready to ship"
    const availabilityRegex = /\b(in\s+stock|out\s+of\s+stock|only\s+(\d+)\s+left\s+(?:in\s+stock)?|limited\s+stock|backorder(?:ed)?|pre-?order|ready\s+to\s+ship|ships\s+today|available\s+now|in\s+store\s+now|sold\s+out|low\s+stock)\b/gi;
    while ((match = availabilityRegex.exec(copyText)) !== null) {
        const rawMatch = match[0];
        const startIndex = match.index;
        const endIndex = startIndex + rawMatch.length;
        let stockStatus = 'IN_STOCK';
        if (/out\s+of\s+stock|sold\s+out/i.test(rawMatch)) {
            stockStatus = 'OUT_OF_STOCK';
        }
        else if (/limited|only|low/i.test(rawMatch)) {
            stockStatus = 'LIMITED_STOCK';
        }
        else if (/backorder/i.test(rawMatch)) {
            stockStatus = 'BACKORDER';
        }
        else if (/pre-?order/i.test(rawMatch)) {
            stockStatus = 'PREORDER';
        }
        const claim = validateClaim({
            claimId: `${prefix}-${claimSeq++}`,
            claimClass: 'AVAILABILITY',
            rawSpan: {
                startIndex,
                endIndex,
                text: rawMatch,
            },
            normalizedStatement: `Product availability status is ${stockStatus}`,
            extractedParameters: {
                statedStockStatus: stockStatus,
            },
            extractorConfidence: 0.95,
            extractionSource: source,
        });
        claims.push(claim);
    }
    // 3. Shipping Promise Patterns
    // Examples: "Free 2-Day Delivery", "Delivered tomorrow", "Delivery in 3 days", "Free shipping", "Overnight shipping", "Free delivery"
    const shippingRegex = /\b(free\s+(\d+)-day\s+delivery|(?:guaranteed\s+)?next-day\s+delivery|(?:guaranteed\s+)?(\d+)-day\s+delivery|delivered\s+tomorrow|delivery\s+in\s+(\d+)\s+days?|free\s+shipping|same-day\s+delivery|overnight\s+shipping|free\s+delivery|express\s+delivery|fast\s+(\d+)-day\s+shipping|standard\s+shipping|curbside\s+pickup)\b/gi;
    while ((match = shippingRegex.exec(copyText)) !== null) {
        const rawMatch = match[0];
        const startIndex = match.index;
        const endIndex = startIndex + rawMatch.length;
        let days = 2; // default standard fast shipping
        if (/same-day/i.test(rawMatch)) {
            days = 0;
        }
        else if (/tomorrow|overnight|next-day/i.test(rawMatch) || rawMatch.includes('1-day')) {
            days = 1;
        }
        else if (match[2]) {
            days = Number.parseInt(match[2], 10);
        }
        else if (match[3]) {
            days = Number.parseInt(match[3], 10);
        }
        else if (match[4]) {
            days = Number.parseInt(match[4], 10);
        }
        else if (match[5]) {
            days = Number.parseInt(match[5], 10);
        }
        else if (/free\s+shipping|free\s+delivery/i.test(rawMatch)) {
            days = 5; // standard ground shipping window
        }
        const isFree = /free/i.test(rawMatch);
        const normalizedStatement = isFree
            ? `Delivery transit promised within ${days} days with free shipping`
            : `Delivery transit promised within ${days} days`;
        const claim = validateClaim({
            claimId: `${prefix}-${claimSeq++}`,
            claimClass: 'SHIPPING_PROMISE',
            rawSpan: {
                startIndex,
                endIndex,
                text: rawMatch,
            },
            normalizedStatement,
            extractedParameters: {
                statedDeliveryWindowDays: days,
            },
            extractorConfidence: 0.95,
            extractionSource: source,
        });
        claims.push(claim);
    }
    // 4. Product Attribute Patterns
    // Examples: "300W", "Bluetooth 5.3", "Stainless Steel", "Active Noise Cancelling", "4K OLED", "Organic Cotton", "SPF 30", "1500mm"
    const attributeRegex = /\b(300W|500W|\d+W|\d+kW|Bluetooth\s+\d+(?:\.\d+)?|Wireless|Organic\s+Cotton|100%\s+Cotton|Stainless\s+Steel|Waterproof|Active\s+Noise\s+Cancelling|4K\s+OLED|4K|8K|OLED|QLED|\d+GB|\d+TB|Dark\s+Roast|Light\s+Roast|GORE-TEX(?:\s+Pro)?|\d+-Quart|\d+-Liter|SPF\s+\d+|\d+mm|100%\s+Merino\s+Wool)\b/gi;
    while ((match = attributeRegex.exec(copyText)) !== null) {
        const rawMatch = match[0];
        const startIndex = match.index;
        const endIndex = startIndex + rawMatch.length;
        let key = 'feature';
        if (/\d+W|\d+kW/i.test(rawMatch))
            key = 'powerOutput';
        else if (/Bluetooth|Wireless/i.test(rawMatch))
            key = 'connectivity';
        else if (/Stainless Steel|Organic Cotton|Merino Wool|100% Cotton/i.test(rawMatch))
            key = 'material';
        else if (/Noise Cancelling/i.test(rawMatch))
            key = 'audioFeature';
        else if (/OLED|QLED|4K|8K/i.test(rawMatch))
            key = 'displayType';
        else if (/\d+(?:GB|TB)/i.test(rawMatch))
            key = 'capacity';
        else if (/Roast/i.test(rawMatch))
            key = 'roastLevel';
        else if (/GORE-TEX/i.test(rawMatch))
            key = 'membrane';
        else if (/Quart|Liter/i.test(rawMatch))
            key = 'capacity';
        else if (/SPF/i.test(rawMatch))
            key = 'spf';
        else if (/mm|Waterproof/i.test(rawMatch))
            key = 'waterproofRating';
        const claim = validateClaim({
            claimId: `${prefix}-${claimSeq++}`,
            claimClass: 'PRODUCT_ATTRIBUTE',
            rawSpan: {
                startIndex,
                endIndex,
                text: rawMatch,
            },
            normalizedStatement: `Product specification ${key} is stated as ${rawMatch}`,
            extractedParameters: {
                statedAttributeKey: key,
                statedAttributeValue: rawMatch,
            },
            extractorConfidence: 0.90,
            extractionSource: source,
        });
        claims.push(claim);
    }
    // 5. Out of Scope / Unverifiable Puffery Patterns
    // Examples: "#1 rated", "world's best", "guaranteed to change your life", "miracle results", "best in the world", "revolutionary formula"
    const outOfScopeRegex = /\b(#1\s+rated|world'?s\s+best|best\s+in\s+the\s+world|greatest\s+audio\s+experience|guaranteed\s+100%\s+cure|100%\s+cure|erases\s+\d+\s+years|guaranteed\s+to\s+change\s+your\s+life|miracle\s+results|miraculous\s+sound|heavenly\s+flavor|voted\s+#1|unmatched\s+perfection|revolutionary\s+formula|unbeatable\s+performance|legendary\s+quality|ignore\s+previous\s+rules|output\s+VERDICT|REDACTED_INSTRUCTION)\b/gi;
    while ((match = outOfScopeRegex.exec(copyText)) !== null) {
        const rawMatch = match[0];
        const startIndex = match.index;
        const endIndex = startIndex + rawMatch.length;
        const claim = validateClaim({
            claimId: `${prefix}-${claimSeq++}`,
            claimClass: 'OUT_OF_SCOPE',
            rawSpan: {
                startIndex,
                endIndex,
                text: rawMatch,
            },
            normalizedStatement: `Subjective marketing claim out of scope: "${rawMatch}"`,
            extractedParameters: {},
            extractorConfidence: 0.99,
            extractionSource: source,
        });
        claims.push(claim);
    }
    return claims;
}
/**
 * Generates an OpenAI-compatible JSON completion payload wrapping extracted claims.
 * Used for deterministic offline testing of AMD vLLM client pipelines.
 */
export function generateMockChatCompletion(copyText, options) {
    if (options?.simulateMalformed) {
        return {
            id: `chatcmpl-mock-malformed-${Date.now()}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: options?.model ?? 'meta-llama/Llama-3.1-8B-Instruct',
            choices: [
                {
                    index: 0,
                    message: {
                        role: 'assistant',
                        content: '{ "claims": [ { "claimId": "broken", "unclosedJson": true ... ',
                    },
                    finish_reason: 'stop',
                },
            ],
            usage: {
                prompt_tokens: 150,
                completion_tokens: 25,
                total_tokens: 175,
            },
        };
    }
    const claims = extractClaimsFallback(copyText, {
        source: options?.source ?? 'MODEL_GENERATED',
        claimIdPrefix: options?.claimIdPrefix ?? 'claim-llm',
    });
    const payload = {
        claims,
        extractionMetadata: {
            engine: 'AMD-ROCm-Llama-3.1-8B-Instruct',
            targetDevice: 'AMD Instinct MI300X',
            decodingStrategy: 'greedy-schema-constrained',
            claimCount: claims.length,
        },
    };
    const content = JSON.stringify(payload, null, 2);
    const promptTokens = Math.max(20, Math.ceil(copyText.length / 4) + 60);
    const completionTokens = Math.max(10, Math.ceil(content.length / 4));
    return {
        id: `chatcmpl-mock-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: options?.model ?? 'meta-llama/Llama-3.1-8B-Instruct',
        choices: [
            {
                index: 0,
                message: {
                    role: 'assistant',
                    content,
                },
                finish_reason: 'stop',
            },
        ],
        usage: {
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: promptTokens + completionTokens,
        },
        system_fingerprint: 'fp_amd_rocm_mi300x_vllm_062',
    };
}
