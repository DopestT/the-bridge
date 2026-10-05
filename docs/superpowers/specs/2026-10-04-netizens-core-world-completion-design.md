# NETIZENS Core World Completion Design

## Intent

Finish the non-College NETIZENS World while keeping Atlas — NETIZENS College Side isolated inside `NETIZENS → Crews → College Groups` so College can adopt shared NETIZENS contracts later without controlling the architecture or blocking delivery.

The governing split is:

- **Atlas / College Side owns:** College Groups discovery, campus pages, campus participation flows, DMV pilot instrumentation, and later College-specific expansion.
- **Core NETIZENS owns:** Commons, generic Crews, Local, Projects, Ask, Exchange, Circles, Events, Plans, Yes or No, Citizen/reputation, notifications, messaging, safety, World navigation, and shared entity contracts.
- **Perception owns:** objective understanding, Reality Maps, routes, runtime permissions, execution, verification, adaptation, learning, and scenario intelligence.

College is **Perception-ready, not Perception-dependent**.

## Product outcome

A Citizen should be able to enter NETIZENS, move among distinct Places, participate using the interaction grammar of each Place, convert intent into action across Places, preserve one identity and reputation throughout, and use Perception when useful without the social network depending on an AI provider for canonical state.

NETIZENS remains:

> **One network, many places.**

> **Separate by purpose. Connect by intent.**

> **A social app on the surface. A world underneath.**

## Existing foundation

This design builds on the merged foundation already present in `DopestT/the-bridge`:

- World V3 entity graph and nested `World → Place → Entity → deeper Entity` navigation;
- local-first data adapter;
- production Supabase schema with auth-bound Citizens, World Entities, memberships, messaging, notifications, blocking, reporting, moderation foundations, artifacts/reputation, Perception bindings, and Time Machine storage;
- live Perception client with bounded NETIZENS context and local fallback;
- durable NETIZENS / Perception ownership boundary;
- College Groups pilot inside Crews.

No second social-state model will be introduced.

## Approaches considered

### Selected: shared social primitives, then Place-specific experiences

Build a small set of durable primitives once—discussion, membership, relationship/link, messaging, notification, moderation, reputation, approximate location—and make each Place compose those primitives with its own interaction grammar.

Advantages:

- avoids duplicated logic across Places;
- preserves distinct Place identity without fragmenting state;
- gives College stable contracts to adopt later;
- maps cleanly onto the existing `world_entities` model;
- makes server migration and verification incremental.

### Rejected: build every Place independently

This would make initial screens fast but duplicate membership, discussion, notification, access, and moderation rules. Cross-Place transformations would become brittle.

### Rejected: one generic feed with Place filters

This is structurally incompatible with NETIZENS. It would collapse the product back into a conventional feed-and-tabs social network and erase the purpose of distinct Places.

## Architecture

### 1. Shared social primitives

The core product will use reusable primitives under every Place:

- **Citizen identity:** one account, avatar form, mode, Citizen Mark, XP, artifacts, contribution history;
- **World Entity:** stable ID, Place, type, parent, creator, visibility, status, metadata, timestamps;
- **Membership / participation:** join, follow, interested, invited, requested, active, muted, left, removed;
- **Discussion:** posts, replies, references, bounded reactions, moderation state;
- **Relationship:** typed links between entities such as `became_event`, `became_project`, `organizer_circle`, `related`, and future replication links;
- **Messaging:** direct or entity-bound trusted threads;
- **Notification:** user-owned delivery state tied to entities, threads, and actors;
- **Safety:** blocks, reports, access checks, visibility checks, moderation actions;
- **Reputation:** evidence-backed contribution events and earned artifacts, not follower-count status;
- **Instrumentation:** structured events that distinguish seeded/demo content from real activity.

College Groups remain ordinary World Entities with College metadata, not a separate database universe.

### 2. Place-specific interaction grammar

Each Place must feel different because its primary action is different:

- **Commons:** public conversation and discovery; primary action is discuss.
- **Crews:** durable interest/activity membership; primary action is join and participate. College Groups remain a scoped subtype here.
- **Local:** approximate-area discovery; primary action is find nearby people, activity, events, and opportunities without exposing precise location.
- **Projects:** structured collaboration; primary action is contribute toward an outcome.
- **Ask:** expertise and questions; primary action is ask, answer, or turn a useful question into action.
- **Exchange:** offers/requests for skills, help, favors, and collaboration; primary action is match and accept a bounded exchange.
- **Circles:** trusted/private groups; primary action is communicate with accepted participants.
- **Events:** established time/place activity; primary action is attend/host.
- **Plans:** early “Anybody want to…?” intent; primary action is express interest and turn sufficient intent into an Event.
- **Yes or No:** vote-first/reveal-second binary decision; primary action is vote before seeing aggregate results.
- **Time Machine:** future scenario exploration only after present-day World flows are solid; scenarios are projections, never predictions.

