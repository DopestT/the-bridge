-- Cascading erasure must not insert foreign keys to identities/entities just removed.
-- Deletion audit events retain only non-identifying structural fields.
create or replace function private.audit_world_entity()
returns trigger language plpgsql security definer set search_path='' as $$
declare
  actor uuid;
  target uuid;
begin
  select c.id into actor from public.citizens c where c.id=(select auth.uid());
  target:=case when tg_op='DELETE' then null else new.id end;
  insert into public.world_audit_events(actor_citizen_id,event_type,entity_id,payload)
  values(actor,'world_entity_'||lower(tg_op),target,jsonb_build_object(
    'place_id',coalesce(new.place_id,old.place_id),
    'entity_type',coalesce(new.entity_type,old.entity_type),
    'status',coalesce(new.status,old.status)));
  return coalesce(new,old);
end $$;

-- A report must not become an invalid targetless row when its target is erased.
alter table public.reports drop constraint reports_target_citizen_id_fkey;
alter table public.reports add constraint reports_target_citizen_id_fkey
  foreign key(target_citizen_id) references public.citizens(id) on delete cascade;
alter table public.reports drop constraint reports_target_entity_id_fkey;
alter table public.reports add constraint reports_target_entity_id_fkey
  foreign key(target_entity_id) references public.world_entities(id) on delete cascade;
alter table public.reports drop constraint reports_target_message_id_fkey;
alter table public.reports add constraint reports_target_message_id_fkey
  foreign key(target_message_id) references public.messages(id) on delete cascade;

-- Evidence follows the actual FK cascade, including concurrent writes.
alter table public.moderation_actions drop constraint moderation_actions_target_citizen_id_fkey;
alter table public.moderation_actions add constraint moderation_actions_target_citizen_id_fkey
  foreign key(target_citizen_id) references public.citizens(id) on delete cascade;
alter table public.moderation_actions drop constraint moderation_actions_target_entity_id_fkey;
alter table public.moderation_actions add constraint moderation_actions_target_entity_id_fkey
  foreign key(target_entity_id) references public.world_entities(id) on delete cascade;
alter table public.moderation_actions drop constraint moderation_actions_target_message_id_fkey;
alter table public.moderation_actions add constraint moderation_actions_target_message_id_fkey
  foreign key(target_message_id) references public.messages(id) on delete cascade;
alter table public.world_audit_events drop constraint world_audit_events_actor_citizen_id_fkey;
alter table public.world_audit_events add constraint world_audit_events_actor_citizen_id_fkey
  foreign key(actor_citizen_id) references public.citizens(id) on delete cascade;
alter table public.world_audit_events drop constraint world_audit_events_entity_id_fkey;
alter table public.world_audit_events add constraint world_audit_events_entity_id_fkey
  foreign key(entity_id) references public.world_entities(id) on delete cascade;
alter table public.notifications drop constraint notifications_actor_id_fkey;
alter table public.notifications add constraint notifications_actor_id_fkey
  foreign key(actor_id) references public.citizens(id) on delete cascade;

create function public.delete_own_account(p_confirmation text)
returns boolean language plpgsql security definer set search_path='' as $$
declare
  actor uuid := (select auth.uid());
  claims jsonb := (select auth.jwt());
begin
  if p_confirmation is distinct from 'DELETE' then
    raise exception 'Confirm permanent account deletion' using errcode='22023';
  end if;
  -- A refreshed JWT is not proof that the password was recently entered.
  if actor is null or not exists(select 1 from auth.sessions s
      where s.user_id=actor and s.id::text=claims->>'session_id')
    or not exists(select 1 from jsonb_array_elements(case when jsonb_typeof(claims->'amr')='array'
        then claims->'amr' else '[]'::jsonb end) proof
      where proof->>'method'='password' and case when proof->>'timestamp' ~ '^[0-9]{1,12}$'
        then (proof->>'timestamp')::numeric between extract(epoch from now())-300 and extract(epoch from now())+30
        else false end) then
    raise exception 'Sign in with your password again before deleting this account' using errcode='42501';
  end if;
  perform 1 from auth.users u where u.id=actor and coalesce(u.is_anonymous,false)=false for update;
  if not found then raise exception 'Account deletion unavailable' using errcode='42501'; end if;

  -- Existing ownership FKs remove profile, spaces, conversations, posts, messages,
  -- memberships, invitations and Auth sessions in this same transaction.
  delete from auth.users where id=actor;
  return true;
end $$;
revoke all on function public.delete_own_account(text) from public,anon,authenticated;
grant execute on function public.delete_own_account(text) to authenticated;
