# NETIZENS LIVE — bounded review prototype

Status: **proposal in a review branch only**. This is not a working
stream, connected LiveKit room, signed-in event, newsroom, or production feature.

## Scope

- Keep NETIZENS's World → Place → Entity permissioning and app-first UX.
- One consenting host, two authenticated viewers, real live audio/video,
  one permissioned comment thread, a moderator remove/stop action,
  reconnection, accurate server-derived audience counts, and safe session end.
- Begin with LiveKit's Expo-compatible native SDK in a **separate future step**
  after reviewing an authorized backend token issuer, the required development
  build, provider hosting, cost ceilings and privacy/recording policy.
- No API keys, LiveKit tokens, viewer records, synthetic participant activity
  or camera permissions are created by this branch.
- Amazon-owned services and direct AWS procurement are excluded for BDS reasons.
  Confirm third-party hosting dependencies before purchasing or activating.
- Optional Cloudflare Stream distribution is a later evaluation; it is not
  needed to prove the first small interactive room.

## Current code

- `apps/netizens-mobile/src/features/live/live-contract.ts` provides the
  provider-neutral join request and defensive validation for short-lived backend
  LiveKit-style grants. Callers cannot request host/moderator privileges.
- `apps/netizens-mobile/app/live-preview.tsx` is an **inactive design preview**
  not linked from production navigation; it does not pretend that anyone is live.
- `apps/netizens-mobile/tests/live-contract.test.mjs` covers cross-Entity
  rejection, invalid grants, insecure transport and fabricated viewer counts.
- The code does NOT verify a JWT signature or enforce actual permissions; only
  the backend and streaming service can do that.

## Required backend contract — not implemented

1. NETIZENS server authenticates the session and checks Entity visibility,
   membership, blocks, host eligibility, and any age/safety restrictions.
2. Server maps actor to role and generates a short-lived, room-scoped grant
   with the **server-held LiveKit secret**, never the mobile application.
3. The join response includes roomId, entityId, role, secure serverUrl,
   accessToken and expiresAtMs. No role field appears in client join requests.
4. Server enforces comment velocity, rate limits, moderator permissions,
   account bans and stop-stream. No client self-grant, fake viewer counters,
   or silently exposed private Circles.
5. Logs and metrics distinguish genuine, suspected automated, test and
   unverified activity. Track false positives and provide appeals.
6. Clear retention, recording consent, replay rights, and cost limits.

## Review and acceptance

- Run `cd apps/netizens-mobile && npm run test:storage`, `npm run typecheck`
  and `npm run lint` on a clean checkout with dependencies. Record actual output.
- Verify design against the approved NETIZENS cinematic World visuals,
  while keeping streaming an optional feature and not game mechanics.
- Later, with approved infrastructure: complete one host + two consenting
  viewers; test real camera/mic, chat, spam control, reconnect and moderator stop.
- Verify real backend receipts, provider events, server counts and independent
  Android/iOS device observations. Do not claim success from a preview.
- Keep existing [NETIZENS issue #16](https://github.com/DopestT/the-bridge/issues/16)
  and [World visuals issue #27](https://github.com/DopestT/the-bridge/issues/27)
  as the primary acceptance and design priorities. No deploy/merge without approval.
