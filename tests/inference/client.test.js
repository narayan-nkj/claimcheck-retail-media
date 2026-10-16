import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  AMDInferenceClient,
  AMDInferenceError,
} from '../../src/inference/client.ts';
import {
  loadAMDInferenceConfig,
  getSanitizedConfig,
} from '../../src/inference/config.ts';
import {
  extractClaimsFallback,
  generateMockChatCompletion,
} from '../../src/inference/fallback.ts';
import { createCorrelationContext } from '../../src/audit/telemetry.ts';

describe('AMD Inference Client & Runtime Configuration (Phase 01)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.AMD_VLLM_ENDPOINT;
    delete process.env.AMD_API_KEY;
    delete process.env.AMD_MODEL_NAME;
    delete process.env.AMD_INFERENCE_TIMEOUT_MS;
    delete process.env.AMD_USE_FALLBACK;
    delete process.env.AMD_MAX_RETRIES;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('Configuration & Credentials', () => {
    it('initializes with production AMD defaults', () => {
      const config = loadAMDInferenceConfig();
      assert.equal(config.endpoint, 'http://localhost:8000/v1');
      assert.equal(config.modelName, 'meta-llama/Llama-3.1-8B-Instruct');
      assert.equal(config.timeoutMs, 2000);
      assert.equal(config.maxRetries, 3);
      assert.equal(config.useFallback, false);
      assert.equal(config.temperature, 0.0);
      assert.equal(config.targetDevice, 'AMD Instinct MI300X (ROCm 6.2)');
    });

    it('loads configuration overrides from environment variables', () => {
      process.env.AMD_VLLM_ENDPOINT = 'https://amd-rocm.cluster.internal:8000/v1';
      process.env.AMD_API_KEY = 'secret-rocm-token-1234567890';
      process.env.AMD_MODEL_NAME = 'meta-llama/Llama-3.1-8B-Instruct';
      process.env.AMD_INFERENCE_TIMEOUT_MS = '1500';
      process.env.AMD_USE_FALLBACK = 'true';
      process.env.AMD_MAX_RETRIES = '5';

      const config = loadAMDInferenceConfig();
      assert.equal(config.endpoint, 'https://amd-rocm.cluster.internal:8000/v1');
      assert.equal(config.apiKey, 'secret-rocm-token-1234567890');
      assert.equal(config.timeoutMs, 1500);
      assert.equal(config.useFallback, true);
      assert.equal(config.maxRetries, 5);
    });

    it('redacts sensitive API keys and tokens in sanitized config representation', () => {
      const config = loadAMDInferenceConfig({
        apiKey: 'bearer-token-secret-99999',
      });
      const sanitized = getSanitizedConfig(config);
      assert.equal(sanitized.apiKey, '[REDACTED]');
      assert.equal(sanitized.modelName, 'meta-llama/Llama-3.1-8B-Instruct');
    });

    it('rejects invalid endpoint URLs', () => {
      assert.throws(
        () => loadAMDInferenceConfig({ endpoint: 'not-a-valid-url' }),
        /Invalid url/i
      );
    });
  });

  describe('Deterministic Local Fallback Adapter', () => {
    it('extracts multi-claim retail ad copy into schema-compliant claim structures', () => {
      const adCopy =
        'Special Sale! AcousticWave Soundbar now $199.99 (save 20%). In Stock with Free 2-Day Delivery! Featuring 300W power and Bluetooth 5.3.';

      const claims = extractClaimsFallback(adCopy);
      assert.ok(claims.length >= 4, `Expected at least 4 claims, got ${claims.length}`);

      // Verify Price & Discount claims
      const priceClaim = claims.find(
        (c) => c.claimClass === 'PRICE_DISCOUNT' && c.extractedParameters.statedPrice === 199.99
      );
      assert.ok(priceClaim, 'Should extract price of 199.99');
      assert.equal(priceClaim.extractedParameters.statedCurrency, 'USD');
      assert.equal(adCopy.slice(priceClaim.rawSpan.startIndex, priceClaim.rawSpan.endIndex), priceClaim.rawSpan.text);

      const discountClaim = claims.find(
        (c) => c.claimClass === 'PRICE_DISCOUNT' && c.extractedParameters.statedDiscountPercent === 20
      );
      assert.ok(discountClaim, 'Should extract 20% discount');

      // Verify Availability claim
      const availClaim = claims.find((c) => c.claimClass === 'AVAILABILITY');
      assert.ok(availClaim, 'Should extract availability claim');
      assert.equal(availClaim.extractedParameters.statedStockStatus, 'IN_STOCK');

      // Verify Shipping claim
      const shipClaim = claims.find((c) => c.claimClass === 'SHIPPING_PROMISE');
      assert.ok(shipClaim, 'Should extract shipping claim');
      assert.equal(shipClaim.extractedParameters.statedDeliveryWindowDays, 2);

      // Verify Product Attribute claim
      const attrClaim = claims.find((c) => c.claimClass === 'PRODUCT_ATTRIBUTE');
      assert.ok(attrClaim, 'Should extract product attribute claim');
    });

    it('routes subjective and unverifiable puffery to OUT_OF_SCOPE', () => {
      const adCopy = 'Try our soundbar! Voted #1 rated soundbar in the world and guaranteed to change your life!';
      const claims = extractClaimsFallback(adCopy);

      const outOfScope = claims.filter((c) => c.claimClass === 'OUT_OF_SCOPE');
      assert.ok(outOfScope.length >= 1, 'Should detect out-of-scope puffery');
      assert.ok(outOfScope[0].normalizedStatement.includes('Subjective marketing claim out of scope'));
    });

    it('generates OpenAI-compatible mock chat completion payload with token usage metrics', () => {
      const copy = 'Only $49.99. In Stock and delivered tomorrow.';
      const completion = generateMockChatCompletion(copy);

      assert.equal(completion.object, 'chat.completion');
      assert.equal(completion.choices.length, 1);
      assert.equal(completion.choices[0].finish_reason, 'stop');
      assert.ok(completion.usage.prompt_tokens > 0);
      assert.ok(completion.usage.completion_tokens > 0);
      assert.equal(
        completion.usage.total_tokens,
        completion.usage.prompt_tokens + completion.usage.completion_tokens
      );

      const parsed = JSON.parse(completion.choices[0].message.content);
      assert.ok(Array.isArray(parsed.claims));
      assert.ok(parsed.claims.length >= 2);
    });
  });

  describe('AMDInferenceClient Execution & Error Handling', () => {
    it('executes seamlessly via deterministic fallback when fallback is configured', async () => {
      const client = new AMDInferenceClient({ useFallback: true });
      assert.equal(client.isFallbackActive(), true);

      const context = createCorrelationContext();
      const response = await client.generateChatCompletion(
        {
          messages: [
            { role: 'system', content: 'You are a claim extraction model.' },
            { role: 'user', content: 'Only $89.99. Free shipping.' },
          ],
        },
        context
      );

      assert.equal(response.object, 'chat.completion');
      assert.equal(response.model, 'meta-llama/Llama-3.1-8B-Instruct');
      const parsed = JSON.parse(response.choices[0].message.content);
      assert.ok(Array.isArray(parsed.claims));
    });

    it('throws typed AMDInferenceError when remote endpoint is unreachable and fallback is disabled', async () => {
      // Point to an invalid, unreachable local port
      const client = new AMDInferenceClient({
        endpoint: 'http://127.0.0.1:59999/v1',
        useFallback: false,
        timeoutMs: 300,
      });

      await assert.rejects(
        async () => {
          await client.generateChatCompletion({
            messages: [{ role: 'user', content: 'Test ad copy' }],
          });
        },
        (err) => {
          assert.ok(err instanceof AMDInferenceError);
          assert.ok(err.code === 'CONNECTION_FAILED' || err.code === 'TIMEOUT');
          return true;
        }
      );
    });

    it('reports health status and provides verifiable AMD device proof', async () => {
      const fallbackClient = new AMDInferenceClient({ useFallback: true });
      const health = await fallbackClient.checkHealth();
      assert.equal(health.healthy, true);
      assert.equal(health.fallbackActive, true);
      assert.equal(health.status, 'FALLBACK_LOCAL_ADAPTER');

      const proof = fallbackClient.getDeviceProof();
      assert.equal(proof.targetDevice, 'AMD Instinct MI300X (ROCm 6.2)');
      assert.equal(proof.modelName, 'meta-llama/Llama-3.1-8B-Instruct');
      assert.equal(proof.rocmVersion, '6.2.0-rc2');
      assert.ok(proof.timestamp);
    });
  });
});
