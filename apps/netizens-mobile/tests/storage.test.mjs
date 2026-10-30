import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { migrate } from "../src/storage/migrations.ts";
import { Outbox } from "../src/sync/outbox.ts";
import { ProjectionStore } from "../src/storage/projections.ts";

function database(raw = new DatabaseSync(":memory:")) {
  return {
    raw,
    execAsync: async (sql) => raw.exec(sql),
    runAsync: async (sql, ...p) => raw.prepare(sql).run(...p),
    getAllAsync: async (sql, ...p) => raw.prepare(sql).all(...p),
    getFirstAsync: async (sql, ...p) => raw.prepare(sql).get(...p) ?? null,
  };
}
const id = "11111111-1111-4111-8111-111111111111";
const id2 = "22222222-2222-4222-8222-222222222222";
test("durable claim survives restart, delays retries, and preserves mutation identity", async () => {
  const db = database();
  await migrate(db);
  let now = 100;
  const q = new Outbox(
    db,
    "alice",
    () => now,
    () => id,
  );
  await q.enqueue("discussion.post", { entityId: id, body: "hello" });
  assert.equal((await q.claimBatch(2))[0].mutationId, id);
  assert.deepEqual(await new Outbox(db, "alice", () => now).claimBatch(2), []);
  now += 61000;
  const claimed = await new Outbox(db, "alice", () => now).claimBatch(2);
  assert.equal(claimed[0].mutationId, id);
  assert.equal(claimed[0].attempts, 2);
  await q.markRetry(claimed[0], "offline");
  assert.deepEqual(await q.claimBatch(2), []);
  now += 60000;
  const retry = (await q.claimBatch(2))[0];
  await q.markApplied(retry);
  assert.deepEqual(await q.claimBatch(2), []);
});
test("deduplicates identical IDs but rejects reused IDs with different intent", async () => {
  const db = database();
  await migrate(db);
  const q = new Outbox(
    db,
    "alice",
    () => 100,
    () => id,
  );
  await q.enqueue("membership.join", { entityId: id }, id);
  await q.enqueue("membership.join", { entityId: id }, id);
  await assert.rejects(
    q.enqueue("membership.leave", { entityId: id }, id),
    /different/,
  );
  assert.equal((await q.claimBatch(10)).length, 1);
});
test("FIFO bounded claims, terminal failures and account isolation", async () => {
  const db = database();
  await migrate(db);
  const a = new Outbox(
    db,
    "alice",
    () => 100,
    () => id,
  );
  const b = new Outbox(
    db,
    "bob",
    () => 100,
    () => id2,
  );
  await a.enqueue("membership.join", { entityId: id }, id);
  await a.enqueue("membership.leave", { entityId: id }, id2);
  assert.deepEqual(await b.claimBatch(10), []);
  const first = (await a.claimBatch(1))[0];
  assert.equal(first.mutationId, id);
  await a.markTerminal(first, "authorization");
  assert.equal((await a.claimBatch(1))[0].mutationId, id2);
});
test("expired claim cannot overwrite a newer worker result", async () => {
  const db = database();
  await migrate(db);
  let now = 1;
  const q = new Outbox(
    db,
    "alice",
    () => now,
    () => id,
  );
  await q.enqueue("membership.join", { entityId: id });
  const old = (await q.claimBatch(1))[0];
  now += 61000;
  const current = (await q.claimBatch(1))[0];
  await q.markApplied(current);
  await q.markRetry(old, "offline");
  now += 61000;
  assert.deepEqual(await q.claimBatch(1), []);
});
test("cache is account scoped, optimistic metadata separate, purge clears queued writes", async () => {
  const db = database();
  await migrate(db);
  const p = new ProjectionStore(db, "alice");
  await p.put("entities", id, { title: "hello" }, "canonical");
  await p.put("discussion", id, { body: "draft" }, "pending");
  assert.equal((await p.get("discussion", id)).state, "pending");
  assert.equal(await new ProjectionStore(db, "bob").get("entities", id), null);
  const q = new Outbox(
    db,
    "alice",
    () => 1,
    () => id,
  );
  await q.enqueue("membership.join", { entityId: id });
  await p.clearAccount();
  assert.equal(await p.get("entities", id), null);
  assert.deepEqual(await q.claimBatch(10), []);
});
test("rejects unbounded payloads and invalid mutation IDs", async () => {
  const db = database();
  await migrate(db);
  const q = new Outbox(
    db,
    "alice",
    () => 1,
    () => id,
  );
  await assert.rejects(
    q.enqueue("discussion.post", { body: "a".repeat(40000) }),
    /large/,
  );
  await assert.rejects(q.enqueue("membership.join", {}, "bad"), /UUID/);
});
test("a delayed first action prevents later actions overtaking it", async () => {
  const db = database();
  await migrate(db);
  const q = new Outbox(
    db,
    "alice",
    () => 1,
    () => id,
  );
  await q.enqueue("membership.join", { entityId: id }, id);
  await q.enqueue("membership.leave", { entityId: id }, id2);
  const first = (await q.claimBatch(1))[0];
  await q.markRetry(first, "offline");
  assert.deepEqual(await q.claimBatch(1), []);
});
test("pending and rejected intents remain reviewable after screen restart and isolated by entity", async () => {
  const db = database();
  await migrate(db);
  const q = new Outbox(
    db,
    "alice",
    () => 1,
    () => id,
  );
  await q.enqueue("discussion.post", { entityId: id, body: "draft" }, id);
  const claimed = (await q.claimBatch(1))[0];
  await q.markTerminal(claimed, "authorization");
  const rows = await new Outbox(db, "alice").list("entityId", id);
  assert.equal(rows[0].status, "rejected");
  assert.equal(rows[0].payload.body, "draft");
  assert.deepEqual(await q.list("entityId", id2), []);
  assert.deepEqual(await new Outbox(db, "bob").list("entityId", id), []);
});
test("unconfirmed private sends retain their UUID across process recreation", async () => {
  const db = database();
  await migrate(db);
  const q = new Outbox(
    db,
    "alice",
    () => 1,
    () => id,
  );
  await q.enqueue("message.send", { threadId: id2, body: "private" }, id);
  const pending = await new Outbox(db, "alice").list("threadId", id2);
  assert.equal(pending[0].mutationId, id);
  assert.equal(pending[0].payload.body, "private");
  await new ProjectionStore(db, "alice").clearAccount();
  assert.deepEqual(await q.list("threadId", id2), []);
});

