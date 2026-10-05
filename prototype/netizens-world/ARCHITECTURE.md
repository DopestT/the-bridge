# NETIZENS World Architecture

## Product boundary

NETIZENS is an **app-first** product with two deliberately different layers. The browser prototype in this repository is a development and contract-validation harness for the eventual iOS/Android product, not the final delivery surface.

### Surface App
Fast utility:
- search
- messages
- notifications
- profile
- account controls
- invitations
- Perception objective entry

### World
Immersive social environment:
- Commons
- Crews
- Local
- Projects
- Ask
- Exchange
- Circles
- Events
- Plans
- Yes or No
- hidden Time Machine

The World must never make routine app utility slower or harder.

## Core rules

**Separate by purpose. Connect by intent.**

**Ordinary social use does not wait for AI.**

Each Place owns its interaction model. Shared services may span Places, but shared services do not erase Place boundaries. Navigation, membership, discussion, messaging, notifications, voting, and other routine social actions stay on the fast NETIZENS path. Perception is optional intelligence beneath the product, not a dependency for social-state integrity.

The detailed latency/critical-path requirements live in `docs/NETIZENS_SPEED_STANDARD.md`.

## Ownership boundary

NETIZENS owns:
- Citizen identity presentation;
- World Places and nested social objects;
- memberships and participation provenance;
- public/entity-bound discussion and replies;
- private conversation/thread state;
- Plans, Projects and Events;
- notifications;
- social access controls;
- artifacts and reputation;
- World navigation and history;
- Time Machine presentation.

Perception owns:
- objective interpretation;
- Reality Maps and routes;
- runtime permission grants;
- worker execution;
- execution ledger;
- verification;
- learning;
- scenario intelligence.

NETIZENS stores a lightweight binding between World context and Perception IDs. It does not duplicate Perception's canonical objective, route, execution or verification ledgers.

## Core / College boundary

College stays inside `NETIZENS → Crews → College Groups` and uses the same World Entity, membership, discussion, notification, safety, and provenance contracts as the rest of NETIZENS.

College-specific discovery, campus pages, campus participation flows, and pilot analytics remain Atlas-owned. Core does not create a second campus state model or a College top-level Place.

College is **Perception-ready, not Perception-dependent**.

## Shared services

The following span multiple NETIZENS Places:
- Citizen identity
- Citizen Mark
- avatar forms and Place modes
- social access controls
- entity discussion
- participation provenance
- reputation and artifacts
- search
- messaging
- notifications
- moderation
- Perception bridge
- analytics
- World history
- local-first mutation queue

## Shared participation contract

### Public/entity-bound discussion

Eligible World Entities may expose discussion through the generic participation contract:
- `createDiscussionItem`
- `listDiscussion`
- reply through `parentId`
- moderation state
- provenance
- stable client mutation ID for server reconciliation

The local-first app applies genuine user participation optimistically and syncs it in the background. Retries reuse the original queue/mutation ID; they never invent a new ID merely to force a second write.

### Provenance

Participation is one of:
- `genuine` — real Citizen action;
- `seeded` — service-provided bootstrap state;
- `demo` — service-provided demonstration state.

Seeded/demo activity must remain visibly distinguishable and must not inflate genuine participation, reputation, or future usage conclusions. Browser/mobile client-originated participation is genuine only; seeded/demo writes are service-controlled.

### Public discussion vs private messaging

Public/entity discussion and private messaging are separate storage and permission systems.

- World Entity discussion uses `entity_discussion_items`.
- Direct and Circle conversation uses `conversation_threads`, `thread_members`, and `messages`.
- Circles do not surface public entity discussion.
- A Citizen viewing a public entity does not automatically gain private conversational access.

### Notifications

Notifications are user-owned utility state. They are deliberately presented as a compact action surface, not another engagement feed. Read state may update optimistically and reconcile in the background.

## Durable NETIZENS backend entities

The production World models:

- Citizen
- Place
- WorldEntity
- Membership
- EntityLink
- EntityDiscussionItem
- CitizenBlock
- ConversationThread
- ThreadMember
- Message
- Notification
- Report
- ModerationAction
- YesNoVote
- Artifact
- CitizenArtifact
- ReputationEvent
- NetizensAccessGrant
- NetizensPerceptionBinding
- TimeMachineScenario
- WorldAuditEvent

PerceptionObjective, PerceptionRoute, runtime permission grants, execution steps and verification records remain canonical in Perception.

## Production participation security

The additive participation migration extends the dedicated NETIZENS database contract without rewriting the foundation migration.

Required boundaries:
- all public participation tables use RLS;
- anonymous browser role has no World participation access;
- only permanent authenticated Citizens create client participation;
- client discussion authorship must match `auth.uid()`;
- browser/mobile-created discussion and memberships are `genuine`;
- seeded/demo participation is service-controlled;
- blocked authors are suppressed from discussion reads;
- entity visibility reuses `private.can_view_entity`;
- ordinary authors may edit content/soft-delete fields but may not change moderation, provenance, identity, parent, entity, or mutation ID;
- moderation remains service-controlled;
- `(author_id, client_mutation_id)` is unique for discussion retry deduplication;
- entity/time and parent indexes keep common mobile reads fast.

## Perception bridge contract

A NETIZENS objective carries:
1. Citizen context;
2. source Place;
3. optional source World Entity;
4. objective text;
5. relevant World state snapshot;
6. requested audience boundaries.

Perception returns:
1. interpreted goal;
2. relevant World Places;
3. required people and resources;
4. proposed route;
5. runtime permission requirements;
6. verification requirements.

NETIZENS presents the route to the Citizen. If approved, Perception executes the bounded route and writes its own execution and verification records. NETIZENS stores only the binding and resulting World changes.

## Time Machine contract

Time Machine reads current durable World state and may use Perception scenario intelligence to produce a labeled scenario for a selected horizon.

A scenario must:
- preserve the Citizen and their World context;
- show assumptions;
- remain reversible and non-destructive;
- never be represented as a prediction;
- never silently alter present-day World state.

## World depth

Navigation is hierarchical:

World → Place → Entity → deeper Entity / trusted room

The breadcrumb is a real state path, not decorative UI. A Citizen can descend without losing identity, permissions, or the ability to return to the parent layer.

## Two permission systems

NETIZENS social access controls govern things such as who may discuss, message, enter a private Circle, see a restricted object, or receive an invitation.

Perception runtime permissions govern whether an AI route may create, connect, publish, execute, or otherwise act on the Citizen's behalf.

The two systems may reference one another, but neither replaces the other.

## Current implementation boundary

The repository now contains the V4 local participation state, retry-safe local-first participation adapter, additive production participation migration, entity discussion UI module, and notification UI surface.

That does **not** by itself prove the additive migration is deployed in the dedicated NETIZENS production Supabase project. Live database application and verification remain separate release evidence.

## Production phases

1. Persistent interactive World prototype.
2. Durable NETIZENS backend foundation.
3. Canonical Perception bridge.
4. Shared participation layer: discussion, provenance, notifications, moderation hooks, retry-safe sync.
5. Commons + Ask + Exchange Place grammar.
6. Projects + Plans + Events action flows.
7. Circles/private messaging experience.
8. Local discovery, reputation, Yes or No, and mobile integration hardening.
9. Time Machine expansion after present-day World flows are verified.
10. Native app release QA, performance, accessibility, moderation operations and store readiness.
