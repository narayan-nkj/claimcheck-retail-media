import { randomUUID } from 'node:crypto';
import { redactSensitiveData } from '../evidence/redaction.js';
export function generateTraceId() {
    return randomUUID().replace(/-/g, '');
}
export function generateSpanId() {
    return randomUUID().replace(/-/g, '').slice(0, 16);
}
export function createCorrelationContext(traceId) {
    const tId = traceId ?? generateTraceId();
    const sId = generateSpanId();
    return {
        correlationId: `corr-${tId.slice(0, 8)}-${sId.slice(0, 4)}`,
        traceId: tId,
        spanId: sId,
    };
}
class TelemetryCollector {
    metrics = {
        evaluationsTotal: { ALLOW: 0, REVIEW: 0, BLOCK: 0 },
        claimsExtractedTotal: {},
        staleEvidenceTotal: {},
        contradictionsDetectedTotal: 0,
        humanOverridesTotal: {},
        slaBreachesTotal: 0,
    };
    recordEvaluation(status, options) {
        this.metrics.evaluationsTotal[status] = (this.metrics.evaluationsTotal[status] ?? 0) + 1;
        if (options?.hasContradiction) {
            this.metrics.contradictionsDetectedTotal += 1;
        }
        if (options?.claims) {
            for (const claim of options.claims) {
                this.metrics.claimsExtractedTotal[claim.claimClass] =
                    (this.metrics.claimsExtractedTotal[claim.claimClass] ?? 0) + 1;
            }
        }
    }
    recordStaleEvidence(sourceType) {
        this.metrics.staleEvidenceTotal[sourceType] = (this.metrics.staleEvidenceTotal[sourceType] ?? 0) + 1;
    }
    recordHumanOverride(role) {
        this.metrics.humanOverridesTotal[role] = (this.metrics.humanOverridesTotal[role] ?? 0) + 1;
    }
    recordSlaBreach() {
        this.metrics.slaBreachesTotal += 1;
    }
    getSnapshot() {
        return structuredClone(this.metrics);
    }
    reset() {
        this.metrics = {
            evaluationsTotal: { ALLOW: 0, REVIEW: 0, BLOCK: 0 },
            claimsExtractedTotal: {},
            staleEvidenceTotal: {},
            contradictionsDetectedTotal: 0,
            humanOverridesTotal: {},
            slaBreachesTotal: 0,
        };
    }
    /**
     * Export metrics in Prometheus text exposition format (version 0.0.4)
     */
    exportPrometheus() {
        const lines = [
            '# HELP claimcheck_evaluations_total Total number of ad copy policy checks by verdict.',
            '# TYPE claimcheck_evaluations_total counter',
            `claimcheck_evaluations_total{verdict="ALLOW"} ${this.metrics.evaluationsTotal.ALLOW}`,
            `claimcheck_evaluations_total{verdict="REVIEW"} ${this.metrics.evaluationsTotal.REVIEW}`,
            `claimcheck_evaluations_total{verdict="BLOCK"} ${this.metrics.evaluationsTotal.BLOCK}`,
            '',
            '# HELP claimcheck_contradictions_total Total evidence contradictions detected between feeds.',
            '# TYPE claimcheck_contradictions_total counter',
            `claimcheck_contradictions_total ${this.metrics.contradictionsDetectedTotal}`,
            '',
            '# HELP claimcheck_sla_breaches_total Total operator review SLA deadlines breached.',
            '# TYPE claimcheck_sla_breaches_total counter',
            `claimcheck_sla_breaches_total ${this.metrics.slaBreachesTotal}`,
            '',
            '# HELP claimcheck_stale_evidence_total Total stale evidence items encountered by source.',
            '# TYPE claimcheck_stale_evidence_total counter',
        ];
        for (const [source, count] of Object.entries(this.metrics.staleEvidenceTotal)) {
            lines.push(`claimcheck_stale_evidence_total{source="${source}"} ${count}`);
        }
        lines.push('', '# HELP claimcheck_human_overrides_total Total operator approval overrides by role.', '# TYPE claimcheck_human_overrides_total counter');
        for (const [role, count] of Object.entries(this.metrics.humanOverridesTotal)) {
            lines.push(`claimcheck_human_overrides_total{role="${role}"} ${count}`);
        }
        return lines.join('\n') + '\n';
    }
}
export const telemetry = new TelemetryCollector();
/**
 * Structured logger writing sanitized JSON log entries with correlation headers
 */
export function logStructured(level, message, context) {
    const sanitizedDetails = context.details ? redactSensitiveData(context.details) : undefined;
    const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        traceId: context.correlation.traceId,
        spanId: context.correlation.spanId,
        correlationId: context.correlation.correlationId,
        checkId: context.checkId,
        message,
        details: sanitizedDetails,
    };
    return JSON.stringify(logEntry);
}
