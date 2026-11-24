# NETIZENS World — recovered faceted city + private moving dots + hidden details

## Scope and evidence (November 23, 2026)

Reconstructed a newer **local-only** World scene from two prior saved Mac Git patches, preserving the actual faceted 1600x940 SVG city geometry, ten connected districts, interactive architecture, camera pan, directory layout, local yes/no voting, and entity navigation. This work is distinct from PERCEPTION Project World and Blue Tsunami World.

Base public repo: `DopestT/the-bridge` `main` commit `c0edf84c1379d27106d3ae10264b358227167760`.

Recovered local review commits:
- `cdabb14`, `7517041`: truthful local example/choice treatment and original city reference work
- `4b2c3586ca12122147d783b43b54e44bc88d9fda`: deterministic SVG city scene, no flattened reference image, city/directory navigation, browser acceptance QA

The scene was reconstructed on Mac local branch `review/recovered-cinematic-city-20261123` in `/tmp/netizens-city-recovery`; the original iCloud-managed Git checkout could not be read reliably. No public GitHub branch push or deployment occurred.

## Integrated new features

1. `world-presence.js`: one own-device dot + exactly four clearly labeled **simulated** movement dots on four artificial routes, moving/fading/returning; no fake membership claim or client/server presence API. Device-only identity/follow preview settings start OFF; follow requires identify; revoking identify revokes follow. No GPS, street coordinates, public route history or network telemetry.
2. `world-secrets.js`: one original short hidden detail in each of ten Places with browser-local discovery ledger and editorial finale `A CONSTELLATION FORMS`. The small detail trigger remains keyboard accessible with focus restoration. Nothing represents paid rewards or public engagement.
3. `cinematic-city.css`: neutral slate/graphite/stone architectural treatment layered **over** the recovered original district geometry, muted SVG coloration and glows, smaller non-cartoon moving dots, minimally styled discovery dialogs and controls, compact presentation. Preserves both City and Directory views, ten distinct districts, desktop/mobile canvas panning. This is a premium-looking **stylized 2.5D SVG visualization**, **NOT** a photoreal or fully 3D architectural render.
4. `app.js` & `participation-ui.js`: Place/dot selectors are distinct (`button.island[data-place]` versus `data-world-place` on dots); city/directory layout changes trigger realignment of bot/self dots; client navigation integrates arrival animation and restores map; `netizens:entity-view` internal event preserves functional discussions while `netizens:analytics` is blocked with no live service or explicit follow consent. No changes to authentication, database, billing or services.
5. Privacy contract and reusable static/browser QA files included.

## QA and acceptance boundaries

- Static: original `city-scene-qa.mjs` passed city SVG determinism, ten routes, no reference-image dependency; World V4 core QA, participation UI/adapter/backend contract, privacy and Easter egg guards passed.
- Browser: 1440px and 390px inspected faceted city renders: ten districts and labels, four demo bots + one self dot, no errors or external requests/document overflow.
- Browser: `world-presence-browser-qa.cjs` passed 1440, 390, 360: own-dot movement, privacy default OFF/opt-in/out and zero navigation analytics; `world-secrets-browser-qa.cjs` passed ten unique reveals, final ending, device persistence on desktop, and phone checks 390/360.
- Browser: `privacy-entity-browser-qa.cjs` passed: local entity discussion works, one local entity-view event, zero analytics events with consent disabled.
- City/Directory full route sweep, touch target sizes, built-scene architecture click/drag, responsive phone pan, stable dot position on layout switch, reduced-motion and local Yes/No device vote: see dedicated `city-integration-browser-qa.cjs` (run results must be checked before final acceptance).

No field Safari/iOS/Android hardware, 3D photorealism, remotely connected users, server consent/RLS, production data or public launch were verified.

## Recovery / next gates

Store a Git-format patch and browser logs/screenshots **outside temporary folders** on the authorized Mac and document commit SHA / patch hash in canonical NETIZENS Notion page.

Next: improve physical architectural materials and camera motion using existing source instead of replacing it, verify mobile device performance, and design server-enforced private multiuser presence before any true people appear as dots. Public PR/push, merge, deployment, spending and access changes are approval-gated.

## Completed acceptance receipt for recovered faceted city — November 23

- `city-integration-browser-qa.cjs` (Mac Chrome / loopback, no external requests) PASS at 1440x900, 768x1024, 390x844, and 320x740. Each viewport passed 10 City and 10 Directory Place routes (80 total), all native Place button targets at least 44px, architecture → Crews click, drag without accidental navigation, responsive phone/tablet horizontal pan, own-dot alignment with latest Place across layout changes, default-private sharing, 4 synthetic dots + own dot, local YES vote persistence after reload and no made-up percentages, zero JS errors / horizontal document overflow / external requests. Desktop fit the city without a need to pan.
- Separate reduced-motion check passed: all four demo dots stayed still, and their CSS transitions plus SVG district transitions were disabled.
- `world-presence-browser-qa.cjs`: PASS 1440/390/360, zero unsolicited analytics, correct self/demo separation and privacy toggles.
- `world-secrets-browser-qa.cjs`: PASS desktop all 10 hidden signals, 10/10 Constellation and reload persistence, plus 390/360 phone Place checks, zero errors or external network calls.
- `privacy-entity-browser-qa.cjs`: PASS local discussion on Indie Film Series while zero analytics events were emitted.
- Original `city-scene-qa.mjs` plus World V4, participation UI, participation adapter, backend contract and both new secret/presence static QA passed.

Known limitations remain the ones above: no real multiplayer presence service, physical iPhone/Safari performance, photoreal 3D city or public deployment.
