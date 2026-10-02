# NETIZENS World V1

This prototype separates **NETIZENS the practical social app** from **NETIZENS World**, the immersive layer beneath it.

## Product rule

> A social app on the surface. A world underneath.

The normal app remains fast and familiar for messaging, notifications, profile, search and account controls. **Enter World** moves the user into a distinct explorable network.

## What this prototype builds

- Separate App and World layers with an explicit **Enter World / Exit World** transition.
- A navigable World containing:
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
- Distinct place identities, colors, descriptions and interaction framing.
- Persistent Citizen identity across places.
- Citizen panel with:
  - Core avatar
  - place-mode previews
  - unique deterministic Citizen Mark
  - level / XP
  - earned artifacts
- Inception-style depth trail:
  - World → Place → Crew / Project / Plan
  - users can move deeper or back up without losing identity context.
- Perception prototype:
  - accepts a natural-language objective
  - maps it to relevant places
  - preserves the permission-first concept before execution
- Yes or No:
  - vote first
  - reveal split second
- Time Machine:
  - exists only inside World
  - not in navigation
  - relocates to one eligible place per local day per device
  - disappears after discovery that day
  - currently opens only **TIME MACHINE — Be right back.**
  - future horizons are teased as +6 months, +1 year and +5 years.
- Responsive layouts and reduced-motion support.
- Browser analytics hooks through the `netizens:analytics` custom event.

## Why World is separate

The immersive concept should never make routine tasks harder. A user can live mostly in the standard app if they want. World is for exploration, identity, communities, deeper places, projects, plans and future concepts.

Perception spans both layers: it can receive an objective from the practical app and route the user into the right World places.

## Local run

Open `prototype/netizens-world/index.html` directly in a browser, or serve the repository with any static HTTP server.

## V1 limitations

This is an interactive front-end prototype. It does not yet provide authentication, a persistent backend, real users, messaging, permissions storage, production reputation, geospatial search, moderation services, or real Perception execution.

The next implementation phase should connect World objects to a durable backend model while preserving the separation between the utility app and immersive World.
