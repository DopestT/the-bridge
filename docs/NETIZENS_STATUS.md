# NETIZENS Current Status

**Verified update: October 29, 2026 (America/New_York).** Canonical repository: `DopestT/the-bridge`. Current main: `0e5fb06` (PR #20, native message safety controls). Issue #16 remains OPEN.

## Current implementation branch

`codex/netizens-completion-20261029` adds a real Citizen profile/completion flow, account creation with explicit email-confirmation handling, bounded title search, nested World/Place/Entity navigation, contextual access to existing Circle conversations, and native Yes or No voting through the existing vote-first RPC. A denied request never becomes a success state. Results are advisory community polls, not official elections.

The additive Citizen migration derives identity from Auth, rejects restricted accounts, preserves reputation/seed/status, validates direct profile edits, and makes blocks survive message reloads. It is installed on the hosted backend as `20261030034537_netizens_citizen_onboarding_safety`. Code in this branch is not yet merged or deployed.

Observed checks on this branch: typecheck and lint passed; 54 Jest tests and 32 storage/transport tests passed; all five existing World/backend QA commands passed; iOS and Android Hermes bundles exported. Fresh disposable PostgreSQL 16 passed effective privileges, Citizen onboarding, Citizen safety and vote-first fixtures, plus legacy upgrade compatibility. These checks do not establish signed builds, real Auth email flows, device behavior, push delivery or release clearance.

## Backend verified now

The existing dedicated project `the-bridge` (`udygizxcwqoxifqlyfkq`) was inactive and was restored; a fresh read returned ACTIVE_HEALTHY. No replacement project was created. Hosted migration history contains the three foundation/participation migrations, `20261019075407_netizens_effective_privileges`, and `20261030034537_netizens_citizen_onboarding_safety`. Do not replay the repository privilege migration merely because its file timestamp differs.

Fresh aggregate inspection: 21 public tables have RLS, 10 Places exist, and there are zero Auth users, Citizens and World Entities. No people, activity or test accounts were fabricated. The reviewed onboarding/safety migration is now installed as hosted version `20261030034537`; catalog readback confirms the completion column, self-profile status policy, protected fields and least-privilege grants. Anonymous RPC/read HTTP probes return 401/42501. Public Auth settings respond successfully, but real signup/email/login remains unverified.

## Locked product architecture

- One network, many places: World → Place → Entity.
- Shared Citizen identity, messaging, search, notifications and permissions.
- College Groups live inside Crews; no top-level College island or speculative national-campus systems.
- Supabase owns canonical social state; SQLite is account-scoped cache/outbox.
- Private Circle/direct-message bodies never use public discussion paths.
- Perception remains off ordinary social critical paths.
- Seeded/test/demo activity must stay distinct from genuine activity and reputation.

## Remaining acceptance gates

1. Complete two-account HTTP/Auth acceptance against the installed migration. Live catalogs and anonymous denial probes are verified; security advisors still flag the intentionally exposed authenticated vote/profile SECURITY DEFINER RPCs and two service-only RLS tables without client policies. Prepare consented permanent test Citizens and controlled, explicitly labeled test Entities.
2. Resolve ownership between the two existing Expo projects, confirm LWV iOS/Android identifiers and signing, and configure signing. The existing project URL and active publishable key are configured locally in the ignored environment file; neither is a privileged server key. Do not create another project or guess identifiers.
3. Complete authenticated push token registration/delivery, response routing and token revocation; the existing permission adapter alone is insufficient.
4. Persist the College funnel and capture real device performance measurements. Local area selection still does not filter canonical discovery.
5. Prove login → World → Place → Entity → join → post → reply, notifications/deep links, block/report enforcement, process-death/offline recovery, retry suppression, logout/account isolation and private-thread boundaries on physical iOS and Android.
6. Record exact source/build/backend evidence and private-beta distribution. No usable local iOS simulator or Android emulator is currently installed; no signed artifact or physical-device result is established.

See [the completion ledger](NETIZENS_COMPLETION_2026-10-29.md), [real-phone runbook](NETIZENS_REAL_PHONE_RUNBOOK.md), and [private-beta gate](../apps/netizens-mobile/PRIVATE_BETA_GATE.md). Implementation PRs must not automatically close #16.

## Historical record

The October 8 record below describes the earlier baseline. Its mobile “work still required” list is historical; use the merged implementation and remaining acceptance gates above for current planning.

---


**Status date:** 2026-10-08  
**Canonical repo:** `DopestT/the-bridge`  
**Verified main baseline:** `201615737200dc9fffbf04efb85f98b7664f0a10`  
**Active execution tracker:** GitHub issue #16

This file is the repo-facing operating status for NETIZENS. It separates merged architecture/code from production behavior that has actually been verified.

## Executive state

NETIZENS is no longer concept-only. The repository contains a World/entity architecture, Supabase production contract, Core Participation system, College Groups pilot, Perception bridge, and a native Expo/React Native mobile foundation.

The next milestone is **not additional product expansion**. It is:

> **NETIZENS runs end-to-end on a real phone.**

A permanent Citizen must be able to authenticate, enter World, open a Place and Entity, join, post/reply, close/reopen the app, recover across offline/online state without duplicate writes, receive a notification, return through a deep link, and pass privacy/RLS checks on iOS and Android.

## Locked product architecture

- Product model: **one network, many places**.
- Structural hierarchy: **World -> Place -> Entity**.
- Shared across Places: Citizen identity, messaging, search, notifications, reputation, memberships, permissions, and cross-Place links.
- College is **not** a top-level Place. It lives at **Crews -> College Groups**.
- Initial College pilot campuses: University of Maryland, Howard University, Georgetown University, George Washington University, American University.
- Do not build the national Campus Map, Issue Graph, Coalition Rooms, polling infrastructure, or other heavy College systems until the campus-group usage loop is proven.
- Perception is optional intelligence/orchestration and must remain off ordinary social critical paths.
- Supabase owns canonical NETIZENS social state.
- Device SQLite is cache/projection/outbox only and may not become a second canonical store.
- Private Circle/direct-message content must never traverse public entity discussion paths.
- Seeded/demo activity must remain distinguishable from genuine activity and may not inflate genuine reputation.

## Verified merged foundation

### World / entity graph

Merged architecture supports:

- enterable World entities;
- nested entities;
- memberships;
- durable cross-Place links;
- Plan -> Event transformation;
- organizer Circle conversion;
- Ask -> Project transformation;
- entity-aware Perception bindings/context;
- Time Machine scenario/entity awareness.

### Supabase production contract

The repository includes the dedicated NETIZENS production schema/migration contract for:

- permanent Citizen identity;
- World entities and memberships;
- cross-Place links;
- blocking;
- messaging;
- notifications;
- reports/moderation;
- reputation/artifacts/provenance;
- NETIZENS-side Perception bindings;
- Time Machine scenario storage;
- Yes/No vote-first RPC behavior;
- Row Level Security;
- least-privilege grants;
- audit hooks.

**Important:** repository presence of the production migration is verified. Application of that migration to the dedicated live NETIZENS Supabase project is still a separate verification item.

### Core Participation

Merged participation contracts include:

- entity membership;
- root discussion posts;
- replies;
- provenance-aware participation;
- notifications;
- moderation state;
- idempotent local-first mutation contracts;
- RLS hardening preventing recursive parent validation and ordinary reads of hidden/soft-deleted discussion bodies.

### College Groups pilot

Merged pilot behavior includes:

- College discovery inside Crews;
- the five DMV campus groups;
- campus-group open flows;
- join/leave behavior using shared Crew/entity primitives;
- pilot impression, campus-open, and membership events;
- seeded/demo state explicitly separated from claims of real activity.

The remaining College measurement gap is a persistent production analytics/retention system for:

`impression -> campus open -> join -> participate -> return -> cross-campus visit`

### Perception boundary

Merged bridge rules keep ownership separated:

- NETIZENS owns social World state;
- Perception owns objectives, routes, runtime permissions, execution, verification, learning, and scenario intelligence;
- ordinary NETIZENS launch/navigation/read/join/post/reply/vote/message/notification paths may not depend synchronously on Perception.

## Native mobile status

Application root: `apps/netizens-mobile/`

Current stack:

- Expo SDK 57;
- React Native 0.86;
- React 19.2.x;
- TypeScript;
- Expo Router;
- Expo SQLite;
- Expo SecureStore;
- Expo Notifications;
- Supabase JS;
- Jest / `jest-expo`;
- React Native Testing Library;
- Maestro;
- GitHub Actions.

Merged native foundation includes:

- real native app scaffold, not a WebView wrapper;
- boot contract;
- typed route/deep-link contract;
- routes for World, Place, Entity, Search, Messages, message thread, Notifications, and Profile;
- `netizens://` custom scheme;
- secure permanent-Citizen session handling;
- Supabase public client/environment contract with privileged service-role secrets forbidden;
- NETIZENS theme tokens;
- native `AppShell` and primary navigation structure;
- accessibility/shell tests.

PR #15 restored the mobile dependency/test gate after the earlier React Native/Jest preset conflict. Mobile CI run #21 on the PR #15 head completed successfully before merge.

## Mobile work still required

The active implementation sequence remains Tasks 5-13 of `docs/superpowers/plans/2026-10-05-netizens-mobile-app.md`:

1. Expo SQLite local projections + retry-safe mutation outbox.
2. Supabase repository transport + reconciliation.
3. Cached-first World -> Place -> Entity native read flows.
4. Native Core Participation: join/leave/post/reply/rollback.
5. Canonical notifications + contextual push registration.
6. Private Messages + Circle/public-discussion boundary enforcement.
7. Privacy-aware Local/location permission handling.
8. Real performance instrumentation and budget checks.
9. iOS/Android private-beta E2E and release gates.

## Performance standard

Do not claim these are achieved until they are measured on representative devices. Current targets remain:

- warm resume: <= 1.0 s p75;
- cold usable launch: <= 2.5 s p75;
- navigation response begins: <= 100 ms;
- optimistic acknowledgement: <= 150 ms;
- cached Place/entity render: <= 300 ms.

## Explicitly unverified

Until evidence is recorded, do not describe the following as complete:

- dedicated NETIZENS Supabase production project has the complete migration applied;
- public production NETIZENS deployment is live and current;
- TestFlight build exists and passes the private-beta gate;
- Play internal-test build exists and passes the private-beta gate;
- physical-device iOS/Android E2E passes;
- measured device performance meets the speed standard;
- College retention funnel is persisted and queryable in production;
- real-user retention, engagement, or traction exists.

## Private-beta gate

Do not call NETIZENS private-beta-ready until all of these are evidenced:

- real iOS build;
- real Android build;
- permanent-Citizen auth;
- cached fast navigation;
- World -> Place -> Entity reads;
- production join/post/reply;
- retry-safe offline writes;
- canonical notifications and deep links;
- blocks/reports/private-Circle boundaries;
- no synchronous Perception dependency on ordinary social paths;
- no seeded/demo reputation inflation;
- green critical E2E on both platforms;
- measured performance;
- no known critical RLS/security regression.

## Current operating priority

**P0 — Finish the real-phone social loop.**

Do not spend the next engineering cycle expanding Time Machine, national College infrastructure, or additional Places ahead of the P0 milestone. Those surfaces can remain designed/seeded while engineering completes the mobile state, sync, participation, privacy, and release path.

## Tracking

Execution checklist and unresolved verification items live in GitHub issue #16: **NETIZENS next execution wave: real-phone end-to-end milestone**.
