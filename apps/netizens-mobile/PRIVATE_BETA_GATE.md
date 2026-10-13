# NETIZENS private-beta gate

Not cleared. Code checks are not physical-device certification.

PR #18 is merged at `f66d1bdd24ed46f85be6a6a52b1c8f98009cbbc3`; post-merge Mobile CI run #24 passed. This establishes the implementation baseline only. See [the real-phone runbook](../../docs/NETIZENS_REAL_PHONE_RUNBOOK.md) for the dependency order and evidence matrix.

Latest backend observation (October 13, 2026): connected `the-bridge` is ACTIVE_HEALTHY, but migration history and public tables are empty. Confirm its identity as the dedicated NETIZENS target before applying migrations. The earlier inactive status/timeout no longer describes the latest inspection.

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
