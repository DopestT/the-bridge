# NETIZENS connected web release

The existing cinematic World remains the guest exploration surface. Join the community opens the dedicated Supabase-backed account and conversation journey. Local examples and synthetic dots are disclosed; they are not actual user activity.

`npm ci && npm run build` produces the self-contained `dist/` site. `vercel.json` targets the dedicated NETIZENS project only. Never deploy this project to the separate Bridge site.

Core writes use the authenticated session and existing RLS. Topic insertion deliberately requests no returned row: the stable visibility helper cannot see a just-inserted row in the insertion snapshot. A separate canonical read confirms success. Topic and reply mutation identifiers remain stable during retries. Profile initialization uses the existing restricted RPC; clients cannot change reputation, account status or moderation state.

Run the real two-account browser check with `QA_ACCOUNTS=/private/path/accounts.json QA_URL=https://netizens-rho.vercel.app QA_OUTPUT=/private/path/evidence node tools/release/browser-acceptance.cjs`. The account file is a JSON array of two explicitly authorized test credentials. It must never be committed, uploaded, or included in receipts. The runner creates clearly labeled temporary topics and replies; clean up only its own fixtures afterward. Account creation/email confirmation, moderator service actions, and native physical-device acceptance need separate evidence.

Web session persistence uses Supabase Auth on this origin. Sign-out clears the current account UI. No account data is copied into the guest example store. No geolocation, real movement feed or analytics is enabled. Circle messaging remains in the native invitation-based journey; the web UI does not expose private threads as public discussions.
