# NETIZENS Mobile App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first shipping NETIZENS iOS/Android application with fast native navigation, secure authenticated state, local-first caching/outbox behavior, World -> Place -> Entity participation, notifications, private messaging boundaries, device permissions, performance instrumentation, and private-beta release gates.

**Architecture:** Add a dedicated Expo/React Native application at `apps/netizens-mobile/` that consumes the existing NETIZENS backend contracts without creating a second canonical social model. The device stores projections and a retry-safe outbox only; Supabase remains authoritative for social state, while Perception remains optional and outside ordinary social critical paths.

**Tech Stack:** Expo SDK 57, React Native 0.86, React 19.2.x, TypeScript, Expo Router, Expo SQLite, Expo SecureStore, Expo Notifications, Supabase JS, Jest/`jest-expo`, React Native Testing Library, Maestro, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-05-netizens-mobile-app-design.md`

## Global Constraints

- Build a real iOS/Android app, not a WebView/browser wrapper.
- Application root: `apps/netizens-mobile/`.
- Expo SDK 57; React Native 0.86; React 19.2.x; Node.js >= 22.13.x.
- Use Expo Router and Continuous Native Generation; do not commit permanent `ios/` or `android/` trees in the initial architecture.
- Supabase NETIZENS backend remains canonical for social state; SQLite is cache/outbox only.
- Never ship a Supabase service-role credential or any privileged database secret in the app.
- Anonymous Supabase Auth users do not enter NETIZENS World.
- Perception must not be required for launch, navigation, reading, joining, posting, replying, voting, messaging, or notifications.
- College remains `NETIZENS -> Crews -> College Groups`; no College-specific top-level route or mobile subsystem.
- Public entity discussion and private Circles/direct messages remain separate security domains.
- Seeded/demo activity remains distinguishable from genuine activity and cannot inflate genuine reputation.
- Deep links never bypass backend authorization/RLS.
- Notification permission is contextual, never requested automatically on first launch.
- Precise location is optional and only requested when a Local action requires it.
- Contacts permission/address-book ingestion is out of scope.
- Existing browser/backend/RLS QA must remain green throughout mobile development.
- Speed targets remain: warm resume <= 1.0 s p75; cold usable launch <= 2.5 s p75; touch/navigation response begins <= 100 ms; optimistic acknowledgement <= 150 ms; cached Place/entity render <= 300 ms.

## Review Focus

- **Stale auth with valid cached content:** cached read surfaces remain usable while protected writes pause until session recovery; tests live in Task 4 and Task 6.
- **Duplicate outbox replay after crash/network failure:** the same client mutation UUID survives retries and cannot generate a second logical write; tests live in Task 5 and Task 6.
- **Deep link into unauthorized/private content:** route parsing may resolve the ID, but the app must render an authorization/not-found state after canonical fetch rather than leaking content; tests live in Task 2, Task 7, and Task 10.
- **Private Circle content entering public discussion paths:** Circle entities never use public entity-discussion repositories/components; tests live in Task 8 and Task 10.
- **Offline optimistic write later rejected by RLS/validation:** the optimistic projection is reconciled visibly and the failed outbox item becomes terminal rather than retrying forever; tests live in Task 5, Task 6, and Task 8.

---

### Task 1: Scaffold the native mobile project and CI gate

**Files:**
- Create: `apps/netizens-mobile/package.json`
- Create: `apps/netizens-mobile/app.json`
- Create: `apps/netizens-mobile/tsconfig.json`
- Create: `apps/netizens-mobile/eslint.config.js`
- Create: `apps/netizens-mobile/jest.config.js`
- Create: `apps/netizens-mobile/jest.setup.ts`
- Create: `apps/netizens-mobile/app/_layout.tsx`
- Create: `apps/netizens-mobile/app/index.tsx`
- Create: `apps/netizens-mobile/src/app/boot.ts`
- Create: `apps/netizens-mobile/src/app/boot.test.ts`
- Create: `.github/workflows/netizens-mobile.yml`

**Interfaces:**
- Consumes: none beyond repository root and approved spec.
- Produces: runnable Expo app, scripts `typecheck`, `lint`, `test`, `test:ci`; `BootState = { phase: "shell" | "ready"; hydrated: boolean }`; `createInitialBootState(): BootState`.

- [ ] **Step 1: Scaffold the Expo SDK 57 application**

Create `apps/netizens-mobile/` from the current Expo default TypeScript template, then verify generated dependency versions resolve to Expo 57.x, React Native 0.86.x, React 19.2.x, and Node engine >=22.13.

- [ ] **Step 2: Write the failing boot test**

Create `src/app/boot.test.ts` asserting `createInitialBootState()` returns `{ phase: "shell", hydrated: false }` and imports no Perception client/module.

- [ ] **Step 3: Run the focused test and verify RED**

Run: `cd apps/netizens-mobile && npm test -- --runInBand src/app/boot.test.ts`
Expected: FAIL because `src/app/boot.ts`/`createInitialBootState` does not exist.

- [ ] **Step 4: Implement the minimal boot contract**

Create `src/app/boot.ts` exporting:

```ts
export type BootState = { phase: "shell" | "ready"; hydrated: boolean };
export function createInitialBootState(): BootState;
```

Keep boot synchronous and free of network/AI dependencies.

- [ ] **Step 5: Make the root route render a native NETIZENS shell immediately**

`app/index.tsx` renders a minimal native screen with product name and no WebView. `app/_layout.tsx` hosts the Router stack.

- [ ] **Step 6: Add mobile CI**

`.github/workflows/netizens-mobile.yml` runs on changes under `apps/netizens-mobile/**`, the mobile workflow itself, and shared NETIZENS SQL/contracts. It installs with `npm ci` and runs `typecheck`, `lint`, `test:ci`, plus the existing browser/backend QA commands.

- [ ] **Step 7: Verify GREEN**

Run:
`cd apps/netizens-mobile && npm run typecheck && npm run lint && npm run test:ci`
Then run existing NETIZENS browser/backend QA.
Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/netizens-mobile .github/workflows/netizens-mobile.yml
git commit -m "feat: scaffold NETIZENS mobile app"
```

### Task 2: Lock the route and deep-link contract

**Files:**
- Create: `apps/netizens-mobile/src/navigation/routes.ts`
- Create: `apps/netizens-mobile/src/navigation/routes.test.ts`
- Create: `apps/netizens-mobile/app/world.tsx`
- Create: `apps/netizens-mobile/app/place/[placeId].tsx`
- Create: `apps/netizens-mobile/app/entity/[entityId].tsx`
- Create: `apps/netizens-mobile/app/search.tsx`
- Create: `apps/netizens-mobile/app/messages/index.tsx`
- Create: `apps/netizens-mobile/app/messages/[threadId].tsx`
- Create: `apps/netizens-mobile/app/notifications.tsx`
- Create: `apps/netizens-mobile/app/profile.tsx`
- Modify: `apps/netizens-mobile/app.json`

**Interfaces:**
- Consumes: Expo Router.
- Produces: `NetizensRoute`, `parseNetizensUrl(url: string): NetizensRoute | null`, `routeToHref(route: NetizensRoute): string`; custom scheme `netizens`.

- [ ] **Step 1: Write route-contract tests**

Tests must cover `/world`, `/place/:placeId`, `/entity/:entityId`, `/search`, `/messages`, `/messages/:threadId`, `/notifications`, `/profile`, `netizens://entity/<id>`, malformed IDs returning `null`, and a private deep link producing only a route descriptor—not cached private content.

- [ ] **Step 2: Run route tests and verify RED**

Run: `npm test -- --runInBand src/navigation/routes.test.ts`
Expected: FAIL because route helpers do not exist.

- [ ] **Step 3: Implement the typed route helpers**

Define a discriminated union for the initial route contract. `parseNetizensUrl` parses internal path/scheme only; authorization remains repository/backend work.

- [ ] **Step 4: Add Expo Router route files and custom scheme**

Each route renders a native placeholder backed by route params. Set `scheme: "netizens"` in app config. Do not select a production universal-link host yet.

- [ ] **Step 5: Verify route tests and Router typecheck GREEN**

Run: `npm run typecheck && npm test -- --runInBand src/navigation/routes.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/netizens-mobile/app apps/netizens-mobile/src/navigation apps/netizens-mobile/app.json
git commit -m "feat: add NETIZENS mobile route contract"
```

### Task 3: Build the app shell, theme, and primary navigation

**Files:**
- Create: `apps/netizens-mobile/src/theme/tokens.ts`
- Create: `apps/netizens-mobile/src/theme/ThemeProvider.tsx`
- Create: `apps/netizens-mobile/src/components/AppShell.tsx`
- Create: `apps/netizens-mobile/src/components/PlaceBreadcrumb.tsx`
- Create: `apps/netizens-mobile/src/components/__tests__/AppShell.test.tsx`
- Create: `apps/netizens-mobile/app/(tabs)/_layout.tsx`
- Move/adapt primary routes under `app/(tabs)/` as Router permits while preserving public hrefs.

**Interfaces:**
- Consumes: Task 2 route contract.
- Produces: `ThemeTokens`; `AppShell({children,title,breadcrumb})`; primary tabs World/Search/Messages/Notifications/Profile.

- [ ] **Step 1: Write failing shell tests**

Assert five primary tabs exist, World is the default entry, touch targets expose accessibility roles/labels, breadcrumb renders structural depth, and reduced-motion mode disables nonessential transition animation.

- [ ] **Step 2: Verify RED**

Run focused component test; expected FAIL because shell/theme components do not exist.

- [ ] **Step 3: Implement theme tokens and AppShell**

Use a clean, adult, spatial visual system with native surfaces; no WebView, no generic global feed, no neon-metaverse treatment.

- [ ] **Step 4: Implement bottom-tab navigation and breadcrumb depth**

Preserve route hrefs from Task 2. Place/Entity screens remain stack-deep rather than becoming new tabs.

- [ ] **Step 5: Verify GREEN**

Run component tests, typecheck, lint.

- [ ] **Step 6: Commit**

```bash
git add apps/netizens-mobile
git commit -m "feat: build NETIZENS mobile app shell"
```

### Task 4: Add secure permanent-Citizen session handling

**Files:**
- Create: `apps/netizens-mobile/src/auth/types.ts`
- Create: `apps/netizens-mobile/src/auth/secure-session.ts`
- Create: `apps/netizens-mobile/src/auth/session-controller.ts`
- Create: `apps/netizens-mobile/src/auth/session-controller.test.ts`
- Create: `apps/netizens-mobile/src/api/supabase.ts`
- Create: `apps/netizens-mobile/src/config/env.ts`
- Create: `apps/netizens-mobile/.env.example`

**Interfaces:**
- Consumes: Expo SecureStore, Supabase JS.
- Produces: `SessionState = "unknown" | "anonymous" | "authenticated" | "expired"`; `SessionController.restore()`, `refresh()`, `requireWriteSession()`, `logout()`; `createSupabaseClient()` using only public/publishable credentials.

- [ ] **Step 1: Write failing session tests**

Cover secure restore, anonymous-user rejection, stale/expired session while cached reads remain available, protected write refusal without valid session, refresh recovery, and logout clearing sensitive tokens.

- [ ] **Step 2: Verify RED**

Run focused session tests; expected FAIL because controller does not exist.

- [ ] **Step 3: Implement environment validation and Supabase client factory**

Required variables: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Explicitly reject any `SERVICE_ROLE`-style variable from the client config contract.

- [ ] **Step 4: Implement SecureStore adapter and SessionController**

Session state gates protected writes but does not blank already-cached read surfaces while a refresh is in progress.

- [ ] **Step 5: Verify GREEN**

Run session tests, typecheck, lint.

- [ ] **Step 6: Commit**

```bash
git add apps/netizens-mobile/src/auth apps/netizens-mobile/src/api apps/netizens-mobile/src/config apps/netizens-mobile/.env.example
git commit -m "feat: add secure NETIZENS mobile sessions"
```

### Task 5: Add SQLite projections and retry-safe mutation outbox

**Files:**
- Create: `apps/netizens-mobile/src/storage/database.ts`
- Create: `apps/netizens-mobile/src/storage/schema.ts`
- Create: `apps/netizens-mobile/src/storage/migrations.ts`
- Create: `apps/netizens-mobile/src/storage/projections.ts`
- Create: `apps/netizens-mobile/src/sync/types.ts`
- Create: `apps/netizens-mobile/src/sync/outbox.ts`
- Create: `apps/netizens-mobile/src/sync/outbox.test.ts`

**Interfaces:**
- Consumes: Expo SQLite.
- Produces: `openNetizensDatabase()`, `ProjectionStore`; `Outbox.enqueue(kind,payload): Promise<OutboxItem>`, `claimBatch(limit)`, `markRetry(id,errorClass)`, `markTerminal(id,errorClass)`, `markApplied(id)`; stable `mutationId: string` UUID.

- [ ] **Step 1: Write failing outbox tests**

Cover enqueue, stable UUID across retry, process restart reload, bounded batch order, transient retry, terminal authorization/validation failure, and duplicate enqueue protection when the same mutation ID is supplied.

- [ ] **Step 2: Verify RED**

Run focused outbox tests; expected FAIL.

- [ ] **Step 3: Implement SQLite schema/migrations**

Create local projections for Citizen, Places, Entities, memberships, discussion, notifications, thread summaries, navigation recovery, sync checkpoints, and mutation outbox. Do not store auth secrets in SQLite.

- [ ] **Step 4: Implement projection and outbox interfaces**

The device database remains non-authoritative. Optimistic records carry pending/rejected/applied metadata separate from canonical server fields.

- [ ] **Step 5: Verify crash/retry and terminal-failure behavior GREEN**

Run focused tests plus full mobile unit suite.

- [ ] **Step 6: Commit**

```bash
git add apps/netizens-mobile/src/storage apps/netizens-mobile/src/sync
git commit -m "feat: add NETIZENS mobile cache and outbox"
```

### Task 6: Implement backend transport and reconciliation

**Files:**
- Create: `apps/netizens-mobile/src/api/netizens-repository.ts`
- Create: `apps/netizens-mobile/src/api/netizens-repository.test.ts`
- Create: `apps/netizens-mobile/src/sync/reconciler.ts`
- Create: `apps/netizens-mobile/src/sync/reconciler.test.ts`

**Interfaces:**
- Consumes: Task 4 Supabase/session contract; Task 5 ProjectionStore/Outbox.
- Produces: `NetizensRepository` read/write interface; `Reconciler.syncOnce(): Promise<SyncResult>`; error classes `transient | offline | auth | authorization | validation | conflict | server`.

- [ ] **Step 1: Write failing repository/reconciler tests**

Cover cached-first reads, paginated/bounded server refresh, idempotent mutation ID forwarding, transient retry, stale-auth pause, RLS/validation terminal rejection, optimistic rollback/reconcile, and no Perception invocation on ordinary social requests.

- [ ] **Step 2: Verify RED**

Run focused repository/reconciler tests; expected FAIL.

- [ ] **Step 3: Implement repository queries against existing NETIZENS tables/RPCs**

Reuse the current backend contract; do not create a mobile-only database or duplicate social tables.

- [ ] **Step 4: Implement `Reconciler.syncOnce()`**

Transient/offline remains queued; auth pauses; authorization/validation becomes terminal; successful canonical response updates projection then marks outbox item applied.

- [ ] **Step 5: Verify GREEN**

Run focused tests and existing production contract QA.

- [ ] **Step 6: Commit**

```bash
git add apps/netizens-mobile/src/api apps/netizens-mobile/src/sync
git commit -m "feat: sync NETIZENS mobile state safely"
```

### Task 7: Build World, Place, and Entity read flows

**Files:**
- Create: `apps/netizens-mobile/src/features/world/WorldScreen.tsx`
- Create: `apps/netizens-mobile/src/features/world/PlaceScreen.tsx`
- Create: `apps/netizens-mobile/src/features/world/EntityScreen.tsx`
- Create: `apps/netizens-mobile/src/features/world/world-model.ts`
- Create: `apps/netizens-mobile/src/features/world/__tests__/world-flow.test.tsx`
- Modify: matching Router route files from Task 2.

**Interfaces:**
- Consumes: Task 3 AppShell; Task 5 projections; Task 6 repository.
- Produces: cached-first World -> Place -> Entity screens with state `neverLoaded | cachedRefreshing | offlineCached | ready | unavailable | unauthorized`.

- [ ] **Step 1: Write failing read-flow tests**

Assert cached Place/entity renders before network completion, refresh failure preserves cached content, unknown resource shows unavailable, unauthorized deep link shows no cached private body, and College Groups render as generic Crew entities with no College-only route.

- [ ] **Step 2: Verify RED**

Run focused World flow tests; expected FAIL.

- [ ] **Step 3: Implement World/Place/Entity model and screens**

Do not hydrate the entire World at startup. Use bounded/cursor reads for Place/entity collections.

- [ ] **Step 4: Wire Router routes to feature screens**

Keep the structural breadcrumb and direct deep-link entry behavior.

- [ ] **Step 5: Verify GREEN**

Run focused component tests, typecheck, lint.

- [ ] **Step 6: Commit**

```bash
git add apps/netizens-mobile/src/features/world apps/netizens-mobile/app
git commit -m "feat: add NETIZENS mobile World navigation"
```

### Task 8: Bring Core Participation to mobile

**Files:**
- Create: `apps/netizens-mobile/src/features/participation/ParticipationPanel.tsx`
- Create: `apps/netizens-mobile/src/features/participation/DiscussionList.tsx`
- Create: `apps/netizens-mobile/src/features/participation/Composer.tsx`
- Create: `apps/netizens-mobile/src/features/participation/participation-service.ts`
- Create: `apps/netizens-mobile/src/features/participation/__tests__/participation.test.tsx`
- Modify: `apps/netizens-mobile/src/features/world/EntityScreen.tsx`

**Interfaces:**
- Consumes: existing `entity_memberships` and `entity_discussion_items` production contracts through Task 6 repository/outbox.
- Produces: join/leave, root post, reply, notification-read optimistic operations; no public participation path for Circles.

- [ ] **Step 1: Write failing participation tests**

Cover immediate optimistic acknowledgement, stable mutation ID, join/post/reply rendering, seeded/demo provenance not counted as genuine reputation state, missing/moderated parent safety, Circle entity refusing the public discussion component, offline queueing, and visible rollback when RLS/validation later rejects a write.

- [ ] **Step 2: Verify RED**

Run focused participation tests; expected FAIL.

- [ ] **Step 3: Implement participation service**

Map local optimistic operations to the existing generic Core Participation contracts; no College-specific branch.

- [ ] **Step 4: Implement mobile participation UI**

Touch response is immediate; pending state is visible but distinct from canonical completion.

- [ ] **Step 5: Verify GREEN**

Run focused tests plus existing Core Participation browser/backend QA.

- [ ] **Step 6: Commit**

```bash
git add apps/netizens-mobile/src/features/participation apps/netizens-mobile/src/features/world/EntityScreen.tsx
git commit -m "feat: add NETIZENS mobile participation"
```

### Task 9: Add canonical notifications, push registration, and routing

**Files:**
- Create: `apps/netizens-mobile/src/features/notifications/notification-router.ts`
- Create: `apps/netizens-mobile/src/features/notifications/notification-router.test.ts`
- Create: `apps/netizens-mobile/src/features/notifications/NotificationsScreen.tsx`
- Create: `apps/netizens-mobile/src/features/notifications/push.ts`
- Modify: `apps/netizens-mobile/app/notifications.tsx`

**Interfaces:**
- Consumes: canonical backend notifications, Task 2 routes, Expo Notifications.
- Produces: `routeNotification(payload): NetizensRoute | null`; contextual `requestPushPermission(reason)`; push registration token adapter.

- [ ] **Step 1: Write failing notification tests**

Cover Entity/thread/deep-link routing, invalid payload rejection, no permission request on first launch, contextual request after qualifying user action, and sensitive payloads containing routing identifiers rather than private message bodies.

- [ ] **Step 2: Verify RED**

Run focused tests; expected FAIL.

- [ ] **Step 3: Implement canonical NotificationsScreen and router**

Backend notification rows remain the source of read/unread state; push is only an attention signal.

- [ ] **Step 4: Implement contextual push registration**

Do not request permission until explicitly triggered by a value-bearing action.

- [ ] **Step 5: Verify GREEN**

Run tests, typecheck, lint.

- [ ] **Step 6: Commit**

```bash
git add apps/netizens-mobile/src/features/notifications apps/netizens-mobile/app/notifications.tsx
git commit -m "feat: add NETIZENS mobile notifications"
```

### Task 10: Add Messages and enforce private Circle boundaries

**Files:**
- Create: `apps/netizens-mobile/src/features/messages/MessagesScreen.tsx`
- Create: `apps/netizens-mobile/src/features/messages/ThreadScreen.tsx`
- Create: `apps/netizens-mobile/src/features/messages/message-service.ts`
- Create: `apps/netizens-mobile/src/features/messages/__tests__/messages.test.tsx`
- Modify: Router message files.

**Interfaces:**
- Consumes: existing `conversation_threads`, `thread_members`, `messages`, blocks, backend RLS.
- Produces: thread list/read/send flow; private Circle/direct content never routed through `entity_discussion_items`.

- [ ] **Step 1: Write failing privacy/message tests**

Cover membership-gated thread access, blocked-user send failure, unsolicited DM prevention, unauthorized deep-link no-content behavior, cached thread summary without cached protected body after logout, and assertion that Circle/private sends use message service rather than public discussion service.

- [ ] **Step 2: Verify RED**

Run focused tests; expected FAIL.

- [ ] **Step 3: Implement message service and screens**

Respect server RLS as authoritative; client state can improve UX but never grants access.

- [ ] **Step 4: Verify GREEN**

Run focused tests and production contract QA.

- [ ] **Step 5: Commit**

```bash
git add apps/netizens-mobile/src/features/messages apps/netizens-mobile/app/messages
git commit -m "feat: add private NETIZENS mobile messaging"
```

### Task 11: Add device permissions and Local capability boundaries

**Files:**
- Create: `apps/netizens-mobile/src/permissions/permissions.ts`
- Create: `apps/netizens-mobile/src/permissions/permissions.test.ts`
- Create: `apps/netizens-mobile/src/features/local/location.ts`
- Create: `apps/netizens-mobile/src/features/local/location.test.ts`
- Create: `apps/netizens-mobile/src/features/local/LocalScreen.tsx`

**Interfaces:**
- Consumes: Expo Location, media-library/camera APIs only when feature action requires them.
- Produces: contextual permission helpers; `toPublicLocation()` that emits privacy-preserving/coarse location representation and never exact coordinates by default.

- [ ] **Step 1: Write failing permission/privacy tests**

Cover no first-launch location/camera/notification request, Local read without precise location, explicit Local action requesting location, denied permission fallback, and exact-coordinate suppression from public payloads.

- [ ] **Step 2: Verify RED**

Run focused permission tests; expected FAIL.

- [ ] **Step 3: Implement contextual permission helpers and Local location adapter**

Do not add contacts permission.

- [ ] **Step 4: Implement Local screen integration**

Local remains usable in degraded/coarse mode without making location permission mandatory for the app.

- [ ] **Step 5: Verify GREEN**

Run focused tests, typecheck, lint.

- [ ] **Step 6: Commit**

```bash
git add apps/netizens-mobile/src/permissions apps/netizens-mobile/src/features/local
git commit -m "feat: add privacy-aware NETIZENS device permissions"
```

### Task 12: Instrument and gate speed

**Files:**
- Create: `apps/netizens-mobile/src/performance/metrics.ts`
- Create: `apps/netizens-mobile/src/performance/metrics.test.ts`
- Create: `apps/netizens-mobile/src/performance/PerformanceBoundary.tsx`
- Create: `apps/netizens-mobile/scripts/check-performance-budget.mjs`
- Modify: `apps/netizens-mobile/package.json`
- Modify: `.github/workflows/netizens-mobile.yml`

**Interfaces:**
- Consumes: monotonic timing API, app lifecycle/navigation events.
- Produces: metrics `warm_resume_ms`, `cold_usable_ms`, `navigation_response_ms`, `optimistic_ack_ms`, `cached_entity_render_ms`; CI budget checker that fails only on measured fixtures/benchmarks, not invented production numbers.

- [ ] **Step 1: Write failing metrics/budget tests**

Assert metric names, monotonic durations, and exact spec budgets: 1000/2500/100/150/300 ms respectively.

- [ ] **Step 2: Verify RED**

Run focused tests; expected FAIL.

- [ ] **Step 3: Implement performance instrumentation**

Instrumentation must not synchronously block navigation or send network analytics on the interaction path.

- [ ] **Step 4: Add budget script and CI command**

The script consumes explicit measurement JSON fixtures/build output and reports pass/fail per budget. Do not claim device performance before device measurements exist.

- [ ] **Step 5: Verify GREEN**

Run unit tests and `npm run performance:check` against controlled fixtures.

- [ ] **Step 6: Commit**

```bash
git add apps/netizens-mobile/src/performance apps/netizens-mobile/scripts apps/netizens-mobile/package.json .github/workflows/netizens-mobile.yml
git commit -m "feat: measure NETIZENS mobile speed budgets"
```

### Task 13: Add private-beta device E2E and release gates

**Files:**
- Create: `apps/netizens-mobile/.maestro/launch-and-world.yaml`
- Create: `apps/netizens-mobile/.maestro/participation.yaml`
- Create: `apps/netizens-mobile/.maestro/deep-link-notification.yaml`
- Create: `apps/netizens-mobile/.maestro/offline-recovery.yaml`
- Create: `apps/netizens-mobile/.maestro/private-circle-boundary.yaml`
- Create: `apps/netizens-mobile/eas.json`
- Create: `apps/netizens-mobile/scripts/validate-release-config.mjs`
- Create: `apps/netizens-mobile/PRIVATE_BETA_GATE.md`
- Modify: `.github/workflows/netizens-mobile.yml`

**Interfaces:**
- Consumes: Tasks 1-12.
- Produces: reproducible iOS/Android private-beta smoke flows, release-config validation, explicit private-beta checklist.

- [ ] **Step 1: Write release-config validation tests/fixtures**

Assert CNG-compatible config, `netizens` scheme, no service-role secret names, required public Supabase variables declared by environment contract, and iOS/Android app identifiers supplied at release configuration time.

- [ ] **Step 2: Verify validator RED**

Run release validator test before implementation; expected FAIL.

- [ ] **Step 3: Implement EAS/release configuration validator**

Keep native projects generated rather than permanently committed unless a later native requirement forces the change.

- [ ] **Step 4: Add Maestro critical paths**

Cover launch/authenticate, World -> Place -> Entity, join/post/reply, background/resume, deep link, notification route, cached offline read + queued eligible write, and Circle/public-discussion separation on both platforms.

- [ ] **Step 5: Create `PRIVATE_BETA_GATE.md`**

Require: real iOS and Android builds; permanent-Citizen auth; cached fast navigation; production join/post/reply contract; retry-safe writes; canonical notifications/deep links; blocks/reports/private-Circle boundaries; no AI dependency on ordinary social paths; no seeded/demo reputation inflation; green critical E2E on both platforms; measured performance; no known critical security/RLS regression.

- [ ] **Step 6: Run full verification**

Run mobile typecheck/lint/unit/component suite, existing browser/backend/RLS QA, release validator, and available simulator/device Maestro smoke tests. Record unavailable physical-device measurements as unverified rather than passing them by assumption.

- [ ] **Step 7: Whole-branch review before merge**

Review specifically for source-of-truth duplication, secret leakage, RLS assumptions, private/public boundary drift, College boundary drift, Perception on critical paths, idempotency regressions, and speed regressions.

- [ ] **Step 8: Commit**

```bash
git add apps/netizens-mobile .github/workflows/netizens-mobile.yml
git commit -m "test: gate NETIZENS mobile private beta"
```

## Final Verification Sequence

Before declaring the mobile milestone complete:

1. `cd apps/netizens-mobile && npm ci`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run test:ci`
5. `npm run performance:check` using recorded/fixture measurements as appropriate
6. run the existing NETIZENS browser World QA suite
7. run backend and production SQL contract QA
8. run Maestro smoke flows available in the execution environment
9. inspect dependency/config output for accidental privileged credentials
10. inspect the final diff for College-specific top-level routing, public/private discussion crossover, duplicate canonical state, or synchronous Perception dependencies

Only after the complete verification sequence is green may the branch be considered merge-ready. Physical-device or store-build claims remain explicitly unverified until those builds/tests actually run.