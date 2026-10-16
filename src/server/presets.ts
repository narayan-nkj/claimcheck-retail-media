import type { CatalogItem } from '../contracts/v1/catalog.ts';
import type { EvidenceReference } from '../contracts/v1/evidence.ts';
import type { ClaimExtraction } from '../contracts/v1/claim.ts';

export interface PresetScenario {
  id: string;
  name: string;
  tagline: string;
  expectedVerdict: 'ALLOW' | 'REVIEW' | 'BLOCK';
  expectedReason: string;
  sku: string;
  adCopyText: string;
  catalogItem: CatalogItem;
  evidenceList: EvidenceReference[];
  explanation: string;
}

const NOW = new Date().toISOString();
const PAST_1HR = new Date(Date.now() - 3600 * 1000).toISOString();
const PAST_30MIN = new Date(Date.now() - 1800 * 1000).toISOString();
const FUTURE_30DAYS = new Date(Date.now() + 30 * 86400 * 1000).toISOString();

export const PRESET_SCENARIOS: Record<string, PresetScenario> = {
  golden_pass: {
    id: 'golden_pass',
    name: 'Golden Pass',
    tagline: 'Valid 25% Discount, In-Stock Inventory & Free 2-Day Delivery',
    expectedVerdict: 'ALLOW',
    expectedReason: 'MATCHES_APPROVED_FACTS',
    sku: 'SKU-VISION-55-OLED',
    adCopyText: 'Save 25% on the VisionView 55" 4K OLED Ultra Smart TV! Now $899.99. In stock with Free 2-Day Shipping!',
    catalogItem: {
      schemaVersion: '1.0.0',
      productId: 'prod-4k-tv-55',
      sku: 'SKU-VISION-55-OLED',
      title: 'VisionView 55" 4K OLED Ultra Smart TV',
      brand: 'VisionView',
      category: 'Consumer Electronics',
      pricing: {
        amount: 899.99,
        currency: 'USD',
        regularAmount: 1199.99,
        discountPercentage: 25,
        effectiveFrom: PAST_1HR,
        effectiveTo: FUTURE_30DAYS,
        sourceSnapshotId: 'snap-pricing-golden',
      },
      inventory: {
        stockStatus: 'IN_STOCK',
        availableQuantity: 42,
        leadTimeDays: 1,
        updatedAt: PAST_30MIN,
        warehouseLocation: 'Main Distribution Hub - Ohio',
      },
      shipping: [
        {
          carrierOrTier: 'FedEx Express 2-Day',
          minTransitDays: 2,
          maxTransitDays: 2,
          isFreeShipping: true,
          geoRestrictions: [],
          validThrough: FUTURE_30DAYS,
        },
      ],
      attributes: [
        { key: 'resolution', value: '4K OLED', standardizedValue: 'resolution' },
        { key: 'displayType', value: '4K OLED', standardizedValue: 'display' },
        { key: 'display_size', value: '55 inch', standardizedValue: 'size' },
      ],
      disclaimers: [],
      lastVerifiedAt: PAST_30MIN,
    },
    evidenceList: [
      {
        evidenceId: 'ev-golden-price',
        claimId: 'c1-price',
        sourceType: 'OPERATOR_ATTESTATION',
        sourceUri: 'https://admin.merchant.com/promotions/october-deals',
        snapshotTimestamp: PAST_30MIN,
        freshnessTtlSeconds: 86400,
        isFresh: true,
        expectedValue: 899.99,
        actualValue: 899.99,
        evidenceDigest: 'a'.repeat(64),
      },
      {
        evidenceId: 'ev-golden-inv',
        claimId: 'c2-stock',
        sourceType: 'INVENTORY_FEED',
        sourceUri: 'https://wms.merchant.com/api/v2/stock/SKU-VISION-55-OLED',
        snapshotTimestamp: PAST_30MIN,
        freshnessTtlSeconds: 3600,
        isFresh: true,
        expectedValue: 'IN_STOCK',
        actualValue: 42,
        evidenceDigest: 'b'.repeat(64),
      },
      {
        evidenceId: 'ev-golden-ship',
        claimId: 'c3-ship',
        sourceType: 'SHIPPING_SERVICE',
        sourceUri: 'https://api.fedex.com/rate/v1',
        snapshotTimestamp: PAST_30MIN,
        freshnessTtlSeconds: 86400,
        isFresh: true,
        expectedValue: 2,
        actualValue: 2,
        evidenceDigest: 'c'.repeat(64),
      },
    ],
    explanation: 'All extracted retail claims align with verified merchant facts, fresh stock counts, and carrier timelines. Clears deterministic publication gate immediately.',
  },

  deceptive_price: {
    id: 'deceptive_price',
    name: 'Deceptive Price',
    tagline: '50% Claimed Discount vs 25% Active Promotion',
    expectedVerdict: 'BLOCK',
    expectedReason: 'DISCOUNT_UNSUPPORTED',
    sku: 'SKU-CHAIR-ERG',
    adCopyText: 'Massive Clearance! 50% OFF the ErgoComfort Pro Mesh Office Chair today only. Lowest price guaranteed!',
    catalogItem: {
      schemaVersion: '1.0.0',
      productId: 'prod-chair-erg',
      sku: 'SKU-CHAIR-ERG',
      title: 'ErgoComfort Pro Mesh Office Chair',
      brand: 'ErgoComfort',
      category: 'Office Furniture',
      pricing: {
        amount: 224.99,
        currency: 'USD',
        regularAmount: 299.99,
        discountPercentage: 25, // Active discount is 25%, but copy claims 50%
        effectiveFrom: PAST_1HR,
        effectiveTo: FUTURE_30DAYS,
        sourceSnapshotId: 'snap-pricing-chair',
      },
      inventory: {
        stockStatus: 'IN_STOCK',
        availableQuantity: 80,
        leadTimeDays: 2,
        updatedAt: PAST_30MIN,
      },
      shipping: [
        {
          carrierOrTier: 'Standard Ground',
          minTransitDays: 3,
          maxTransitDays: 5,
          isFreeShipping: false,
          geoRestrictions: [],
          validThrough: FUTURE_30DAYS,
        },
      ],
      attributes: [
        { key: 'material', value: 'Breathable Mesh', standardizedValue: 'material' },
      ],
      disclaimers: [],
      lastVerifiedAt: PAST_30MIN,
    },
    evidenceList: [
      {
        evidenceId: 'ev-deceptive-promo',
        claimId: 'c1-price',
        sourceType: 'PROMOTION_ENGINE',
        sourceUri: 'https://promotions.internal/campaigns/q4-ergonomics',
        snapshotTimestamp: PAST_30MIN,
        freshnessTtlSeconds: 86400,
        isFresh: true,
        expectedValue: 50,
        actualValue: 25,
        evidenceDigest: 'd'.repeat(64),
      },
    ],
    explanation: 'Ad copy falsely claims a 50% discount when the promotion engine only authorizes 25%. Factual BLOCK prevents FTC deceptive pricing violations and protects merchant reputation.',
  },

  out_of_stock: {
    id: 'out_of_stock',
    name: 'Out of Stock',
    tagline: 'Stock Depletion Failure (0 Available Units in Warehouse)',
    expectedVerdict: 'BLOCK',
    expectedReason: 'PRODUCT_OUT_OF_STOCK',
    sku: 'SKU-MILK-ORG',
    adCopyText: 'FarmFresh Organic Whole Milk Gallon is back in stock! Buy now for same-day store pickup.',
    catalogItem: {
      schemaVersion: '1.0.0',
      productId: 'prod-milk-org',
      sku: 'SKU-MILK-ORG',
      title: 'FarmFresh Organic Whole Milk Gallon',
      brand: 'FarmFresh',
      category: 'Dairy & Refrigerated',
      pricing: {
        amount: 4.49,
        currency: 'USD',
        regularAmount: 4.49,
        discountPercentage: 0,
        effectiveFrom: PAST_1HR,
        effectiveTo: FUTURE_30DAYS,
        sourceSnapshotId: 'snap-pricing-milk',
      },
      inventory: {
        stockStatus: 'OUT_OF_STOCK',
        availableQuantity: 0, // 0 units
        leadTimeDays: 0,
        updatedAt: PAST_30MIN,
      },
      shipping: [
        {
          carrierOrTier: 'Same-Day Pickup',
          minTransitDays: 0,
          maxTransitDays: 0,
          isFreeShipping: true,
          geoRestrictions: [],
          validThrough: FUTURE_30DAYS,
        },
      ],
      attributes: [
        { key: 'fat_content', value: 'Whole', standardizedValue: 'fat_content' },
      ],
      disclaimers: [],
      lastVerifiedAt: PAST_30MIN,
    },
    evidenceList: [
      {
        evidenceId: 'ev-stockout-inv',
        claimId: 'c1-stock',
        sourceType: 'INVENTORY_FEED',
        sourceUri: 'https://inventory.pos.merchant.com/skus/SKU-MILK-ORG',
        snapshotTimestamp: PAST_30MIN,
        freshnessTtlSeconds: 900,
        isFresh: true,
        expectedValue: 'IN_STOCK',
        actualValue: 0,
        evidenceDigest: 'e'.repeat(64),
      },
    ],
    explanation: 'Real-time store inventory confirms zero units available. Promoting out-of-stock items wastes ad spend, annoys customers, and violates retailer marketplace policies.',
  },

  warehouse_contradiction: {
    id: 'warehouse_contradiction',
    name: 'Warehouse Contradiction / Expired',
    tagline: 'Conflicting Equal-Tier Feeds (Warehouse East 0 vs West 10)',
    expectedVerdict: 'REVIEW',
    expectedReason: 'AMBIGUOUS_CLAIM',
    sku: 'SKU-RUN-SHOE',
    adCopyText: 'Apex Carbon Fiber Road Running Shoes. In stock now with limited supply remaining!',
    catalogItem: {
      schemaVersion: '1.0.0',
      productId: 'prod-run-shoe',
      sku: 'SKU-RUN-SHOE',
      title: 'Apex Carbon Fiber Road Running Shoes',
      brand: 'Apex Athletics',
      category: 'Sporting Goods & Footwear',
      pricing: {
        amount: 149.99,
        currency: 'USD',
        regularAmount: 149.99,
        discountPercentage: 0,
        effectiveFrom: PAST_1HR,
        effectiveTo: FUTURE_30DAYS,
        sourceSnapshotId: 'snap-pricing-shoe',
      },
      inventory: {
        stockStatus: 'LOW_STOCK',
        availableQuantity: 5,
        leadTimeDays: 2,
        updatedAt: PAST_30MIN,
      },
      shipping: [
        {
          carrierOrTier: 'Standard 3-Day',
          minTransitDays: 2,
          maxTransitDays: 3,
          isFreeShipping: true,
          geoRestrictions: [],
          validThrough: FUTURE_30DAYS,
        },
      ],
      attributes: [
        { key: 'sole_material', value: 'Carbon Plate', standardizedValue: 'material' },
      ],
      disclaimers: [],
      lastVerifiedAt: PAST_30MIN,
    },
    evidenceList: [
      {
        evidenceId: 'ev-feed-east',
        claimId: 'c1-stock',
        sourceType: 'INVENTORY_FEED',
        sourceUri: 'https://warehouse-east.logistics/sku/SKU-RUN-SHOE',
        snapshotTimestamp: PAST_30MIN,
        freshnessTtlSeconds: 3600,
        isFresh: true,
        expectedValue: 'IN_STOCK',
        actualValue: 0, // East warehouse reports 0 units
        evidenceDigest: 'f'.repeat(64),
      },
      {
        evidenceId: 'ev-feed-west',
        claimId: 'c1-stock',
        sourceType: 'INVENTORY_FEED', // Equal precedence tier!
        sourceUri: 'https://warehouse-west.logistics/sku/SKU-RUN-SHOE',
        snapshotTimestamp: PAST_30MIN,
        freshnessTtlSeconds: 3600,
        isFresh: true,
        expectedValue: 'IN_STOCK',
        actualValue: 10, // West warehouse reports 10 units
        evidenceDigest: '0'.repeat(64),
      },
    ],
    explanation: 'Contradictory data from two equal-precedence inventory feeds fails-closed to human review. Automatic guessing without human verification is prohibited by DEC-007.',
  },
};

