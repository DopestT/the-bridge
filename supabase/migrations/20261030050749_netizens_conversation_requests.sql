-- Dedicated NETIZENS only. Invitations carry no private message body.
create table public.conversation_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.citizens(id) on delete cascade,
  recipient_id uuid not null references public.citizens(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled','expired')),
  thread_id uuid references public.conversation_threads(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now()+interval '7 days',
  check (requester_id<>recipient_id),
  check (expires_at>created_at),
  check ((status='accepted')=(thread_id is not null))
);
create unique index conversation_requests_pending_pair on public.conversation_requests
  (least(requester_id,recipient_id),greatest(requester_id,recipient_id)) where status='pending';
create index conversation_requests_sender_recent on public.conversation_requests(requester_id,created_at desc);
create index conversation_requests_recipient_recent on public.conversation_requests(recipient_id,status,created_at desc);
alter table public.conversation_requests enable row level security;
revoke all on public.conversation_requests from public,anon,authenticated;
grant select on public.conversation_requests to authenticated;
grant all on public.conversation_requests to service_role;
create policy conversation_requests_participant_read on public.conversation_requests for select to authenticated using (
  private.current_user_is_permanent()
  and ((select auth.uid())=requester_id or (select auth.uid())=recipient_id)
  and not private.blocked_between(requester_id,recipient_id)
);

create function public.request_conversation(p_recipient_handle text)
returns table(request_id uuid,status text,thread_id uuid)
language plpgsql security definer set search_path='' as $$
declare
  actor uuid := (select auth.uid());
  target uuid;
  existing_thread uuid;
  invitation public.conversation_requests%rowtype;
  normalized text := lower(btrim(p_recipient_handle));
begin
  if not private.current_user_is_permanent() or not exists (
    select 1 from public.citizens c where c.id=actor and c.onboarding_completed_at is not null
  ) then raise exception 'Conversation request unavailable' using errcode='42501'; end if;
  if normalized is null or normalized !~ '^[a-z0-9][a-z0-9_-]{2,39}$' then
    raise exception 'Enter an exact Citizen handle' using errcode='22023';
  end if;
  select c.id into target from public.citizens c join auth.users u on u.id=c.id
    where c.handle=normalized and c.status='active' and c.onboarding_completed_at is not null
      and coalesce(u.is_anonymous,false)=false;
  if target is null or target=actor or private.blocked_between(actor,target) then
    raise exception 'Conversation request unavailable' using errcode='42501';
  end if;
  -- Serialize each sender's quota and retries, including different recipients.
  perform pg_advisory_xact_lock(hashtextextended(actor::text,17));
  select t.id into existing_thread from public.conversation_threads t
    join public.thread_members mine on mine.thread_id=t.id and mine.citizen_id=actor
    where t.kind='direct'
      and exists(select 1 from public.thread_members other where other.thread_id=t.id and other.citizen_id=target)
      and (select count(*) from public.thread_members members where members.thread_id=t.id)=2
    order by t.created_at,t.id limit 1;
  if existing_thread is not null then return query select null::uuid,'accepted'::text,existing_thread; return; end if;
  update public.conversation_requests q set status='expired',updated_at=now()
    where q.status='pending' and q.expires_at<=now()
      and least(q.requester_id,q.recipient_id)=least(actor,target)
      and greatest(q.requester_id,q.recipient_id)=greatest(actor,target);
  select q.* into invitation from public.conversation_requests q where q.status='pending'
    and least(q.requester_id,q.recipient_id)=least(actor,target)
    and greatest(q.requester_id,q.recipient_id)=greatest(actor,target);
  if found then return query select invitation.id,invitation.status,invitation.thread_id; return; end if;
  if exists(select 1 from public.conversation_requests q where q.requester_id=actor and q.recipient_id=target
    and q.status='declined' and q.updated_at>now()-interval '30 days') then
    raise exception 'Conversation request unavailable' using errcode='42501';
  end if;
  if (select count(*) from public.conversation_requests q where q.requester_id=actor and q.created_at>now()-interval '1 hour')>=5 then
    raise sqlstate 'PT429' using message='Conversation request limit reached; try later';
  end if;
  insert into public.conversation_requests(requester_id,recipient_id) values(actor,target)
    on conflict do nothing returning * into invitation;
  if not found then
    -- A reciprocal request may have won the unique pair constraint.
    select q.* into invitation from public.conversation_requests q where q.status='pending'
      and least(q.requester_id,q.recipient_id)=least(actor,target)
      and greatest(q.requester_id,q.recipient_id)=greatest(actor,target);
    if not found then raise exception 'Retry conversation request' using errcode='40001'; end if;
  else
    insert into public.notifications(citizen_id,notification_type,actor_id,payload)
      values(target,'conversation_request',actor,jsonb_build_object('request_id',invitation.id));
  end if;
  return query select invitation.id,invitation.status,invitation.thread_id;
end $$;
revoke all on function public.request_conversation(text) from public,anon,authenticated;
grant execute on function public.request_conversation(text) to authenticated;

create function public.respond_conversation_request(p_request_id uuid,p_action text)
returns table(request_id uuid,status text,thread_id uuid)
language plpgsql security definer set search_path='' as $$
declare
  actor uuid := (select auth.uid());
  invitation public.conversation_requests%rowtype;
  direct_thread uuid;
  title_value text;
  desired_status text;
begin
  if not private.current_user_is_permanent() or not exists (
    select 1 from public.citizens c where c.id=actor and c.onboarding_completed_at is not null
  ) then raise exception 'Conversation request unavailable' using errcode='42501'; end if;
  if p_action is null or p_action not in ('accept','decline','cancel') then
    raise exception 'Invalid conversation action' using errcode='22023';
  end if;
  select q.* into invitation from public.conversation_requests q where q.id=p_request_id for update;
  if not found or (p_action='cancel' and invitation.requester_id<>actor)
    or (p_action in ('accept','decline') and invitation.recipient_id<>actor) then
    raise exception 'Conversation request unavailable' using errcode='42501';
  end if;
  -- Withdrawal and refusal remain available if the other account is restricted.
  if p_action='accept' and (private.blocked_between(invitation.requester_id,invitation.recipient_id)
    or (select count(*) from public.citizens c join auth.users u on u.id=c.id
      where c.id in (invitation.requester_id,invitation.recipient_id) and c.status='active'
        and c.onboarding_completed_at is not null and coalesce(u.is_anonymous,false)=false)<>2) then
    raise exception 'Conversation request unavailable' using errcode='42501';
  end if;
  desired_status:=case p_action when 'accept' then 'accepted' when 'decline' then 'declined' else 'cancelled' end;
  if invitation.status=desired_status then
    return query select invitation.id,invitation.status,invitation.thread_id; return;
  end if;
  if invitation.status<>'pending' or invitation.expires_at<=now() then
    raise exception 'This invitation is no longer pending' using errcode='22023';
  end if;
  if p_action='accept' then
    select t.id into direct_thread from public.conversation_threads t
      where t.kind='direct'
        and exists(select 1 from public.thread_members m where m.thread_id=t.id and m.citizen_id=invitation.requester_id)
        and exists(select 1 from public.thread_members m where m.thread_id=t.id and m.citizen_id=invitation.recipient_id)
        and (select count(*) from public.thread_members m where m.thread_id=t.id)=2
      order by t.created_at,t.id limit 1;
    if direct_thread is null then
      select '@'||sender.handle||' · @'||recipient.handle into title_value
        from public.citizens sender,public.citizens recipient
        where sender.id=invitation.requester_id and recipient.id=invitation.recipient_id;
      insert into public.conversation_threads(kind,created_by,title)
        values('direct',invitation.requester_id,title_value) returning id into direct_thread;
      insert into public.thread_members(thread_id,citizen_id) values
        (direct_thread,invitation.requester_id),(direct_thread,invitation.recipient_id);
    end if;
    update public.conversation_requests q set status='accepted',thread_id=direct_thread,updated_at=now()
      where q.id=invitation.id returning q.* into invitation;
    insert into public.notifications(citizen_id,notification_type,actor_id,thread_id)
      values(invitation.requester_id,'conversation_request_accepted',actor,direct_thread);
  else
    update public.conversation_requests q set status=desired_status,updated_at=now()
      where q.id=invitation.id returning q.* into invitation;
  end if;
  return query select invitation.id,invitation.status,invitation.thread_id;
end $$;
revoke all on function public.respond_conversation_request(uuid,text) from public,anon,authenticated;
grant execute on function public.respond_conversation_request(uuid,text) to authenticated;
