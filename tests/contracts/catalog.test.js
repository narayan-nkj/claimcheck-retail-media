import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateCatalogItem, CatalogItemSchema } from '../../src/contracts/v1/catalog.ts';

describe('CatalogItem Contract (v1)', () => {
  const validCatalogItem = {
    schemaVersion: '1.0.0',
    productId: 'prod-48219',
    sku: 'SKU-ULTRA-SOUNDBAR',
    title: 'AcousticWave Pro Soundbar 300W',
    brand: 'AcousticWave',
    category: 'Home Audio',
    pricing: {
      amount: 199.99,
      currency: 'USD',
      regularAmount: 249.99,
      discountPercentage: 20,
      effectiveFrom: '2026-10-01T00:00:00Z',
      effectiveTo: '2026-10-31T23:59:59Z',
      sourceSnapshotId: 'snap-pricing-20261015-001',
    },
    inventory: {
      stockStatus: 'IN_STOCK',
      availableQuantity: 142,
      leadTimeDays: 1,
      updatedAt: '2026-10-15T18:00:00Z',
      warehouseLocation: 'US-EAST-01',
    },
    shipping: [
      {
        carrierOrTier: 'Standard 2-Day Ground',
        cutoffTimeUtc: '14:00',
        minTransitDays: 2,
        maxTransitDays: 3,
        isFreeShipping: true,
        minSpendThreshold: 50.0,
        geoRestrictions: ['US-CONUS'],
        validThrough: '2026-12-31T23:59:59Z',
      },
    ],
    attributes: [
      { key: 'power_output_watts', value: '300' },
      { key: 'connectivity', value: 'Bluetooth 5.3, HDMI eARC, Optical' },
      { key: 'color', value: 'Matte Obsidian' },
    ],
    disclaimers: ['Free shipping applies to contiguous US addresses only.'],
    lastVerifiedAt: '2026-10-15T18:30:00Z',
  };

  it('validates a complete, compliant catalog item', () => {
    const parsed = validateCatalogItem(validCatalogItem);
    assert.equal(parsed.productId, 'prod-48219');
    assert.equal(parsed.pricing.amount, 199.99);
    assert.equal(parsed.inventory.stockStatus, 'IN_STOCK');
    assert.equal(parsed.shipping[0].isFreeShipping, true);
  });

  it('rejects payload with negative price', () => {
    const invalid = structuredClone(validCatalogItem);
    invalid.pricing.amount = -10.0;
    assert.throws(() => validateCatalogItem(invalid), /Current price amount must be >= 0/);
  });

  it('rejects unsupported currency code', () => {
    const invalid = structuredClone(validCatalogItem);
    invalid.pricing.currency = 'XYZ';
    assert.throws(() => validateCatalogItem(invalid));
  });

  it('rejects shipping fact where maxTransitDays < minTransitDays', () => {
    const invalid = structuredClone(validCatalogItem);
    invalid.shipping[0].minTransitDays = 5;
    invalid.shipping[0].maxTransitDays = 2;
    assert.throws(() => validateCatalogItem(invalid), /maxTransitDays must be greater than or equal to minTransitDays/);
  });

  it('fail-closed: rejects payload with unexpected extra keys (strict mode)', () => {
    const invalid = structuredClone(validCatalogItem);
    invalid.unauthorizedField = 'injection_test';
    assert.throws(() => validateCatalogItem(invalid));
  });

  it('rejects non-ISO-8601 timestamps', () => {
    const invalid = structuredClone(validCatalogItem);
    invalid.pricing.effectiveFrom = '10/01/2026 12:00';
    assert.throws(() => validateCatalogItem(invalid));
  });
});
