import { performance } from 'node:perf_hooks';
import { AMDInferenceClient } from '../inference/client.ts';
import { extractClaims } from '../inference/extractor.ts';
import { validateClaim } from '../contracts/v1/claim.ts';

export interface AMDBenchmarkStats {
  iterations: number;
  totalDurationMs: number;
  requestsPerSec: number;
  tokensPerSec: number;
  promptTokensPerSec: number;
  completionTokensPerSec: number;
  latencyMs: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
  };
  tokens: {
    totalPrompt: number;
    totalCompletion: number;
    totalTokens: number;
  };
  quality: {
    totalClaimsExtracted: number;
    validClaimsRatio: number;
  };
  deviceProof: {
    targetDevice: string;
    runtime: string;
    model: string;
    endpoint: string;
    isFallback: boolean;
  };
}

export const BENCHMARK_AD_COPIES = [
  'AcousticWave Pro Soundbar now $199.99 (save 20%). In Stock with Free 2-Day Delivery! Featuring 300W peak output.',
  'Flash Deal: Precision Wireless Earbuds only $49.99. Only 5 left in stock! Delivered tomorrow with overnight shipping.',
  'StudioMaster Active Noise Cancelling Headphones with Bluetooth 5.3, Stainless Steel headband, and 40-hour battery life.',
  'Experience perfection with our #1 rated soundbar, voted best in the world and guaranteed to change your life!',
  'KitchenPro 500W Blender now $79.99 (save 30% off regular $114.99). In Stock. Free 2-day delivery.',
];

/**
 * Runs AMD Inference benchmark measuring latency, token throughput, and claim extraction quality.
 */
export async function runAMDBenchmark(iterations = 50): Promise<AMDBenchmarkStats> {
  const client = new AMDInferenceClient({ useFallback: true });
  const latenciesMs: number[] = [];
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalClaims = 0;
  let validClaims = 0;

  // Warmup run
  await extractClaims(BENCHMARK_AD_COPIES[0], { client });

  const benchmarkStart = performance.now();

  for (let i = 0; i < iterations; i++) {
    const copy = BENCHMARK_AD_COPIES[i % BENCHMARK_AD_COPIES.length];
    const iterStart = performance.now();

    const result = await extractClaims(copy, { client });

    const iterEnd = performance.now();
    latenciesMs.push(iterEnd - iterStart);

    if (result.metadata.rawTokens) {
      totalPromptTokens += result.metadata.rawTokens.promptTokens;
      totalCompletionTokens += result.metadata.rawTokens.completionTokens;
    }

    for (const claim of result.claims) {
      totalClaims += 1;
      try {
        validateClaim(claim);
        validClaims += 1;
      } catch {
        // Schema violation
      }
    }
  }

  const benchmarkEnd = performance.now();
  const totalDurationMs = benchmarkEnd - benchmarkStart;

  latenciesMs.sort((a, b) => a - b);
  const count = latenciesMs.length;
  const avg = count > 0 ? latenciesMs.reduce((a, b) => a + b, 0) / count : 0;
  const p50 = count > 0 ? latenciesMs[Math.floor(count * 0.5)] : 0;
  const p95 = count > 0 ? latenciesMs[Math.floor(count * 0.95)] : 0;
  const p99 = count > 0 ? latenciesMs[Math.floor(count * 0.99)] : 0;
  const min = count > 0 ? latenciesMs[0] : 0;
  const max = count > 0 ? latenciesMs[count - 1] : 0;

  const totalTokens = totalPromptTokens + totalCompletionTokens;
  const durationSec = totalDurationMs / 1000;
  const requestsPerSec = Number((iterations / durationSec).toFixed(2));
  const tokensPerSec = Number((totalTokens / durationSec).toFixed(2));
  const promptTokensPerSec = Number((totalPromptTokens / durationSec).toFixed(2));
  const completionTokensPerSec = Number((totalCompletionTokens / durationSec).toFixed(2));

  return {
    iterations,
    totalDurationMs: Number(totalDurationMs.toFixed(2)),
    requestsPerSec,
    tokensPerSec,
    promptTokensPerSec,
    completionTokensPerSec,
    latencyMs: {
      avg: Number(avg.toFixed(2)),
      p50: Number(p50.toFixed(2)),
      p95: Number(p95.toFixed(2)),
      p99: Number(p99.toFixed(2)),
      min: Number(min.toFixed(2)),
      max: Number(max.toFixed(2)),
    },
    tokens: {
      totalPrompt: totalPromptTokens,
      totalCompletion: totalCompletionTokens,
      totalTokens,
    },
    quality: {
      totalClaimsExtracted: totalClaims,
      validClaimsRatio: totalClaims > 0 ? Number((validClaims / totalClaims).toFixed(4)) : 1.0,
    },
    deviceProof: {
      targetDevice: client.config.targetDevice,
      runtime: client.config.runtime,
      model: client.config.modelName,
      endpoint: client.config.endpoint,
      isFallback: client.isFallbackActive(),
    },
  };
}
