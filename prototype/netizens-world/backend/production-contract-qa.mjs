import fs from "node:fs";
import assert from "node:assert/strict";

const foundationPath=new URL("../../../supabase/migrations/20261002223500_netizens_world_foundation.sql",import.meta.url);
const participationPath=new URL("../../../supabase/migrations/20261005010500_netizens_participation_layer.sql",import.meta.url);
const migration=fs.readFileSync(foundationPath,"utf8").toLowerCase();

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

assert.ok(fs.existsSync(participationPath),"participation migration must exist as an additive migration");
const participation=fs.readFileSync(participationPath,"utf8").toLowerCase();

assert.ok(
  participation.includes("create table public.entity_discussion_items"),
  "production participation requires entity_discussion_items"
);
assert.ok(
  participation.includes("parent_id uuid references public.entity_discussion_items(id) on delete set null"),
  "discussion replies require a safe self-referencing parent"
);
assert.ok(
  participation.includes("check (provenance in ('genuine','seeded','demo'))"),
  "discussion provenance must distinguish genuine, seeded, and demo activity"
);
assert.ok(
  participation.includes("client_mutation_id uuid not null"),
  "discussion writes require a client mutation id"
);
assert.ok(
  participation.includes("unique (author_id,client_mutation_id)"),
  "discussion retries must be deduplicated per author and mutation id"
);
assert.ok(
  participation.includes("alter table public.entity_memberships add column provenance"),
  "membership provenance must be added without rewriting membership identity"
);
assert.ok(
  participation.includes("alter table public.entity_discussion_items enable row level security"),
  "discussion table must have RLS enabled"
);
assert.ok(
  participation.includes("private.can_view_entity(entity_id,(select auth.uid()))"),
  "discussion visibility must reuse the canonical entity visibility helper"
);
assert.ok(
  participation.includes("not private.blocked_between((select auth.uid()),author_id)"),
  "discussion selection must suppress blocked authors"
);
assert.ok(
  participation.includes("private.current_user_is_permanent()"),
  "participation writes must require a permanent authenticated Citizen"
);
assert.ok(
  participation.includes("author_id=(select auth.uid())") && participation.includes("provenance='genuine'"),
  "browser discussion inserts must be self-authored genuine activity"
);
assert.ok(
  participation.includes("create policy \"authenticated genuine discussion insert\""),
  "discussion inserts need an explicit authenticated policy"
);
assert.ok(
  participation.includes("create policy \"authenticated discussion select\""),
  "discussion reads need an explicit block-aware visibility policy"
);
assert.ok(
  participation.includes("revoke all on public.entity_discussion_items from anon"),
  "anonymous role must not access discussion rows"
);
assert.ok(
  participation.includes("grant select,insert on public.entity_discussion_items to authenticated"),
  "authenticated users need only explicit discussion read/create table grants"
);
assert.ok(
  participation.includes("grant update (body,edited_at,deleted_at) on public.entity_discussion_items to authenticated"),
  "ordinary authors may edit content fields but not provenance/moderation/identity"
);
assert.ok(
  !participation.includes("grant update (moderation_state) on public.entity_discussion_items to authenticated"),
  "ordinary clients must never receive moderation-state update privilege"
);
assert.ok(
  participation.includes("grant all on public.entity_discussion_items to service_role"),
  "service-controlled moderation and seeded/demo insertion require server access"
);
assert.ok(
  participation.includes("create policy \"authenticated genuine membership insert\""),
  "browser membership inserts must be constrained to genuine provenance"
);
assert.ok(
  participation.includes("create policy \"authenticated genuine membership update\""),
  "browser membership updates must not mutate seeded/demo membership state"
);
assert.ok(
  participation.includes("create index entity_discussion_items_entity_created_idx"),
  "discussion reads need an entity/time index for app speed"
);
assert.ok(
  participation.includes("create index entity_discussion_items_parent_idx"),
  "reply traversal needs a parent index"
);

assert.ok(
  participation.includes("create or replace function private.valid_discussion_parent"),
  "reply validation must use a private helper instead of recursively querying the RLS-protected discussion table from its own policy"
);
assert.ok(
  participation.includes("private.valid_discussion_parent(parent_id,entity_id)"),
  "discussion inserts must delegate parent validation to the non-recursive helper"
);
assert.ok(
  participation.includes("moderation_state='visible'") && participation.includes("deleted_at is null"),
  "ordinary discussion reads must not expose moderated or soft-deleted bodies"
);
assert.ok(
  !participation.includes("select 1\n      from public.entity_discussion_items p"),
  "discussion INSERT policy must not self-query entity_discussion_items and recurse through RLS"
);

console.log("NETIZENS production Supabase contract QA passed");
