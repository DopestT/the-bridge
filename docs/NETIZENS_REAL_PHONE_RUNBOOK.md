# NETIZENS real-phone acceptance runbook

Status: **not cleared**. Merged baseline: PR #20, `0e5fb06`; October 29 completion branch remains separate. This runbook records the next executable work, not completed device results.

## 1. Confirm and prepare the backend

On October 29, 2026, the existing dedicated `the-bridge` project (`udygizxcwqoxifqlyfkq`) was restored and verified ACTIVE_HEALTHY. Its five installed migrations are the three foundation/participation files plus effective privileges (`20261019075407`) and onboarding/safety (`20261030034537`). The repository privilege file has an earlier timestamp; do not replay it. There are 21 public RLS tables, 10 Places, and zero Auth users/Citizens/World Entities. Never target the Perception database.

The reviewed `20261030031920_netizens_citizen_onboarding_safety.sql` is installed as hosted version `20261030034537`. Match names and reviewed SQL as well as timestamps; do not reapply it. Catalog readback and anonymous HTTP denial probes passed. Confirm target identity against the final build environment, review the migration and its regression fixtures, and preserve actual user data.

Apply only missing migrations after reviewing target state. Verify the resulting tables, grants, RLS and security/performance advisors. Static SQL contract QA does not prove database application. Prepare two permanent test Citizens with valid profiles and a controlled Place/Entity; distinguish all test activity from genuine pilot metrics and reputation.

Exit evidence: confirmed project mapping, migration versions, schema/grant checks, and allowed/denied authenticated API results for both accounts.

## 2. Validate and build the app

This work can proceed alongside backend preparation. Use the user-delegated `com.big271.netizens` identifiers (iOS and Android) and the user-selected existing `@big271/netizens-mobile` project (`5f86b3a0-9d3b-4982-a05c-2aa6c4b3f0da`), now fixed in app.config.ts. Configure `NETIZENS_IOS_BUNDLE_ID`, `NETIZENS_ANDROID_PACKAGE`, `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` through the build environment. Keep privileged database and signing credentials out of public variables and evidence files.

From `apps/netizens-mobile/`, using Node 24 for the SQLite test harness:

```bash
npm ci
npm run typecheck
npm run lint
npm run test:ci
npm run test:storage
npx expo config --type public --json > /tmp/netizens-resolved-config.json
npm run release:check -- /tmp/netizens-resolved-config.json
npx expo export --platform ios --platform android --output-dir /tmp/netizens-export
```

Run the five existing repository QA suites from the repository root:

```bash
node prototype/netizens-world/qa.mjs
node prototype/netizens-world/participation-adapter-qa.mjs
node prototype/netizens-world/participation-ui-qa.mjs
node prototype/netizens-world/backend/contract-qa.mjs
node prototype/netizens-world/backend/production-contract-qa.mjs
```

Then create signed iOS and Android builds using the confirmed EAS/signing setup. Internal signed builds can establish the first physical-device loop; record TestFlight/Play internal distribution separately for private-beta release. Expo export is only a JavaScript bundle check. The current CI workflow does not run signed-device E2E, release environment validation or device performance.

Exit evidence: exact source commit, resolved identifiers, EAS build IDs, artifact/distribution references, and successful installation on each physical device.

## 3. Verify the smallest live loop

On both platforms: permanent-Citizen login → World → Place → Entity → join → post → reply. Inspect canonical server records and confirm the second account sees the permitted result. First resolve failures in this slice before expanding the test surface.

## 4. Complete the remaining implementation

| Work | Required behavior | Acceptance proof |
| --- | --- | --- |
| Push | Wire the existing contextual permission adapter to authenticated persistent token registration, delivery and notification-response routing; handle token replacement/logout and delivery failures | Actual arrival and authorized deep-link return on both platforms, including background/terminated app states |
| Block/report | Expose user-facing actions backed by canonical blocks/reports and visible success/failure states | Persisted report and server-enforced blocked-user rejection; unauthorized writes denied |
| College funnel | Persist impression → campus open → join → participate → return → cross-campus visit, with retry-safe event identity | Queryable cross-session funnel; test/seeded/demo activity excluded from genuine usage and reputation |
| Performance | Wire and capture every required lifecycle/interaction measurement without blocking social paths | Real device samples for every metric, with device/OS/build and sample count |
| Device E2E | Add/reuse repeatable device flows for the cases below | Logs and server corroboration on physical iOS and Android |

College remains inside Crews → College Groups. Supabase remains canonical; SQLite is cache/outbox only. No ordinary social path may synchronously depend on Perception.

## 5. Recovery and privacy matrix

Run each case on physical iOS and Android:

- Queue an eligible post offline; terminate the process; reopen offline; reconnect. The intent survives and creates exactly one canonical write.
- Interrupt the response after the server accepts a mutation; retry the same mutation. No duplicate post/message is created.
- Reject a queued write through canonical authorization or validation. The UI reconciles optimistic state and shows a terminal rejection.
- Expire the session, then restore it. Protected writes pause; cached permitted reads remain usable; replay uses the recovered account.
- Logout and switch accounts. The prior account's projections, private content and pending actions are inaccessible and never replay under the new identity.
- Open an unauthorized thread deep link. No private body is revealed; the backend denies access.
- Block a sender and attempt a private send. Server rejection holds even if client controls are bypassed.
- Confirm Circle/private sends never traverse public entity discussion paths.
- Deny contextual notification/location permission. Ordinary social navigation remains usable, and exact location is not published by default.

Measure warm resume ≤1,000 ms p75, cold usable launch ≤2,500 ms p75, navigation response ≤100 ms, optimistic acknowledgement ≤150 ms and cached render ≤300 ms. Preserve raw samples; the existing checker evaluates p75 for all five metrics, so retain individual interaction samples as well when reviewing the latter three limits.

```bash
npm run performance:check -- /path/to/actual-device-measurements.json
```

Input keys: `warm_resume_ms`, `cold_usable_ms`, `navigation_response_ms`, `optimistic_ack_ms`, `cached_entity_render_ms`; each maps to an array of measured milliseconds. Never substitute synthetic samples for device acceptance.

## 6. Record acceptance before closing #16

For every run record: timestamp, tester, exact source commit, build ID, platform, physical device/OS, backend project and migration versions, case/result, evidence links, server verification and unresolved defects. Keep credentials, tokens and private message bodies out of public evidence.

Use explicit outcomes: passed, failed, blocked or not run. A merge, green bundle CI, simulator run or closed issue cannot fill a missing physical-device result. Keep issue #16 open until its complete real-phone acceptance matrix passes, and keep private-beta release blocked until every item in `apps/netizens-mobile/PRIVATE_BETA_GATE.md` is evidenced.
