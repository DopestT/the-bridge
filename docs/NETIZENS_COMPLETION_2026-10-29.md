# NETIZENS completion ledger

## Authority and scope

The user corrected the active project to **NETIZENS**. Unrelated Archangels audit text, launch policy and code are not NETIZENS requirements. Archangels edits were stopped and preserved in their separate checkout. The user explicitly paused the stale Archangels automatic goal. It remains paused and must not be resumed as NETIZENS work. The goal API cannot replace an unfinished paused goal; NETIZENS continues as the authorized task in this chat.

Canonical source: `DopestT/the-bridge`, `apps/netizens-mobile`, current main `0e5fb06`. Worktree: this checkout, branch `codex/netizens-completion-20261029`. Existing worktree configuration and duplicate Expo projects are preserved. Synced `sources/` are read-only.

The implementation milestone remains issue #16: a permanent Citizen completes the canonical social/recovery/privacy loop on physical iOS and Android. A bundle export, mock response or green CI does not finish the build. The older editorial/civic-media blueprint is a separate planning artifact; no voting initiative, jurisdiction, editorial production, staffing or live audience is inferred from it.

## Verified source changes

| Area | Behavior | Evidence and limits |
| --- | --- | --- |
| Citizen profile | Own persisted identity, validated handle/name, avatar-form/home-Place preferences; reputation and server state never editable | Profile/UI/API tests; RPC fixtures on disposable PostgreSQL. Hosted version `20261030034537` installed; anonymous denial probes and protected-field catalogs verified |
| Onboarding | Existing generated profiles require explicit completion; a failed lookup is not mistaken for a missing profile; account-scoped completed identity permits cached public reads offline | Runtime tests including foreign-account cache rejection, restricted-account gate and logout purge |
| Signup | Creates permanent Auth account; missing session gives an email-confirmation notice without entering World | Mocked SDK integration tests only. Actual email configuration/delivery unverified |
| Account safety | Current Auth/Citizen status governs policies despite stale JWT; restricted accounts cannot reinitialize or reactivate themselves | SQL tests deny suspended/deleted identities and preserve seed/XP/level |
| Message safety | Canonical blocking hides blocked sender bodies on reload and prevents edits/sends across a block | Real SQL role/RLS fixtures; live two-account acceptance pending |
| Search | Authenticated, bounded title search with loading/error/empty states; superseded requests cannot display stale private results | Repository and component tests; results are not persisted in public caches |
| Nested World | Place lists roots; authorized entities expose bounded children and parent navigation | Tests prohibit child reads before parent authorization and private/Circle cache display |
| Circle routing | Opens an existing entity-bound authorized thread; missing/denied thread is an explicit state | No new client grants or automatic thread creation. First DM creation remains unresolved |
| Yes or No | Existing authenticated RPC records/upserts vote before returning aggregate results | UI/transport tests; only confirmed counts appear. Advisory community questions, not official ballots |

## Checks observed

- Typecheck and ESLint passed.
- 54 Jest tests and 32 Node storage/transport tests passed, zero skips.
- All five existing World/participation/backend QA commands passed.
- iOS and Android Hermes exports completed; these are unsigned JavaScript bundles.
- Fresh disposable PostgreSQL 16 applied all migrations and passed effective privileges, Citizen safety, onboarding and vote-first scripts, plus legacy upgrade compatibility. Invalid direct profile edits also fail at database constraints. Fixtures roll back and never target production.
- Red states were observed before the relevant implementations: profile placeholder, missing search/nested routing/vote flows, stale-session/block SQL failures, missing completion marker, and invalid direct profile edits.

Raw logs are outside the checkout under `/private/tmp/netizens-*`; release evidence should retain sanitized copies together with the final source SHA. No private credentials or message bodies belong in evidence.

## Current external state and unresolved work

Existing Supabase project `udygizxcwqoxifqlyfkq` was restored, then verified ACTIVE_HEALTHY. Its original four migration versions are preserved; onboarding/safety is installed as `20261030034537`. Catalog readback confirms the new column/policy/RPC, denied anon execution/read access, no authenticated TRUNCATE grants, and protected status/XP/completion fields. Anonymous HTTP probes return 401 with PostgreSQL code 42501. Auth settings return 200 with email signup enabled; no real email or two-account login is claimed. Aggregate read found zero Auth users/Citizens/World Entities, 10 Places and 21 public RLS tables.

Established owner decision: the user selected **big271**. Live CLI readback verifies existing `@big271/netizens-mobile`, ID `5f86b3a0-9d3b-4982-a05c-2aa6c4b3f0da`; canonical owner/project are now fixed in `app.config.ts`. No project was created, transferred or deleted. The other recorded project is preserved. The real public backend URL and publishable key are configured locally in the ignored environment file. The user delegated identifier selection; both platforms now default to `com.big271.netizens` with optional explicit environment overrides. Resolved Expo configuration and the release-configuration gate pass. Preview public backend variables are set in EAS, its profile produces an Android APK, and the account is verified on the Free plan. Signing and device acceptance remain separate gates. Android build `63daa5ed-7b05-4969-9dcc-0ea7346dd4aa` is in progress; no artifact or device success is claimed yet. Never use a privileged key in the client.

The local computer has Command Line Tools, but no usable Xcode simulator, Android SDK/emulator, Maestro or attached-device build path. Actual signed installation, push arrival, deep links and device performance need external evidence.

Source still requires authenticated push registration/delivery/revocation, persisted College analytics, genuine Local area filtering, and a scoped first-conversation creation contract. Do not weaken service-controlled thread grants or fabricate content to fill empty screens. Editorial/interview/voting initiative operations still require the owner's actual scope/content and approved provenance.

## Independent review and migration compatibility

One independent review identified restricted-account status visibility, historical-profile migration compatibility, an older refresh overwriting completed onboarding, and retired-session credential refreshes. Added reproductions failed on the original code and pass after the fixes. Restricted Citizens may read only their own account profile while World/mutation permissions remain denied. Profile refreshes are deduplicated and invalidated by saves; retired controllers cannot persist late refresh results.

New profile constraints use `NOT VALID` so upgrades preserve previously allowed legacy values. They still reject invalid new writes. Explicit onboarding repairs chosen editable fields without resetting seed, reputation or status. The CI database job inserts historical values before the new migration and verifies preservation and explicit repair afterward. Validation of all historical rows can be performed after reconciliation; the migration never silently rewrites a person's identity.

## Next execution

1. Fresh whole-branch review; resolve important findings and rerun affected checks.
2. Draft PR #21 is published at `6e30ba7`; Mobile CI and World QA (including real PostgreSQL 17 fixtures) passed. Keep #16 open.
3. The additive schema is deployed on confirmed NETIZENS; live grants and anonymous denial probes passed. Authenticated vote/profile SECURITY DEFINER advisor warnings are expected reviewed entry points, not a claim of full security clearance. Two service-owned RLS tables intentionally have no client policies.
4. Implement remaining core contracts, integrate and test them without claiming provider delivery.
5. Reconcile Expo/signing inputs; use consented test Citizens and labeled controlled Entities; capture both-platform physical-device evidence from the final artifact.

No full-build or private-beta completion is claimed.
