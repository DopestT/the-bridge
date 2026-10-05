-- NETIZENS production participation layer.
-- Additive migration for the dedicated NETIZENS Supabase project only.
-- Do not apply to the Perception database.

-- Provenance distinguishes genuine user participation from service-controlled
-- seeded/demo state. Existing memberships become genuine by default without
-- changing their identity key or status semantics.
alter table public.entity_memberships add column provenance text not null default 'genuine'
  check (provenance in ('genuine','seeded','demo'));

-- Existing membership policies remain the positive authorization rules.
-- These restrictive policies add the provenance boundary so browser clients
-- cannot create or mutate service-controlled seeded/demo membership state.
create policy "authenticated genuine membership insert"
on public.entity_memberships
as restrictive
for insert
to authenticated
with check (
  provenance='genuine'
);

create policy "authenticated genuine membership update"
on public.entity_memberships
as restrictive
for update
to authenticated
using (
  provenance='genuine'
)
with check (
  provenance='genuine'
);

create policy "authenticated genuine membership delete"
on public.entity_memberships
as restrictive
for delete
to authenticated
using (
  provenance='genuine'
);

create table public.entity_discussion_items (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.world_entities(id) on delete cascade,
  author_id uuid not null references public.citizens(id) on delete cascade,
  parent_id uuid references public.entity_discussion_items(id) on delete set null,
  body text not null check (char_length(body) between 1 and 5000),
  provenance text not null default 'genuine'
    check (provenance in ('genuine','seeded','demo')),
  moderation_state text not null default 'visible'
    check (moderation_state in ('visible','hidden','removed')),
  client_mutation_id uuid not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  unique (author_id,client_mutation_id)
);

-- Mobile/app critical-path indexes: entity discussion loads by entity/time and
-- reply traversal by parent without requiring AI or a broad World scan.
create index entity_discussion_items_entity_created_idx
  on public.entity_discussion_items(entity_id,created_at,id);
create index entity_discussion_items_parent_idx
  on public.entity_discussion_items(parent_id,created_at,id)
  where parent_id is not null;
create index entity_discussion_items_author_idx
  on public.entity_discussion_items(author_id,created_at desc);

alter table public.entity_discussion_items enable row level security;

-- Opt in explicitly to the Data API surface. RLS is the row gate; grants are
-- the object/column gate. No anonymous World participation.
revoke all on public.entity_discussion_items from public,anon,authenticated;
revoke all on public.entity_discussion_items from anon;
grant select,insert on public.entity_discussion_items to authenticated;
grant update (body,edited_at,deleted_at) on public.entity_discussion_items to authenticated;
grant all on public.entity_discussion_items to service_role;

-- Public/entity discussion is intentionally separate from Circle/private
-- messaging. Visible rows must inherit the canonical entity visibility rule and
-- independently suppress blocked authors. Hidden rows remain addressable so a
-- client can render a safe moderated-parent placeholder while preserving reply
-- structure; removed rows are not exposed to ordinary clients.
create policy "authenticated discussion select"
on public.entity_discussion_items
for select
to authenticated
using (
  private.current_user_is_permanent()
  and private.can_view_entity(entity_id,(select auth.uid()))
  and not private.blocked_between((select auth.uid()),author_id)
  and moderation_state<>'removed'
  and exists (
    select 1
    from public.world_entities e
    where e.id=entity_id
      and e.place_id<>'circles'
  )
);

-- Browser/mobile clients may create only their own genuine discussion rows.
-- Seeded/demo material and moderation are service-controlled. Circle content is
-- never routed through this public discussion table.
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
  and (
    parent_id is null
    or exists (
      select 1
      from public.entity_discussion_items p
      where p.id=parent_id
        and p.entity_id=entity_id
        and p.moderation_state<>'removed'
    )
  )
);

-- Authors can edit/soft-delete only their own genuine rows. Column grants above
-- deliberately exclude identity, provenance, entity, parent, mutation ID, and
-- moderation state, so this policy cannot be used to elevate moderation.
create policy "authenticated discussion update own"
on public.entity_discussion_items
for update
to authenticated
using (
  private.current_user_is_permanent()
  and author_id=(select auth.uid())
  and provenance='genuine'
  and private.can_view_entity(entity_id,(select auth.uid()))
)
with check (
  author_id=(select auth.uid())
  and provenance='genuine'
  and private.can_view_entity(entity_id,(select auth.uid()))
);

comment on table public.entity_discussion_items is
  'Public/entity-bound NETIZENS discussion. Private Circle/direct conversation remains in conversation_threads/messages.';
comment on column public.entity_discussion_items.client_mutation_id is
  'Client-generated UUID used with author_id to reject duplicate optimistic/retried writes.';
comment on column public.entity_discussion_items.provenance is
  'genuine=user participation; seeded/demo=service-controlled non-genuine activity.';
