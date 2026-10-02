import fs from "node:fs";
import assert from "node:assert/strict";

const migration=fs.readFileSync(
  new URL("../../../supabase/migrations/20261002223500_netizens_world_foundation.sql",import.meta.url),
  "utf8"
).toLowerCase();

const tables=[
  "citizens","places","world_entities","entity_memberships","entity_links","citizen_blocks",
  "yes_no_votes","artifacts","citizen_artifacts","reputation_events","netizens_access_grants",
  "netizens_perception_bindings","time_machine_scenarios","conversation_threads","thread_members",
  "messages","notifications","reports","moderation_actions","world_audit_events"
];

for(const table of tables){
  assert.ok(
    migration.includes("create table public."+table),
    "missing production table: "+table
  );
  assert.ok(
    migration.includes("alter table public."+table+" enable row level security"),
    "RLS must be enabled for: "+table
  );
}

for(const canonicalPerceptionTable of [
  "perception_objectives","perception_routes","execution_steps","verification_events","perception_permission_grants"
]){
  assert.ok(
    !migration.includes("create table public."+canonicalPerceptionTable),
    "NETIZENS must not duplicate canonical Perception state: "+canonicalPerceptionTable
  );
}

assert.ok(
  migration.includes("id uuid primary key references auth.users(id) on delete cascade"),
  "Citizen identity must bind directly to Supabase Auth"
);
assert.ok(
  migration.includes("coalesce(new.is_anonymous,false)"),
  "Auth trigger must reject anonymous users"
);
assert.ok(
  migration.includes("auth.jwt())->>'is_anonymous'"),
  "RLS must distinguish permanent from anonymous authenticated users"
);
assert.ok(
  migration.includes("revoke all on table") && migration.includes("from anon"),
  "anonymous browser role must not receive World table access"
);
assert.ok(
  migration.includes("grant update (handle,display_name,avatar_form,avatar_mode) on public.citizens"),
  "Citizen system fields must not be client-updatable"
);
assert.ok(
  migration.includes("grant update (title,summary,visibility,status,metadata) on public.world_entities"),
  "World Entity immutable ownership fields must be protected"
);
assert.ok(
  migration.includes("grant update (role,status,joined_at) on public.entity_memberships"),
  "Membership identity keys must remain immutable"
);
assert.ok(
  migration.includes("grant update (body,edited_at,deleted_at) on public.messages"),
  "Messages must protect thread and sender identity fields"
);
assert.ok(
  migration.includes("create or replace function public.cast_yes_no_vote"),
  "Yes or No requires a vote-first aggregate RPC"
);
assert.ok(
  migration.includes("create or replace function private.can_view_entity"),
  "World visibility must be centralized"
);
assert.ok(
  migration.includes("create or replace function private.can_send_message"),
  "Messaging must enforce membership and blocking"
);
assert.ok(
  migration.includes("revoke all on public.moderation_actions from authenticated"),
  "Moderation actions must remain service-only"
);
assert.ok(
  migration.includes("revoke all on public.world_audit_events from authenticated"),
  "Audit events must remain service-only"
);
assert.ok(
  migration.includes("scenario-not-prediction"),
  "Time Machine contract must preserve scenario-not-prediction semantics"
);

console.log("NETIZENS production Supabase contract QA passed");