/**
 * Dynamically builds or maps corroborating evidence records for extracted claims.
 * Connects factual claims to catalog facts or preset contradiction scenarios.
 */
export function buildCorroboratingEvidence(
  claims: readonly ClaimExtraction[],
  catalog: CatalogItem,
  presetId?: string
): EvidenceReference[] {
  const now = new Date().toISOString();
  const evidenceList: EvidenceReference[] = [];

  for (let i = 0; i < claims.length; i++) {
    const claim = claims[i];
    const effectiveToTime = catalog.pricing.effectiveTo ? new Date(catalog.pricing.effectiveTo).getTime() : 0;
    const isImpendingExpiry = effectiveToTime > 0 && effectiveToTime - Date.now() < 3600 * 1000;

    if (claim.claimClass === 'PRICE_DISCOUNT' && (isImpendingExpiry || presetId === 'expiring_soon')) {
      evidenceList.push({
        evidenceId: `ev-exp-${claim.claimId}`,
        claimId: claim.claimId,
        sourceType: 'PROMOTION_ENGINE',
        sourceUri: `https://promotions.internal/flash/${catalog.sku}`,
        snapshotTimestamp: new Date(Date.now() - 85 * 1000).toISOString(),
        freshnessTtlSeconds: 100, // Age 85s -> 15s remaining (<= 20s warning window)
        isFresh: true,
        expectedValue: catalog.pricing.amount,
        actualValue: catalog.pricing.amount,
        evidenceDigest: '9'.repeat(64),
      });
      continue;
    }

    if (presetId === 'deceptive_price' && claim.claimClass === 'PRICE_DISCOUNT') {
      evidenceList.push({
        evidenceId: `ev-${claim.claimId}`,
        claimId: claim.claimId,
        sourceType: 'PROMOTION_ENGINE',
        sourceUri: 'https://promotions.internal/campaigns/q4-ergonomics',
        snapshotTimestamp: now,
        freshnessTtlSeconds: 86400,
        isFresh: true,
        expectedValue: 50,
        actualValue: 25,
        evidenceDigest: 'd'.repeat(64),
      });
      continue;
    }

    if (presetId === 'out_of_stock' && claim.claimClass === 'AVAILABILITY') {
      evidenceList.push({
        evidenceId: `ev-${claim.claimId}`,
        claimId: claim.claimId,
        sourceType: 'INVENTORY_FEED',
        sourceUri: 'https://inventory.pos.merchant.com/skus/SKU-MILK-ORG',
        snapshotTimestamp: now,
        freshnessTtlSeconds: 900,
        isFresh: true,
        expectedValue: 'IN_STOCK',
        actualValue: 0,
        evidenceDigest: 'e'.repeat(64),
      });
      continue;
    }

    if (presetId === 'warehouse_contradiction' && claim.claimClass === 'AVAILABILITY') {
      evidenceList.push({
        evidenceId: `ev-east-${claim.claimId}`,
        claimId: claim.claimId,
        sourceType: 'INVENTORY_FEED',
        sourceUri: 'https://warehouse-east.logistics/sku/SKU-RUN-SHOE',
        snapshotTimestamp: now,
        freshnessTtlSeconds: 3600,
        isFresh: true,
        expectedValue: 'IN_STOCK',
        actualValue: 0,
        evidenceDigest: 'f'.repeat(64),
      });
      evidenceList.push({
        evidenceId: `ev-west-${claim.claimId}`,
        claimId: claim.claimId,
        sourceType: 'INVENTORY_FEED',
        sourceUri: 'https://warehouse-west.logistics/sku/SKU-RUN-SHOE',
        snapshotTimestamp: now,
        freshnessTtlSeconds: 3600,
        isFresh: true,
        expectedValue: 'IN_STOCK',
        actualValue: 10,
        evidenceDigest: '0'.repeat(64),
      });
      continue;
    }

    // Default corroborating evidence
    switch (claim.claimClass) {
      case 'PRICE_DISCOUNT': {
        const expectedPrice = claim.extractedParameters.statedPrice ?? catalog.pricing.amount;
        evidenceList.push({
          evidenceId: `ev-${claim.claimId}`,
          claimId: claim.claimId,
          sourceType: 'OPERATOR_ATTESTATION',
          sourceUri: `https://pricing.merchant.internal/${catalog.sku}`,
          snapshotTimestamp: now,
          freshnessTtlSeconds: 86400,
          isFresh: true,
          expectedValue: expectedPrice,
          actualValue: catalog.pricing.amount,
          evidenceDigest: '1'.repeat(64),
        });
        break;
      }
      case 'AVAILABILITY': {
        evidenceList.push({
          evidenceId: `ev-${claim.claimId}`,
          claimId: claim.claimId,
          sourceType: 'INVENTORY_FEED',
          sourceUri: `https://inventory.wms.internal/${catalog.sku}`,
          snapshotTimestamp: now,
          freshnessTtlSeconds: 3600,
          isFresh: true,
          expectedValue: catalog.inventory.stockStatus,
          actualValue: catalog.inventory.availableQuantity,
          evidenceDigest: '2'.repeat(64),
        });
        break;
      }
      case 'SHIPPING_PROMISE': {
        evidenceList.push({
          evidenceId: `ev-${claim.claimId}`,
          claimId: claim.claimId,
          sourceType: 'SHIPPING_SERVICE',
          sourceUri: 'https://logistics.carrier.internal/routes',
          snapshotTimestamp: now,
          freshnessTtlSeconds: 86400,
          isFresh: true,
          expectedValue: catalog.shipping[0]?.minTransitDays ?? 2,
          actualValue: catalog.shipping[0]?.maxTransitDays ?? 2,
          evidenceDigest: '3'.repeat(64),
        });
        break;
      }
      case 'PRODUCT_ATTRIBUTE': {
        evidenceList.push({
          evidenceId: `ev-${claim.claimId}`,
          claimId: claim.claimId,
          sourceType: 'CATALOG_DATABASE',
          sourceUri: `https://pim.merchant.internal/attributes/${catalog.productId}`,
          snapshotTimestamp: now,
          freshnessTtlSeconds: 86400,
          isFresh: true,
          expectedValue: 'VERIFIED',
          actualValue: 'VERIFIED',
          evidenceDigest: '4'.repeat(64),
        });
        break;
      }
      default:
        break;
    }
  }

  return evidenceList;
}
