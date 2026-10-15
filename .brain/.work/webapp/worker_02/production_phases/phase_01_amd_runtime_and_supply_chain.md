# Worker 02 P-01 — AMD Runtime, Model, and Supply Chain

## Objective
Establish a verified AMD inference dependency with secure configuration and a supported model lifecycle.

## Scope
Verify AMD access, GPU/quota, vLLM compatibility, model license, image provenance, pinning, secrets, and local fallback.

## Dependencies
Official event/runtime verification; repository state; Worker 01 contracts.

## Expected outputs
Runtime decision; pinned environment; model/license record; fallback matrix.

## Production validation
Define and execute unit, contract, integration, security, reliability, observability, and operational checks appropriate to this phase. Record evidence and limitations.

## Production acceptance criteria
AMD execution is real and inspectable; secrets and untrusted artifacts are controlled.

## Handoff
Tester 02 validates evidence and reproducibility.

## Report

`.brain/.work/.report/worker_02_p01_report.md` is mandatory before this phase can close.

## Atomic execution plan

Break this phase into the following atomic steps. The owner may split a step further if the repository, research, or risk review shows that it is still too large. Do not combine steps merely to reduce the number of commits.

| Step | Atomic activity | Required evidence | Step-specific validation | Commit/push requirement |
|---|---|---|---|---|
| 1.01 | Inspect current repository state, branch, remote, relevant files, and incoming changes. | State snapshot and dependency notes. | `git status`, branch/remote inspection, conflict check. | Commit only if planning artifacts change; push the state/report update. |
| 1.02 | Convert the phase objective into the smallest implementable contract or change. | Contract or decision record. | Schema/type/consistency review. | Small descriptive commit and push. |
| 1.03 | Implement or specify the first independently reviewable unit. | Files, schemas, or planning artifacts changed. | Unit/contract/documentation test for the unit. | Small descriptive commit and push. |
| 1.04 | Add failure, abuse, privacy, and boundary behavior. | Failure matrix and mitigation record. | Negative, security, and privacy checks. | Small descriptive commit and push. |
| 1.05 | Add observability, auditability, and operational evidence. | Logs, metrics, traces, audit, or runbook requirements. | Observability/readiness verification. | Small descriptive commit and push. |
| 1.06 | Integrate with the next contract or dependent workstream. | Integration notes and compatibility evidence. | Contract/integration test. | Small descriptive commit and push. |
| 1.07 | Review documentation, traceability, and release impact. | Updated report, matrix, decisions, risks, and handoff. | Documentation and traceability check. | Small descriptive commit and push. |
| 1.08 | Perform phase-level validation and prepare the handoff. | Test output, defect list, signoff recommendation. | Full phase test suite and regression checks. | Final phase commit and push. |

### Mandatory step-close checklist

For **each** atomic step, the Worker 02 must record:

- exact files and lines changed;
- test or validation command;
- expected and actual result;
- defects found and resolution;
- security/privacy/secret scan result;
- documentation and traceability updates;
- commit message and full commit hash;
- remote name and branch;
- push result and pushed commit hash;
- rollback or recovery action if the push or test fails.

### Final phase test-and-push gate

After all atomic steps complete, run the complete phase test suite, the relevant regression suite, security checks, documentation checks, and integration checks. Fix all failures. Then create the phase report at `.brain/.work/.report/worker_02_p01_report.md`, update the handoff and status files, commit all phase-final artifacts, push to GitHub, and record the final commit hash and push result. The phase remains **INCOMPLETE** until this gate passes.

Do not claim GitHub synchronization unless the push command succeeded and the remote branch contains the recorded commit.
