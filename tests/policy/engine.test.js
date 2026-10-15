import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateClaimAgainstEvidence,
  evaluateAdCopyPolicy,
} from '../../src/policy/engine.ts';

describe('Deterministic Policy Engine', () => {
  const baseTime = '2026-10-16T12:00:00Z';

  const mockCatalog = {
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
      sourceSnapshotId: 'snap-pricing-001',
    },
    inventory: {
      stockStatus: 'IN_STOCK',
      availableQuantity: 45,
      leadTimeDays: 1,
      updatedAt: '2026-10-16T11:00:00Z',
    },
    shipping: [
      {
        carrierOrTier: 'Standard 2-Day',
        minTransitDays: 2,
        maxTransitDays: 2,
        isFreeShipping: true,
        geoRestrictions: ['US-CONUS'],
        validThrough: '2026-12-31T23:59:59Z',
      },
    ],
    attributes: [
      { key: 'power_output', value: '300W' },
      { key: 'color', value: 'Matte Obsidian' },
    ],
    disclaimers: [],
    lastVerifiedAt: '2026-10-16T11:00:00Z',
  };

  const validEvidencePrice = {
    evidenceId: 'ev-price-01',
    claimId: 'claim-price-1',
    sourceType: 'CATALOG_DATABASE',
    sourceUri: 'catalog://item-01/price',
    snapshotTimestamp: '2026-10-16T11:30:00Z',
    freshnessTtlSeconds: 86400,
    isFresh: true,
    expectedValue: 199.99,
    actualValue: 199.99,
    evidenceDigest: '1'.repeat(64),
  };

  describe('Price & Discount Evaluation', () => {
    it('produces ALLOW when stated price matches active approved price', () => {
      const claim = {
        claimId: 'claim-price-1',
        claimClass: 'PRICE_DISCOUNT',
        rawSpan: { startIndex: 0, endIndex: 15, text: 'Only $199.99' },
        normalizedStatement: 'Price is $199.99',
        extractedParameters: { statedPrice: 199.99, statedCurrency: 'USD' },
        extractorConfidence: 0.99,
        extractionSource: 'MODEL_GENERATED',
      };

      const verdict = evaluateClaimAgainstEvidence(claim, mockCatalog, [validEvidencePrice], { asOf: baseTime });
      assert.equal(verdict.status, 'ALLOW');
      assert.equal(verdict.primaryReason, 'MATCHES_APPROVED_FACTS');
    });

    it('produces BLOCK (PRICE_MISMATCH) when copy claims a false lower price', () => {
      const claim = {
        claimId: 'claim-price-1',
        claimClass: 'PRICE_DISCOUNT',
        rawSpan: { startIndex: 0, endIndex: 15, text: 'Only $149.99' },
        normalizedStatement: 'Price is $149.99',
        extractedParameters: { statedPrice: 149.99, statedCurrency: 'USD' },
        extractorConfidence: 0.99,
        extractionSource: 'MODEL_GENERATED',
      };

      const verdict = evaluateClaimAgainstEvidence(claim, mockCatalog, [validEvidencePrice], { asOf: baseTime });
      assert.equal(verdict.status, 'BLOCK');
      assert.equal(verdict.primaryReason, 'PRICE_MISMATCH');
      assert.match(verdict.detail, /lower than the active merchant catalog price/);
    });

    it('produces BLOCK (DISCOUNT_UNSUPPORTED) when copy claims 50% discount but active is 20%', () => {
      const claim = {
        claimId: 'claim-price-1',
        claimClass: 'PRICE_DISCOUNT',
        rawSpan: { startIndex: 0, endIndex: 15, text: 'Save 50% today' },
        normalizedStatement: 'Discount is 50%',
        extractedParameters: { statedDiscountPercent: 50 },
        extractorConfidence: 0.98,
        extractionSource: 'MODEL_GENERATED',
      };

      const verdict = evaluateClaimAgainstEvidence(claim, mockCatalog, [validEvidencePrice], { asOf: baseTime });
      assert.equal(verdict.status, 'BLOCK');
      assert.equal(verdict.primaryReason, 'DISCOUNT_UNSUPPORTED');
    });
  });

  describe('Availability & Stock Evaluation', () => {
    it('produces BLOCK (PRODUCT_OUT_OF_STOCK) when inventory confirms 0 units', () => {
      const oosCatalog = structuredClone(mockCatalog);
      oosCatalog.inventory.stockStatus = 'OUT_OF_STOCK';
      oosCatalog.inventory.availableQuantity = 0;

      const claim = {
        claimId: 'claim-stock-1',
        claimClass: 'AVAILABILITY',
        rawSpan: { startIndex: 0, endIndex: 10, text: 'In stock now' },
        normalizedStatement: 'Item is in stock',
        extractedParameters: { statedStockStatus: 'IN_STOCK' },
        extractorConfidence: 0.97,
        extractionSource: 'MODEL_GENERATED',
      };

      const stockEvidence = {
        evidenceId: 'ev-stock-01',
        claimId: 'claim-stock-1',
        sourceType: 'INVENTORY_FEED',
        sourceUri: 'inventory://live/stock',
        snapshotTimestamp: '2026-10-16T11:50:00Z',
        freshnessTtlSeconds: 900,
        isFresh: true,
        expectedValue: 'IN_STOCK',
        actualValue: 'OUT_OF_STOCK',
        evidenceDigest: '2'.repeat(64),
      };

      const verdict = evaluateClaimAgainstEvidence(claim, oosCatalog, [stockEvidence], { asOf: baseTime });
      assert.equal(verdict.status, 'BLOCK');
      assert.equal(verdict.primaryReason, 'PRODUCT_OUT_OF_STOCK');
    });
  });

  describe('Shipping Promise Evaluation', () => {
    it('produces BLOCK when copy claims 1-day delivery but fastest carrier is 2 days', () => {
      const claim = {
        claimId: 'claim-ship-1',
        claimClass: 'SHIPPING_PROMISE',
        rawSpan: { startIndex: 0, endIndex: 18, text: 'Arrives in 1 day!' },
        normalizedStatement: 'Delivery within 1 day',
        extractedParameters: { statedDeliveryWindowDays: 1 },
        extractorConfidence: 0.95,
        extractionSource: 'MODEL_GENERATED',
      };

      const shipEvidence = {
        evidenceId: 'ev-ship-01',
        claimId: 'claim-ship-1',
        sourceType: 'SHIPPING_SERVICE',
        sourceUri: 'shipping://carrier/rates',
        snapshotTimestamp: '2026-10-16T10:00:00Z',
        freshnessTtlSeconds: 43200,
        isFresh: true,
        expectedValue: 2,
        actualValue: 2,
        evidenceDigest: '3'.repeat(64),
      };

      const verdict = evaluateClaimAgainstEvidence(claim, mockCatalog, [shipEvidence], { asOf: baseTime });
      assert.equal(verdict.status, 'BLOCK');
      assert.equal(verdict.primaryReason, 'SHIPPING_TIMELINE_UNSUPPORTED');
    });
  });

  describe('Out of Scope Claims', () => {
    it('routes subjective claims to REVIEW (OUT_OF_SCOPE_CLAIM)', () => {
      const claim = {
        claimId: 'claim-subj-1',
        claimClass: 'OUT_OF_SCOPE',
        rawSpan: { startIndex: 0, endIndex: 20, text: 'Rated the best soundbar' },
        normalizedStatement: 'Subjective top rating claim',
        extractedParameters: {},
        extractorConfidence: 0.90,
        extractionSource: 'MODEL_GENERATED',
      };

      const verdict = evaluateClaimAgainstEvidence(claim, mockCatalog, [], { asOf: baseTime });
      assert.equal(verdict.status, 'REVIEW');
      assert.equal(verdict.primaryReason, 'OUT_OF_SCOPE_CLAIM');
    });
  });

  describe('Top-Level evaluateAdCopyPolicy', () => {
    it('synthesizes overall BLOCK if any claim contradicts merchant facts', () => {
      const validClaim = {
        claimId: 'c1',
        claimClass: 'PRICE_DISCOUNT',
        rawSpan: { startIndex: 0, endIndex: 5, text: '$199' },
        normalizedStatement: 'Price $199.99',
        extractedParameters: { statedPrice: 199.99 },
        extractorConfidence: 0.99,
        extractionSource: 'MODEL_GENERATED',
      };

      const invalidClaim = {
        claimId: 'c2',
        claimClass: 'SHIPPING_PROMISE',
        rawSpan: { startIndex: 6, endIndex: 20, text: 'Next hour delivery' },
        normalizedStatement: 'Delivery in 0 days',
        extractedParameters: { statedDeliveryWindowDays: 0 },
        extractorConfidence: 0.95,
        extractionSource: 'MODEL_GENERATED',
      };

      const evPrice = { ...validEvidencePrice, claimId: 'c1' };
      const evShip = {
        evidenceId: 'ev-c2',
        claimId: 'c2',
        sourceType: 'SHIPPING_SERVICE',
        sourceUri: 'carrier://tier',
        snapshotTimestamp: '2026-10-16T11:00:00Z',
        freshnessTtlSeconds: 43200,
        isFresh: true,
        expectedValue: 2,
        actualValue: 2,
        evidenceDigest: '9'.repeat(64),
      };

      const overall = evaluateAdCopyPolicy({
        checkId: 'chk-composite-01',
        copyText: 'Buy for $199 with Next hour delivery!',
        catalog: mockCatalog,
        claims: [validClaim, invalidClaim],
        evidenceList: [evPrice, evShip],
        options: { asOf: baseTime },
      });

      assert.equal(overall.compositeStatus, 'BLOCK');
      assert.match(overall.summary, /Publication blocked/);
    });
  });
});
