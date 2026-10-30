# NETIZENS private-beta gate

Not cleared. Code checks are not physical-device certification.

Current main is `0e5fb06` (PR #20). The October 29 completion branch adds tested Citizen onboarding/safety and core navigation/search/vote flows; its mobile code is not yet merged or distributed. See the current repository status and completion ledger for source and check evidence.

Fresh October 29 inspection: dedicated `the-bridge` (`udygizxcwqoxifqlyfkq`) is ACTIVE_HEALTHY after restoring the existing project. Five migrations are installed, including effective privileges under hosted version `20261019075407` and onboarding/safety under `20261030034537`. Live catalogs and anonymous denial probes passed; two-account HTTP/Auth acceptance has not run. There are zero Auth users, Citizens and World Entities and 10 Places; live two-account acceptance has not run.

Issue #16 must remain open until its physical-device acceptance evidence is recorded. Implementation PRs should reference it without automatic closing keywords.

Required evidence:
- Dedicated NETIZENS Supabase project identity and all migrations applied (never the Perception project).
- Confirmed LWV Apple/Google app identifiers, EAS project and signing credentials.
- Real iOS and Android builds; permanent-Citizen login and existing Citizen profile.
- World → Place → Entity, join, post, reply, close/reopen and network recovery.
- Retry-safe outbox; explicit pending/rejected states; no duplicate writes.
- Authenticated notifications and deep links, plus a deployed push token registration and delivery service. Push adapter alone is insufficient.
- Private thread RLS, blocked-user rejection, Circle/public separation, logout cache purge.
- Working user-facing block/report controls and their live RLS verification.
- College analytics persisted end-to-end; seeded data excluded from real activity/reputation.
- Device measurements for every speed budget; no fabricated benchmark input.
- Green physical-device E2E on both platforms.

Current automated coverage exercises SQLite persistence/leases/account scoping, transport errors/idempotency, cached public reads, private route exclusion and message retry stability. It does not replace the above evidence.

Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test:ci`, `npm run test:storage` and repository browser/backend QA. Node >=24 is used for the native SQLite integration harness; the Expo app's Node >=22.13 baseline is unchanged.

Export resolved Expo config to a temporary JSON file, then run `node scripts/validate-release-config.mjs <file>`. Provide real app IDs via NETIZENS_IOS_BUNDLE_ID, NETIZENS_ANDROID_PACKAGE and NETIZENS_EAS_PROJECT_ID. Never put signing credentials or privileged Supabase keys in public variables.
