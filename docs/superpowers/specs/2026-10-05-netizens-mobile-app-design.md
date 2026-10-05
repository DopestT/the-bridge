# NETIZENS Mobile App Architecture Design

**Date:** 2026-10-05  
**Status:** Approved architecture, implementation not yet started  
**Repository:** `DopestT/the-bridge`  
**Target:** Shipping iOS and Android application  

## 1. Purpose

NETIZENS is an app-first social world: **one network, many places**. The mobile product must feel immediate, explorable, and structurally different from a conventional feed-first social app.

The browser World remains a development and contract-validation harness. The shipping product will live in a dedicated mobile application that consumes the existing NETIZENS backend and social contracts without creating a second canonical social model.

The primary product promise is:

> **NETIZENS helps you find the people you need for what you want to do next.**

The universal interaction prompt remains:

> **What do you want to do?**

## 2. Success Criteria

The first mobile architecture is successful when:

1. NETIZENS launches as a real iOS/Android app rather than a browser wrapper.
2. A Citizen can authenticate, enter the World, move through Places and Entities, join, participate, receive notifications, and return through deep links without Perception being required for ordinary social use.
3. The app renders cached state immediately and reconciles with the backend in the background.
4. Mutations are optimistic and retry-safe through stable idempotency keys.
5. College remains inside `Crews -> College Groups` and uses the same generic app architecture as other Crews.
6. Public participation, private Circles, and direct messaging remain separate security domains.
7. The app meets the existing NETIZENS speed standard on representative devices before public launch.
8. The same backend contracts continue to support the browser prototype as a development harness.

## 3. Technical Baseline

Initial mobile stack, validated against current Expo documentation on 2026-10-05:

- Expo SDK 57
- React Native 0.86
- React 19.2.x
- TypeScript
- Expo Router
- Node.js 22.13.x or newer compatible 22.x release
- Continuous Native Generation (CNG) as the default native-project workflow
- Supabase JS client for authenticated NETIZENS backend access
- Expo SQLite for durable local cache and mutation outbox
- Expo SecureStore for sensitive session material only
- Expo Notifications for device notification registration/delivery integration
- `jest-expo` + React Native Testing Library for unit/component tests
- Maestro for device-level critical-path E2E tests

The mobile application will live at:

```text
apps/netizens-mobile/
```

The repository will not be converted into a large workspace/monorepo system merely to support the first mobile client. Shared-package extraction is allowed later only when real reuse justifies it.

## 4. Source-of-Truth Boundaries

### 4.1 NETIZENS backend

The dedicated NETIZENS backend remains canonical for social state:

- Citizens
- Places
- World Entities
- memberships
- entity links
- public participation/discussion
- Yes or No votes
- artifacts/reputation events
- notifications
- conversation threads/messages
- blocks/reports/moderation state
- NETIZENS-side Perception bindings
- Time Machine scenario references

The device database is a **cache and outbox**, not the system of record.

### 4.2 Perception

Perception remains the intelligence/orchestration layer, not the social-state database.

Ordinary social actions must never require an AI provider:

```text
Citizen action
  -> local NETIZENS state
  -> optimistic UI
  -> NETIZENS backend
  -> reconciliation
```

AI-enhanced actions remain separate:

```text
Citizen objective
  -> bounded NETIZENS context
  -> Perception
  -> proposed route/action
  -> permission
  -> verified result
  -> NETIZENS
```

A slow or unavailable Perception route must not make NETIZENS itself slow or unavailable.

### 4.3 Browser prototype

`prototype/netizens-world/` remains a contract/reference harness during migration. It is not the final product shell and must not become the source of mobile UI architecture.

## 5. Mobile Navigation Architecture

The initial app navigation is deliberately small and stable.

### Primary tabs

```text
World | Search | Messages | Notifications | Profile
```

### World hierarchy

```text
World
  -> Place
    -> Entity
      -> Participation
```

The app must preserve the user's structural location. A Citizen should understand where they are without treating every surface as a feed.

### Initial route contract

