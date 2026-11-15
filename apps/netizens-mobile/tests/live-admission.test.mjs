import { test } from "node:test";
import assert from "node:assert/strict";
import { decideLiveAdmission } from "../../../supabase/functions/_shared/live-admission.ts";

const host = "a0000000-0000-4000-8000-000000000001";
const viewer = "a0000000-0000-4000-8000-000000000002";
const entityId = "b0000000-0000-4000-8000-000000000001";

const base = {
  actorId: viewer,
  authenticated: true, anonymous: false,
  citizenStatus: "active", onboardingComplete: true,
  entity: { id: entityId, creatorId: host, visibility: "public", status: "active" },
  room: { id: "room_123", entityId, hostId: host, status: "live" },
  requestedRoomId: "room_123", requestedEntityId: entityId,
  entityVisibleToActor: true, blockedBetweenActorAndHost: false,
  membership: null, safetyApproved: true, withinRateLimit: true,
};
const result = x => decideLiveAdmission({ ...base, ...x });

test("public viewer is admitted only with verified server facts", () => {
  assert.deepEqual(result({}), { allowed: true, role: "viewer" });
  assert.deepEqual(result({ actorId: host }), { allowed: true, role: "host" });
});

test("privileged role requires active server-held membership", () => {
  assert.deepEqual(result({ membership: { status: "active", role: "moderator" } }), { allowed: true, role: "moderator" });
  assert.equal(result({ membership: { status: "invited", role: "moderator" } }).role, "viewer");
  assert.equal(result({ actorId: viewer, room: { ...base.room, hostId: viewer } }).allowed, false);
});

test("private and invitation-only rooms deny nonmembers", () => {
  for (const visibility of ["members", "invite", "private"]) {
    assert.equal(result({ entity: { ...base.entity, visibility } }).allowed, false);
    assert.deepEqual(result({ entity: { ...base.entity, visibility },
      membership: { status: "active", role: "member" } }), { allowed: true, role: "viewer" });
    assert.equal(result({ entity: { ...base.entity, visibility },
      membership: { status: "invited", role: "member" } }).allowed, false);
  }
});

test("fails closed on lost or ineligible identity", () => {
  for (const update of [
    { authenticated: false }, { anonymous: true }, { citizenStatus: "suspended" },
    { onboardingComplete: false }, { entityVisibleToActor: false },
    { blockedBetweenActorAndHost: true }, { safetyApproved: false },
    { withinRateLimit: false }, { entity: null }, { room: null },
    { room: { ...base.room, status: "ended" } },
    { room: { ...base.room, entityId: "wrong" } },
    { requestedRoomId: "other_room" }, { requestedEntityId: "other_entity" },
  ]) assert.equal(result(update).allowed, false);
});

test("scheduled streams reject viewers and non-host moderators", () => {
  const room = { ...base.room, status: "scheduled" };
  assert.equal(result({ room }).allowed, false);
  assert.equal(result({ room, membership: { role: "moderator", status: "active" } }).allowed, false);
  assert.deepEqual(result({ room, actorId: host }), { allowed: true, role: "host" });
});

test("muted or removed members cannot view even public live streams", () => {
  for (const status of ["muted", "removed"])
    assert.equal(result({ membership: { status, role: "member" } }).allowed, false);
});
