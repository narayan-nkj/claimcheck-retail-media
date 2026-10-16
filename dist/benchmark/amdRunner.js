import { performance } from 'node:perf_hooks';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { AMDInferenceClient } from '../inference/client.js';
import { extractClaims } from '../inference/extractor.js';
import { validateClaim } from '../contracts/v1/claim.js';
export const BENCHMARK_AD_COPIES = [
    'AcousticWave Pro Soundbar now $199.99 (save 20%). In Stock with Free 2-Day Delivery! Featuring 300W peak output.',
    'Flash Deal: Precision Wireless Earbuds only $49.99. Only 5 left in stock! Delivered tomorrow with overnight shipping.',
    'StudioMaster Active Noise Cancelling Headphones with Bluetooth 5.3, Stainless Steel headband, and 40-hour battery life.',
    'Experience perfection with our #1 rated soundbar, voted best in the world and guaranteed to change your life!',
    'KitchenPro 500W Blender now $79.99 (save 30% off regular $114.99). In Stock. Free 2-day delivery.',
];
/**
 * Runs AMD Inference benchmark measuring latency, token throughput, and claim extraction quality.
 * Can execute in live AMD ROCm mode (requiring remote endpoint) or deterministic fallback mode.
 */
export async function runAMDBenchmark(iterationsOrOptions = 50) {
    const options = typeof iterationsOrOptions === 'number'
        ? { iterations: iterationsOrOptions }
        : iterationsOrOptions;
    const iterations = options.iterations ?? 50;
    const requireLive = options.requireLive ?? false;
    let client;
    let verifiedRemoteModel;
    if (options.client) {
        client = options.client;
    }
    else if (requireLive) {
        const endpoint = process.env.AMD_VLLM_ENDPOINT;
        if (!endpoint || !endpoint.trim()) {
            throw new Error('AMD_VLLM_ENDPOINT environment variable is required for live AMD execution.\n' +
                'Set AMD_VLLM_ENDPOINT (e.g. export AMD_VLLM_ENDPOINT=http://mi300x-host:8000/v1) and verify the container is running.\n' +
                'To benchmark the deterministic local adapter instead, run: npm run benchmark:fallback');
        }
        client = new AMDInferenceClient({
            endpoint,
            useFallback: false,
        });
        if (client.isFallbackActive()) {
            throw new Error('AMDInferenceClient resolved to fallback mode. Live AMD execution cannot proceed in fallback mode.');
        }
        // Verify remote /models endpoint
        try {
            const modelsUrl = `${client.config.endpoint.replace(/\/$/, '')}/models`;
            const res = await fetch(modelsUrl, {
                headers: client.config.apiKey ? { Authorization: `Bearer ${client.config.apiKey}` } : {},
                signal: AbortSignal.timeout(3000),
            });
            if (!res.ok) {
                throw new Error(`Remote /models returned status ${res.status}`);
            }
            const modelsData = (await res.json());
            verifiedRemoteModel = modelsData.data?.[0]?.id ?? client.config.modelName;
        }
        catch (err) {
            throw new Error(`Failed to verify live AMD endpoint at ${client.config.endpoint}/models: ${err.message}`);
        }
    }
    else {
        // Fallback or auto-detect
        const useFallback = options.useFallback ?? (process.env.AMD_VLLM_ENDPOINT ? false : true);
        client = new AMDInferenceClient({ useFallback });
    }
    const latenciesMs = [];
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
        latenciesMs.push(Number((iterEnd - iterStart).toFixed(3)));
        if (result.metadata.rawTokens) {
            totalPromptTokens += result.metadata.rawTokens.promptTokens;
            totalCompletionTokens += result.metadata.rawTokens.completionTokens;
        }
        for (const claim of result.claims) {
            totalClaims += 1;
            try {
                validateClaim(claim);
                validClaims += 1;
            }
            catch {
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
    const stats = {
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
            model: verifiedRemoteModel ?? client.config.modelName,
            endpoint: client.config.endpoint,
            isFallback: client.isFallbackActive(),
            isLive: !client.isFallbackActive(),
            verifiedRemoteModel,
        },
        rawLatenciesMs: latenciesMs,
    };
    if (options.logPath) {
        try {
            mkdirSync(dirname(options.logPath), { recursive: true });
            writeFileSync(options.logPath, JSON.stringify({
                timestamp: new Date().toISOString(),
                stats,
            }, null, 2), 'utf8');
        }
        catch (err) {
            console.warn(`[WARN] Could not write benchmark log to ${options.logPath}: ${err.message}`);
        }
    }
    return stats;
}
