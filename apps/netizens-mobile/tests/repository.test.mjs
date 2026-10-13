import { test } from "node:test";
import assert from "node:assert/strict";
import {
  NetizensRepository,
  ApiError,
} from "../src/api/netizens-repository.ts";
import { Reconciler } from "../src/sync/reconciler.ts";
const user = "11111111-1111-4111-8111-111111111111",
  entity = "22222222-2222-4222-8222-222222222222";
const session = () => ({ userId: user, accessToken: "token" });
test("reads bounded canonical rows and forwards bearer credential", async () => {
  const repo = new NetizensRepository(
    "https://example.test",
    "public",
    session,
    async (url, init) => {
      assert.equal(new URL(url).searchParams.get("limit"), "50");
      assert.equal(init.headers.Authorization, "Bearer token");
      return new Response(JSON.stringify([{ id: entity, title: "Crew" }]));
    },
  );
  assert.equal((await repo.entities("crews"))[0].title, "Crew");
});
test("post retries recover canonical row by mutation ID after unique conflict", async () => {
  let n = 0;
  const repo = new NetizensRepository(
    "https://example.test",
    "public",
    session,
    async (url, init) => {
      n++;
      if (init.method === "POST") {
        const body = JSON.parse(init.body);
        assert.equal(body.client_mutation_id, entity);
        assert.equal(body.author_id, user);
        return new Response(JSON.stringify({ code: "23505" }), { status: 409 });
      }
      assert.equal(
        new URL(url).searchParams.get("client_mutation_id"),
        "eq." + entity,
      );
      return new Response(
        JSON.stringify([
          {
            id: entity,
            body: "hello",
            entity_id: entity,
            parent_id: null,
            author_id: user,
            client_mutation_id: entity,
          },
        ]),
      );
    },
  );
  const row = await repo.apply({
    mutationId: entity,
    kind: "discussion.post",
    payload: { entityId: entity, body: "hello" },
    attempts: 1,
    leaseUntil: 1,
  });
  assert.equal(row.body, "hello");
  assert.equal(n, 2);
});
test("authorization and stale authentication have different classifications", async () => {
  for (const [status, kind] of [
    [401, "auth"],
    [403, "authorization"],
    [400, "validation"],
    [503, "server"],
  ]) {
    const repo = new NetizensRepository(
      "https://example.test",
      "public",
      session,
      async () => new Response("{}", { status }),
    );
    await assert.rejects(
      repo.places(),
      (e) => e instanceof ApiError && e.kind === kind,
    );
  }
});
test("sync refuses another Citizen and never claims their queued writes", async () => {
  let claimed = false;
  const outbox = {
    owner: user,
    claimBatch: async () => {
      claimed = true;
      return [];
    },
  };
  const sync = new Reconciler(outbox, { apply: async () => ({}) }, {}, () => ({
    userId: "other",
  }));
  assert.equal((await sync.syncOnce()).paused, true);
  assert.equal(claimed, false);
});
test("RLS failure is visibly rejected; offline failure remains retryable", async () => {
  for (const kind of ["authorization", "offline"]) {
    const item = {
      mutationId: entity,
      kind: "discussion.post",
      payload: { entityId: entity, body: "hello" },
      attempts: 1,
    };
    let status = "",
      state = "";
    const outbox = {
      owner: user,
      claimBatch: async () => [item],
      markTerminal: async () => (status = "rejected"),
      markRetry: async () => (status = "queued"),
    };
    const projections = { put: async (c, id, body, s) => (state = s) };
    const sync = new Reconciler(
      outbox,
      {
        apply: async () => {
          throw new ApiError(kind, "failed");
        },
      },
      projections,
      session,
    );
    await sync.syncOnce();
    assert.equal(status, kind === "offline" ? "queued" : "rejected");
    assert.equal(state, kind === "offline" ? "" : "rejected");
  }
});
test("logout during an authorization response cannot recreate purged private projections", async () => {
  let active = true,
    put = false;
  const item = {
    mutationId: entity,
    kind: "message.send",
    payload: { threadId: entity, body: "private" },
    attempts: 1,
  };
  const q = {
    owner: user,
    claimBatch: async () => [item],
    markTerminal: async () => {},
    markRetry: async () => {},
  };
  const sync = new Reconciler(
    q,
    {
      apply: async () => {
        active = false;
        throw new ApiError("authorization", "denied");
      },
    },
    { put: async () => (put = true) },
    () => {
      if (!active) throw Error("closed");
      return { userId: user };
    },
  );
  await sync.syncOnce();
  assert.equal(put, false);
});
