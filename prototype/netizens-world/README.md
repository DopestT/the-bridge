# NETIZENS World V2

NETIZENS is split into two layers:

> A social app on the surface. A world underneath.

The normal app handles everyday utility. Enter World opens the immersive network.

## V2

V2 adds persistent browser-local World state, Citizen XP and artifacts, four avatar forms, place modes, a deterministic Citizen Mark, persistent place visits, Crews, Projects, Event interest, Plans, Yes or No votes, and saved Perception routes.

The World contains Commons, Crews, Local, Projects, Ask, Exchange, Circles, Events, Plans, and Yes or No. These places remain separate by purpose and connect only when an approved objective needs more than one place.

The Inception-style depth trail supports World to Place to nested Crew, Project, or Plan.

Time Machine is now an interactive scenario explorer after discovery with +6 months, +1 year, and +5 years views. Every generated future is labeled as a scenario rather than a prediction.

GitHub QA checks JavaScript syntax, World state behavior, and required shell elements.

## Product rules

- Separate by purpose. Connect by intent.
- One Citizen identity can appear differently in different places.
- Perception proposes cross-place routes before actions are carried out.
- Time Machine scenarios are exploratory, not factual forecasts.

## Still to build for production

The current prototype does not yet include production authentication, server-side durable state, real user messaging, moderation services, geospatial discovery, live Perception execution, notifications, production reputation, media upload, or real-time collaboration.

The next phase is the durable World backend contract covering identity, places, memberships, plans, projects, events, permissions, reputation, Perception objectives, and append-only action and verification history.

## Run

Serve the repository with any static HTTP server and open:

`prototype/netizens-world/index.html`

Run state QA with:

`node prototype/netizens-world/qa.mjs`