```text
/
/world
/place/[placeId]
/entity/[entityId]
/search
/messages
/messages/[threadId]
/notifications
/profile
```

Additional Place-specific screens should be composed beneath these contracts rather than creating unrelated top-level navigation islands.

### Deep links

The internal route contract must work through both:

- custom app scheme: `netizens://...`
- HTTPS universal/app links once the production NETIZENS public host is finalized

The route contract is host-independent, so selecting the final public hostname does not block implementation.

A push notification or shared link must be able to open the exact relevant Place, Entity, thread, event, project, plan, discussion, or notification context without forcing the user through the World root first.

## 6. Place Model in the App

The mobile app must preserve the established NETIZENS World instead of flattening it into a giant feed with tabs.

Initial Places remain:

- Commons
- Crews
- Local
- Projects
- Ask
- Exchange
- Circles
- Events
- Yes or No
- Plans
- Time Machine

Each Place may have its own interaction grammar, but all reuse shared identity, navigation, safety, membership, notification, search, and cross-Place link systems.

### College boundary

College is not a new top-level Place.

```text
NETIZENS -> Crews -> College Groups
```

The mobile app must contain no College-specific navigation architecture. Campus groups use generic Crew/entity/membership/participation contracts. Atlas can evolve the College experience inside those contracts without owning or blocking the rest of the app.

## 7. App Shell and Interaction Model

### 7.1 Launch

On app launch:

1. render the native shell immediately;
2. restore cached identity and navigation state;
3. restore cached World/Place data;
4. refresh the authenticated session in parallel;
5. reconcile active-screen data in the background;
6. block only operations that genuinely require current authorization.

Already-known content must not disappear behind a blank loading screen during refresh.

### 7.2 Navigation

Touch feedback and transition start must be immediate. Network fetches do not block navigation to a cached screen.

### 7.3 Participation

Entity participation uses the Core Participation layer already merged into NETIZENS:

- join/leave
- root discussion posts
- replies
- provenance-aware activity
- notifications
- moderation boundaries
- stable mutation IDs

Private Circles do not use the public entity-discussion path.

### 7.4 Empty/loading/error states

The app distinguishes:

- never loaded
- cached but refreshing
- offline with cached state
- optimistic pending write
- rejected write
- authentication expired
- genuinely unavailable resource

A background refresh failure must not erase readable cached content.

## 8. Local-First Data Architecture

### 8.1 Device database

Expo SQLite stores durable local projections of the data needed for fast app use. Initial local tables/projections should cover:

- cached Citizen profile
- Places
- World Entities
- memberships
- discussion items
- notifications
- lightweight conversation/thread summaries
- navigation/deep-link recovery state
- mutation outbox
- sync checkpoints

Sensitive authentication secrets do not belong in ordinary SQLite rows.

### 8.2 Mutation outbox

Every queued write has:

- stable client mutation UUID
- mutation kind
- bounded payload
- created timestamp
- attempt count
- status
- last error classification

The client mutation UUID survives retries and is the idempotency key sent to the backend.

### 8.3 Optimistic behavior

Eligible actions update the local projection immediately, including common joins, posts, replies, votes, and notification reads.

If the server rejects the mutation because authorization or canonical state changed, the client must reconcile visibly rather than silently pretending success.

### 8.4 Offline boundaries

V1 supports queued offline behavior for safe, retryable participation operations. High-risk or administrative operations—moderation decisions, account-security changes, destructive administrative state, and permission-sensitive execution—require an online authorization path.

## 9. Authentication and Session Security

NETIZENS uses the dedicated Supabase Auth project and the existing permanent-Citizen gate.

Rules:

- no service-role credential in the app;
- no privileged database secret bundled in JavaScript/native assets;
- session material is stored through a secure device-storage adapter;
- anonymous Supabase Auth users do not enter the NETIZENS World;
- session refresh happens independently of ordinary cached rendering;
- protected writes require a valid authenticated session;
- logout clears sensitive session material and invalidates protected local state while retaining only explicitly safe public/cache material.

