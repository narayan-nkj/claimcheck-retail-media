# Worker 03 P-05 — Demo, Documentation, and Submission

## Objective
Prepare a truthful, repeatable, judge-ready release package.

## Scope
Plan README, setup, architecture, limitation statement, demo reset, recorded fallback, cover image, slides, public repo, URLs, attribution, and AMD proof.

## Dependencies
All worker contracts; evaluation results; tester findings.

## Expected outputs
Demo runbook; documentation checklist; submission checklist; release notes.

## Production validation
Define and execute unit, contract, integration, security, reliability, observability, and operational checks appropriate to this phase. Record evidence and limitations.

## Production acceptance criteria
A fresh user can run the system; demo proves value, evidence, gate, audit, and AMD workload.

## Handoff
Tester 02 validates the complete submission package.

## Report

`.brain/.work/.report/worker_03_p05_report.md` is mandatory before this phase can close.

## Atomic execution plan

Break this phase into the following atomic steps. The owner may split a step further if the repository, research, or risk review shows that it is still too large. Do not combine steps merely to reduce the number of commits.

| Step | Atomic activity | Required evidence | Step-specific validation | Commit/push requirement |
|---|---|---|---|---|
| 5.01 | Inspect current repository state, branch, remote, relevant files, and incoming changes. | State snapshot and dependency notes. | `git status`, branch/remote inspection, conflict check. | Commit only if planning artifacts change; push the state/report update. |
| 5.02 | Convert the phase objective into the smallest implementable contract or change. | Contract or decision record. | Schema/type/consistency review. | Small descriptive commit and push. |
| 5.03 | Implement or specify the first independently reviewable unit. | Files, schemas, or planning artifacts changed. | Unit/contract/documentation test for the unit. | Small descriptive commit and push. |
| 5.04 | Add failure, abuse, privacy, and boundary behavior. | Failure matrix and mitigation record. | Negative, security, and privacy checks. | Small descriptive commit and push. |
| 5.05 | Add observability, auditability, and operational evidence. | Logs, metrics, traces, audit, or runbook requirements. | Observability/readiness verification. | Small descriptive commit and push. |
| 5.06 | Integrate with the next contract or dependent workstream. | Integration notes and compatibility evidence. | Contract/integration test. | Small descriptive commit and push. |
| 5.07 | Review documentation, traceability, and release impact. | Updated report, matrix, decisions, risks, and handoff. | Documentation and traceability check. | Small descriptive commit and push. |
| 5.08 | Perform phase-level validation and prepare the handoff. | Test output, defect list, signoff recommendation. | Full phase test suite and regression checks. | Final phase commit and push. |

### Mandatory step-close checklist

For **each** atomic step, the Worker 03 must record:

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

After all atomic steps complete, run the complete phase test suite, the relevant regression suite, security checks, documentation checks, and integration checks. Fix all failures. Then create the phase report at `.brain/.work/.report/worker_03_p05_report.md`, update the handoff and status files, commit all phase-final artifacts, push to GitHub, and record the final commit hash and push result. The phase remains **INCOMPLETE** until this gate passes.

Do not claim GitHub synchronization unless the push command succeeded and the remote branch contains the recorded commit.
