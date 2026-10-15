# Worker 03 P-07 — Community Distribution and Ethical Analytics

## Objective
Earn legitimate discovery, GitHub stars/views, lablab hearts, demo visits, and useful feedback for ClaimCheck without manipulating hackathon metrics or violating platform rules.

## Scope
Prepare the public README, project page, screenshots, demo/video links, changelog, outreach messages, mentor-feedback request, campaign log, tagged URLs, analytics capture, and final metrics snapshot. Keep all claims accurate and disclose that stars, views, and hearts are not technical validation.

## Dependencies
- P-05 demo/documentation/submission package
- P-06 release candidate
- Official lablab rules and GitHub/community policies
- Public repository and demo URL

## Expected outputs

- Visibility and community plan
- Public README and project-page quality checklist
- Truthful outreach templates for team networks, mentors, and relevant communities
- Campaign/activity log
- GitHub metrics snapshot with timestamp
- lablab hearts/page-view snapshot where visible
- Feedback triage list and issue links
- Final engagement report with no unsupported causal claims

## Production validation

Test the README and demo from a clean browser or clone. Verify every public link, disclosure, license, screenshot, and analytics source. Review outreach for spam, privacy, misleading claims, platform-rule violations, and requests for artificial engagement. Confirm that no credentials, private data, or hidden tracking are exposed.

## Production acceptance criteria

- The public project is understandable without private context.
- Outreach requests inspection and feedback rather than guaranteed stars or hearts.
- GitHub stars/views and lablab hearts are recorded as observed metrics with timestamps.
- No bots, fake accounts, paid engagement, vote exchanges, engagement pods, or spam are used.
- Metrics never replace product, AMD, safety, or submission gates.

## Atomic execution plan

| Step | Activity | Test/evidence | Commit and push |
|---|---|---|---|
| 7.01 | Inspect public repository, lablab page, URLs, README, and current metrics. | Clean-link and baseline metrics snapshot. | Commit/push baseline documentation if changed. |
| 7.02 | Improve README, project description, screenshots, AMD explanation, and run instructions. | Fresh-clone/readability/link test. | Small commit and push. |
| 7.03 | Prepare demo/video/slide links and a truthful project-page update. | Media playback, URL, and claim review. | Small commit and push. |
| 7.04 | Prepare consent-safe outreach messages and target relevant communities. | Spam/platform-policy/privacy review. | Small commit and push campaign materials. |
| 7.05 | Share through approved team, mentor, hackathon, and relevant community channels. | Activity log with channel/date/URL/result. | Commit/push the sanitized activity log; do not commit private contact data. |
| 7.06 | Capture GitHub stars/views, demo visits, video metrics, and lablab hearts/views where visible. | Timestamped platform screenshots or exported public analytics. | Commit/push metrics snapshot without private analytics. |
| 7.07 | Triage legitimate feedback and record product/documentation improvements. | Issue links, decision log, regression check. | Small commit and push each accepted improvement. |
| 7.08 | Freeze the final visibility report and verify no manipulation or unsupported claims. | Policy, rules, secrets, and final-link review. | Final report commit and push. |

## Final test-and-push gate

Run link, README, media, secret, privacy, platform-policy, and documentation checks. Complete `.brain/.work/.report/worker_03_p07_report.md`, record the observed GitHub and lablab metrics with timestamps, commit the final artifacts, and push successfully to the authorized GitHub branch. This phase cannot close if engagement was artificially generated or if the push result is unverified.