App session state must never be treated as authorization by itself; backend RLS remains authoritative.

## 10. Notifications and Realtime

### 10.1 Canonical notification state

The NETIZENS backend owns notification records and read state. Push services deliver attention signals only; they are not canonical notification storage.

### 10.2 Permission timing

Do not ask for notification permission on first launch with no context. Request it after the Citizen reaches a point where notification value is clear, such as joining a Crew/Project/Event or enabling conversation updates.

### 10.3 Deep-link behavior

Push payloads contain only the minimum routing identifier needed to open the correct in-app context. Sensitive content should be resolved after authenticated app launch when appropriate.

### 10.4 Realtime scope

Realtime subscriptions are scoped to the current Citizen and active context. The app must not subscribe to the entire World.

## 11. Device Capabilities and Permissions

Permissions are requested only when a user action requires them.

### Location

Used by Local only when needed. Precise location is not a prerequisite for ordinary NETIZENS use. Public display uses privacy-preserving/coarse location rules rather than exposing exact coordinates by default.

### Camera/media library

Requested when the Citizen explicitly starts a media action. Media upload must not block text/navigation interactions.

### Notifications

Requested contextually as described above.

### Contacts

No address-book upload or contacts permission is part of the first mobile architecture.

## 12. Speed Requirements

The existing `docs/NETIZENS_SPEED_STANDARD.md` governs the mobile build.

Initial engineering targets include:

- warm resume to interactive: <= 1.0 s at p75;
- cold launch to usable primary surface: <= 2.5 s at p75 on supported devices;
- navigation/touch response begins: <= 100 ms;
- optimistic mutation acknowledgement: <= 150 ms;
- cached Place/entity render: <= 300 ms after navigation begins.

These are measured targets, not claims before measurement exists.

Performance design rules:

- cached data renders first;
- expensive aggregation remains asynchronous;
- AI never runs on ordinary navigation;
- media loads progressively;
- long lists virtualize;
- app-facing backend reads are paginated/bounded;
- N+1 query patterns are not accepted on critical paths;
- startup does not hydrate the entire World before becoming interactive.

## 13. Visual and Interaction Direction

The mobile product should feel clean, adult, spatial, and alive—not like a generic neon metaverse and not like a clone of X, Instagram, or Facebook.

Key principles:

- large, readable touch surfaces;
- clear sense of Place and depth;
- distinct Place identity without fragmenting the overall app;
- immediate motion/feedback, with reduced-motion support;
- no follower-count obsession as the dominant status surface;
- no endless global algorithmic feed as the primary home experience;
- contribution, expertise, trust, and community history matter more than vanity metrics.

The established avatar system, Citizen identity, artifacts, and Place Modes remain compatible with the mobile shell.

## 14. Accessibility

The app must support:

- VoiceOver/TalkBack labels and navigation order;
- dynamic text scaling where layout allows;
- minimum practical touch-target sizes;
- sufficient contrast;
- reduced-motion behavior;
- non-color-only state indicators;
- keyboard/accessibility focus correctness for supported external input scenarios.

Accessibility regressions on core navigation and participation are release blockers.

## 15. Safety and Privacy Boundaries

Existing NETIZENS safety rules carry into mobile:

- no unsolicited DMs by default;
- blocks affect visibility and messaging;
- private Circle membership is authorization, not decoration;
- public discussion and private conversation remain distinct;
- reports/moderation are authenticated and auditable;
- seeded/demo activity stays distinguishable from genuine activity;
- seeded/demo activity does not inflate genuine reputation;
- exact location is not exposed by default;
- deep links must not bypass authorization checks.

## 16. Error and Reconciliation Model

Errors are classified into at least:

- transient network
- offline
- authentication/session
- authorization/RLS rejection
- validation
- conflict/stale state
- server/internal

Behavior:

- transient/offline retryable writes stay in the outbox;
- authentication failures pause protected sync until session recovery;
- authorization/validation failures do not retry forever;
- rejected optimistic state is reconciled and surfaced to the user;
- no mutation is shown as canonically completed solely because the local optimistic update succeeded.

