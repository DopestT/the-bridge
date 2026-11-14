# NETIZENS — Advanced Engineering Swarm (Codex-ready work orders)
Updated: November 13, 2026. **Status: engineering task definitions only; no autonomous workers were launched by this change.**

## Mission
Finish NETIZENS against the canonical [mobile specification](superpowers/specs/2026-10-05-netizens-mobile-app-design.md), [World architecture](../prototype/netizens-world/ARCHITECTURE.md), [real-phone runbook](NETIZENS_REAL_PHONE_RUNBOOK.md) and [release gate](../apps/netizens-mobile/PRIVATE_BETA_GATE.md). Keep [issue #16](https://github.com/DopestT/the-bridge/issues/16) open until physical-device acceptance is evidenced on both platforms.

## Distinction from the in-app bot roster
[Draft PR #23](https://github.com/DopestT/the-bridge/pull/23) defines 14 proposed *consumer-facing* bounded roles, not coding workers. This engineering swarm is separate; it should be used to complete the application, not to implement 24 new in-app agents.

## Existing known state; verify freshness
- On PR #23 commit `29e733ba7a5d854cfda3f0765d00b5f60f04dbce`, NETIZENS World QA and NETIZENS Mobile CI completed successfully. They do not demonstrate a working phone app.
- Current blocker is not "add more bots": it is final backend/auth/RLS and real iOS+Android acceptance of login→World→Place→Entity→join→post→reply, offline recovery, push/deep links and privacy checks.
- The [completion ledger](NETIZENS_COMPLETION_2026-10-29.md) and runbook contain dated live backend/EAS observations, not automatic proof of current state. Check the actual services before any operation.
- The existing Android preview is older than some application changes. Apple Developer membership/signing has been an explicit iOS blocker. Never claim an iOS build exists without readback.

## Operating method
1. Have a *single integration lead* compare the current main and draft branches and assign work from [manifest.json](../tools/netizens-engineering-swarm/manifest.json). Start with the four discovery agents, then up to four non-conflicting worktrees at a time.
2. Use **OpenAI Codex parallel agents/worktrees** as the first available development tool. Prefer the existing runtime over inventing a new model orchestrator. An alternative custom deployment can use OpenAI **Agents SDK SandboxAgent**, isolated Docker sandboxes, structured outputs and tracing. Neither runtime is connected or launched by committing these files.
3. Every worker first reads the canonical documents, existing code, tests and previous PRs. Inspect before changes. Create narrow changes on *separate feature branches* and use a draft PR for each independently reviewable code change. Do not overwrite the unmerged PR #23.
4. The integration lead merges only after explicit owner approval and regression testing, with server-side evidence for relevant contracts. Do not run live provider writes, migrations, messages, invitations, account changes, production releases, DNS or payment/Apple enrollment without separate authorization.
5. An independent adversarial reviewer tries to break private/public boundaries, trust and evidence claims. A separate outcome verifier compares real-device evidence to the issue #16 matrix. Do not count a repeated model-generated claim as independent proof.
6. Use `node tools/netizens-engineering-swarm/plan.mjs` to inspect the read-only dependency waves. It makes **no API calls** and does **not** start any agents. Real Codex/Agents API execution requires an authenticated runner and can incur costs; credentials must not be stored in GitHub or Notion.

## Critical implementation lanes
- Auth and permanent Citizen; real two-account server access; RLS and scoped private messaging
- App navigation, stable offline outbox/retries and no duplicate write
- Push token registration/delivery/revocation + authorized notification deep links
- User-facing block/report; College Groups persisted analytics; Local discovery
- Real device performance instrumentation and accessibility
- Physical iOS/Android signed builds and end-to-end acceptance

## Security and boundaries
- NETIZENS owns Citizen/World/Place/Entity/social state; **Perception remains canonical for objective, route, grant, execution and verification**. No duplicate engine.
- Keep College inside `Crews → College Groups`. Supabase is canonical; SQLite only cache/outbox. Ordinary social actions do not wait on Perception.
- Never send private Circle/DM content to general AI workers; do not substitute client checks for server authorization. Seed/demo/test activity must not count as genuine adoption.
- Explicit approval required for production/migration/write access, public publishing, permission or account changes, spending, and external outreach.
- No hardcoded keys, automatic merge, fake timestamps, fake physical-phone telemetry or green CI equated to DONE.

## Evidence contract (per worker)
Each deliverable records: task ID, source commit, files inspected/changed, tests actually executed, their raw output or link, privacy/rollback impact, assumptions, blocked dependencies and separate result status `not_started|in_progress|tested|blocked|verified`. A static manifest or PR is not the user-complete application.
