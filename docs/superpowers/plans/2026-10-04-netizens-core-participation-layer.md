# NETIZENS Core Participation Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the shared non-College participation layer that every NETIZENS Place can reuse: discussion/replies, provenance-aware membership activity, notifications, moderation hooks, and local-first/server-ready mutation contracts.

**Architecture:** Extend the existing World V3 social state instead of creating a second model. Local-first behavior remains immediately usable through `NetizensStore`/`NetizensData`, while a new additive Supabase migration introduces the matching production discussion/provenance contract behind RLS. College Groups remain ordinary Crews entities and inherit shared contracts without College-specific code changes or any Perception dependency.

**Tech Stack:** Browser JavaScript, localStorage local-first state, Node-based QA scripts, PostgreSQL/Supabase RLS, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-04-netizens-core-world-completion-design.md`

## Global Constraints

- College remains inside `NETIZENS → Crews → College Groups`; this plan must not add a College top-level place.
- NETIZENS owns canonical social state; Perception remains optional and receives only bounded context.
- No second social-state model.
- Public discussion and private messaging remain separate concerns.
- Unsolicited direct conversational access is not granted merely because a Citizen or public entity is viewable.
- Seeded/demo activity must be distinguishable from genuine activity and must not inflate genuine participation/reputation.
- All server writes require authenticated identity, RLS, and bounded mutation contracts.
- Existing World V3 entity IDs and College pilot entities must migrate without destructive reset.
- Only verified Perception outcomes may be shown as completed; this slice does not grant new Perception execution authority.

## Review Focus

- A blocked Citizen must not become visible again through a public discussion item or notification actor reference.
- Replies whose parent was moderated/deleted must remain structurally safe and must not crash entity discussion rendering.
- Replaying a queued local-first mutation after a transient transport failure must not create a second logical discussion item.
- Seeded/demo posts, memberships, or activity events must never award reputation or count as genuine participation.
- College Group entities must continue to use the generic membership/discussion path without importing College-specific behavior into Core.

---

### Task 1: Extend World state with reusable participation primitives

**Files:**
- Modify: `prototype/netizens-world/world-state.js`
- Modify: `prototype/netizens-world/backend/world-state.schema.json`
- Test: `prototype/netizens-world/qa.mjs`

**Interfaces:**
- Consumes: existing `createEntity`, `getEntity`, `setEntityMembership`, `getEntityMembership`, Citizen state, entity visibility/status.
- Produces: `createDiscussionItem(input)`, `listDiscussion(entityId)`, `markDiscussionItemModerated(id,state)`, `listNotifications()`, `markNotificationRead(id)`, and provenance-aware membership/activity records.

- [ ] **Step 1: Write failing World QA for state migration and participation primitives**

Add assertions that a legacy V3 state loads without losing Citizens/entities/College pilot data, that a root post and reply can be created for an existing entity, and that `listDiscussion(entityId)` returns parent-before-reply order.

- [ ] **Step 2: Run World QA and verify RED**

Run: `node prototype/netizens-world/qa.mjs`

Expected: FAIL because discussion/provenance/notification APIs and the new state contract do not exist yet.

- [ ] **Step 3: Add the minimal state model and API**

In `world-state.js`, evolve the persisted state additively to the next schema version while preserving V3 data. Add discussion items with stable IDs, `entityId`, `authorId`, optional `parentId`, body, `provenance` (`genuine|seeded|demo`), moderation state, and timestamps. Add local notification records with stable IDs, owner, actor/entity references, payload, read state, and timestamps.

Exact public signatures:

```js
createDiscussionItem({entityId, body, parentId=null, provenance="genuine"})
listDiscussion(entityId)
markDiscussionItemModerated(id, state)
listNotifications()
markNotificationRead(id)
setEntityMembership(entityId, status, role, provenance="genuine")
```

Genuine activity may feed contribution/reputation logic; seeded/demo activity must not.

- [ ] **Step 4: Update the JSON state schema**

Document the new discussion, notification, and provenance fields while preserving all existing V3 entity graph fields.

- [ ] **Step 5: Add Review Focus tests owned by local state**

Test parent-moderated replies, seeded/demo non-counting, and College Group membership/discussion using the same generic APIs.

- [ ] **Step 6: Run QA and verify GREEN**

Run: `node prototype/netizens-world/qa.mjs`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add prototype/netizens-world/world-state.js prototype/netizens-world/backend/world-state.schema.json prototype/netizens-world/qa.mjs
git commit -m "feat: add NETIZENS participation state"
```

