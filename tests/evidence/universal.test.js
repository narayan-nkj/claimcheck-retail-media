import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  detectProductInfo,
  synthesizeUniversalCatalogItem,
  synthesizeUniversalEvidence,
} from '../../src/evidence/universal.ts';
import { extractClaimsFallback } from '../../src/inference/fallback.ts';
import { evaluateAdCopyPolicy } from '../../src/policy/engine.ts';
import { createServer } from '../../src/server/app.ts';

describe('Universal Ad Verification Engine', () => {
  describe('Universal Category & Brand Recognition', () => {
    it('accurately identifies footwear and apparel products', () => {
      const copy = 'Special deal: Nike Air Zoom Pegasus 40 running shoes now $129.99 with Free Next-Day Delivery! In stock now.';
      const info = detectProductInfo(copy);
      assert.equal(info.category, 'Apparel & Footwear');
      assert.equal(info.brand, 'Nike');
    });

    it('accurately identifies consumer electronics products', () => {
      const copy = 'Get the Sony WH-1000XM5 Active Noise Cancelling Headphones for only $349.99 (save 15%). In stock!';
      const info = detectProductInfo(copy);
      assert.equal(info.category, 'Consumer Electronics');
      assert.equal(info.brand, 'Sony');
    });

    it('accurately identifies grocery and FMCG goods', () => {
      const copy = 'Starbucks Dark Roast Arabica Coffee Beans now $14.99 with 100% Organic beans.';
      const info = detectProductInfo(copy);
      assert.equal(info.category, 'Grocery & FMCG');
      assert.equal(info.brand, 'Starbucks');
    });

    it('accurately identifies beauty and personal care items', () => {
      const copy = 'L\'Oreal Revitalift Hyaluronic Acid Serum now $24.99 with SPF 30 protection.';
      const info = detectProductInfo(copy);
      assert.equal(info.category, 'Beauty & Personal Care');
      assert.equal(info.brand, 'L\'Oreal');
    });

    it('accurately identifies sporting goods and fitness gear', () => {
      const copy = 'Peloton Exercise Bike now $1199.99 with Free 2-Day Delivery! In stock.';
      const info = detectProductInfo(copy);
      assert.equal(info.category, 'Sporting Goods & Outdoors');
      assert.equal(info.brand, 'Peloton');
    });

    it('accurately identifies automotive and mobility items', () => {
      const copy = 'Tesla Wall Connector EV Charger 500W now $450. In stock ready to ship.';
      const info = detectProductInfo(copy);
      assert.equal(info.category, 'Automotive & Mobility');
      assert.equal(info.brand, 'Tesla');
    });
  });

  describe('Universal Catalog & Evidence Synthesis', () => {
    it('synthesizes schema-compliant catalog item and corroborating evidence for arbitrary ad', () => {
      const copy = 'Save 20% on Bose QuietComfort Ultra Headphones! Now $329.00 with Free 2-Day Delivery. In stock featuring Bluetooth 5.3.';
      const claims = extractClaimsFallback(copy);
      assert.ok(claims.length >= 3, `Expected at least 3 claims, found ${claims.length}`);

      const catalog = synthesizeUniversalCatalogItem(copy, claims);
      assert.equal(catalog.schemaVersion, '1.0.0');
      assert.equal(catalog.pricing.amount, 329.0);
      assert.equal(catalog.pricing.currency, 'USD');
      assert.equal(catalog.inventory.stockStatus, 'IN_STOCK');
      assert.equal(catalog.shipping[0].isFreeShipping, true);
      assert.equal(catalog.shipping[0].minTransitDays, 2);

      const evidence = synthesizeUniversalEvidence(claims, catalog);
      assert.equal(evidence.length, claims.length);

      const verdict = evaluateAdCopyPolicy({
        checkId: 'chk-univ-01',
        copyText: copy,
        catalog,
        claims,
        evidenceList: evidence,
      });

      assert.equal(verdict.compositeStatus, 'ALLOW');
      assert.ok(verdict.summary.includes('Publication cleared'));
    });

    it('enforces fail-closed BLOCK when simulating price mismatch on universal ad', () => {
      const copy = 'Nike Air Max 90 sneakers now $99.99 (save 40%)! In stock today.';
      const claims = extractClaimsFallback(copy);

      const catalog = synthesizeUniversalCatalogItem(copy, claims, {
        simulationMode: 'PRICE_MISMATCH',
      });
      const evidence = synthesizeUniversalEvidence(claims, catalog, {
        simulationMode: 'PRICE_MISMATCH',
      });

      const verdict = evaluateAdCopyPolicy({
        checkId: 'chk-univ-price',
        copyText: copy,
        catalog,
        claims,
        evidenceList: evidence,
      });

      assert.equal(verdict.compositeStatus, 'BLOCK');
      assert.ok(verdict.claimVerdicts.some((cv) => cv.primaryReason === 'PRICE_MISMATCH' || cv.primaryReason === 'DISCOUNT_UNSUPPORTED'));
    });

    it('enforces fail-closed BLOCK when simulating out of stock on universal ad', () => {
      const copy = 'FarmFresh Organic Milk 1 Gallon now $4.99. In stock with Free 2-Day Delivery.';
      const claims = extractClaimsFallback(copy);

      const catalog = synthesizeUniversalCatalogItem(copy, claims, {
        simulationMode: 'OUT_OF_STOCK',
      });
      const evidence = synthesizeUniversalEvidence(claims, catalog, {
        simulationMode: 'OUT_OF_STOCK',
      });

      const verdict = evaluateAdCopyPolicy({
        checkId: 'chk-univ-stock',
        copyText: copy,
        catalog,
        claims,
        evidenceList: evidence,
      });

      assert.equal(verdict.compositeStatus, 'BLOCK');
      assert.ok(verdict.claimVerdicts.some((cv) => cv.primaryReason === 'PRODUCT_OUT_OF_STOCK'));
    });

    it('enforces fail-closed REVIEW when simulating warehouse feed conflict on universal ad', () => {
      const copy = 'Ergonomic Standing Desk now $299.99. In stock now with Free 2-Day Delivery.';
      const claims = extractClaimsFallback(copy);

      const catalog = synthesizeUniversalCatalogItem(copy, claims, {
        simulationMode: 'FEED_CONTRADICTION',
      });
      const evidence = synthesizeUniversalEvidence(claims, catalog, {
        simulationMode: 'FEED_CONTRADICTION',
      });

      const verdict = evaluateAdCopyPolicy({
        checkId: 'chk-univ-feed',
        copyText: copy,
        catalog,
        claims,
        evidenceList: evidence,
      });

      assert.equal(verdict.compositeStatus, 'REVIEW');
    });
  });

  describe('HTTP Server End-to-End Universal Ad Verification', () => {
    let server;
    let baseUrl;

    it('initializes test server', async () => {
      server = createServer();
      await new Promise((res) => {
        server.listen(0, '127.0.0.1', () => {
          const addr = server.address();
          baseUrl = `http://127.0.0.1:${addr.port}`;
          res();
        });
      });
    });

    it('verifies custom ad copy for un-preset product and clears with ALLOW', async () => {
      const res = await fetch(`${baseUrl}/api/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adCopyText: 'Brand new Apple MacBook Air 15-inch M3 now $1299.00! In stock with Free 2-Day Delivery.',
          sku: 'UNIVERSAL_AUTO',
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.verdict.compositeStatus, 'ALLOW');
      assert.equal(data.catalogItem.brand, 'Apple');
      assert.equal(data.catalogItem.category, 'Consumer Electronics');
      assert.equal(data.catalogItem.pricing.amount, 1299.0);
    });

    it('verifies custom ad copy with simulated price mismatch returns BLOCK', async () => {
      const res = await fetch(`${baseUrl}/api/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adCopyText: 'Adidas Ultraboost Light running shoes now $140.00! In stock today.',
          sku: 'UNIVERSAL_AUTO',
          simulationMode: 'PRICE_MISMATCH',
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.verdict.compositeStatus, 'BLOCK');
    });

    it('closes test server', async () => {
      await new Promise((res) => server.close(res));
    });
  });
});
