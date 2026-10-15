import { z } from 'zod';
import { CurrencyCodeSchema } from './catalog.ts';

/**
 * Explicit supported claim classes for ClaimCheck
 * Any claim outside the 4 core factual classes is marked OUT_OF_SCOPE
 * and routes directly to human review (fail-closed).
 */
export const ClaimClassSchema = z.enum([
  'PRICE_DISCOUNT',
  'AVAILABILITY',
  'SHIPPING_PROMISE',
  'PRODUCT_ATTRIBUTE',
  'OUT_OF_SCOPE',
]);
export type ClaimClass = z.infer<typeof ClaimClassSchema>;

/**
 * Text span coordinates linking the extracted claim to exact characters in ad copy
 */
export const TextSpanSchema = z
  .object({
    startIndex: z.number().int().nonnegative(),
    endIndex: z.number().int().nonnegative(),
    text: z.string().min(1).max(500),
  })
  .strict()
  .refine((data) => data.endIndex > data.startIndex, {
    message: 'endIndex must be strictly greater than startIndex',
    path: ['endIndex'],
  });
export type TextSpan = z.infer<typeof TextSpanSchema>;

/**
 * Origin of claim extraction
 */
export const ExtractionSourceSchema = z.enum([
  'MODEL_GENERATED',
  'OPERATOR_ENTERED',
  'RULE_BASED',
]);
export type ExtractionSource = z.infer<typeof ExtractionSourceSchema>;

/**
 * Strongly-typed parameters extracted from copy for comparison against catalog
 */
export const ExtractedParametersSchema = z
  .object({
    statedPrice: z.number().nonnegative().optional(),
    statedCurrency: CurrencyCodeSchema.optional(),
    statedDiscountPercent: z.number().min(0).max(100).optional(),
    statedStockStatus: z.string().optional(),
    statedDeliveryWindowDays: z.number().int().nonnegative().optional(),
    statedAttributeKey: z.string().optional(),
    statedAttributeValue: z.string().optional(),
  })
  .strict();
export type ExtractedParameters = z.infer<typeof ExtractedParametersSchema>;

/**
 * Claim Extraction Contract
 */
export const ClaimExtractionSchema = z
  .object({
    claimId: z.string().min(1).max(64),
    claimClass: ClaimClassSchema,
    rawSpan: TextSpanSchema,
    normalizedStatement: z.string().min(1).max(500),
    extractedParameters: ExtractedParametersSchema.default({}),
    extractorConfidence: z.number().min(0).max(1.0),
    extractionSource: ExtractionSourceSchema,
  })
  .strict();
export type ClaimExtraction = z.infer<typeof ClaimExtractionSchema>;

/**
 * Validator function for extracted claims
 */
export function validateClaim(payload: unknown): ClaimExtraction {
  return ClaimExtractionSchema.parse(payload);
}
