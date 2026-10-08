# NETIZENS Current Status

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
