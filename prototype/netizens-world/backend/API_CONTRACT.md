# NETIZENS World API Contract

This contract defines the production boundary between the Surface App, NETIZENS World, and the existing Perception runtime.

## Principles

- Places remain separate by purpose.
- Cross-place actions happen through explicit routes.
- The Citizen identity is shared across the network.
- NETIZENS owns social World state.
- Perception owns objectives, routes, execution, runtime permissions, verification, and learning.
- Write operations return enough evidence to verify what actually happened.
- Time Machine creates scenarios without mutating present-day state.

## Ownership boundary

NETIZENS persists:
- Citizens;
- Places and World Entities;
- memberships and entity links;
- social access grants;
- Yes or No votes;
- artifacts and reputation;
- Perception bindings;
- Time Machine scenario snapshots.

Perception persists:
- projects;
- objectives;
- routes and route nodes;
- runtime permission grants;
- execution ledger;
- worker runs;
- verification runs;
- scenario intelligence.

NETIZENS references Perception records by ID through `netizens_perception_bindings`. NETIZENS does not maintain a second copy of Perception's ledgers.

## Core resources

### Citizen
One network identity and its World-facing state.

### Place
A stable World surface such as Commons, Crews, Local, Projects, Ask, Exchange, Circles, Events, Plans, or Yes or No.

### World Entity
A nested object inside a Place. Examples include a Crew, Project, Plan, Event, Question, Exchange offer, Circle, or Yes/No question.

### Membership
Connects a Citizen to a World Entity with a role and status.

### Netizens Access Grant
Controls social access such as private visibility, invitations, or messaging boundaries.

### Perception Binding
Links a Citizen, Place, and optional World Entity to the canonical Perception project/objective/route records.

### Time Machine Scenario
A non-destructive future scenario derived from a durable World snapshot and, when available, Perception scenario intelligence.

## Proposed NETIZENS endpoints

### World bootstrap

`GET /v1/world/bootstrap`

Returns:
- Citizen;
- Place catalog;
- visible memberships;
- recent World entities;
- artifacts and reputation summary;
- social access controls;
- recent Perception bindings;
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

A Plan may later produce an Event, Circle, Crew, or Project. The resulting objects are linked rather than replacing the original Plan.

### Yes or No

`POST /v1/yes-no/{entityId}/vote`

Request:

```json
{"choice":"yes","explanation":null}
```

The response returns aggregate results only after the vote is accepted.

## Perception gateway

These NETIZENS endpoints are gateways into the canonical Perception runtime. They do not create duplicate NETIZENS-owned objective or route ledgers.

`POST /v1/perception/objectives`

Request:

```json
{
  "objective":"I want to start a local film club",
  "sourcePlaceId":"local",
  "sourceEntityId":null
}
```

Flow:
1. NETIZENS creates or resolves the Perception project binding.
2. The objective is sent to Perception with World context.
3. Perception creates the canonical objective and route.
4. NETIZENS stores the returned IDs in `netizens_perception_bindings`.
5. NETIZENS renders the route and permission requirements.

`POST /v1/perception/bindings/{bindingId}/approve`

Approves the presented route and requested runtime permission scope.

`POST /v1/perception/bindings/{bindingId}/execute`

Asks Perception to execute the approved route.

`GET /v1/perception/bindings/{bindingId}`

Returns the NETIZENS binding plus current canonical Perception status, execution evidence, and verification summary.

## Time Machine

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
  "perceptionScenarioId":null,
  "createdAt":"..."
}
```

This endpoint must not modify present-day World entities, memberships, access grants, reputation, or messages.

## Two permission layers

### NETIZENS social access
Controls who can see, enter, message, invite, or interact with World objects.

### Perception runtime permission
Controls what an AI route can create, connect, publish, execute, or otherwise do on the Citizen's behalf.

A Perception route should carry its required runtime permissions. Missing permissions keep execution blocked.

## Idempotency

All mutation endpoints should accept an `Idempotency-Key` header. Retried requests with the same key and same authenticated Citizen should not create duplicate entities or duplicate side effects.

## Verification

A successful API response is not automatically a verified Perception result.

For actions that change World state:
1. Perception records execution evidence in its canonical execution ledger.
2. Verification confirms the intended change.
3. NETIZENS refreshes the affected World objects.
4. The binding is marked verified only when the expected state is observable.

## Events

The production client should consume server events for:
- entity.created;
- entity.updated;
- membership.changed;
- plan.converted;
- event.updated;
- perception.binding.updated;
- perception.execution.updated;
- perception.verification.updated;
- citizen.reputation.updated;
- notification.created.

The transport may change without changing these application-level event names.
