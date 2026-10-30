# Effective privilege regression

`bootstrap.sql` is exclusively for a disposable PostgreSQL database. It creates
minimal Supabase Auth stand-ins and reproduces broad platform default grants.
Never run it against a connected Supabase project.

The World QA workflow applies the repository migrations to PostgreSQL 17 and
runs `effective-privileges.sql`. The test checks effective column/table/function
privileges and actual authenticated writes, profile creation, join/post/reply,
private-message isolation and anonymous-user exclusion. Fixtures roll back.

It also runs `citizen-onboarding.sql` and `citizen-safety.sql` for the additive
completion/safety migration. These verify self-only completion, actual permanent
Auth state, migrated/converted accounts, handle conflicts, constrained direct
profile updates, preservation of server-owned fields, immediate account
restrictions and persistent block enforcement. The generated default handle may
use 40 characters; newly chosen handles through the completion UI/RPC use 3–30.

This test does not certify Supabase HTTP/Auth configuration, signed builds, push,
or physical-device acceptance. Those still require the real-phone runbook.

## Deployment boundary

The read-only inspection at 2026-10-13 05:01 UTC found all three original
migrations installed on `udygizxcwqoxifqlyfkq`, 21 RLS-enabled public tables and
44 policies, but excessive authenticated grants and exposed function privileges.
There were no permanent Auth users, Citizens or World Entities; 10 Places existed.
This supersedes the earlier empty-schema observation, not the unconfirmed
NETIZENS project mapping. No live migration was applied by this work.

Only after confirming the approved dedicated NETIZENS project against the actual
build environment, apply the missing `netizens_effective_privileges` migration.
Do not replay the three installed migrations. Recheck effective privileges and
advisors, then run two-account API acceptance before physical-device testing.

The correction explicitly resets privileges on the NETIZENS tables and named
functions; service-role access and RLS rules are preserved. It does not change
schema-wide default ACLs or unrelated objects. Future migrations must explicitly
reset client ACLs and grant only the intended operations. Narrow GRANT statements
alone do not remove broader existing privileges.
