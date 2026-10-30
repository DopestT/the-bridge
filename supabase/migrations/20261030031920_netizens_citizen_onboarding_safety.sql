-- Dedicated NETIZENS project only. Existing migrations remain immutable.
alter table public.citizens add column onboarding_completed_at timestamptz;
revoke update (onboarding_completed_at) on public.citizens from public, anon, authenticated;
-- Direct allowed-column updates must obey the same identity boundaries as the
-- completion RPC. The original trigger's generated handle uses 40 characters.
alter table public.citizens add constraint citizens_handle_format
  check (handle ~ '^[a-z0-9][a-z0-9_-]{2,39}$');
alter table public.citizens add constraint citizens_display_name_length
  check (char_length(btrim(display_name)) between 1 and 60);
alter table public.citizens add constraint citizens_avatar_mode_place
  foreign key (avatar_mode) references public.places(id);

-- Consult current server records as well as the signed JWT. Account restrictions
-- take effect without waiting for a previously issued token to expire.
create or replace function private.current_user_is_permanent()
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null
    and coalesce((((select auth.jwt())->>'is_anonymous')::boolean),false)=false
    and exists (select 1 from auth.users u join public.citizens c on c.id=u.id
      where u.id=(select auth.uid()) and coalesce(u.is_anonymous,false)=false and c.status='active');
$$;
revoke all on function private.current_user_is_permanent() from public,anon,authenticated;
grant execute on function private.current_user_is_permanent() to authenticated;

-- A permanent Auth identity can initialize only its own profile. No caller can
-- submit an ID, status, reputation, level, seed or completion timestamp.
create function public.complete_citizen_profile(
  p_handle text, p_display_name text, p_avatar_form text, p_avatar_mode text
)
returns table (
  id uuid, handle text, display_name text, avatar_form text, avatar_mode text,
  status text, citizen_mark_seed text, xp integer, level integer,
  onboarding_completed_at timestamptz
)
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  normalized_handle text := lower(btrim(p_handle));
  normalized_name text := btrim(p_display_name);
begin
  if actor is null or coalesce((((select auth.jwt())->>'is_anonymous')::boolean),false)
    or not exists (select 1 from auth.users u where u.id=actor and coalesce(u.is_anonymous,false)=false) then
    raise exception 'A permanent account is required' using errcode='42501';
  end if;
  if normalized_handle is null or normalized_handle !~ '^[a-z0-9][a-z0-9_-]{2,29}$'
    or normalized_name is null or char_length(normalized_name) not between 1 and 60
    or p_avatar_form is null or p_avatar_form not in ('likeness','stylized','fictional','privacy')
    or p_avatar_mode is null or not exists (select 1 from public.places p where p.id=p_avatar_mode) then
    raise exception 'Invalid Citizen profile' using errcode='22023';
  end if;
  if exists (select 1 from public.citizens c where c.id=actor and c.status<>'active') then
    raise exception 'This account cannot complete its profile' using errcode='42501';
  end if;
  return query
    insert into public.citizens as c (id,handle,display_name,avatar_form,avatar_mode,citizen_mark_seed,onboarding_completed_at)
    values (actor,normalized_handle,normalized_name,p_avatar_form,p_avatar_mode,replace(actor::text,'-',''),now())
    on conflict on constraint citizens_pkey do update
      set handle=excluded.handle, display_name=excluded.display_name,
          avatar_form=excluded.avatar_form, avatar_mode=excluded.avatar_mode,
          onboarding_completed_at=coalesce(c.onboarding_completed_at,now())
      where c.status='active'
    returning c.id,c.handle,c.display_name,c.avatar_form,c.avatar_mode,c.status,c.citizen_mark_seed,c.xp,c.level,c.onboarding_completed_at;
  if not found then
    raise exception 'This account cannot complete its profile' using errcode='42501';
  end if;
end;
$$;
revoke all on function public.complete_citizen_profile(text,text,text,text) from public,anon,authenticated;
grant execute on function public.complete_citizen_profile(text,text,text,text) to authenticated;

drop policy messages_select_member on public.messages;
create policy messages_select_member on public.messages for select to authenticated using (
  private.current_user_is_permanent()
  and private.is_thread_member(thread_id,(select auth.uid()))
  and not private.blocked_between((select auth.uid()),sender_id)
);
drop policy messages_update_sender on public.messages;
create policy messages_update_sender on public.messages for update to authenticated using (
  private.current_user_is_permanent() and sender_id=(select auth.uid())
  and private.can_send_message(thread_id,(select auth.uid()))
) with check (
  private.current_user_is_permanent() and sender_id=(select auth.uid())
  and private.can_send_message(thread_id,(select auth.uid()))
);
