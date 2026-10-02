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

## Shared services

The following belong to the network layer rather than any one place:
- Citizen identity
- Citizen Mark
- avatar forms and place modes
- permissions
- reputation and artifacts
- search
- messaging
- notifications
- moderation
- Perception
- analytics
- World history

## Durable backend entities

The production backend should model these as first-class records:

- Citizen
- Place
- Membership
- Crew
- Circle
- Project
- Plan
- Event
- Question
- Answer
- ExchangeOffer
- YesNoQuestion
- YesNoVote
- Artifact
- ReputationEvent
- PermissionGrant
- PerceptionObjective
- PerceptionRoute
- ExecutionStep
- VerificationEvent
- TimeMachineScenario

## Perception contract

Perception receives an objective and returns:
1. interpreted goal;
2. relevant World places;
3. required people and resources;
4. proposed actions;
5. permission requirements;
6. verification requirements.

No proposed action is considered complete until the relevant execution and verification records exist.

## Time Machine contract

Time Machine reads current durable World state and produces a labeled scenario for a selected horizon.

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

## Safety and privacy

The production design should minimize unnecessary exposure and make audience boundaries legible. Location, direct-message access, private Circle membership, invitation reach, and cross-place publishing should each have explicit audience or permission controls.

## Production phases

1. Persistent interactive prototype.
2. Durable backend contract and authentication.
3. Real memberships, Plans, Projects, Events, messaging and notifications.
4. Perception objective routing with permissioned execution.
5. Moderation, reputation and verification systems.
6. Time Machine backed by durable state.
7. Production QA, performance, accessibility and release hardening.