### Task 2: Extend the local-first mutation adapter with idempotent participation operations

**Files:**
- Modify: `prototype/netizens-world/data-adapter.js`
- Test: `prototype/netizens-world/qa.mjs`

**Interfaces:**
- Consumes: Task 1 participation APIs and existing queue item `id` generated by the adapter.
- Produces: mutation kinds `discussion.create`, `discussion.moderate`, `notification.read`, and provenance-aware `entity.membership`; transport payloads carry `mutationId` equal to the queue operation ID.

- [ ] **Step 1: Write failing adapter QA**

Assert that discussion creation queues one operation, retry preserves the same queue operation ID, a failed transport leaves it pending, and a later successful flush removes it without generating a replacement ID.

- [ ] **Step 2: Run World QA and verify RED**

Run: `node prototype/netizens-world/qa.mjs`

Expected: FAIL because the participation adapter methods do not exist and transport does not expose an explicit idempotency key.

- [ ] **Step 3: Implement adapter methods**

Add:

```js
createDiscussionItem(input)
markDiscussionItemModerated(id, state)
listDiscussion(entityId)
listNotifications()
markNotificationRead(id)
setEntityMembership(entityId, status, role, provenance="genuine")
```

When sending queued operations to `transport`, include `mutationId: op.id` in the cloned operation contract. Do not create a new queue ID on retry.

- [ ] **Step 4: Add replay/idempotency QA**

Cover transient failure → retry → success and verify one logical operation ID survives the full cycle.

- [ ] **Step 5: Run QA and verify GREEN**

Run: `node prototype/netizens-world/qa.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add prototype/netizens-world/data-adapter.js prototype/netizens-world/qa.mjs
git commit -m "feat: queue participation mutations safely"
```

### Task 3: Add the production Supabase participation contract

**Files:**
- Create: `supabase/migrations/20261005010500_netizens_participation_layer.sql`
- Modify: `prototype/netizens-world/backend/production-contract-qa.mjs`
- Modify: `prototype/netizens-world/backend/API_CONTRACT.md`
- Test: `prototype/netizens-world/backend/production-contract-qa.mjs`

**Interfaces:**
- Consumes: existing `citizens`, `world_entities`, `entity_memberships`, `notifications`, `citizen_blocks`, `reports`, `moderation_actions`, and private access helper functions from the foundation migration.
- Produces: `entity_discussion_items` plus additive provenance fields/constraints required to distinguish `genuine|seeded|demo`; RLS-select/insert/update rules; indexes for entity/time and reply traversal; server contract for idempotent client mutation IDs.

- [ ] **Step 1: Write failing production-contract QA**

Require the new discussion table, parent relation, provenance constraint, client mutation ID uniqueness, RLS, block-aware visibility, and authenticated-author insert boundary.

- [ ] **Step 2: Run production contract QA and verify RED**

Run: `node prototype/netizens-world/backend/production-contract-qa.mjs`

Expected: FAIL because the additive participation migration is absent.

- [ ] **Step 3: Write the additive migration**

Create `public.entity_discussion_items` with UUID primary key, entity/author foreign keys, optional self-referencing `parent_id`, bounded body, `provenance`, moderation state, client mutation UUID, created/edited/deleted timestamps, and indexes. Add provenance to membership data only through an additive column/constraint; do not rewrite existing membership identity keys.

RLS requirements:
- permanent authenticated Citizens only;
- author identity must equal `auth.uid()` for client-created discussion rows;
- client-created rows must use `provenance='genuine'`;
- seeded/demo insertion is service-controlled;
- selection requires entity visibility and must suppress blocked-author content for the viewer;
- moderation state cannot be freely elevated by ordinary authors;
- duplicate `client_mutation_id` for the same author is rejected/treated idempotently by the server contract.

- [ ] **Step 4: Document the mutation contract**

Update `API_CONTRACT.md` with discussion create/list/moderate/read operations, provenance semantics, and `mutationId` idempotency behavior.

- [ ] **Step 5: Run production contract QA and verify GREEN**

Run: `node prototype/netizens-world/backend/production-contract-qa.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20261005010500_netizens_participation_layer.sql prototype/netizens-world/backend/production-contract-qa.mjs prototype/netizens-world/backend/API_CONTRACT.md
git commit -m "feat: add production participation contract"
```

### Task 4: Put real participation into the entity experience

