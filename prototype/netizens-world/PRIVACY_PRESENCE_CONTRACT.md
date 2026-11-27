# NETIZENS World — Everyone contributes a dot (privacy-first design)

**Owner decision, 2026-11-23:** Every participant present in NETIZENS World should contribute a moving dot as they move between **virtual World Places** (Commons, Crews, Local, Projects, Ask, Exchange, Circles, Events, Plans, Yes/No). Nobody can be individually tracked from that presence layer without turning on the appropriate privacy settings.

**This is NOT physical location tracking.** Do not access device GPS, geolocation APIs, street addresses or real-life movement data. The World "Local" Place is an application destination, not permission to locate people geographically.

## Implemented in this isolated web prototype

- One device-local, unlabeled **Your dot** is rendered for the current browser visitor. A World Place click animates that dot before navigation; returning to the map shows it at the Place just visited. Motion reduces to immediate navigation when a reduced-motion preference is present.
- Citizen panel has two independently explicit controls, both default OFF: **Let others identify my dot** and **Let others follow my movements between World Places**. Follow consent cannot be enabled without identity consent. Revoking identity also revokes follow. These selections are local preview settings only, not authentication or effective public sharing.
- Navigation analytics for world entry/exit and Place/entity changes are suppressed unless *both* a future confirmed live presence service and explicit movement-follow consent exist. There is no outgoing presence service in this prototype.
- No fictional live users, fabricated dot populations, real profiles, engagement claims or fake movement streams. No user identifier, session identifier, GPS or route history is published by the preview.

## Live backend required before others can see their dots

The current implementation is a **single-browser UI proof**, not a running multiuser presence service. Delivering one live dot per active World participant will require a separate reviewed architecture:

1. **Authenticated, ephemeral presence:** On entering/leaving a virtual Place, the host service associates a brief expiring presence lease with a valid authenticated session; rate-limit and anti-spoof it. Deduplicate reconnects. Never accept unauthenticated client-declared member counts. Clear presence after disconnect/timeout.
2. **Public, nontrackable representation by default:** The server supplies per-Place totals and short-lived *unlinked dot slots*, not account IDs, usernames, precise click timestamps or individual from→to pairs. A batch update animates dots between Places without retaining a consistent public dot ID, click target, or path history. Shuffle/reseed dot appearance after each update. Use small-group protection or delayed updates when a single person's exact route could be inferred. Display truthful "live participants" only if backed by verified active leases. For crowded Places, cluster/compact visuals but preserve truthful counts.
3. **Identity/follow sharing:** Any identifying marker, stable public dot ID, individual transition, or friend-follow map must be an authenticated server-enforced, explicit, revocable opt-in with restricted audience and clear retention and visibility rules. UI-local toggles alone are **not sufficient** permission. Make per-viewer policy checks and stop previously authorized broadcasts on revoke. Do not enable tracking for minors or private circles by default.
4. **Data minimization:** No physical GPS, geolocation or continuous route archive. Avoid persistent trajectory storage; TTL expire presence and minimize timestamps. Use deny-by-default RLS and negative tests for cross-account leakage, private Place membership, blocked users and opt-out/revocation. Verify on mobile/Expo separately.
5. **Truthful failure states:** When feed is unavailable, show the current visitor's device-only dot plus "Live community presence not connected." Do not draw sample people as active citizens. Never display imaginary activity counts.

## QA and release gate

- Browser smoke at 1440/390/360 verified one self-dot, default-off follow controls, Commons→Projects movement, return-to-map position, opt-in/out behavior and settings persistence, no unsolicited movement-analytics events, no page errors, overflow or external requests.
- Existing World V4 QA and participation adapter/backend contract checks passed. All testing used a **local** checkout.
- **Not yet built/verified:** real presence endpoint; server consent enforcement; live authenticated people/dots; RLS/security audit; production app/Expo parity; live-site or mobile hardware testing.
- This work remains local and private review. A public GitHub PR, branch push, deployment, database migration, release or permissions change needs separate approval. Do not confuse this NETIZENS work with Perception Project World or Blue Tsunami World.


## Four explicitly simulated moving dots (2026-11-23)

- Four **demo dot bots** roam fixed, decorative virtual-place routes. They move, fade out and reappear; they have no accounts, stable public handles, live presence, or backend requests.
- The World status identifies these as **simulated**, never members or real community activity. No active-person totals use these bot dots.
- Animation runs only while the World map is open, stops when entering a Place or leaving World, and stays static when reduced-motion is requested.
- The four demo bots are entirely separate from the owner's dot, the privacy toggles, any real membership feed or future consent-enforced backend.
- On this review branch, ten original, local-only **hidden signals** are embedded one per virtual Place, with an optional browser-local discovery collection and final Constellation completion message. No payments, incentives, tracking, real member activity, external requests or artificial engagement events are attached.
- **Verified:** headless Chrome at 1440, 390 and 360 pixels, 4 bot dots + 1 visitor dot, independent bot movement, Place discovery/reveal/dismiss, ten unique signals, final constellation, browser reload persistence, zero JS page errors, zero external requests and no horizontal overflow.

## Local UI events vs analytics, cinematic review

The local entity-discussion UI uses a dedicated `netizens:entity-view` event with only the entity ID. This preserves local participation without broadcasting route analytics. All `netizens:analytics` events in this prototype are blocked unless both explicit follow-visibility consent and a real connected presence service are present; neither is currently active. The animated marker's current virtual Place lives in `data-world-place`, never `data-place`, to prevent it from matching interactive Place button delegation. These front-end choices are privacy protection in the prototype, not evidence of a production server-side privacy architecture.