test('late SQLite projection writes cannot restore an erased account', async () => {
  const { markAccountErased } = await import('../src/auth/account-erasure.ts');
  const db = database(); await migrate(db);
  const other = new ProjectionStore(db, 'erasure-other');
  await other.put('citizens', 'other', { keep: true });
  let release;
  const barrier = new Promise(resolve => { release = resolve; });
  const delayed = { ...db, runAsync: async (sql, ...params) => {
    if (sql.startsWith('INSERT INTO projections')) await barrier;
    return db.runAsync(sql, ...params);
  } };
  const store = new ProjectionStore(delayed, 'erasure-projection');
  const write = store.put('citizens', 'owner', { erased: true });
  markAccountErased(store.owner); await store.clearAccount(); release();
  await assert.rejects(write, /Account erased/);
  assert.equal(await store.get('citizens', 'owner'), null);
  assert.equal(db.raw.prepare('SELECT count(*) AS n FROM projections WHERE owner=?').get(store.owner).n, 0);
  assert.deepEqual((await other.get('citizens', 'other')).body, { keep: true });
});
test('an in-flight queued write is removed after account erasure', async () => {
  const { markAccountErased } = await import('../src/auth/account-erasure.ts');
  const db = database(); await migrate(db);
  let release;
  const barrier = new Promise(resolve => { release = resolve; });
  const delayed = { ...db, runAsync: async (sql, ...params) => {
    if (sql.startsWith('INSERT INTO outbox')) await barrier;
    return db.runAsync(sql, ...params);
  } };
  const queue = new Outbox(delayed, 'erasure-outbox');
  const write = queue.enqueue('message.send', { threadId: id2, body: 'must erase' }, id);
  markAccountErased(queue.owner); await new ProjectionStore(db, queue.owner).clearAccount(); release();
  await assert.rejects(write, /Account erased/);
  assert.equal(db.raw.prepare('SELECT count(*) AS n FROM outbox WHERE owner=?').get(queue.owner).n, 0);
  await assert.rejects(queue.enqueue('message.send', { threadId: id2, body: 'late retry' }, id2), /Account erased/);
});
