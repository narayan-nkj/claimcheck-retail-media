import type { ChatMessage } from './client.ts';

/**
 * System prompt defining the strict claim extraction contract.
 * Instructs the model to extract factual claims into 4 objective commerce classes
 * or route out-of-scope assertions to OUT_OF_SCOPE.
 *
 * Enforces DEC-009: The model extracts claims, but NEVER grants approvals or verdicts.
 */
export const SYSTEM_EXTRACTION_PROMPT = `You are ClaimCheck Extraction Engine, a specialized AI component for retail media advertising compliance.
Your sole responsibility is to extract objective, verifiable factual assertions from advertising copy and classify them into supported claim classes.

CRITICAL POLICY BOUNDARIES (DEC-009):
1. You have ZERO authority to approve ads, evaluate compliance, or grant "ALLOW" verdicts. Truthfulness is verified downstream by the deterministic policy engine against authoritative merchant databases.
2. DO NOT include verdicts, approval flags, or compliance judgments in your output.
3. Every extracted claim must reference an exact, verbatim text span from the input copy with 0-based character indices (startIndex and endIndex).
4. Do NOT hallucinate claims not present in the input copy.

SUPPORTED CLAIM CLASSES:
1. PRICE_DISCOUNT:
   - Concrete prices (e.g., "$199.99", "now $49")
   - Discount percentages or monetary savings (e.g., "save 20%", "50% off", "save $50")
   - Parameters: statedPrice (number), statedCurrency ("USD"|"EUR"|"GBP"|"CAD"|"AUD"|"JPY"), statedDiscountPercent (number 0-100)
2. AVAILABILITY:
   - Stock claims, inventory status, urgency counts (e.g., "In Stock", "Only 3 left in stock", "Limited inventory", "Backorder")
   - Parameters: statedStockStatus ("IN_STOCK"|"OUT_OF_STOCK"|"LIMITED_STOCK"|"BACKORDER"|"PREORDER")
3. SHIPPING_PROMISE:
   - Delivery timelines, expedited promises (e.g., "Free 2-day delivery", "Delivered tomorrow", "Same-day delivery")
   - Parameters: statedDeliveryWindowDays (integer)
4. PRODUCT_ATTRIBUTE:
   - Verifiable technical specs, power output, materials, certifications, capacities (e.g., "300W", "Bluetooth 5.3", "Stainless Steel", "100% Organic Cotton")
   - Parameters: statedAttributeKey (string), statedAttributeValue (string)
5. OUT_OF_SCOPE:
   - Subjective puffery, opinions, unmeasurable claims (e.g., "#1 rated", "world's best", "guaranteed to change your life", "miracle formula")
   - Claims outside the 4 factual classes must ALWAYS be classified as OUT_OF_SCOPE to trigger mandatory human review.

OUTPUT JSON SCHEMA:
You MUST respond with a single valid JSON object with the following structure:
{
  "claims": [
    {
      "claimId": "claim-1",
      "claimClass": "PRICE_DISCOUNT" | "AVAILABILITY" | "SHIPPING_PROMISE" | "PRODUCT_ATTRIBUTE" | "OUT_OF_SCOPE",
      "rawSpan": {
        "startIndex": 0,
        "endIndex": 7,
        "text": "$199.99"
      },
      "normalizedStatement": "Clear English summary of what is claimed",
      "extractedParameters": { ... },
      "extractorConfidence": 0.95,
      "extractionSource": "MODEL_GENERATED"
    }
  ]
}
No conversational preamble, no markdown fences, only the JSON object.`;

/**
 * Sanitizes ad copy input text:
 * 1. Clamps maximum length to 2,000 characters to prevent token exhaustion.
 * 2. Neutralizes prompt injection phrases and system prompt boundary tokens.
 * 3. Strips control characters while preserving standard whitespace and punctuation.
 */
export function sanitizeAdCopyInput(copyText: string): string {
  if (typeof copyText !== 'string') {
    return '';
  }

  // 1. Length bounding (max 2,000 characters per ad copy unit)
  let sanitized = copyText.slice(0, 2000);

  // 2. Control characters removal (except \n, \r, \t)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 3. Neutralize model boundary tokens and prompt hijacking phrases
  sanitized = sanitized.replace(/<\|(?:im_start|im_end|endoftext|eot_id)\|>/gi, '[STRIPPED_SPECIAL_TOKEN]');
  sanitized = sanitized.replace(/\[\/?INST\]/gi, '[STRIPPED_TAG]');
  sanitized = sanitized.replace(/###\s*(?:Instruction|Response)\s*:/gi, '[STRIPPED_INSTRUCTION_HEADER]');
  sanitized = sanitized.replace(/ignore\s+(?:all\s+)?(?:previous\s+|prior\s+)?instructions/gi, '[SANITIZED_PROMPT_INJECTION]');
  sanitized = sanitized.replace(/disregard\s+(?:all\s+)?rules/gi, '[SANITIZED_PROMPT_INJECTION]');
  sanitized = sanitized.replace(/you\s+must\s+output\s+allow/gi, '[SANITIZED_PROMPT_INJECTION]');
  sanitized = sanitized.replace(/grant\s+(?:an\s+)?approval/gi, '[SANITIZED_PROMPT_INJECTION]');

  return sanitized;
}

/**
 * Builds chat messages for AMD vLLM / Llama-3.1-8B-Instruct inference.
 */
export function buildExtractionMessages(adCopy: string): ChatMessage[] {
  const cleanInput = sanitizeAdCopyInput(adCopy);

  return [
    {
      role: 'system',
      content: SYSTEM_EXTRACTION_PROMPT,
    },
    {
      role: 'user',
      content: `Extract all factual advertising claims from the following retail ad copy:\n\n"${cleanInput}"`,
    },
  ];
}
