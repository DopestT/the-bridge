# Apple and Android readiness contract

Goal: bring the canonical NETIZENS app to its strongest verifiable position for both platforms. This is not a store-approval claim. Prior core implementation remains in draft PR #21; issue #16 remains the real-phone release gate.

## Established decisions

- NETIZENS only; existing Supabase and Expo projects remain canonical.
- Expo owner big271; delegated app identifiers com.big271.netizens.
- No Apple Developer membership yet; paid enrollment is not authorized.
- Consent-first private messaging, account-scoped offline cache/outbox and server-owned identity/reputation remain mandatory.
- Low-credit execution: batch checks and native builds; do not generate a cloud build after every small fix.

## Required work and evidence

| Area | Current evidence | Release requirement |
| --- | --- | --- |
| Identity and core social loop | Source/UI/SQL checks; Android preview exists | Two permanent consenting test accounts, verified email/login/recovery and full loop on both phones |
| First conversation | Hosted backend and source verified, concurrency checked | Include current code in final artifact and test invitation/block behavior with two accounts |
| Account deletion | Missing at this audit | In-app explicit deletion, recent authentication, canonical removal, stale-token denial and local purge; external deletion URL for Play |
| Privacy, terms, support | No confirmed public operator/policy/contact URLs | Truthful public policies, UGC terms acceptance and visible support/reporting; owner must supply actual operator and reachable contact |
| Moderation | User block/report and RLS implemented | Staffed handling, review access, objectionable-content handling and measured response process |
| Notifications | Permission/token adapter only | Canonical registration/revocation, authenticated delivery and push/deep-link device evidence |
| Discovery | Search/nesting implemented; Local only chooses a label | Genuine bounded canonical Local filtering; no exact-coordinate exposure |
| College measurement | Prototype behavior exists | Canonical persisted funnel, seeded data exclusion, actionable privacy-preserving measurements |
| Platform UI | Shared native shell; runtime screenshots unverified | Safe areas, keyboard/scroll, accessibility and actual named-screen screenshots |
| Store packaging | Android APK preview; no final Play AAB/iOS archive | Final build provenance, icons/splash, permission copy, age/content ratings, privacy/Data Safety, reviewer access and store metadata |
| Performance/recovery | Deterministic storage tests and budget contract | Measured physical-device budgets; process death, offline replay, logout/account isolation |

## Account-deletion implementation recommendation

Use an explicit password-confirmed action, separate from sign-out. The server derives the only deletable account from the verified JWT; no target-user argument exists. Require a live Auth session and a password authentication event within five minutes. Restricted/incomplete accounts can delete themselves too. A refresh-token event alone must not satisfy reauthentication.

Deletion follows the existing cascade ownership model: the identity, profile, authored posts/messages, memberships, invitations and owned spaces/conversations are removed. Owned spaces include their nested spaces and discussions, and owned conversations include participants' messages. The confirmation must disclose these consequences. Unrelated accounts/spaces remain. Reports targeting deleted objects cascade instead of becoming invalid orphan records. Related service-only audit/moderation material is removed by the same narrowly scoped operation; no indefinite retention is promised.

No live user's deletion is executed during implementation. Disposable PostgreSQL fixtures prove denial, actual removal, related-object cleanup and unrelated-user preservation. A server acknowledgement is required before claiming deletion. The local session, queued intents and account cache are then purged. Ambiguous network failure must never show a fabricated success; advise signing in again to verify.

## Unknowns that must stay visible

The user supplied `legacyworkaventures.com`; live DNS/HTTPS checks on October 30 could not resolve that exact spelling. Domain confirmation is pending. Actual publisher/operator identity and contact address, public policy/deletion URLs, moderation staffing, store-account access, Apple enrollment, physical devices, transactional email delivery and final privacy disclosures are unverified. No address, policy approval, reviewer credential, device result or benchmark should be invented to complete this matrix.

Primary policy references checked October 30, 2026: [Apple account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app/), [Apple review guidelines](https://developer.apple.com/app-store/review/guidelines/), [Google account deletion](https://support.google.com/googleplay/android-developer/answer/13327111).

## October 30 implementation evidence

Account deletion source now includes explicit confirmation, isolated password reauthentication, same-account verification, a scoped server RPC requiring a live Auth session and recent password AMR, canonical removal, and local credential/cache/outbox purge after acknowledgement. Role fixtures cover target-report cascades, audit cleanup, restricted/incomplete accounts, stale password/revoked session denial and unrelated-user preservation. Client tests cover wrong-account credentials, unconfirmed/network results, retirement and purge ordering. Local full Jest: 75 passed; storage/transport: 36 passed; lint/typecheck passed. Hosted rollout and final device acceptance remain unverified until separately recorded.
