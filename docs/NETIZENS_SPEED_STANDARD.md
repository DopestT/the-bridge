# NETIZENS Speed Standard

NETIZENS is an app-first product. Speed is a product requirement, not a finishing pass.

## Governing rule

Ordinary social use must feel immediate and must not depend on Perception or any external AI provider being available.

The critical path for launch, navigation, reading, joining, posting, replying, voting, messaging, and viewing notifications stays inside the NETIZENS app + NETIZENS backend contract.

Perception may enhance an objective, but it must never be required for basic social responsiveness.

## Performance targets

These are engineering targets to measure on representative production builds, not guarantees before measurement exists.

- Warm app resume to interactive: target <= 1.0 s at p75.
- Cold launch to usable primary surface: target <= 2.5 s at p75 on supported devices.
- Navigation response begins after touch: target <= 100 ms.
- Local/optimistic mutation acknowledgement: target <= 150 ms for joins, votes, posts, replies, reactions, notification reads, and similar actions.
- Cached Place/entity render: target <= 300 ms after navigation begins.
- Network-backed refresh should not block already-cached content from rendering.
- Background sync must retry safely without duplicate logical mutations.

## App architecture implications

- Local-first state is a latency feature as well as a resilience feature.
- Mutations use stable idempotency keys so optimistic UI can respond immediately and synchronize afterward.
- Place/entity screens should render from cached canonical-shaped data first, then reconcile from the server.
- Loading indicators are reserved for genuinely unavailable data; do not blank an already-known screen while refreshing.
- Heavy work moves off the interaction path whenever possible.
- Push/deep-link routing must open the relevant Place/entity directly without forcing a full World reload first.
- Image/video media loads progressively and must not block text/actions.
- Infinite work, expensive aggregation, and AI calls do not run synchronously on ordinary navigation.

## Mobile-first behavior

- Touch feedback is immediate.
- Navigation transitions start immediately even if network reconciliation continues.
- Safe-area/layout calculation must not cause visible relayout loops.
- Lists virtualize once data volume warrants it.
- App state should survive routine background/foreground transitions without unnecessary re-fetching.
- Offline or degraded-network states should preserve readable cached state and queue eligible writes.

## Backend implications

- Index the paths users traverse most: Place/entity listings, memberships, discussion chronology, unread notifications, messages, and Yes/No vote state.
- Avoid N+1 read patterns in app-facing queries.
- Prefer bounded payloads and pagination/cursors over large World dumps.
- Realtime subscriptions must be scoped to the current Citizen/context rather than the entire network.
- Expensive reputation, analytics, recommendation, and AI-derived calculations should be precomputed or asynchronous when possible.

## Perception boundary

Perception remains optional to social-state integrity and speed.

Fast path:

`Citizen action -> NETIZENS local state -> optimistic UI -> NETIZENS canonical backend -> reconciliation`

AI-enhanced path:

`Citizen objective -> bounded NETIZENS context -> Perception -> proposed route/action -> permission -> verified result -> NETIZENS`

A slow or unavailable Perception route must not make NETIZENS itself feel slow.

## Build gate

A feature is not considered finished merely because it functions. Before production readiness, verify that it does not introduce avoidable blocking waits into the app's critical path.

When correctness and speed conflict, preserve correctness and redesign the interaction so correctness does not require making the user wait unnecessarily.
