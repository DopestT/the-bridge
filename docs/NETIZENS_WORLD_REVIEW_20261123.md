# NETIZENS World — November 23 bounded nonproduction change

## Source and change

Inspected canonical Notion page 417c96f063c381b38f45c57e08c85fbe, issue #27, and local feature/netizens-superstars-20261120 at 8360fdaa68946a0d13928ab4d9948522427bbaf5. Remote main remains c0edf84c1379d27106d3ae10264b358227167760.

Removed generated “people active now” copy, hardcoded illustrative member totals/progress, and relabeled examples as not live activity. Added a source regression guard. Desktop native Place buttons overlay the owner-supplied cinematic artwork. Phone composition uses the secondary reference's Commons-first directory approach. Existing World → Place → Entity, Citizen, participation and persistence handlers are retained. No backend/native/security contracts changed.

## Approved reference provenance and comparison

- Primary: [NETIZENS: A Neon World of Connection.png](https://drive.google.com/file/d/15EIp-Cok7BvqKtD7mYkcXowYi_ygJvEB/view). Exact original fetched through connected Drive and visually inspected. Repository asset is byte-for-byte original, SHA256: fea88fcc2bfb172c8cf70b1714d0bdb8ea245d1a459169f134d0e6085246e827. CSS crops out the sample social panels and sample Citizen level header; native HTML buttons own navigation. No generated/stock substitute.
- Secondary: [Netizens World and Citizen Studio.png](https://drive.google.com/file/d/1aFbZxo6etjihkBMKlLrOZo8KoADuURqw/view). Visually inspected. Commons-first responsive directory and dark overlay hierarchy inform the phone layout. Original not copied into runtime.
- Before: Nov 23 audit screenshots at /tmp/netizens_world_{desktop,mobile}_8360fda.png, copied to the task outputs as world-{desktop,mobile}-before-audit.png. Historical audit captures, not new baseline runs.
- After: fresh installed-Chrome browser captures, desktop 1440×900 and phone viewport 390×844, full-page PNGs in task outputs. Browser viewport emulation is not a physical phone test.
- Corrected drift: disconnected gradient boxes → actual approved city imagery with native district navigation; phone single-column long list → Commons-first two-column directory; fabricated activity → explicit illustrative examples.
- Remaining drift: this is a 2D source-image-backed interactive study, not a layered/3D rendered city. Embedded artwork labels may differ from HTML overlay placement; Plans has no dedicated district in the primary reference, so its existing route is retained as an overlay. Full Citizen Studio, search/inbox refinements, detailed social panel fidelity, adaptive artwork/performance optimization and native Expo parity remain outstanding. Existing hardcoded Yes/No poll percentages elsewhere are outside this bounded activity-card fix and still require provenance work. Do not call #27 complete.

## Verification

All six existing World QA suites pass: qa.mjs, swarm-qa.mjs, participation-adapter-qa.mjs, participation-ui-qa.mjs, backend/contract-qa.mjs, backend/production-contract-qa.mjs. Six JS syntax checks and git diff --check pass. Backend tests are local source/contract checks, not live production database tests.

Fresh Chrome checks at both viewports: all 10 districts clicked successfully; each button at least 44×44 CSS pixels; no button overlap; no horizontal document overflow; keyboard Enter opens Crews; nested entity and breadcrumb return work; Citizen panel opens/closes; zero page JavaScript errors. External requests blocked by audit harness, with none attempted. Browser sessions use isolated local storage, localhost only. Raw logs and browser receipt stored in task outputs.

## Review and release status

Reviewable local commit/patch and PR description prepared. No remote PR or branch publication, merge, deployment, production mutation, paid generation or new build requested. Keep #27 and physical-device acceptance #16 open. This is assistant-executed work, not evidence of an independently running World Architect worker.

Rollback: revert this change commit; supplied original feature branch history is preserved.


## Follow-up refinement — November 23

Human/assistant execution only: no independently running bots or worker completions established. The five specialist roles remain a documented operating model.

- City and directory display modes now share the same nine district buttons. Default is city on desktop and directory on phones; phones can scroll through the full city instead of seeing a tiny static banner. Buttons expose their selected state to assistive technology.
- Plans is a separate Make a plan control, no longer mislabeled over the reference's Time Machine portal. All ten existing Place routes remain available. The Time Machine art itself is illustrative, not a newly implemented route.
- Directory uses dark slate/cream controls and Commons-first hierarchy from the secondary approved reference. Original primary image remains unchanged. Exact embedded-text alignment and a layered city remain unresolved.
- Removed fabricated Yes/No community percentages. Displays only the local saved choice and explicitly unavailable community results; choice survives leaving the Place and reloading. Added QA guard against restoring the old fake percentages.
- Existing six World suites, six syntax checks and diff check pass. Chrome checks at 1440×900, 390×844, 320×740, 768×1024 and 1101×900 pass: all ten default routes, city and directory route samples, no target overlap in default layout, >=44px default targets, no document horizontal overflow, keyboard entry, nested entity/breadcrumb return, Citizen panel, saved local vote/reload, zero page errors and external requests. Phone city intentionally scrolls within its own region.
- Browser receipts and fresh screenshots saved under the same task outputs, suffixed refined; prior screenshots preserved. No native Expo build or real-device acceptance. No remote push/PR, production change, publishing or spending. Issues #27/#16 remain open. Local review package updated only.


## Recovery delivery: rendered World arrival — November 23

Base: local `2a8f61a755229186982560e2173682c68014ca05`. This pass replaces the
flattened-reference-image implementation with original deterministic vector scene
geometry: ten separate floating landforms, faceted terrain, bridge decks/lamps,
Commons globe/plaza, warm Crews housing, Local gardens, Projects towers/crane, Ask
library/beacon, private Circles pavilion, Events canopy, Exchange market, Plans
meeting garden and Yes/No sculpture. No simulated users or activity.

### Reference comparison

Both approved originals were visually inspected again. Primary reference informs
floating land, central luminous Commons, connected paths, neighborhood-specific
architecture, atmospheric skyline and colored evening light. Secondary reference
informs dark slate/cream navigation, selectable directory and readable social
controls. Native route buttons remain separate from scene geometry and clicking
architecture forwards to the same route. The image-backed crop and its embedded
fake controls are no longer part of the runtime World.

Phone entry now opens the city centered on Commons, with contained native pan and
a place directory. Desktop scene fits the available height; all ten routes remain
available at six tested viewport sizes. Pointer dragging cannot accidentally open
a district. Reduced-motion preferences disable scene transitions.

**Visual verdict:** substantial source-to-screen implementation, still a stylized
2.5D vector interpretation. It does not match the primary reference's photoreal
materials, dense organic city detail or full Citizen Studio. No pixel-fidelity or
owner acceptance is claimed. Issue #27 stays open; native Expo and physical phone
acceptance #16 remain unverified. These limitations are visible in the saved
reference-comparison artifact rather than concealed by passing route tests.

### Verification and provenance

Seven local suites pass (six existing World suites plus new geometry/route-parity
check). New scene test is wired into the existing World QA workflow. Browser test
is checked in and reusable with existing Playwright/Chrome, no installation.
Real Chrome at 1440×900, 390×844, 320×740, 768×1024, 1101×900 and 1920×1080 passed:
all ten routes in both modes using keyboard, all targets >=44px, no overlaps,
clickable architecture, drag without navigation, nested entity/breadcrumb return,
Citizen and notification panels, local vote/reload, no document overflow, zero
page errors/external requests and no reference PNG request. Local cold navigation
through Enter World measured 265–389ms in that run; this is not a field performance
metric. Live in-app-browser preview also opened and was visually inspected.

The first browser test attempt selected a wall hidden behind its own facade
reflection; the acceptance locator was corrected to the visible facade and the
entire six-size test rerun. This was a test-target error, not a corrected user
route failure.

Evidence: task outputs `world-arrival/` contains six-size screenshots, browser
receipt, raw local QA log, reference comparison, review description and change
patch. Browser runs are viewport emulations on this Mac, not real-phone tests.

This is work executed by the assistant in this chat. No independent bot execution,
worker runtime, public release, cloud build, merge, remote push, paid tool use or
production data mutation. The localhost preview remains available for inspection.


## Perception search correction — November 23

Owner reproduced internal five-specialist proposals in every Perception search.
Removed roster rendering from both local and connected-route results and removed
its script from the consumer shell. Engineering proposal module/history is
preserved; no worker was activated. Results now offer individual Place links,
Start a plan (opens/focuses the existing composer), Explore groups and Browse
questions. Suggestions are explicitly not executed/shared; seeded examples and
on-device preview persistence remain disclosed. Save suggestions preserves the
existing local save behavior.

Desktop 1440×900 and phone 390×844 browser checks passed the exact Commons repro,
absence of specialist roster, group navigation, focused plan composer, creation
of a local plan and discussion note, reload persistence, suggestion save and a
mocked connected routing result. Zero page errors/external requests. Connected
routing was mocked, not a claim of a live Perception session. Added reusable
suggestions-browser-qa.mjs and roster-leak guards to existing QA. Live in-app
preview refreshed and its existing “talk to the moon” input restored; it shows
suggestions instead of specialist proposals. No bot runtime, production mutation,
remote push, deployment or spending.
