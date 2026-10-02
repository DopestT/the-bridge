# NETIZENS Supabase

This directory is the production database foundation for the dedicated NETIZENS Supabase project.

## Hard boundary

Do **not** apply these migrations to the Perception database.

NETIZENS owns social product state:
- Citizens;
- Places and World Entities;
- memberships and cross-Place links;
- social access grants;
- messaging;
- blocks and reports;
- notifications;
- reputation and artifacts;
- NETIZENS-side Perception bindings;
- Time Machine scenario snapshots.

Perception remains canonical for:
- objectives;
- Reality Maps and routes;
- runtime permission grants;
- execution and worker ledgers;
- verification;
- learning;
- scenario intelligence.

## Authentication

The production World requires permanent authenticated users.

Anonymous Supabase Auth users and the unauthenticated `anon` database role do not receive World table access. The browser uses only the project URL and a publishable key. Service-role credentials must never be exposed to a client.

## Security

Every table reachable from the Data API has Row Level Security enabled.

Sensitive service-owned tables such as moderation actions and World audit events have no authenticated client privileges. System-owned fields such as Citizen XP/status, entity ownership, sender identity, and membership identity keys are protected with column-level privileges in addition to RLS.

## Migration order

Apply files in `supabase/migrations/` in timestamp order.

After every schema migration:
1. run the NETIZENS World QA workflow;
2. run Supabase security advisors;
3. run Supabase performance advisors;
4. resolve material findings before production traffic.

## Client configuration

The production client should receive:
- the NETIZENS project URL;
- a NETIZENS publishable key;
- an authenticated user session.

Never persist Perception or Supabase service credentials in browser storage.

## Perception bridge

NETIZENS sends bounded Place and Entity source context to the canonical Perception runtime. Perception returns IDs and bounded route state. NETIZENS stores only the lightweight binding required to reconnect verified runtime outcomes to the relevant World object.
