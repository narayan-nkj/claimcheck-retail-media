import { z } from 'zod';
/**
 * Supported ISO-4217 Currency Codes for Retail Commerce
 */
export const CurrencyCodeSchema = z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY']);
/**
 * Stock availability status taxonomy
 */
export const StockStatusSchema = z.enum([
    'IN_STOCK',
    'OUT_OF_STOCK',
    'LOW_STOCK',
    'BACKORDER',
]);
/**
 * Price & discount fact contract
 */
export const PriceFactSchema = z
    .object({
    amount: z.number().nonnegative({ message: 'Current price amount must be >= 0' }),
    currency: CurrencyCodeSchema,
    regularAmount: z.number().nonnegative().optional(),
    discountPercentage: z.number().min(0).max(100).optional(),
    effectiveFrom: z.string().datetime({ message: 'effectiveFrom must be valid ISO-8601 UTC string' }),
    effectiveTo: z.string().datetime({ message: 'effectiveTo must be valid ISO-8601 UTC string' }).optional(),
    sourceSnapshotId: z.string().min(1, { message: 'sourceSnapshotId is required' }),
})
    .strict();
/**
 * Inventory stock fact contract
 */
export const InventoryFactSchema = z
    .object({
    stockStatus: StockStatusSchema,
    availableQuantity: z.number().int().nonnegative({ message: 'availableQuantity must be integer >= 0' }),
    leadTimeDays: z.number().int().nonnegative({ message: 'leadTimeDays must be integer >= 0' }),
    updatedAt: z.string().datetime({ message: 'updatedAt must be valid ISO-8601 UTC string' }),
    warehouseLocation: z.string().max(100).optional(),
})
    .strict();
/**
 * Shipping policy & promise fact contract
 */
export const ShippingFactSchema = z
    .object({
    carrierOrTier: z.string().min(1).max(100),
    cutoffTimeUtc: z
        .string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'cutoffTimeUtc must match HH:mm format' })
        .optional(),
    minTransitDays: z.number().int().nonnegative(),
    maxTransitDays: z.number().int().nonnegative(),
    isFreeShipping: z.boolean(),
    minSpendThreshold: z.number().nonnegative().optional(),
    geoRestrictions: z.array(z.string().min(2).max(20)).default([]),
    validThrough: z.string().datetime({ message: 'validThrough must be valid ISO-8601 UTC string' }),
})
    .strict()
    .refine((data) => data.maxTransitDays >= data.minTransitDays, {
    message: 'maxTransitDays must be greater than or equal to minTransitDays',
    path: ['maxTransitDays'],
});
/**
 * Product attribute fact contract
 */
export const ProductAttributeFactSchema = z
    .object({
    key: z.string().min(1).max(100),
    value: z.string().min(1).max(500),
    standardizedValue: z.string().max(500).optional(),
})
    .strict();
/**
 * Top-level Catalog Item Fact Contract
 */
export const CatalogItemSchema = z
    .object({
    schemaVersion: z.literal('1.0.0'),
    productId: z.string().min(1).max(64),
    sku: z.string().min(1).max(64),
    title: z.string().min(1).max(200),
    brand: z.string().min(1).max(100),
    category: z.string().min(1).max(100),
    pricing: PriceFactSchema,
    inventory: InventoryFactSchema,
    shipping: z.array(ShippingFactSchema).min(1, { message: 'At least one shipping policy required' }),
    attributes: z.array(ProductAttributeFactSchema).default([]),
    disclaimers: z.array(z.string().max(300)).default([]),
    lastVerifiedAt: z.string().datetime({ message: 'lastVerifiedAt must be valid ISO-8601 UTC string' }),
})
    .strict();
/**
 * Validator function with fail-closed error handling
 */
export function validateCatalogItem(payload) {
    return CatalogItemSchema.parse(payload);
}
