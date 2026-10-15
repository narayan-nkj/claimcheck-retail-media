import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateClaim } from '../../src/contracts/v1/claim.ts';

describe('Claim Extraction Contract (v1)', () => {
  const validPriceClaim = {
    claimId: 'claim-001-price',
    claimClass: 'PRICE_DISCOUNT',
    rawSpan: {
      startIndex: 12,
      endIndex: 27,
      text: 'now only $199.99',
    },
    normalizedStatement: 'Product price is $199.99 USD',
    extractedParameters: {
      statedPrice: 199.99,
      statedCurrency: 'USD',
    },
    extractorConfidence: 0.98,
    extractionSource: 'MODEL_GENERATED',
  };

  it('validates a correct price claim extraction', () => {
    const parsed = validateClaim(validPriceClaim);
    assert.equal(parsed.claimClass, 'PRICE_DISCOUNT');
    assert.equal(parsed.extractedParameters.statedPrice, 199.99);
    assert.equal(parsed.extractorConfidence, 0.98);
  });

  it('validates OUT_OF_SCOPE claim routing', () => {
    const outOfScopeClaim = {
      claimId: 'claim-002-award',
      claimClass: 'OUT_OF_SCOPE',
      rawSpan: {
        startIndex: 0,
        endIndex: 24,
        text: 'Voted #1 Soundbar of 2026',
      },
      normalizedStatement: 'Subjective ranking award claim',
      extractedParameters: {},
      extractorConfidence: 0.85,
      extractionSource: 'MODEL_GENERATED',
    };
    const parsed = validateClaim(outOfScopeClaim);
    assert.equal(parsed.claimClass, 'OUT_OF_SCOPE');
  });

  it('rejects TextSpan when endIndex <= startIndex', () => {
    const invalid = structuredClone(validPriceClaim);
    invalid.rawSpan.startIndex = 20;
    invalid.rawSpan.endIndex = 15;
    assert.throws(() => validateClaim(invalid), /endIndex must be strictly greater than startIndex/);
  });

  it('rejects confidence score out of [0, 1] range', () => {
    const invalid = structuredClone(validPriceClaim);
    invalid.extractorConfidence = 1.25;
    assert.throws(() => validateClaim(invalid));
  });

  it('rejects unknown claimClass to enforce fail-closed scope', () => {
    const invalid = structuredClone(validPriceClaim);
    invalid.claimClass = 'ARBITRARY_PROMISE';
    assert.throws(() => validateClaim(invalid));
  });

  it('fail-closed: rejects unexpected extra fields (strict schema)', () => {
    const invalid = structuredClone(validPriceClaim);
    invalid.extraHiddenProperty = true;
    assert.throws(() => validateClaim(invalid));
  });
});
