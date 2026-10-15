import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computePayloadDigest,
  createIngestionProvenance,
  appendProvenanceStep,
} from '../../src/evidence/provenance.ts';

describe('Evidence Provenance and Chain-of-Custody', () => {
  it('computes consistent, deterministic SHA-256 payload digest', () => {
    const payload = { sku: 'SKU-001', price: 99.99, currency: 'USD' };
    const digest1 = computePayloadDigest(payload);
    const digest2 = computePayloadDigest(payload);

    assert.equal(digest1, digest2);
    assert.match(digest1, /^[a-f0-9]{64}$/);
  });

  it('initializes ingestion provenance with valid initial chain step', () => {
    const rawPayload = { inventoryCount: 150, warehouse: 'US-CENTRAL' };
    const record = createIngestionProvenance({
      evidenceId: 'ev-prov-100',
      sourceType: 'INVENTORY_FEED',
      originUri: 'api.merchant.com/v1/inventory/warehouse-central',
      ingestionBatchId: 'batch-20261016-01',
      rawPayload,
      actor: 'inventory-sync-service',
      timestamp: '2026-10-16T12:00:00Z',
    });

    assert.equal(record.evidenceId, 'ev-prov-100');
    assert.equal(record.chainOfCustody.length, 1);
    assert.equal(record.chainOfCustody[0].action, 'INGESTED');
    assert.equal(record.chainOfCustody[0].inputDigest, record.rawPayloadDigest);
  });

  it('appends transformation steps maintaining cryptographic linkage', () => {
    const rawPayload = { price: '199.99', currency: 'usd' };
    const record = createIngestionProvenance({
      evidenceId: 'ev-prov-101',
      sourceType: 'CATALOG_DATABASE',
      originUri: 'db://catalog/items/101',
      ingestionBatchId: 'batch-01',
      rawPayload,
      actor: 'catalog-ingest',
      timestamp: '2026-10-16T12:00:00Z',
    });

    // Step 2: Normalization
    const normalizedPayload = { amount: 199.99, currency: 'USD' };
    const updatedRecord = appendProvenanceStep(record, {
      action: 'NORMALIZED',
      actor: 'normalizer-service',
      newPayload: normalizedPayload,
      timestamp: '2026-10-16T12:00:02Z',
    });

    assert.equal(updatedRecord.chainOfCustody.length, 2);
    // Linkage check: Step 2 inputDigest must equal Step 1 outputDigest
    assert.equal(
      updatedRecord.chainOfCustody[1].inputDigest,
      updatedRecord.chainOfCustody[0].outputDigest
    );
    assert.equal(updatedRecord.chainOfCustody[1].action, 'NORMALIZED');
  });
});
