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