## Cross-Place transformations

Cross-Place movement uses durable relationships instead of renaming or copying state blindly.

Required first transformations:

- Ask → Project
- Plan → Event
- Event → organizer Circle
- Crew → Project
- Project → Event
- Local discovery → Plan or Event
- Exchange match → Circle or Project

The source object remains addressable after transformation. The new object records origin through a typed relationship.

Perception may propose these transformations, but NETIZENS displays the proposed route and requires the applicable permission before consequential execution.

## Shared conversation model

Public discussion and private messaging are separate concerns.

Public discussion attaches to a World Entity and can be visible according to that entity’s access rules. Private conversation lives in Circles/direct threads and does not become public merely because a participant also belongs to a Crew, Project, or Event.

Unsolicited direct conversational access is not granted solely because someone can view a Citizen or public entity.

## Local safety model

Local uses coarse/approximate location for discovery. Exact live coordinates are not a social profile property.

The first implementation should support named area / coarse geospatial buckets sufficient to rank nearby entities without exposing a precise residence or movement trail. Event locations may be precise when intentionally published for that Event.

## Citizen reputation

Reputation is based on evidence-backed participation rather than raw audience size.

Initial visible signals:

- projects completed;
- people helped / exchanges completed;
- events hosted;
- skills or contributions verified;
- earned artifacts;
- community participation history.

Follower counts are not a primary status mechanic.

## Safety and permissions

Two permission systems remain distinct:

1. **NETIZENS social access** — who can see, enter, message, invite, join, comment, or participate.
2. **Perception runtime permission** — what AI orchestration may create, connect, publish, execute, or change.

A valid social permission does not grant AI execution authority, and AI execution authority does not bypass social access rules.

All server writes continue to be protected by authenticated identity, RLS, and bounded mutation contracts.

## Canonical data and AI boundary

NETIZENS owns canonical social state. Perception receives bounded copies of the World context required for an objective.

The later College connection uses the same path as every other part of NETIZENS:

`College activity → NETIZENS canonical state → bounded context → Perception → proposed route/action → user approval → verified result → NETIZENS`

College therefore needs stable IDs and shared entity contracts now, but no College-specific Perception dependency.

## Delivery sequence

The rest of the World will be completed in independently testable slices:

1. **Core participation layer:** discussions/replies, memberships, entity relationships, notifications, moderation hooks, seeded-vs-real provenance.
2. **Commons + Ask + Exchange:** public intent/discussion/help flows on shared primitives.
3. **Projects + Plans + Events:** structured action and cross-Place conversion flows.
4. **Circles + messaging:** trusted/private communication and invitation boundaries.
5. **Local:** approximate-location discovery with explicit privacy constraints.
6. **Citizen reputation/artifacts:** evidence-backed visible contribution history.
7. **Yes or No:** production vote-first/reveal-second behavior on durable data.
8. **World integration hardening:** navigation, access consistency, offline/local-first sync, instrumentation, and end-to-end tests.
9. **Time Machine expansion:** only after the present-day World flows are verified.

Atlas may continue College work in parallel. Core changes must not require edits to College-specific behavior unless a shared contract intentionally evolves.

## Testing strategy

Every slice uses test-first development and must pass existing NETIZENS World QA before merge.

Required test classes across the program:

- authorization and RLS boundaries;
- block/report effects on visibility and messaging;
- seeded/demo content never counted as genuine participation;
- cross-Place transformations preserve source identity and provenance;
- local discovery never exposes precise private coordinates;
- vote results remain hidden until the Citizen votes;
- private Circle content does not leak into public Place views;
- local-first mutations remain retryable/idempotent;
- Perception failure falls back safely without pretending execution occurred;
- College entities continue to work through generic shared contracts without acquiring a hard Perception dependency.

## Explicitly deferred

Until genuine usage justifies them, this build does **not** add:

- national College Campus Map;
- College Issue Graph;
- College Coalition Rooms;
- heavy College polling infrastructure;
- 3D metaverse rendering;
- follower-count status hierarchy;
- an infinite algorithmic main feed;
- provider-owned AI memory as social state.

## Completion criteria

The non-College build is considered complete for this phase when:

- every current Place has a real interaction path rather than a static mock card;
- shared identity, participation, discussion, access, notification, safety, and reputation contracts are reused instead of duplicated;
- required cross-Place transformations work and preserve provenance;
- private and public interaction boundaries are tested;
- Local meets the approximate-location safety rule;
- Yes or No preserves vote-first/reveal-second behavior;
- server-backed paths are ready to replace local-first transport without redesigning the World model;
- College remains functional inside Crews and can adopt the same shared contracts later;
- Perception remains optional to social-state integrity and only verified outcomes are shown as completed.
