-- NETIZENS World durable backend contract (PostgreSQL)
-- NETIZENS owns social-world state.
-- Perception remains the canonical owner of objectives, routes, execution ledgers,
-- runtime permission grants, verification, and scenario intelligence.

create extension if not exists pgcrypto;

create table if not exists citizens (
  id uuid primary key default gen_random_uuid(),
  handle text unique not null,
  display_name text not null,
  avatar_form text not null default 'stylized'
    check (avatar_form in ('likeness','stylized','fictional','privacy')),
  avatar_mode text not null default 'commons',
  citizen_mark_seed text not null,
  xp integer not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  status text not null default 'active'
    check (status in ('active','limited','suspended','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists places (
  id text primary key,
  name text not null,
  purpose text not null,
  interaction_model text not null,
  is_world_visible boolean not null default true,
  created_at timestamptz not null default now()
);

insert into places (id,name,purpose,interaction_model) values
  ('commons','Commons','Public conversation','conversation'),
  ('crews','Crews','Interest and activity groups','membership'),
  ('local','Local','Nearby people and activity','local-discovery'),
  ('projects','Projects','Collaborative work','milestones'),
  ('ask','Ask','Questions and expertise','question-answer'),
  ('exchange','Exchange','Skills and help','offer-request'),
  ('circles','Circles','Private trusted groups','private-messaging'),
  ('events','Events','Time-bound gatherings','attendance'),
  ('plans','Plans','Early social intent','intent-to-event'),
  ('yesno','Yes or No','Binary opinion and decision','vote-first')
on conflict (id) do nothing;

create table if not exists world_entities (
  id uuid primary key default gen_random_uuid(),
  place_id text not null references places(id),
  entity_type text not null,
  parent_entity_id uuid references world_entities(id) on delete cascade,
  creator_id uuid references citizens(id),
  title text not null,
  summary text,
  visibility text not null default 'public'
    check (visibility in ('public','members','invite','private')),
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists world_entities_place_idx on world_entities(place_id, created_at desc);
create index if not exists world_entities_parent_idx on world_entities(parent_entity_id);
create index if not exists world_entities_creator_idx on world_entities(creator_id);

create table if not exists entity_memberships (
  entity_id uuid not null references world_entities(id) on delete cascade,
  citizen_id uuid not null references citizens(id) on delete cascade,
  role text not null default 'member',
  status text not null default 'active'
    check (status in ('invited','requested','active','muted','left','removed')),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (entity_id,citizen_id)
);

create index if not exists entity_memberships_citizen_idx on entity_memberships(citizen_id,status);

create table if not exists entity_links (
  from_entity_id uuid not null references world_entities(id) on delete cascade,
  to_entity_id uuid not null references world_entities(id) on delete cascade,
  link_type text not null,
  created_by uuid references citizens(id),
  created_at timestamptz not null default now(),
  primary key (from_entity_id,to_entity_id,link_type)
);

create table if not exists yes_no_votes (
  entity_id uuid not null references world_entities(id) on delete cascade,
  citizen_id uuid not null references citizens(id) on delete cascade,
  choice text not null check (choice in ('yes','no')),
  explanation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (entity_id,citizen_id)
);

create table if not exists artifacts (
  id text primary key,
  name text not null,
  description text,
  rarity text not null default 'standard',
  created_at timestamptz not null default now()
);

create table if not exists citizen_artifacts (
  citizen_id uuid not null references citizens(id) on delete cascade,
  artifact_id text not null references artifacts(id),
  earned_at timestamptz not null default now(),
  source_type text,
  source_id text,
  primary key (citizen_id,artifact_id)
);

create table if not exists reputation_events (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references citizens(id) on delete cascade,
  place_id text references places(id),
  event_type text not null,
  points integer not null default 0,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists reputation_events_citizen_idx on reputation_events(citizen_id,created_at desc);

-- NETIZENS access controls are social/audience controls.
-- They are intentionally separate from Perception runtime execution grants.
create table if not exists netizens_access_grants (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references citizens(id) on delete cascade,
  grantee_citizen_id uuid references citizens(id) on delete cascade,
  grantee_entity_id uuid references world_entities(id) on delete cascade,
  capability text not null,
  scope jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('active','expired','revoked')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  check (grantee_citizen_id is not null or grantee_entity_id is not null)
);

create index if not exists netizens_access_grants_lookup_idx
  on netizens_access_grants(citizen_id,capability,status);

-- Bridge records bind NETIZENS World context to the canonical Perception runtime.
-- Perception IDs are deliberately not foreign-keyed here so the runtimes can
-- remain provider-independent or move across databases without corrupting World state.
create table if not exists netizens_perception_bindings (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references citizens(id) on delete cascade,
  source_place_id text references places(id),
  source_entity_id uuid references world_entities(id) on delete set null,
  perception_project_id uuid not null,
  perception_objective_id uuid,
  perception_route_id uuid,
  binding_status text not null default 'objective_created'
    check (binding_status in ('objective_created','route_proposed','awaiting_permission','executing','verified','failed','cancelled')),
  context_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists netizens_perception_bindings_citizen_idx
  on netizens_perception_bindings(citizen_id,created_at desc);
create index if not exists netizens_perception_bindings_objective_idx
  on netizens_perception_bindings(perception_objective_id);

create table if not exists time_machine_scenarios (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references citizens(id) on delete cascade,
  horizon text not null check (horizon in ('6m','1y','5y')),
  input_snapshot jsonb not null,
  assumptions jsonb not null default '[]'::jsonb,
  scenario jsonb not null,
  perception_scenario_id uuid,
  model_version text,
  created_at timestamptz not null default now()
);

create index if not exists time_machine_scenarios_citizen_idx
  on time_machine_scenarios(citizen_id,created_at desc);

create table if not exists world_audit_events (
  id bigserial primary key,
  actor_citizen_id uuid references citizens(id),
  event_type text not null,
  entity_id uuid references world_entities(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists world_audit_events_created_idx on world_audit_events(created_at desc);
