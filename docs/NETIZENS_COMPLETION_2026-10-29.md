# NETIZENS completion ledger

## Authority and scope

The user corrected the active project to **NETIZENS**. Unrelated Archangels audit text, launch policy and code are not NETIZENS requirements. Archangels edits were stopped and preserved in their separate checkout. The saved automatic goal still names Archangels; a request to pause that stale goal is pending. Do not resume it as NETIZENS work.

Canonical source: `DopestT/the-bridge`, `apps/netizens-mobile`, current main `0e5fb06`. Worktree: this checkout, branch `codex/netizens-completion-20261029`. Existing worktree configuration and duplicate Expo projects are preserved. Synced `sources/` are read-only.

The implementation milestone remains issue #16: a permanent Citizen completes the canonical social/recovery/privacy loop on physical iOS and Android. A bundle export, mock response or green CI does not finish the build. The older editorial/civic-media blueprint is a separate planning artifact; no voting initiative, jurisdiction, editorial production, staffing or live audience is inferred from it.

## Verified source changes

| Area | Behavior | Evidence and limits |
| --- | --- | --- |
| Citizen profile | Own persisted identity, validated handle/name, avatar-form/home-Place preferences; reputation and server state never editable | Profile/UI/API tests; RPC fixtures on disposable PostgreSQL. Hosted migration pending |
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
- 52 Jest tests and 32 Node storage/transport tests passed, zero skips.
- All five existing World/participation/backend QA commands passed.
- iOS and Android Hermes exports completed; these are unsigned JavaScript bundles.
- Fresh disposable PostgreSQL 16 applied all migrations and passed effective privileges, Citizen safety and onboarding scripts. Invalid direct profile edits also fail at database constraints. Fixtures roll back and never target production.
- Red states were observed before the relevant implementations: profile placeholder, missing search/nested routing/vote flows, stale-session/block SQL failures, missing completion marker, and invalid direct profile edits.

Raw logs are outside the checkout under `/private/tmp/netizens-*`; release evidence should retain sanitized copies together with the final source SHA. No private credentials or message bodies belong in evidence.

## Current external state and unresolved work

Existing Supabase project `udygizxcwqoxifqlyfkq` was restored, then verified ACTIVE_HEALTHY. Its four installed migration versions are unchanged; the new migration is not deployed. Aggregate read found zero Auth users/Citizens/World Entities, 10 Places and 21 public RLS tables.

Two existing Expo projects remain unresolved: `@big27/netizens-mobile` and `@big271/netizens-mobile`. Owner selection is pending. No project creation/transfer/deletion, guessed bundle/package identifiers, signing change or paid build is authorized by that ambiguity. Five release inputs remain unconfigured in this checkout: the two app identifiers, EAS project, backend URL and publishable key. Never use a privileged key in the client.

The local computer has Command Line Tools, but no usable Xcode simulator, Android SDK/emulator, Maestro or attached-device build path. Actual signed installation, push arrival, deep links and device performance need external evidence.

Source still requires authenticated push registration/delivery/revocation, persisted College analytics, genuine Local area filtering, and a scoped first-conversation creation contract. Do not weaken service-controlled thread grants or fabricate content to fill empty screens. Editorial/interview/voting initiative operations still require the owner's actual scope/content and approved provenance.

## Next execution

1. Fresh whole-branch review; resolve important findings and rerun affected checks.
2. Push reviewed branch/PR without closing #16; verify clean CI, including real PostgreSQL fixtures.
3. Deploy additive schema only to confirmed NETIZENS after review; inspect effective grants/advisors and HTTP behavior.
4. Implement remaining core contracts, integrate and test them without claiming provider delivery.
5. Reconcile Expo/signing inputs; use consented test Citizens and labeled controlled Entities; capture both-platform physical-device evidence from the final artifact.

No full-build or private-beta completion is claimed.
