# NETIZENS World V4

NETIZENS is an **app-first** product with two deliberately different layers:

> **A social app on the surface. A world underneath.**

The Surface App handles everyday utility. **Enter World** opens the explorable network. The browser prototype is a development/test harness for the eventual iOS/Android app, not the final product surface.

## V4: the World is participatory

V4 keeps the V3 generic World Entity graph and adds reusable participation primitives that every non-private Place can compose:

- entity discussion and replies;
- participation provenance (`genuine`, `seeded`, `demo`);
- moderation-safe local discussion state;
- user-owned notifications;
- provenance-aware memberships;
- retry-safe local-first mutation IDs;
- an additive production Supabase discussion/RLS contract;
- a reusable entity discussion UI;
- a compact notification surface.

Ordinary social participation stays on the fast NETIZENS path. Posting, replying, joining, notification reads, and other normal social interactions do not wait for Perception or any AI provider.

## World entities

A World Entity can be a:
- Crew
- Project
- Plan
- Event
- Circle
- Question
- Exchange offer
- or another future object inside a Place.

Each entity has a durable identity, Place, type, parent, creator, title, summary, visibility, status, metadata, timestamps, membership state, and cross-Place links.

The nested-world model remains structural:

**World → Place → Entity → nested Entity**

Examples supported by the prototype:
- a Plan can become an Event;
- creating that Event can also create a nested organizer Circle;
- an Ask question can become a Project;
- linked entities remain separately addressable instead of being renamed into one another;
- eligible entities can host public/entity-bound discussion using the same shared contract;
- College Groups inside Crews use the generic entity/membership/discussion contract rather than a separate College database model.

## Participation provenance

Every shared participation record can distinguish:
- `genuine` — real Citizen participation;
- `seeded` — service-created bootstrap state;
- `demo` — service-created demonstration state.

Seeded/demo activity does not award the local genuine-participation XP used by the prototype and must not be counted as genuine usage/reputation in production analytics.

Client-originated app participation is genuine only. Seeded/demo production writes remain service-controlled.

## Public discussion and private messaging are separate

Entity discussion is for eligible public/member World contexts.

Circles do **not** expose the public entity-discussion composer. Direct/private conversation continues through the separate conversation thread/message contract. Discovering or viewing a Citizen or public entity does not automatically grant private conversational access.

## V2 → V3 → V4 migration

The client now stores V4 state under `netizens_world_state_v4`.

If V4 state does not exist, it reads V3 and then V2 state additively. Existing Citizens, entity IDs, Plans, memberships, entity links, and the College Groups pilot survive normalization into V4. Legacy local-state keys are left intact during migration so migration can be verified before older state is intentionally discarded.

## Local-first speed and retry model

`NetizensData` applies social mutations locally first and queues transport reconciliation in the background.

For participation operations:
- one queue operation ID is created once;
- retries keep the same ID;
- the outbound transport receives that same value as `mutationId`;
- a failed transport leaves the original operation pending;
- a later successful flush removes it without creating a replacement mutation;
- production discussion storage uses `(author_id, client_mutation_id)` uniqueness to reject duplicate retried writes.

This supports the mobile speed standard while preserving eventual canonical server truth.

See `docs/NETIZENS_SPEED_STANDARD.md` for the broader latency and critical-path rules.

## Production database contract

The original production foundation migration remains immutable:

`supabase/migrations/20261002223500_netizens_world_foundation.sql`

V4 adds an additive migration:

`supabase/migrations/20261005010500_netizens_participation_layer.sql`

The additive migration introduces `entity_discussion_items`, membership provenance, RLS, block-aware reads, least-privilege client grants, service-controlled seeded/demo state, moderation boundaries, and mutation-ID deduplication.

The repository contract being green does **not** prove this migration has been applied to the dedicated NETIZENS production Supabase project. Live deployment and verification are separate release evidence. Never apply this migration to the Perception database.

## College boundary

College remains:

**NETIZENS → Crews → College Groups**

Atlas owns College-specific discovery, campus pages, participation flows, and pilot measurement. Core NETIZENS owns the shared entity, participation, notification, safety, and eventual Perception bridge contracts.

College is **Perception-ready, not Perception-dependent**.

## Perception

Perception remains the canonical intelligence and orchestration runtime. NETIZENS sends bounded Place and Entity context with an objective. Perception owns objective interpretation, routes, runtime permissions, execution, verification and learning.

NETIZENS stores only the World state and lightweight Perception binding IDs it needs to reconnect verified results to the right Place and Entity.

Perception is not required for discussion, membership, notifications, messaging, voting, or ordinary navigation.

## Existing capabilities preserved

- persistent Citizen state;
- Citizen Mark;
- XP, levels and earned artifacts;
- likeness, stylized, fictional and privacy avatar forms;
- Place Modes;
- Commons, Crews, Local, Projects, Ask, Exchange, Circles, Events, Plans and Yes or No;
- World V3 entity graph and nested layers;
- local-first mutation queue;
- session-scoped live Perception client;
- local World-route fallback;
- hidden Time Machine with +6 months, +1 year and +5 years scenarios;
- scenario-not-prediction labeling;
- College Groups DMV pilot inside Crews;
- GitHub QA.

## Still required for product launch

The V4 browser harness is not yet the shipping mobile social network. Remaining work includes:
- authenticated mobile client wiring to the dedicated NETIZENS backend;
- live application/verification of pending production migrations;
- Commons, Ask and Exchange full Place grammar;
- Projects, Plans and Events full action flows;
- private Circle/direct messaging UX and push delivery;
- geospatial Local discovery with coarse-location privacy;
- production reputation presentation;
- media/storage flows;
- deep links and native push notifications;
- secure mobile session/device handling;
- operational moderation tooling;
- realtime/cross-device reconciliation;
- native performance, accessibility, crash handling and app-store release hardening.

## Run

Serve the repository with a static HTTP server and open:

`prototype/netizens-world/index.html`

Run the current QA contracts with:

```bash
node prototype/netizens-world/qa.mjs
node prototype/netizens-world/participation-adapter-qa.mjs
node prototype/netizens-world/participation-ui-qa.mjs
node prototype/netizens-world/backend/contract-qa.mjs
node prototype/netizens-world/backend/production-contract-qa.mjs
```