**Files:**
- Modify: `prototype/netizens-world/app.js`
- Modify: `prototype/netizens-world/index.html`
- Modify: `prototype/netizens-world/styles.css`
- Test: `prototype/netizens-world/qa.mjs`

**Interfaces:**
- Consumes: `window.NetizensData` discussion/membership/notification APIs from Tasks 1–2.
- Produces: reusable entity discussion UI, participation state control, and notification read surface without changing College ownership or private messaging semantics.

- [ ] **Step 1: Write failing UI contract assertions**

Assert the entity view exposes a discussion region, composer, reply affordance, provenance-safe seeded/demo labeling where applicable, and no public rendering of Circle/private-thread messages.

- [ ] **Step 2: Run World QA and verify RED**

Run: `node prototype/netizens-world/qa.mjs`

Expected: FAIL because the new interaction surface is absent.

- [ ] **Step 3: Implement reusable entity discussion rendering**

Render discussion under eligible World Entities using `NetizensData.listDiscussion(entityId)`. Submit through `createDiscussionItem`. Keep private messaging out of this surface. Preserve the existing World → Place → Entity breadcrumb and interaction grammar.

- [ ] **Step 4: Add membership/provenance and notification UI behavior**

Use the existing membership controls but route them through the provenance-aware adapter. Add a compact user-owned notification surface that can mark items read; do not turn it into a global engagement feed.

- [ ] **Step 5: Add block/moderation-safe rendering tests**

The UI must tolerate hidden/deleted parents, empty discussion, and College Group entities without a College-specific renderer.

- [ ] **Step 6: Run QA and verify GREEN**

Run: `node prototype/netizens-world/qa.mjs`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add prototype/netizens-world/app.js prototype/netizens-world/index.html prototype/netizens-world/styles.css prototype/netizens-world/qa.mjs
git commit -m "feat: make NETIZENS entities participatory"
```

### Task 5: Harden the slice and document the shared contract

**Files:**
- Modify: `prototype/netizens-world/ARCHITECTURE.md`
- Modify: `prototype/netizens-world/README.md`
- Modify: `.github/workflows/netizens-world.yml`
- Test: `prototype/netizens-world/qa.mjs`
- Test: `prototype/netizens-world/backend/contract-qa.mjs`
- Test: `prototype/netizens-world/backend/production-contract-qa.mjs`

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: one documented shared participation contract ready for Commons/Ask/Exchange to compose in the next slice.

- [ ] **Step 1: Add whole-slice regression assertions**

Pin these invariants: seeded/demo does not count as genuine participation; private Circle/thread content never enters public discussion; College remains generic Crews data; Perception is not required for discussion/membership integrity; queued retries keep one mutation ID.

- [ ] **Step 2: Update architecture documentation**

Document ownership, provenance, public-discussion/private-message separation, idempotency, and the exact generic contract College may adopt later.

- [ ] **Step 3: Ensure CI runs all relevant contract checks**

Keep the existing workflow and add only missing participation checks; do not create a parallel CI system.

- [ ] **Step 4: Run full local verification**

Run:

```bash
node prototype/netizens-world/qa.mjs
node prototype/netizens-world/backend/contract-qa.mjs
node prototype/netizens-world/backend/production-contract-qa.mjs
```

Expected: all PASS.

- [ ] **Step 5: Review the branch diff for scope**

Expected: no edits to `COLLEGE_GROUPS_PILOT.md` or College-specific routing unless a shared contract reference must be documented; no Perception canonical tables; no destructive rewrite of the foundation migration.

- [ ] **Step 6: Commit**

```bash
git add prototype/netizens-world/ARCHITECTURE.md prototype/netizens-world/README.md .github/workflows/netizens-world.yml prototype/netizens-world/qa.mjs prototype/netizens-world/backend/contract-qa.mjs prototype/netizens-world/backend/production-contract-qa.mjs
git commit -m "test: harden NETIZENS participation layer"
```

## Self-review result

- Spec coverage for Slice 1: discussion/replies, membership participation, notification ownership, moderation hooks, seeded/demo provenance, local-first retryability, College generic-contract compatibility, and Perception independence are all assigned to tasks.
- Deferred correctly to later slices: Commons/Ask/Exchange grammar, Projects/Plans/Events conversion expansion, Circles/private messaging UX, Local geospatial discovery, reputation presentation, Yes or No production UX hardening, Time Machine expansion.
- The production change is additive; the original foundation migration remains immutable.
- The plan intentionally reuses existing notification, report, moderation, block, entity, membership, and local-first foundations instead of duplicating them.
