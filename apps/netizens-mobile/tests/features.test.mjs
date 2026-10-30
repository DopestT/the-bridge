import { test } from "node:test";
import assert from "node:assert/strict";
import { loadCached } from "../src/features/world/world-model.ts";
import { participate } from "../src/features/participation/participation-service.ts";
import { routeNotification } from "../src/features/notifications/notification-router.ts";
import { toPublicLocation } from "../src/features/local/location.ts";
import { measure, budgets, checkBudget } from "../src/performance/metrics.ts";
import { ApiError } from "../src/api/netizens-repository.ts";
const id = "11111111-1111-4111-8111-111111111111";
test('a conversation invitation notification opens the protected inbox', () => {
  assert.deepEqual(routeNotification({notification_type:'conversation_request'}),{kind:'messages'});
});
test("cached read renders before network and survives offline refresh", async () => {
  const states = [];
  await loadCached({
    cached: async () => ({ title: "old" }),
    refresh: async () => {
      assert.equal(states[0].phase, "cachedRefreshing");
      throw new ApiError("offline", "offline");
    },
    save: async () => {},
    clear: async () => {},
    emit: (s) => states.push(s),
  });
  assert.equal(states.at(-1).phase, "offlineCached");
  assert.equal(states.at(-1).data.title, "old");
});
test("authorization failure removes cached contents", async () => {
  let cleared = false;
  const states = [];
  await loadCached({
    cached: async () => null,
    refresh: async () => {
      throw new ApiError("authorization", "denied");
    },
    save: async () => {},
    clear: async () => (cleared = true),
    emit: (s) => states.push(s),
  });
  assert.equal(states.at(-1).data, null);
  assert.equal(cleared, true);
});
test("private Circle never queues public discussion; pending draft is distinct from canonical", async () => {
  const records = [];
  const runtime = {
    outbox: {
      enqueue: async (kind, payload) => ({ mutationId: id, kind, payload }),
    },
    projections: { put: async (...args) => records.push(args) },
  };
  await assert.rejects(
    participate(runtime, { id, place_id: "circles" }, "discussion.post", {
      body: "private",
    }),
    /private/i,
  );
  assert.equal(records.length, 0);
  await participate(runtime, { id, place_id: "crews" }, "discussion.post", {
    body: "hello",
  });
  assert.equal(records[0][3], "pending");
});
test("notification accepts routing identifiers only and rejects malformed IDs", () => {
  assert.deepEqual(routeNotification({ entity_id: id, body: "secret" }), {
    kind: "entity",
    entityId: id,
  });
  assert.equal(routeNotification({ thread_id: "../private" }), null);
});
test("public location reveals only the chosen area label, never exact coordinates", () => {
  assert.deepEqual(
    toPublicLocation({
      latitude: 38.987,
      longitude: -77.095,
      area: "Bethesda",
    }),
    { area: "Bethesda" },
  );
});
test("speed budgets use measured p75 and reject missing or invalid measurements", () => {
  assert.equal(measure("navigation_response_ms", 20, 80).duration, 60);
  assert.throws(() => measure("navigation_response_ms", 80, 20));
  assert.equal(checkBudget([10, 20, 30, 110], 100), true);
  assert.equal(checkBudget([101, 102, 103, 104], 100), false);
  assert.equal(checkBudget([], 100), false);
  assert.equal(budgets.cold_usable_ms, 2500);
});
test("expired auth preserves explicitly safe cached public reads while writes pause", async () => {
  let cleared = false;
  const states = [];
  await loadCached({
    cached: async () => ({ title: "public" }),
    refresh: async () => {
      throw new ApiError("auth", "expired");
    },
    save: async () => {},
    clear: async () => (cleared = true),
    emit: (s) => states.push(s),
  });
  assert.equal(cleared, false);
  assert.equal(states.at(-1).data.title, "public");
});
