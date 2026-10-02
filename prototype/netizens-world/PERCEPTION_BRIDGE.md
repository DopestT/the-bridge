# NETIZENS ↔ Perception Bridge

NETIZENS should not grow a second AI runtime beside Perception.

Perception is the intelligence and orchestration layer under the product. NETIZENS supplies social-world context and receives routes, execution status, verification, and scenario intelligence back.

## Objective flow

A Citizen can enter an objective from either the Surface App or a World Place.

Example:

> I want to start a local film club.

NETIZENS sends Perception:
- Citizen reference;
- source Place;
- optional source World Entity;
- objective text;
- relevant memberships and World state;
- social audience boundaries;
- current approved runtime permission context.

Perception then runs its canonical route:

EXPRESS → PERCEIVE → RESOLVE → REALITY MAP → ROUTE → CREATE → CONNECT → EXECUTE → VERIFY → ADAPT → REALIZE → LEARN

## Storage ownership

### NETIZENS stores
- Citizen and World state;
- social access controls;
- the World object that originated the objective;
- a `netizens_perception_bindings` record containing canonical Perception IDs;
- resulting World state after verified execution.

### Perception stores
- project;
- objective;
- route and route nodes;
- runtime permission grants;
- worker execution;
- execution ledger;
- verification;
- learning and scenario records.

This avoids two sources of truth.

## Permission handoff

NETIZENS controls social audience and access boundaries.

Perception controls runtime execution authorization.

Example:

A Citizen asks to turn an Ask post into an Event.

1. NETIZENS confirms the Citizen may access the Ask object.
2. Perception proposes creating an Event and inviting a Crew.
3. NETIZENS displays the route and affected audiences.
4. The Citizen approves the required runtime actions.
5. Perception executes within that exact scope.
6. Verification confirms the Event exists.
7. NETIZENS refreshes the World and links the Ask object to the Event.

## Time Machine

Time Machine may use Perception scenario intelligence.

The present World snapshot remains immutable during scenario generation. A future scene can reference possible Crews, Projects, Events, reputation changes, or World growth, but it must always display that it is a scenario rather than a prediction.

## Failure rule

A failed Perception action must not leave NETIZENS pretending the action succeeded.

The World should display one of:
- proposed;
- awaiting permission;
- executing;
- verified;
- failed;
- cancelled.

Only verified state should be presented as completed.

## Provider independence

NETIZENS should depend on the Perception contract, not on a specific model vendor.

Perception may route work to OpenAI, Anthropic, Gemini, local models, APIs, human operators, or other workers without forcing NETIZENS to redesign its World model.
