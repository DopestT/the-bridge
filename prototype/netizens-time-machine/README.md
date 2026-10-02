# NETIZENS — Time Machine Easter Egg Prototype

This prototype establishes the first implementation of NETIZENS' **Time Machine** easter egg while preserving the product rule:

> **Separate by purpose. Connect by intent.**

## What is built

- A simple NETIZENS shell with distinct places:
  - Commons
  - Crews
  - Local
  - Projects
  - Ask
  - Exchange
  - Circles
  - Events
  - **Yes or No**
- Each place has its own visual identity and interaction framing.
- **Yes or No** is a purpose-built binary voting room: vote first, reveal results second.
- **Time Machine** is intentionally *not* in navigation.
- The Time Machine relocates once per local calendar day to one eligible place using a stable per-device seed.
- Once discovered that day, it disappears from the rest of the network.
- Opening it shows only the locked teaser:
  - **TIME MACHINE**
  - **Be right back.**
- Reduced-motion accessibility is respected.
- Analytics hooks dispatch browser events under `netizens:analytics`.

## Discovery behavior

The easter egg should feel discoverable, not random in a frustrating way.

Production intent:
1. Assign one eligible place to the user per day.
2. Surface the door only inside that place.
3. Do not put it in main navigation.
4. Persist today's discovery so it does not repeatedly interrupt the user.
5. Move it the next day.

This gives advertising something truthful to tease without explaining the feature.

## Teaser campaign hooks

Suggested short-form copy:

- **There is a door in NETIZENS that isn't in the menu.**
- **The door moves.**
- **Someone found the Time Machine.**
- **NETIZENS has a future. Find the door.**
- **If you see TIME MACHINE, open it.**
- **You weren't supposed to find this yet.**

Do not advertise a fake working future feature. The teaser should make clear through the in-app state that the destination is currently locked.

## Future evolution

The locked destination can later become a speculative future version of NETIZENS itself:
- jump forward by time horizon;
- explore future Spaces, Projects, communities and network states;
- preview experimental future interfaces;
- clearly label generated future states as scenarios/projections, not predictions.

## Analytics events

- `home_view`
- `place_view`
- `time_machine_open`
- `time_machine_close`
- `yes_no_vote`

## Local run

Open `prototype/netizens-time-machine/index.html` directly in a browser or serve the repository with any static server.
