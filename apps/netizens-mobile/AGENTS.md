# NETIZENS mobile agent instructions (engineering worktrees only)
Read `../../docs/superpowers/specs/2026-10-05-netizens-mobile-app-design.md`, `../../docs/NETIZENS_REAL_PHONE_RUNBOOK.md`, `../../docs/NETIZENS_SPEED_STANDARD.md`, `../../docs/NETIZENS_ENGINEERING_SWARM.md` and issue #16 before working. These are the canonical product constraints; older checkboxes are not current acceptance evidence.

Work only within the assigned NETIZENS task/branch. Inspect before editing. Preserve auth grants and RLS, stable mutation IDs, SQLite cache/outbox ownership, notification privacy, Circle/DM isolation, genuine vs seeded provenance, and College under Crews. Never depend on Perception for core social actions or create a second Perception runtime.

Run targeted failing tests when appropriate, implement the smallest safe fix, rerun tests and report exact commands/outcomes. Do not mark physical devices or a live server verified from mocks or CI. No merges, deployment, live DB migrations, production data, credential changes, user messaging, publishing or spending without explicit approval. Keep issue #16 open pending actual physical iOS/Android evidence.
