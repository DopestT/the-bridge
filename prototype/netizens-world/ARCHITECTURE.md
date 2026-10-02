# NETIZENS World Architecture

## Product boundary

NETIZENS has two deliberately different layers.

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

## Core rule

**Separate by purpose. Connect by intent.**

Each place owns its interaction model. Shared services may span places, but shared services do not erase place boundaries.

## Ownership boundary

NETIZENS owns:
- Citizen identity presentation;
- World places and nested social objects;
- memberships;
- plans, projects, events and conversations;
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

## Shared services

The following span multiple NETIZENS places:
- Citizen identity
- Citizen Mark
- avatar forms and place modes
- social access controls
- reputation and artifacts
- search
- messaging
- notifications
- moderation
- Perception bridge
- analytics
- World history

## Durable NETIZENS backend entities

The production World should model:

- Citizen
- Place
- WorldEntity
- Membership
- EntityLink
- YesNoVote
- Artifact
- CitizenArtifact
- ReputationEvent
- NetizensAccessGrant
- NetizensPerceptionBinding
- TimeMachineScenario
- WorldAuditEvent

PerceptionObjective, PerceptionRoute, runtime permission grants, execution steps and verification records remain canonical in Perception.

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
2. relevant World places;
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

World → Place → nested place/object → room/task/thread

The breadcrumb is a real state path, not decorative UI. A Citizen can descend without losing identity, permissions, or the ability to return to the parent layer.

## Two permission systems

NETIZENS social access controls govern things such as who may message, enter a private Circle, see a restricted object, or receive an invitation.

Perception runtime permissions govern whether an AI route may create, connect, publish, execute, or otherwise act on the Citizen's behalf.

The two systems may reference one another, but neither replaces the other.

## Production phases

1. Persistent interactive prototype.
2. Durable NETIZENS backend contract.
3. Perception bridge using canonical runtime objects.
4. Real memberships, Plans, Projects, Events, messaging and notifications.
5. Permissioned Perception execution connected to World mutations.
6. Moderation, reputation and verification systems.
7. Time Machine backed by durable state and Perception scenario intelligence.
8. Production QA, performance, accessibility and release hardening.
