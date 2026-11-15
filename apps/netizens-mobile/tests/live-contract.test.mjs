import { test } from "node:test";
import assert from "node:assert/strict";
import {
  makeLiveJoinRequest,
  validateLiveJoinGrant,
  viewerCountLabel,
} from "../src/features/live/live-contract.ts";

const room = makeLiveJoinRequest("room_123", "entity_456");
const now = 1800000000000;

function grant(overrides = {}) {
  return {
    ...room,
    role: "viewer",
    serverUrl: "wss://live.example.test",
    accessToken: "synthetic_not_a_real_token",
    expiresAtMs: now + 60000,
    ...overrides,
  };
}

test("join request carries World context but no client-selected role", () => {
  assert.deepEqual(Object.keys(room), ["roomId", "entityId"]);
  assert.ok(Object.isFrozen(room));
  assert.throws(() => makeLiveJoinRequest("../private", "entity_456"));
  assert.throws(() => makeLiveJoinRequest("room_123", ""));
});

test("valid short-lived backend grant is accepted but not persisted", () => {
  const accepted = validateLiveJoinGrant(grant(), room, now);
  assert.equal(accepted.role, "viewer");
  assert.equal(accepted.entityId, "entity_456");
  assert.ok(Object.isFrozen(accepted));
});

test("cross-room or cross-Entity grants are rejected", () => {
  assert.throws(() => validateLiveJoinGrant(grant({ roomId: "another_room" }), room, now));
  assert.throws(() => validateLiveJoinGrant(grant({ entityId: "other_entity" }), room, now));
});

test("bad role, insecure transport and malformed tokens are rejected", () => {
  assert.throws(() => validateLiveJoinGrant(grant({ role: "admin" }), room, now));
  assert.throws(() => validateLiveJoinGrant(grant({ serverUrl: "ws://live.example.test" }), room, now));
  assert.throws(() => validateLiveJoinGrant(grant({ accessToken: "short" }), room, now));
  assert.throws(() => validateLiveJoinGrant({}, room, now));
});

test("expired and excessive-lifetime grants are rejected", () => {
  assert.throws(() => validateLiveJoinGrant(grant({ expiresAtMs: now }), room, now));
  assert.throws(() => validateLiveJoinGrant(grant({ expiresAtMs: now + 3600000 }), room, now));
});

test("client-estimated, fractional and negative viewer counts are not displayed", () => {
  assert.equal(viewerCountLabel(2, true), "Viewers: 2");
  assert.equal(viewerCountLabel(2000, false), "Viewer count unavailable");
  assert.equal(viewerCountLabel(-1, true), "Viewer count unavailable");
  assert.equal(viewerCountLabel(3.5, true), "Viewer count unavailable");
  assert.equal(viewerCountLabel(null, true), "Viewer count unavailable");
});
