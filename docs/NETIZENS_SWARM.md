# NETIZENS bounded bot swarm — implementation contract

Status: **proposed integration on a review branch; not deployed; no Perception worker execution verified**. Updated November 13, 2026.

## Authority and ownership

This is a **job-assignment layer**, not a cloned AI runtime. NETIZENS retains Citizen identity, World/Place/Entity records, memberships, social access, and local-first participation. Perception remains canonical for objectives, routes, grants, executions, verification and learning. Ordinary navigation, joins, posts, votes, messages and notifications must remain fully independent of Perception latency and availability.

Source contracts:
- [NETIZENS ↔ Perception Bridge](../prototype/netizens-world/PERCEPTION_BRIDGE.md)
- [NETIZENS World Architecture](../prototype/netizens-world/ARCHITECTURE.md)
- [NETIZENS Speed Standard](NETIZENS_SPEED_STANDARD.md)
- User's October 3 [Eye85Media + NETIZENS working blueprint] (separate source document): Perception coordinates authorized work; bounded workers do drafts, sources, QA and metrics; consent, allegations, moderation, publishing and verified outcomes require human review.

## Jobs and evidence

The local `NetizensSwarm.propose(objective, {placeId, entityId})` creates a bounded roster **without executing any agent**. General roles are Scope Guardian, World Router, Evidence Challenger, Accessibility Reviewer, Outcome Verifier and Measurement Auditor. Place-specific specialists are Source Scout, Civic Resource Watch, Crew Steward, Moderation Triage, Project Builder, Event Planner, Exchange Matcher and Yes/No Integrity. Each returned contract contains a job, allowed draft actions, forbidden actions, deliverable, acceptance test, reviewer and a `proposed` status.

Only the active source Place and Entity IDs cross into the local job contract; private social content does not. Unknown Place IDs are rejected. UI displays the roster as a local proposal even when Perception is disconnected. The *existing* Perception client may submit an objective to its configured endpoint; a successful response means **route proposed**, never `verified`. No new bot execution endpoint, API keys, database migration, account connection or permission grant is created.

## Gates before real deployment

1. Confirm the canonical Perception task-contract endpoint, authentication, grant scopes, supported workers and task status API from the actual runtime. No fabricated worker-run or completion claims.
2. Enforce NETIZENS social access **server-side**; issue narrow task grants from Perception only after explicit authorization for the exact source object, destination and operation. Do not trust client job IDs or browser-only guards.
3. Build a backend binding for assigned tasks and receive signed/authorized Perception completion records. Verify independent deliverable evidence, match task + asset version, and reject replay or cross-account access.
4. Keep human final approval for moderation, allegations, consent, publication, outreach, civic guidance and consequential changes. Keep private Circle/DM material away from public World and general AI workers.
5. Test connected and disconnected routes, failed/retried requests, RLS, private data non-disclosure, seeded-vs-genuine metrics, actual phone performance and the real-phone social loop (issue #16).

## Verification command

```bash
node prototype/netizens-world/swarm-qa.mjs
```

Passing tests validate only the local job registry and proof-state contract. They cannot establish agent runtime readiness, live user completion or production deployment.
