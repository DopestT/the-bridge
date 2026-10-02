# NETIZENS World API Contract

This contract defines the production boundary between the Surface App, NETIZENS World, and Perception.

## Principles

- Places remain separate by purpose.
- Cross-place actions happen through explicit routes.
- The Citizen identity is shared across the network.
- Write operations return enough evidence to verify what actually happened.
- Perception proposes actions before executing actions that require permission.
- Time Machine creates scenarios without mutating present-day state.

## Core resources

### Citizen
Represents one network identity and its public World-facing state.

### Place
A stable World surface such as Commons, Crews, Local, Projects, Ask, Exchange, Circles, Events, Plans, or Yes or No.

### World Entity
A nested object inside a Place. Examples include a Crew, Project, Plan, Event, Question, Exchange offer, Circle, or Yes/No question.

### Membership
Connects a Citizen to a World Entity with a role and status.

### Perception Objective
A natural-language goal entered from either the Surface App or a World Place.

### Perception Route
The proposed cross-place plan for achieving an Objective.

### Execution Step
One bounded action in an approved route.

### Verification Event
Evidence that an execution step actually produced the intended result.

### Time Machine Scenario
A non-destructive future scenario derived from a durable World snapshot.

## Proposed HTTP endpoints

### World bootstrap

`GET /v1/world/bootstrap`

Returns:
- Citizen;
- Place catalog;
- visible memberships;
- recent World entities;
- artifacts and reputation summary;
- active permissions;
- unread counts needed by the World shell.

### Places

`GET /v1/places/{placeId}`

Returns the Place contract plus Place-specific discovery data.

### Entities

`POST /v1/entities`

Creates a nested World Entity after authorization.

`GET /v1/entities/{entityId}`

Returns the Entity, parent path, membership summary, and Place-specific state.

`POST /v1/entities/{entityId}/membership`

Creates or changes the calling Citizen's membership state.

### Plans

`POST /v1/plans`

Creates an early intent object in Plans.

A Plan may later produce:
- an Event;
- a Circle;
- a Crew;
- a Project.

The resulting objects are linked rather than replacing the original Plan.

### Yes or No

`POST /v1/yes-no/{entityId}/vote`

Request:
```json
{"choice":"yes","explanation":null}
```

The response returns aggregate results only after the vote is accepted.

### Perception

`POST /v1/perception/objectives`

Request:
```json
{
  "objective":"I want to start a local film club",
  "sourcePlaceId":"local"
}
```

Response includes:
- interpreted goal;
- proposed route;
- required permissions;
- verification requirements.

`POST /v1/perception/routes/{routeId}/approve`

Approves the exact presented route and permission set.

`POST /v1/perception/routes/{routeId}/execute`

Starts bounded execution.

`GET /v1/perception/routes/{routeId}`

Returns route state, execution steps, blockers, and verification evidence.

### Time Machine

`POST /v1/time-machine/scenarios`

Request:
```json
{"horizon":"1y"}
```

Response:
```json
{
  "label":"Scenario, not prediction.",
  "horizon":"1y",
  "assumptions":[],
  "scenario":{},
  "createdAt":"..."
}
```

This endpoint must not modify present-day entities, memberships, permissions, reputation, or messages.

## Idempotency

All mutation endpoints should accept an `Idempotency-Key` header. Retried requests with the same key and same authenticated Citizen should not create duplicate entities or duplicate execution steps.

## Permission model

Permissions are explicit capabilities such as:
- create entity;
- invite Citizens;
- publish to a Place;
- message a Citizen;
- expose broader audience visibility;
- execute a Perception route;
- create links between entities.

A route should carry its required permissions. If any required permission is missing, execution remains blocked.

## Verification

A successful API response is not automatically a verified Perception result.

For actions that change World state, verification should confirm the durable record exists and matches the requested intent.

## Events

The production client should consume server events for:
- entity.created;
- entity.updated;
- membership.changed;
- plan.converted;
- event.updated;
- perception.route.updated;
- execution.step.updated;
- verification.created;
- citizen.reputation.updated;
- notification.created.

The transport may be WebSocket, server-sent events, or a managed real-time channel. The event names are part of the application contract even if the transport changes.
