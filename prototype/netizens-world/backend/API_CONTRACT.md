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
- Ordinary social participation stays on the fast NETIZENS path and does not wait for Perception or an AI provider.

## Ownership boundary

NETIZENS persists:
- Citizens;
- Places and World Entities;
- memberships and entity links;
- public/entity-bound discussion and replies;
- social access grants;
- notifications and private messaging state;
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
Connects a Citizen to a World Entity with a role, status, and provenance.

`provenance` is one of:
- `genuine` — real user participation;
- `seeded` — service-created bootstrap content/state;
- `demo` — service-created demonstration content/state.

Only genuine participation is eligible to count toward user participation/reputation. Browser/mobile clients create genuine participation only; seeded/demo state is service-controlled.

### Discussion Item
A public/entity-bound post or reply attached to a World Entity. Discussion is intentionally separate from direct/private conversation in Circles and `conversation_threads/messages`.

A discussion item includes:
- stable `id`;
- `entityId`;
- authenticated `authorId`;
- optional `parentId`;
- body;
- provenance;
- moderation state;
- client mutation ID;
- created/edited/deleted timestamps.

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

The bootstrap is bounded to the app shell's immediately useful state. Larger discussion/message/history collections load by entity/thread instead of blocking launch.

### Places

`GET /v1/places/{placeId}`

Returns the Place contract plus Place-specific discovery data.

### Entities

`POST /v1/entities`

Creates a nested World Entity after authorization.

`GET /v1/entities/{entityId}`

Returns the Entity, parent path, membership summary, and Place-specific state.

`POST /v1/entities/{entityId}/membership`

Creates or changes the calling Citizen's membership state. Client-originated membership uses `provenance: "genuine"`. Seeded/demo membership is not a browser/mobile capability.

### Entity discussion

`GET /v1/entities/{entityId}/discussion`

Returns discussion rows the authenticated Citizen may see under the entity's existing visibility rules. Rows from blocked authors are suppressed. Removed rows are not returned. A hidden parent may be represented as a moderated placeholder so visible replies remain structurally safe.

Circle/private-thread content is never returned by this endpoint.

`POST /v1/entities/{entityId}/discussion`

Request:

```json
{
  "body":"Anyone want to organize a campus screening?",
  "parentId":null,
  "mutationId":"4c0278bb-9561-4b93-a80f-b2a25e41d08e"
}
```

Rules:
- caller must be a permanent authenticated Citizen;
- `authorId` is derived from the session and must equal the authenticated user;
- client-originated rows are always `provenance: "genuine"`;
- initial moderation state is `visible`;
- the entity must be visible to the caller;
- public discussion is not used for Circles;
- if `parentId` is supplied, the parent must belong to the same entity;
- `mutationId` is a client-generated UUID and is unique per author.

The app applies the post optimistically, queues the mutation locally, and reconciles in the background. Retrying the same mutation must reuse the same `mutationId`.

`PATCH /v1/discussion/{discussionId}`

Ordinary authors may edit only content/soft-delete fields on their own genuine rows. They cannot change author, entity, parent, provenance, client mutation ID, or moderation state.

Moderation state is service-controlled through the moderation system, not a normal client update.

### Notifications

`GET /v1/notifications?unread=true`

Returns notifications owned by the authenticated Citizen.

`POST /v1/notifications/{notificationId}/read`

Marks a user-owned notification read. The app may apply the read state optimistically and reconcile it with the server in the background.

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

All mutation endpoints should accept a stable client mutation identifier (`mutationId`) and/or its transport equivalent, `Idempotency-Key`.

For local-first app operations:
1. the client generates the mutation ID once when the optimistic action is created;
2. the local queue persists that same ID across retries;
3. the transport sends the queue operation ID as `mutationId`;
4. the server scopes deduplication to authenticated Citizen + mutation ID;
5. a repeated request with the same Citizen and mutation ID must not create a second logical side effect.

For `entity_discussion_items`, PostgreSQL enforces `unique(author_id, client_mutation_id)`. If a retry races with or follows a successful first insert, the duplicate-key response is reconciled as an already-applied mutation after the client/server fetch confirms the row. A retry must never invent a replacement mutation ID merely to bypass the uniqueness boundary.

Mutation IDs are transport/application deduplication identifiers, not social object identity and not Perception execution IDs.

## Verification

A successful API response is not automatically a verified Perception result.

For ordinary NETIZENS-owned social writes, server acknowledgement plus subsequent canonical read/realtime reconciliation establishes the social state. Perception is not required for posts, replies, memberships, messaging, notifications, or voting.

For actions that change World state through Perception:
1. Perception records execution evidence in its canonical execution ledger.
2. Verification confirms the intended change.
3. NETIZENS refreshes the affected World objects.
4. The binding is marked verified only when the expected state is observable.

## Events

The production client should consume server events for:
- entity.created;
- entity.updated;
- discussion.created;
- discussion.updated;
- membership.changed;
- plan.converted;
- event.updated;
- perception.binding.updated;
- perception.execution.updated;
- perception.verification.updated;
- citizen.reputation.updated;
- notification.created.

The transport may change without changing these application-level event names.
