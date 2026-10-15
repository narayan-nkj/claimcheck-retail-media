import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  redactSensitiveString,
  redactSensitiveData,
} from '../../src/evidence/redaction.ts';

describe('Evidence Redaction & Privacy Sanitizer', () => {
  it('redacts sensitive API keys and tokens from strings', () => {
    const textWithSecret = 'Configured upstream with Bearer secret-token-1234567890abcdef and sk-1234567890abcdef1234567890';
    const redacted = redactSensitiveString(textWithSecret);

    assert.doesNotMatch(redacted, /secret-token/);
    assert.match(redacted, /\[REDACTED_SECRET\]/);
  });

  it('redacts email addresses and credit cards from strings', () => {
    const textWithPii = 'Contact support at operator.admin@merchant-retail.com or card 4111 2222 3333 4444';
    const redacted = redactSensitiveString(textWithPii);

    assert.doesNotMatch(redacted, /operator\.admin@merchant-retail\.com/);
    assert.doesNotMatch(redacted, /4111 2222 3333 4444/);
    assert.match(redacted, /\[REDACTED_EMAIL\]/);
    assert.match(redacted, /\[REDACTED_CARD\]/);
  });

  it('recursively redacts sensitive keys from complex evidence objects', () => {
    const evidencePayload = {
      productId: 'prod-48219',
      publicTitle: 'AcousticWave Pro Soundbar',
      pricing: {
        retailPrice: 199.99,
        wholesale_cost: 110.0, // Sensitive
        profit_margin_pct: 45.0, // Sensitive
      },
      upstreamConnection: {
        apiKey: 'sk-9999999999999999999999', // Sensitive
        endpointUrl: 'https://api.merchant.com/v1',
      },
      tags: ['audio', 'soundbar'],
    };

    const sanitized = redactSensitiveData(evidencePayload);

    assert.equal(sanitized.productId, 'prod-48219');
    assert.equal(sanitized.publicTitle, 'AcousticWave Pro Soundbar');
    assert.equal(sanitized.pricing.retailPrice, 199.99);
    assert.equal(sanitized.pricing.wholesale_cost, '[REDACTED_CONFIDENTIAL]');
    assert.equal(sanitized.pricing.profit_margin_pct, '[REDACTED_CONFIDENTIAL]');
    assert.equal(sanitized.upstreamConnection.apiKey, '[REDACTED_CONFIDENTIAL]');
    assert.equal(sanitized.upstreamConnection.endpointUrl, 'https://api.merchant.com/v1');
  });
});
