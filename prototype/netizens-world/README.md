# NETIZENS World V3

NETIZENS remains deliberately split into two layers:

> **A social app on the surface. A world underneath.**

The Surface App handles everyday utility. **Enter World** opens the explorable network.

## V3: the World now has real layers

V3 replaces one-off place-specific mock interactions with a generic World Entity graph.

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

That makes the Inception model structural rather than cosmetic:

**World → Place → Entity → nested Entity**

Examples now supported by the prototype:
- a Plan can become an Event;
- creating that Event can also create a nested organizer Circle;
- an Ask question can become a Project;
- linked entities remain separately addressable instead of being renamed into one another.

## Existing V2 capabilities preserved

- persistent Citizen state;
- Citizen Mark;
- XP, levels and earned artifacts;
- likeness, stylized, fictional and privacy avatar forms;
- Place Modes;
- Commons, Crews, Local, Projects, Ask, Exchange, Circles, Events, Plans and Yes or No;
- local-first mutation queue;
- session-scoped live Perception client;
- local World-route fallback;
- hidden Time Machine with +6 months, +1 year and +5 years scenarios;
- scenario-not-prediction labeling;
- GitHub QA.

## V2 → V3 migration

The client reads the previous V2 local state if no V3 state exists. Existing Plans are promoted into enterable V3 World Entities without destroying the legacy state.

The V3 state is stored separately so migration can be verified before older local state is discarded.

## Perception

Perception remains the canonical intelligence and orchestration runtime. NETIZENS sends bounded Place and Entity context with an objective. Perception owns objective interpretation, routes, runtime permissions, execution, verification and learning.

NETIZENS stores only the World state and lightweight Perception binding IDs it needs to reconnect those verified results to the right Place and Entity.

## Still required for production

The prototype is not yet the production social network. Remaining production work includes:
- authenticated NETIZENS server state;
- real Citizens and memberships;
- messaging and notifications;
- moderation and safety systems;
- geospatial discovery;
- server-side access controls;
- production reputation;
- media;
- real-time collaboration;
- deployment and operational hardening.

The client entity graph intentionally mirrors the durable PostgreSQL contract so local-first behavior can move to the server without redesigning the World model.

## Run

Serve the repository with a static HTTP server and open:

`prototype/netizens-world/index.html`

Run QA with:

`node prototype/netizens-world/qa.mjs`
