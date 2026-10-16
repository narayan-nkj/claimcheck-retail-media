import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractClaims } from '../../src/inference/extractor.ts';
import { AMDInferenceClient } from '../../src/inference/client.ts';
import { validateClaim } from '../../src/contracts/v1/claim.ts';

describe('Structured Claim Extraction & Schema Constraints (Phase 02)', () => {
  const fallbackClient = new AMDInferenceClient({ useFallback: true });

  it('extracts multi-claim retail ad copy into validated ClaimExtraction objects', async () => {
    const adCopy =
      'SoundMax Soundbar now $199.99 (save 20%). In Stock with Free 2-Day Delivery! Features 300W peak output.';

    const result = await extractClaims(adCopy, { client: fallbackClient });

    assert.ok(result.claims.length >= 4, `Expected at least 4 claims, got ${result.claims.length}`);
    assert.equal(result.metadata.source, 'MODEL_GENERATED');
    assert.ok(result.metadata.extractionTimeMs >= 0);

    for (const claim of result.claims) {
      // Validate every extracted claim against Zod ClaimExtractionSchema
      const validated = validateClaim(claim);
      assert.ok(validated.claimId);

      // Verify span coordinates against original text
      const slice = adCopy.slice(claim.rawSpan.startIndex, claim.rawSpan.endIndex);
      assert.equal(
        slice,
        claim.rawSpan.text,
        `Span mismatch: expected "${claim.rawSpan.text}", got "${slice}"`
      );
    }

    const price = result.claims.find((c) => c.claimClass === 'PRICE_DISCOUNT' && c.extractedParameters.statedPrice === 199.99);
    assert.ok(price, 'Price discount claim extracted');

    const stock = result.claims.find((c) => c.claimClass === 'AVAILABILITY');
    assert.ok(stock, 'Availability claim extracted');
    assert.equal(stock.extractedParameters.statedStockStatus, 'IN_STOCK');

    const shipping = result.claims.find((c) => c.claimClass === 'SHIPPING_PROMISE');
    assert.ok(shipping, 'Shipping promise claim extracted');
    assert.equal(shipping.extractedParameters.statedDeliveryWindowDays, 2);

    const attr = result.claims.find((c) => c.claimClass === 'PRODUCT_ATTRIBUTE');
    assert.ok(attr, 'Product attribute claim extracted');
    assert.equal(attr.extractedParameters.statedAttributeValue, '300W');
  });

  it('handles empty or whitespace-only ad copy without throwing', async () => {
    const emptyResult = await extractClaims('   \n  \t  ', { client: fallbackClient });
    assert.equal(emptyResult.claims.length, 0);
    assert.equal(emptyResult.warnings.length, 1);
  });

  it('cleans markdown code fences and extracts pure JSON payload', async () => {
    // Custom mock client that returns markdown fences
    const mockFenceClient = {
      config: fallbackClient.config,
      isFallbackActive: () => false,
      generateChatCompletion: async () => ({
        id: 'chatcmpl-fence-test',
        object: 'chat.completion',
        created: 123456,
        model: 'meta-llama/Llama-3.1-8B-Instruct',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content:
                '```json\n{\n  "claims": [\n    {\n      "claimId": "claim-fence-1",\n      "claimClass": "PRICE_DISCOUNT",\n      "rawSpan": { "startIndex": 0, "endIndex": 6, "text": "$49.99" },\n      "normalizedStatement": "Price is $49.99 USD",\n      "extractedParameters": { "statedPrice": 49.99, "statedCurrency": "USD" },\n      "extractorConfidence": 0.98,\n      "extractionSource": "MODEL_GENERATED"\n    }\n  ]\n}\n```',
            },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 50, completion_tokens: 40, total_tokens: 90 },
      }),
    };

    const copy = '$49.99 Special';
    const result = await extractClaims(copy, { client: mockFenceClient });

    assert.equal(result.claims.length, 1);
    assert.equal(result.claims[0].claimClass, 'PRICE_DISCOUNT');
    assert.equal(result.claims[0].extractedParameters.statedPrice, 49.99);
  });

  it('re-aligns shifted or inaccurate span coordinates to match text boundaries', async () => {
    // Inaccurate start and end indices in mock LLM response
    const mockShiftedClient = {
      config: fallbackClient.config,
      isFallbackActive: () => false,
      generateChatCompletion: async () => ({
        id: 'chatcmpl-shift-test',
        object: 'chat.completion',
        created: 123456,
        model: 'meta-llama/Llama-3.1-8B-Instruct',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify({
                claims: [
                  {
                    claimId: 'claim-shift-1',
                    claimClass: 'AVAILABILITY',
                    rawSpan: { startIndex: 0, endIndex: 8, text: 'In Stock' }, // "In Stock" is not at index 0
                    normalizedStatement: 'Product is in stock',
                    extractedParameters: { statedStockStatus: 'IN_STOCK' },
                    extractorConfidence: 0.95,
                    extractionSource: 'MODEL_GENERATED',
                  },
                ],
              }),
            },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 40, completion_tokens: 30, total_tokens: 70 },
      }),
    };

    const text = 'Brand New Acoustic Soundbar! In Stock now!';
    const result = await extractClaims(text, { client: mockShiftedClient });

    assert.equal(result.claims.length, 1);
    const span = result.claims[0].rawSpan;
    assert.equal(text.slice(span.startIndex, span.endIndex), 'In Stock');
    assert.equal(span.startIndex, 29);
    assert.equal(span.endIndex, 37);
  });
});