## 17. Testing Strategy

### Static/type checks

- TypeScript strict mode
- Expo/React Native linting
- route/type validation

### Unit/domain tests

Cover:

- route construction/parsing
- entity/Place projection mapping
- mutation UUID stability
- outbox retry semantics
- optimistic apply/reconcile behavior
- auth/session storage adapter
- notification routing
- Perception-boundary enforcement

### Component tests

Cover:

- app shell
- Place screen states
- Entity participation
- notifications
- offline/refresh/error states
- private/public boundary rendering

### Device E2E

Maestro critical-path flows on both iOS and Android:

1. launch/authenticate;
2. enter World;
3. open Place;
4. open Entity;
5. join;
6. post/reply;
7. background/resume;
8. open a deep link;
9. open a notification;
10. verify offline cached read and queued eligible write;
11. verify Circle/public-discussion separation.

### Existing regression suite

The current browser World and production-contract QA remain green. Mobile work must not weaken the existing database/RLS tests.

## 18. Build and Release Architecture

Use Expo CNG/EAS-compatible configuration rather than committing native projects prematurely.

Release stages:

```text
local development
  -> simulator/device development build
  -> CI type/unit/component checks
  -> internal EAS build
  -> private beta
  -> store release candidates
  -> public release
```

The application is released under Legacy Works Ventures LLC's developer organization. Bundle/package identifiers and store metadata are release configuration, not architecture dependencies.

## 19. CI Gates

A mobile PR cannot be considered merge-ready merely because the app starts.

Required gates grow in stages, beginning with:

- dependency/install integrity
- TypeScript compile/typecheck
- lint
- unit tests
- component tests
- existing NETIZENS browser/backend QA

Before private beta, add:

- device E2E smoke suite
- deep-link tests
- offline/outbox regression tests
- measured startup/navigation performance checks on representative builds
- release configuration validation

## 20. Initial Implementation Sequence

The implementation plan should decompose the mobile build in this order:

1. mobile project shell and CI;
2. route/deep-link graph;
3. theme/app shell/navigation;
4. secure authenticated session adapter;
5. SQLite cache + mutation outbox;
6. NETIZENS backend transport/reconciliation;
7. World/Place/Entity read flows;
8. Core Participation mobile UI;
9. notifications + push/deep-link routing;
10. messages/private Circle boundaries;
11. device capabilities and Local permissions;
12. performance instrumentation;
13. private-beta E2E/release hardening.

Each stage must leave the app testable and must not require later stages merely to preserve ordinary navigation.

## 21. Non-Goals for the First Mobile Architecture

The first mobile build does **not** require:

- a national College Campus Map;
- a national Issue Graph;
- Coalition Rooms;
- heavy Time Machine expansion;
- an algorithmic global feed;
- contact-book ingestion;
- full native modules for features that Expo can safely provide;
- a separate mobile backend;
- a duplicate Perception memory/state system;
- converting the entire repository into a complex monorepo before reuse demands it.

## 22. Acceptance Gate for Private Beta

Private beta requires all of the following:

- real iOS and Android builds;
- authenticated permanent-Citizen entry;
- stable World -> Place -> Entity navigation;
- cached fast rendering and background reconciliation;
- join/post/reply functionality using the production social contract;
- retry-safe idempotent writes;
- notifications with direct routing;
- block/report/private-Circle boundaries enforced;
- no AI dependency on ordinary social paths;
- no seeded/demo activity counted as genuine reputation;
- deep links cannot bypass authorization;
- critical E2E flows green on both platforms;
- startup/navigation performance measured against the Speed Standard;
- no known critical security/RLS regression.

## 23. Reference Documentation

Official Expo references used to validate the initial technical baseline:

- https://docs.expo.dev/versions/latest/
- https://docs.expo.dev/versions/latest/sdk/router/
- https://docs.expo.dev/guides/typescript/
- https://docs.expo.dev/router/basics/notation/
- https://docs.expo.dev/more/create-expo/
