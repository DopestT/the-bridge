-- NETIZENS World durable backend contract (PostgreSQL)
-- Prototype contract: schema is intentionally portable and not yet wired to production auth.

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

create table if not exists permission_grants (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references citizens(id) on delete cascade,
  scope_type text not null,
  scope_id text,
  permission text not null,
  granted_to text not null default 'perception',
  status text not null default 'active'
    check (status in ('active','expired','revoked')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists permission_grants_lookup_idx
  on permission_grants(citizen_id,permission,status);

create table if not exists perception_objectives (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references citizens(id) on delete cascade,
  source_place_id text references places(id),
  objective_text text not null,
  interpreted_goal jsonb not null default '{}'::jsonb,
  status text not null default 'proposed'
    check (status in ('proposed','awaiting_permission','approved','executing','verified','failed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists perception_routes (
  id uuid primary key default gen_random_uuid(),
  objective_id uuid not null references perception_objectives(id) on delete cascade,
  route jsonb not null,
  permission_requirements jsonb not null default '[]'::jsonb,
  verification_requirements jsonb not null default '[]'::jsonb,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists execution_steps (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references perception_routes(id) on delete cascade,
  step_index integer not null,
  place_id text references places(id),
  action_type text not null,
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  status text not null default 'pending'
    check (status in ('pending','blocked','running','complete','failed','cancelled')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (route_id,step_index)
);

create table if not exists verification_events (
  id uuid primary key default gen_random_uuid(),
  execution_step_id uuid not null references execution_steps(id) on delete cascade,
  verifier_type text not null,
  result text not null check (result in ('verified','rejected','inconclusive')),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists time_machine_scenarios (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references citizens(id) on delete cascade,
  horizon text not null check (horizon in ('6m','1y','5y')),
  input_snapshot jsonb not null,
  assumptions jsonb not null default '[]'::jsonb,
  scenario jsonb not null,
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
