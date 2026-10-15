import type { AuditEvent } from '../contracts/v1/audit.ts';
import type { VerdictStatus } from '../contracts/v1/verdict.ts';
import { verifyAuditDigest } from '../contracts/v1/audit.ts';
import { evaluateAdCopyPolicy } from '../policy/engine.ts';

export interface ReplayVerificationResult {
  checkId: string;
  auditId: string;
  isReproducible: boolean;
  digestIntegrityValid: boolean;
  originalCompositeStatus: VerdictStatus;
  replayedCompositeStatus: VerdictStatus;
  claimVerdictMatches: boolean;
  discrepancies: string[];
  replayedSummary: string;
}

/**
 * Replays a historical check from an immutable AuditEvent and tests for bit-for-bit determinism.
 */
export function replayHistoricalCheck(event: AuditEvent): ReplayVerificationResult {
  const discrepancies: string[] = [];

  // Step 1: Verify cryptographic signature / digest of the stored event
  const digestIntegrityValid = verifyAuditDigest(event);
  if (!digestIntegrityValid) {
    discrepancies.push(
      `Cryptographic digest mismatch: replayDigest (${event.replayDigest}) does not match canonical payload hash.`
    );
  }

  // Step 2: Re-run the deterministic policy engine using identical historical inputs
  const replayedVerdict = evaluateAdCopyPolicy({
    checkId: event.checkId,
    copyText: event.adCopyText,
    catalog: event.catalogSnapshot,
    claims: event.extractedClaims,
    evidenceList: event.evidenceSnapshots,
    options: {
      asOf: event.timestamp,
      policyVersion: event.overallVerdict.policyVersion,
    },
  });

  // Step 3: Compare overall composite verdict
  const originalStatus = event.overallVerdict.compositeStatus;
  const replayedStatus = replayedVerdict.compositeStatus;

  if (originalStatus !== replayedStatus) {
    discrepancies.push(
      `Composite status mismatch: Original was "${originalStatus}", but replayed verdict produced "${replayedStatus}".`
    );
  }

  // Step 4: Compare each individual claim verdict
  let claimVerdictMatches = true;
  if (event.overallVerdict.claimVerdicts.length !== replayedVerdict.claimVerdicts.length) {
    claimVerdictMatches = false;
    discrepancies.push(
      `Claim count mismatch: Original had ${event.overallVerdict.claimVerdicts.length} claims, replayed had ${replayedVerdict.claimVerdicts.length}.`
    );
  } else {
    for (let i = 0; i < event.overallVerdict.claimVerdicts.length; i++) {
      const orig = event.overallVerdict.claimVerdicts[i];
      const repl = replayedVerdict.claimVerdicts[i];

      if (orig.status !== repl.status || orig.primaryReason !== repl.primaryReason) {
        claimVerdictMatches = false;
        discrepancies.push(
          `Claim ${orig.claimId} mismatch: Original was [${orig.status}:${orig.primaryReason}], replayed was [${repl.status}:${repl.primaryReason}].`
        );
      }
    }
  }

  const isReproducible = digestIntegrityValid && originalStatus === replayedStatus && claimVerdictMatches;

  return {
    checkId: event.checkId,
    auditId: event.auditId,
    isReproducible,
    digestIntegrityValid,
    originalCompositeStatus: originalStatus,
    replayedCompositeStatus: replayedStatus,
    claimVerdictMatches,
    discrepancies,
    replayedSummary: replayedVerdict.summary,
  };
}
