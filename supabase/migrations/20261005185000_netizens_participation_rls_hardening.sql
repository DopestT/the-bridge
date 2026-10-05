-- NETIZENS participation RLS hardening.
-- Additive correction for the dedicated NETIZENS Supabase project only.
-- Safe to apply after 20261005010500_netizens_participation_layer.sql.
-- Do not apply to the Perception database.

-- Parent validation must not self-query an RLS-protected table from that
-- table's own INSERT policy. A SECURITY DEFINER helper performs the bounded
-- lookup without re-entering entity_discussion_items RLS.
create or replace function private.valid_discussion_parent(
  target_parent uuid,
  target_entity uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_parent is null
    or exists (
      select 1
      from public.entity_discussion_items p
      where p.id=target_parent
        and p.entity_id=target_entity
        and p.moderation_state='visible'
        and p.deleted_at is null
        and not private.blocked_between((select auth.uid()),p.author_id)
    );
$$;

revoke all on function private.valid_discussion_parent(uuid,uuid) from public;
grant execute on function private.valid_discussion_parent(uuid,uuid) to authenticated;

-- Ordinary clients receive only currently visible, non-deleted discussion
-- bodies. Replies may reference a parent that is no longer returned; the app
-- contract already renders missing/moderated parents safely.
drop policy if exists "authenticated discussion select"
  on public.entity_discussion_items;

create policy "authenticated discussion select"
on public.entity_discussion_items
for select
to authenticated
using (
  private.current_user_is_permanent()
  and private.can_view_entity(entity_id,(select auth.uid()))
  and not private.blocked_between((select auth.uid()),author_id)
  and moderation_state='visible'
  and deleted_at is null
  and exists (
    select 1
    from public.world_entities e
    where e.id=entity_id
      and e.place_id<>'circles'
  )
);

-- Replace the recursive parent subquery with the private bounded helper.
drop policy if exists "authenticated genuine discussion insert"
  on public.entity_discussion_items;

create policy "authenticated genuine discussion insert"
on public.entity_discussion_items
for insert
to authenticated
with check (
  private.current_user_is_permanent()
  and author_id=(select auth.uid())
  and provenance='genuine'
  and moderation_state='visible'
  and deleted_at is null
  and private.can_view_entity(entity_id,(select auth.uid()))
  and exists (
    select 1
    from public.world_entities e
    where e.id=entity_id
      and e.place_id<>'circles'
  )
  and private.valid_discussion_parent(parent_id,entity_id)
);

comment on function private.valid_discussion_parent(uuid,uuid) is
  'RLS-safe reply parent validation for NETIZENS entity discussion; rejects missing, cross-entity, moderated, deleted, or blocked parents.';
