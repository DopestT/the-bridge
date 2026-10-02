-- NETIZENS production database foundation
-- Dedicated Supabase project only. Do not apply this migration to the Perception database.
-- Perception keeps canonical ownership of objectives, routes, runtime permissions,
-- execution, verification, learning, and scenario intelligence.

create extension if not exists pgcrypto;
create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.citizens (
  id uuid primary key references auth.users(id) on delete cascade,
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

create table public.places (
  id text primary key,
  name text not null,
  purpose text not null,
  interaction_model text not null,
  is_world_visible boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.places (id,name,purpose,interaction_model) values
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
on conflict (id) do update
set name=excluded.name,
    purpose=excluded.purpose,
    interaction_model=excluded.interaction_model;

create table public.world_entities (
  id uuid primary key default gen_random_uuid(),
  place_id text not null references public.places(id),
  entity_type text not null,
  parent_entity_id uuid references public.world_entities(id) on delete cascade,
  creator_id uuid not null references public.citizens(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  summary text not null default '' check (char_length(summary) <= 2000),
  visibility text not null default 'public'
    check (visibility in ('public','members','invite','private')),
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index world_entities_place_idx on public.world_entities(place_id, created_at desc);
create index world_entities_parent_idx on public.world_entities(parent_entity_id);
create index world_entities_creator_idx on public.world_entities(creator_id, created_at desc);

create table public.entity_memberships (
  entity_id uuid not null references public.world_entities(id) on delete cascade,
  citizen_id uuid not null references public.citizens(id) on delete cascade,
  role text not null default 'member',
  status text not null default 'active'
    check (status in ('invited','requested','active','muted','left','removed','interested','following')),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (entity_id,citizen_id)
);

create index entity_memberships_citizen_idx
  on public.entity_memberships(citizen_id,status);
create index entity_memberships_entity_status_idx
  on public.entity_memberships(entity_id,status);

create table public.entity_links (
  from_entity_id uuid not null references public.world_entities(id) on delete cascade,
  to_entity_id uuid not null references public.world_entities(id) on delete cascade,
  link_type text not null,
  created_by uuid not null references public.citizens(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_entity_id,to_entity_id,link_type),
  check (from_entity_id <> to_entity_id)
);

create table public.citizen_blocks (
  blocker_id uuid not null references public.citizens(id) on delete cascade,
  blocked_id uuid not null references public.citizens(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id,blocked_id),
  check (blocker_id <> blocked_id)
);

create index citizen_blocks_blocked_idx on public.citizen_blocks(blocked_id);

create table public.yes_no_votes (
  entity_id uuid not null references public.world_entities(id) on delete cascade,
  citizen_id uuid not null references public.citizens(id) on delete cascade,
  choice text not null check (choice in ('yes','no')),
  explanation text check (char_length(explanation) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (entity_id,citizen_id)
);

create table public.artifacts (
  id text primary key,
  name text not null,
  description text,
  rarity text not null default 'standard',
  created_at timestamptz not null default now()
);

create table public.citizen_artifacts (
  citizen_id uuid not null references public.citizens(id) on delete cascade,
  artifact_id text not null references public.artifacts(id) on delete cascade,
  earned_at timestamptz not null default now(),
  source_type text,
  source_id text,
  primary key (citizen_id,artifact_id)
);

create table public.reputation_events (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references public.citizens(id) on delete cascade,
  place_id text references public.places(id),
  event_type text not null,
  points integer not null default 0,
  evidence jsonb not null default '{}'::jsonb
    check (jsonb_typeof(evidence)='object'),
  created_at timestamptz not null default now()
);

create index reputation_events_citizen_idx
  on public.reputation_events(citizen_id,created_at desc);

create table public.netizens_access_grants (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references public.citizens(id) on delete cascade,
  grantee_citizen_id uuid references public.citizens(id) on delete cascade,
  grantee_entity_id uuid references public.world_entities(id) on delete cascade,
  capability text not null,
  scope jsonb not null default '{}'::jsonb
    check (jsonb_typeof(scope)='object'),
  status text not null default 'active'
    check (status in ('active','expired','revoked')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  check (grantee_citizen_id is not null or grantee_entity_id is not null)
);

create index netizens_access_grants_lookup_idx
  on public.netizens_access_grants(citizen_id,capability,status);

create table public.netizens_perception_bindings (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references public.citizens(id) on delete cascade,
  source_place_id text references public.places(id),
  source_entity_id uuid references public.world_entities(id) on delete set null,
  perception_project_id uuid not null,
  perception_objective_id uuid,
  perception_route_id uuid,
  binding_status text not null default 'objective_created'
    check (binding_status in ('objective_created','route_proposed','awaiting_permission','executing','verified','failed','cancelled')),
  context_snapshot jsonb not null default '{}'::jsonb
    check (jsonb_typeof(context_snapshot)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index netizens_perception_bindings_citizen_idx
  on public.netizens_perception_bindings(citizen_id,created_at desc);
create index netizens_perception_bindings_objective_idx
  on public.netizens_perception_bindings(perception_objective_id);

create table public.time_machine_scenarios (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references public.citizens(id) on delete cascade,
  horizon text not null check (horizon in ('6m','1y','5y')),
  input_snapshot jsonb not null,
  assumptions jsonb not null default '[]'::jsonb
    check (jsonb_typeof(assumptions)='array'),
  scenario jsonb not null,
  perception_scenario_id uuid,
  model_version text,
  created_at timestamptz not null default now()
);

create index time_machine_scenarios_citizen_idx
  on public.time_machine_scenarios(citizen_id,created_at desc);

create table public.conversation_threads (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('direct','entity')),
  entity_id uuid references public.world_entities(id) on delete cascade,
  created_by uuid not null references public.citizens(id) on delete cascade,
  title text check (char_length(title) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((kind='entity' and entity_id is not null) or (kind='direct' and entity_id is null))
);

create index conversation_threads_entity_idx on public.conversation_threads(entity_id);

create table public.thread_members (
  thread_id uuid not null references public.conversation_threads(id) on delete cascade,
  citizen_id uuid not null references public.citizens(id) on delete cascade,
  role text not null default 'member' check (role in ('member','admin')),
  joined_at timestamptz not null default now(),
  muted_until timestamptz,
  last_read_at timestamptz,
  primary key (thread_id,citizen_id)
);

create index thread_members_citizen_idx
  on public.thread_members(citizen_id,joined_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.conversation_threads(id) on delete cascade,
  sender_id uuid not null references public.citizens(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  reply_to_id uuid references public.messages(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

create index messages_thread_created_idx on public.messages(thread_id,created_at desc);
create index messages_sender_idx on public.messages(sender_id,created_at desc);

create table public.notifications (
  id bigint generated always as identity primary key,
  citizen_id uuid not null references public.citizens(id) on delete cascade,
  notification_type text not null,
  actor_id uuid references public.citizens(id) on delete set null,
  entity_id uuid references public.world_entities(id) on delete cascade,
  thread_id uuid references public.conversation_threads(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payload)='object'),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_citizen_unread_idx
  on public.notifications(citizen_id,created_at desc)
  where read_at is null;

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.citizens(id) on delete cascade,
  target_citizen_id uuid references public.citizens(id) on delete set null,
  target_entity_id uuid references public.world_entities(id) on delete set null,
  target_message_id uuid references public.messages(id) on delete set null,
  category text not null,
  details text check (char_length(details) <= 4000),
  status text not null default 'submitted'
    check (status in ('submitted','triaged','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    target_citizen_id is not null
    or target_entity_id is not null
    or target_message_id is not null
  )
);

create index reports_reporter_idx on public.reports(reporter_id,created_at desc);
create index reports_status_idx on public.reports(status,created_at);

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  target_citizen_id uuid references public.citizens(id) on delete set null,
  target_entity_id uuid references public.world_entities(id) on delete set null,
  target_message_id uuid references public.messages(id) on delete set null,
  action_type text not null,
  reason text,
  evidence jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.world_audit_events (
  id bigint generated always as identity primary key,
  actor_citizen_id uuid references public.citizens(id) on delete set null,
  event_type text not null,
  entity_id uuid references public.world_entities(id) on delete set null,
  payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payload)='object'),
  created_at timestamptz not null default now()
);

create index world_audit_events_created_idx
  on public.world_audit_events(created_at desc);

-- Generic timestamp maintenance.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger citizens_set_updated_at
before update on public.citizens
for each row execute function private.set_updated_at();

create trigger world_entities_set_updated_at
before update on public.world_entities
for each row execute function private.set_updated_at();

create trigger entity_memberships_set_updated_at
before update on public.entity_memberships
for each row execute function private.set_updated_at();

create trigger yes_no_votes_set_updated_at
before update on public.yes_no_votes
for each row execute function private.set_updated_at();

create trigger netizens_perception_bindings_set_updated_at
before update on public.netizens_perception_bindings
for each row execute function private.set_updated_at();

create trigger conversation_threads_set_updated_at
before update on public.conversation_threads
for each row execute function private.set_updated_at();

create trigger reports_set_updated_at
before update on public.reports
for each row execute function private.set_updated_at();

-- Permanent-auth requirement: anonymous Supabase Auth users do not enter NETIZENS World.
create or replace function private.current_user_is_permanent()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and coalesce((((select auth.jwt())->>'is_anonymous')::boolean),false)=false;
$$;

grant execute on function private.current_user_is_permanent() to authenticated;

create or replace function private.blocked_between(viewer uuid, target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.citizen_blocks b
    where (b.blocker_id=viewer and b.blocked_id=target)
       or (b.blocker_id=target and b.blocked_id=viewer)
  );
$$;

grant execute on function private.blocked_between(uuid,uuid) to authenticated;

create or replace function private.can_view_citizen(target uuid, viewer uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select viewer is not null
    and exists (
      select 1
      from public.citizens c
      where c.id=target
        and (
          c.id=viewer
          or (
            c.status='active'
            and not private.blocked_between(viewer,c.id)
          )
        )
    );
$$;

grant execute on function private.can_view_citizen(uuid,uuid) to authenticated;

create or replace function private.can_view_entity(target_entity uuid, viewer uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select viewer is not null
    and exists (
      select 1
      from public.world_entities e
      where e.id=target_entity
        and not private.blocked_between(viewer,e.creator_id)
        and (
          e.creator_id=viewer
          or e.visibility='public'
          or (
            e.visibility='members'
            and exists (
              select 1 from public.entity_memberships m
              where m.entity_id=e.id and m.citizen_id=viewer
                and m.status in ('active','muted','interested','following')
            )
          )
          or (
            e.visibility='invite'
            and exists (
              select 1 from public.entity_memberships m
              where m.entity_id=e.id and m.citizen_id=viewer
                and m.status in ('invited','active','muted','interested','following')
            )
          )
          or (
            e.visibility='private'
            and exists (
              select 1 from public.entity_memberships m
              where m.entity_id=e.id and m.citizen_id=viewer
                and m.status in ('active','muted')
            )
          )
        )
    );
$$;

grant execute on function private.can_view_entity(uuid,uuid) to authenticated;

create or replace function private.can_manage_entity(target_entity uuid, viewer uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select viewer is not null
    and exists (
      select 1
      from public.world_entities e
      where e.id=target_entity
        and (
          e.creator_id=viewer
          or exists (
            select 1
            from public.entity_memberships m
            where m.entity_id=e.id
              and m.citizen_id=viewer
              and m.status='active'
              and m.role in ('owner','admin','organizer','moderator')
          )
        )
    );
$$;

grant execute on function private.can_manage_entity(uuid,uuid) to authenticated;

create or replace function private.can_self_join_entity(target_entity uuid, desired_status text, viewer uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select viewer is not null
    and exists (
      select 1
      from public.world_entities e
      where e.id=target_entity
        and not private.blocked_between(viewer,e.creator_id)
        and (
          (e.visibility='public' and desired_status in ('active','interested','following','left'))
          or (e.visibility='members' and desired_status in ('requested','active','interested','following','left'))
          or (e.visibility in ('invite','private') and desired_status in ('requested','left'))
        )
    );
$$;

grant execute on function private.can_self_join_entity(uuid,text,uuid) to authenticated;

create or replace function private.is_thread_member(target_thread uuid, viewer uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select viewer is not null and exists (
    select 1
    from public.thread_members tm
    where tm.thread_id=target_thread and tm.citizen_id=viewer
  );
$$;

grant execute on function private.is_thread_member(uuid,uuid) to authenticated;

create or replace function private.can_manage_thread(target_thread uuid, viewer uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select viewer is not null
    and exists (
      select 1
      from public.conversation_threads t
      where t.id=target_thread
        and (
          t.created_by=viewer
          or exists (
            select 1 from public.thread_members tm
            where tm.thread_id=t.id and tm.citizen_id=viewer and tm.role='admin'
          )
        )
    );
$$;

grant execute on function private.can_manage_thread(uuid,uuid) to authenticated;

create or replace function private.can_send_message(target_thread uuid, sender uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select sender is not null
    and private.is_thread_member(target_thread,sender)
    and not exists (
      select 1
      from public.thread_members tm
      where tm.thread_id=target_thread
        and tm.citizen_id<>sender
        and private.blocked_between(sender,tm.citizen_id)
    );
$$;

grant execute on function private.can_send_message(uuid,uuid) to authenticated;

-- One Citizen record per permanent Auth user.
create or replace function public.handle_new_citizen()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(new.is_anonymous,false) then
    return new;
  end if;

  insert into public.citizens (
    id,
    handle,
    display_name,
    citizen_mark_seed
  ) values (
    new.id,
    'citizen-' || replace(new.id::text,'-',''),
    coalesce(nullif(left(new.raw_user_meta_data->>'display_name',40),''),
             'Citizen ' || left(new.id::text,8)),
    replace(new.id::text,'-','')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_citizen() from public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_citizen();

-- Vote-first / reveal-second RPC. Raw vote rows stay private to the voter.
create or replace function public.cast_yes_no_vote(
  p_entity_id uuid,
  p_choice text,
  p_explanation text default null
)
returns table (
  yes_count bigint,
  no_count bigint,
  user_choice text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  viewer uuid := auth.uid();
begin
  if not private.current_user_is_permanent() then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_choice not in ('yes','no') then
    raise exception 'INVALID_CHOICE';
  end if;

  if not exists (
    select 1
    from public.world_entities e
    where e.id=p_entity_id
      and e.place_id='yesno'
      and private.can_view_entity(e.id,viewer)
  ) then
    raise exception 'QUESTION_NOT_AVAILABLE';
  end if;

  insert into public.yes_no_votes(entity_id,citizen_id,choice,explanation)
  values (p_entity_id,viewer,p_choice,left(p_explanation,1000))
  on conflict (entity_id,citizen_id)
  do update set
    choice=excluded.choice,
    explanation=excluded.explanation,
    updated_at=now();

  return query
  select
    count(*) filter (where v.choice='yes')::bigint,
    count(*) filter (where v.choice='no')::bigint,
    p_choice
  from public.yes_no_votes v
  where v.entity_id=p_entity_id;
end;
$$;

revoke all on function public.cast_yes_no_vote(uuid,text,text) from public;
grant execute on function public.cast_yes_no_vote(uuid,text,text) to authenticated;

-- Auditing of World Entity creation and mutation.
create or replace function private.audit_world_entity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target uuid := coalesce(new.id,old.id);
begin
  insert into public.world_audit_events(actor_citizen_id,event_type,entity_id,payload)
  values (
    actor,
    'world_entity_' || lower(tg_op),
    target,
    jsonb_build_object(
      'place_id',coalesce(new.place_id,old.place_id),
      'entity_type',coalesce(new.entity_type,old.entity_type),
      'status',coalesce(new.status,old.status)
    )
  );
  return coalesce(new,old);
end;
$$;

create trigger world_entities_audit_insert
after insert on public.world_entities
for each row execute function private.audit_world_entity();

create trigger world_entities_audit_update
after update on public.world_entities
for each row execute function private.audit_world_entity();

create trigger world_entities_audit_delete
after delete on public.world_entities
for each row execute function private.audit_world_entity();

-- RLS: every client-exposed table is protected.
alter table public.citizens enable row level security;
alter table public.places enable row level security;
alter table public.world_entities enable row level security;
alter table public.entity_memberships enable row level security;
alter table public.entity_links enable row level security;
alter table public.citizen_blocks enable row level security;
alter table public.yes_no_votes enable row level security;
alter table public.artifacts enable row level security;
alter table public.citizen_artifacts enable row level security;
alter table public.reputation_events enable row level security;
alter table public.netizens_access_grants enable row level security;
alter table public.netizens_perception_bindings enable row level security;
alter table public.time_machine_scenarios enable row level security;
alter table public.conversation_threads enable row level security;
alter table public.thread_members enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.world_audit_events enable row level security;

-- Remove anonymous browser access from the World database.
revoke all on table
  public.citizens,
  public.places,
  public.world_entities,
  public.entity_memberships,
  public.entity_links,
  public.citizen_blocks,
  public.yes_no_votes,
  public.artifacts,
  public.citizen_artifacts,
  public.reputation_events,
  public.netizens_access_grants,
  public.netizens_perception_bindings,
  public.time_machine_scenarios,
  public.conversation_threads,
  public.thread_members,
  public.messages,
  public.notifications,
  public.reports,
  public.moderation_actions,
  public.world_audit_events
from anon;

-- Explicit authenticated privileges; RLS remains the final gate.
grant select on public.citizens to authenticated;
grant update (handle,display_name,avatar_form,avatar_mode) on public.citizens to authenticated;
grant select on public.places to authenticated;
grant select,insert,delete on public.world_entities to authenticated;
grant update (title,summary,visibility,status,metadata) on public.world_entities to authenticated;
grant select,insert,delete on public.entity_memberships to authenticated;
grant update (role,status,joined_at) on public.entity_memberships to authenticated;
grant select,insert,delete on public.entity_links to authenticated;
grant select,insert,delete on public.citizen_blocks to authenticated;
grant select on public.yes_no_votes to authenticated;
grant select on public.artifacts to authenticated;
grant select on public.citizen_artifacts to authenticated;
grant select on public.reputation_events to authenticated;
grant select,insert,delete on public.netizens_access_grants to authenticated;
grant update (status,expires_at,revoked_at) on public.netizens_access_grants to authenticated;
grant select on public.netizens_perception_bindings to authenticated;
grant select on public.time_machine_scenarios to authenticated;
grant select on public.conversation_threads to authenticated;
grant select on public.thread_members to authenticated;
grant update (muted_until,last_read_at) on public.thread_members to authenticated;
grant select,insert on public.messages to authenticated;
grant update (body,edited_at,deleted_at) on public.messages to authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant select,insert on public.reports to authenticated;

-- Citizen policies.
create policy citizens_select
on public.citizens for select to authenticated
using (
  private.current_user_is_permanent()
  and private.can_view_citizen(id,(select auth.uid()))
);

create policy citizens_insert_self
on public.citizens for insert to authenticated
with check (
  private.current_user_is_permanent()
  and id=(select auth.uid())
);

create policy citizens_update_self
on public.citizens for update to authenticated
using (
  private.current_user_is_permanent()
  and id=(select auth.uid())
)
with check (
  id=(select auth.uid())
);

-- Places are catalog data for signed-in permanent users.
create policy places_select
on public.places for select to authenticated
using (private.current_user_is_permanent());

-- World Entity policies.
create policy world_entities_select
on public.world_entities for select to authenticated
using (
  private.current_user_is_permanent()
  and private.can_view_entity(id,(select auth.uid()))
);

create policy world_entities_insert
on public.world_entities for insert to authenticated
with check (
  private.current_user_is_permanent()
  and creator_id=(select auth.uid())
);

create policy world_entities_update
on public.world_entities for update to authenticated
using (
  private.current_user_is_permanent()
  and private.can_manage_entity(id,(select auth.uid()))
)
with check (
  private.can_manage_entity(id,(select auth.uid()))
);

create policy world_entities_delete
on public.world_entities for delete to authenticated
using (
  private.current_user_is_permanent()
  and private.can_manage_entity(id,(select auth.uid()))
);

-- Membership policies.
create policy entity_memberships_select
on public.entity_memberships for select to authenticated
using (
  private.current_user_is_permanent()
  and (
    citizen_id=(select auth.uid())
    or private.can_manage_entity(entity_id,(select auth.uid()))
  )
);

create policy entity_memberships_insert
on public.entity_memberships for insert to authenticated
with check (
  private.current_user_is_permanent()
  and (
    (
      citizen_id=(select auth.uid())
      and role='member'
      and private.can_self_join_entity(entity_id,status,(select auth.uid()))
    )
    or private.can_manage_entity(entity_id,(select auth.uid()))
  )
);

create policy entity_memberships_update
on public.entity_memberships for update to authenticated
using (
  private.current_user_is_permanent()
  and (
    citizen_id=(select auth.uid())
    or private.can_manage_entity(entity_id,(select auth.uid()))
  )
)
with check (
  (
    citizen_id=(select auth.uid())
    and role='member'
    and private.can_self_join_entity(entity_id,status,(select auth.uid()))
  )
  or private.can_manage_entity(entity_id,(select auth.uid()))
);

create policy entity_memberships_delete
on public.entity_memberships for delete to authenticated
using (
  private.current_user_is_permanent()
  and (
    citizen_id=(select auth.uid())
    or private.can_manage_entity(entity_id,(select auth.uid()))
  )
);

-- Cross-Place links require visibility to both ends; writes require control of source.
create policy entity_links_select
on public.entity_links for select to authenticated
using (
  private.current_user_is_permanent()
  and private.can_view_entity(from_entity_id,(select auth.uid()))
  and private.can_view_entity(to_entity_id,(select auth.uid()))
);

create policy entity_links_insert
on public.entity_links for insert to authenticated
with check (
  private.current_user_is_permanent()
  and created_by=(select auth.uid())
  and private.can_manage_entity(from_entity_id,(select auth.uid()))
  and private.can_view_entity(to_entity_id,(select auth.uid()))
);

create policy entity_links_delete
on public.entity_links for delete to authenticated
using (
  private.current_user_is_permanent()
  and private.can_manage_entity(from_entity_id,(select auth.uid()))
);

-- Blocking is private and user-controlled.
create policy citizen_blocks_select_self
on public.citizen_blocks for select to authenticated
using (
  private.current_user_is_permanent()
  and blocker_id=(select auth.uid())
);

create policy citizen_blocks_insert_self
on public.citizen_blocks for insert to authenticated
with check (
  private.current_user_is_permanent()
  and blocker_id=(select auth.uid())
);

create policy citizen_blocks_delete_self
on public.citizen_blocks for delete to authenticated
using (
  private.current_user_is_permanent()
  and blocker_id=(select auth.uid())
);

-- Users can only see their own raw vote row. Aggregate results come from the RPC.
create policy yes_no_votes_select_self
on public.yes_no_votes for select to authenticated
using (
  private.current_user_is_permanent()
  and citizen_id=(select auth.uid())
);

create policy artifacts_select
on public.artifacts for select to authenticated
using (private.current_user_is_permanent());

create policy citizen_artifacts_select
on public.citizen_artifacts for select to authenticated
using (
  private.current_user_is_permanent()
  and private.can_view_citizen(citizen_id,(select auth.uid()))
);

create policy reputation_events_select_self
on public.reputation_events for select to authenticated
using (
  private.current_user_is_permanent()
  and citizen_id=(select auth.uid())
);

create policy access_grants_select_self
on public.netizens_access_grants for select to authenticated
using (
  private.current_user_is_permanent()
  and citizen_id=(select auth.uid())
);

create policy access_grants_insert_self
on public.netizens_access_grants for insert to authenticated
with check (
  private.current_user_is_permanent()
  and citizen_id=(select auth.uid())
);

create policy access_grants_update_self
on public.netizens_access_grants for update to authenticated
using (
  private.current_user_is_permanent()
  and citizen_id=(select auth.uid())
)
with check (
  citizen_id=(select auth.uid())
);

create policy access_grants_delete_self
on public.netizens_access_grants for delete to authenticated
using (
  private.current_user_is_permanent()
  and citizen_id=(select auth.uid())
);

-- Perception and Time Machine writes are server-side only.
create policy perception_bindings_select_self
on public.netizens_perception_bindings for select to authenticated
using (
  private.current_user_is_permanent()
  and citizen_id=(select auth.uid())
);

create policy time_machine_scenarios_select_self
on public.time_machine_scenarios for select to authenticated
using (
  private.current_user_is_permanent()
  and citizen_id=(select auth.uid())
);

-- Messaging policies.
create policy conversation_threads_select_member
on public.conversation_threads for select to authenticated
using (
  private.current_user_is_permanent()
  and private.is_thread_member(id,(select auth.uid()))
);

create policy thread_members_select
on public.thread_members for select to authenticated
using (
  private.current_user_is_permanent()
  and (
    citizen_id=(select auth.uid())
    or private.can_manage_thread(thread_id,(select auth.uid()))
  )
);

create policy thread_members_update_self
on public.thread_members for update to authenticated
using (
  private.current_user_is_permanent()
  and citizen_id=(select auth.uid())
)
with check (
  citizen_id=(select auth.uid())
);

create policy messages_select_member
on public.messages for select to authenticated
using (
  private.current_user_is_permanent()
  and private.is_thread_member(thread_id,(select auth.uid()))
);

create policy messages_insert_sender
on public.messages for insert to authenticated
with check (
  private.current_user_is_permanent()
  and sender_id=(select auth.uid())
  and private.can_send_message(thread_id,(select auth.uid()))
);

create policy messages_update_sender
on public.messages for update to authenticated
using (
  private.current_user_is_permanent()
  and sender_id=(select auth.uid())
)
with check (
  sender_id=(select auth.uid())
);

create policy notifications_select_self
on public.notifications for select to authenticated
using (
  private.current_user_is_permanent()
  and citizen_id=(select auth.uid())
);

create policy notifications_update_self
on public.notifications for update to authenticated
using (
  private.current_user_is_permanent()
  and citizen_id=(select auth.uid())
)
with check (
  citizen_id=(select auth.uid())
);

-- Reporting is private to the reporting Citizen; moderation writes are server-side only.
create policy reports_select_self
on public.reports for select to authenticated
using (
  private.current_user_is_permanent()
  and reporter_id=(select auth.uid())
);

create policy reports_insert_self
on public.reports for insert to authenticated
with check (
  private.current_user_is_permanent()
  and reporter_id=(select auth.uid())
);

-- Prevent accidental API exposure of service-only tables.
revoke all on public.moderation_actions from authenticated;
revoke all on public.world_audit_events from authenticated;

comment on table public.netizens_perception_bindings is
  'NETIZENS-side binding only. Canonical objective, route, runtime permission, execution, verification, and learning state remains in Perception.';

comment on table public.time_machine_scenarios is
  'Scenario snapshots only. Time Machine content is explicitly scenario-not-prediction and must never mutate present-day World state.';
