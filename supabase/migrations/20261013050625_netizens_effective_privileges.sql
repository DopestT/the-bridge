-- Correct effective client privileges on the dedicated NETIZENS database only.
-- Additive: do not rewrite installed migrations. Confirm project mapping first.
-- Supabase default ACLs can grant more than a later column GRANT permits.
-- Reset both table and column ACLs before restoring the intended allowlist.
DO $$
DECLARE
  target text;
  columns_sql text;
BEGIN
  FOREACH target IN ARRAY ARRAY[
    'citizens',
    'places',
    'world_entities',
    'entity_memberships',
    'entity_links',
    'citizen_blocks',
    'yes_no_votes',
    'artifacts',
    'citizen_artifacts',
    'reputation_events',
    'netizens_access_grants',
    'netizens_perception_bindings',
    'time_machine_scenarios',
    'conversation_threads',
    'thread_members',
    'messages',
    'notifications',
    'reports',
    'moderation_actions',
    'world_audit_events',
    'entity_discussion_items'
  ] LOOP
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC, anon, authenticated', target);
    SELECT string_agg(quote_ident(attname), ', ' ORDER BY attnum)
      INTO columns_sql FROM pg_attribute
      WHERE attrelid=format('public.%I',target)::regclass
        AND attnum>0 AND NOT attisdropped;
    EXECUTE format('REVOKE ALL PRIVILEGES (%s) ON TABLE public.%I FROM PUBLIC, anon, authenticated', columns_sql, target);
  END LOOP;
END;
$$;

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


grant select,insert on public.entity_discussion_items to authenticated;
grant update (body,edited_at,deleted_at) on public.entity_discussion_items to authenticated;

-- PUBLIC revocation alone does not remove direct Supabase default role grants.
revoke all on function public.cast_yes_no_vote(uuid,text,text) from public,anon,authenticated;
grant execute on function public.cast_yes_no_vote(uuid,text,text) to authenticated;
revoke all on function public.handle_new_citizen() from public,anon,authenticated;

-- Trigger helpers are not client entry points. Policy helpers remain callable
-- by authenticated policy evaluation, in the non-exposed private schema.
revoke all on function private.set_updated_at() from public,anon,authenticated;
revoke all on function private.audit_world_entity() from public,anon,authenticated;
revoke all on function private.current_user_is_permanent() from public,anon,authenticated;
grant execute on function private.current_user_is_permanent() to authenticated;
revoke all on function private.blocked_between(uuid,uuid) from public,anon,authenticated;
grant execute on function private.blocked_between(uuid,uuid) to authenticated;
revoke all on function private.can_view_citizen(uuid,uuid) from public,anon,authenticated;
grant execute on function private.can_view_citizen(uuid,uuid) to authenticated;
revoke all on function private.can_view_entity(uuid,uuid) from public,anon,authenticated;
grant execute on function private.can_view_entity(uuid,uuid) to authenticated;
revoke all on function private.can_manage_entity(uuid,uuid) from public,anon,authenticated;
grant execute on function private.can_manage_entity(uuid,uuid) to authenticated;
revoke all on function private.can_self_join_entity(uuid,text,uuid) from public,anon,authenticated;
grant execute on function private.can_self_join_entity(uuid,text,uuid) to authenticated;
revoke all on function private.is_thread_member(uuid,uuid) from public,anon,authenticated;
grant execute on function private.is_thread_member(uuid,uuid) to authenticated;
revoke all on function private.can_manage_thread(uuid,uuid) from public,anon,authenticated;
grant execute on function private.can_manage_thread(uuid,uuid) to authenticated;
revoke all on function private.can_send_message(uuid,uuid) from public,anon,authenticated;
grant execute on function private.can_send_message(uuid,uuid) to authenticated;
revoke all on function private.valid_discussion_parent(uuid,uuid) from public,anon,authenticated;
grant execute on function private.valid_discussion_parent(uuid,uuid) to authenticated;

-- service_role privileges, RLS policies, data and schema-wide default ACLs are
-- intentionally unchanged. Future migrations must explicitly reset client ACLs
-- before granting their allowlist; do not assume platform defaults are narrow.
