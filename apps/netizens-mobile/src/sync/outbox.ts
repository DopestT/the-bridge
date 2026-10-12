import type { LocalDatabase } from "../storage/schema.ts";
import type {
  ErrorClass,
  MutationKind,
  OutboxItem,
  PendingAction,
} from "./types.ts";
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Row = {
  mutation_id: string;
  kind: MutationKind;
  payload: string;
  attempts: number;
  lease_until: number;
  sequence: number;
};
function item(r: Row): OutboxItem {
  return {
    mutationId: r.mutation_id,
    kind: r.kind,
    payload: JSON.parse(r.payload),
    attempts: r.attempts,
    leaseUntil: r.lease_until,
  };
}
export class Outbox {
  private db: LocalDatabase;
  readonly owner: string;
  private now: () => number;
  private randomId: () => string;
  constructor(
    db: LocalDatabase,
    owner: string,
    now: () => number = Date.now,
    randomId: () => string = () => globalThis.crypto.randomUUID(),
  ) {
    if (!owner) throw new Error("Citizen required");
    this.db = db;
    this.owner = owner;
    this.now = now;
    this.randomId = randomId;
  }
  async enqueue(
    kind: MutationKind,
    payload: Record<string, unknown>,
    mutationId = this.randomId(),
  ): Promise<OutboxItem> {
    if (!uuid.test(mutationId)) throw new Error("Mutation ID must be a UUID");
    const encoded = JSON.stringify(payload);
    if (encoded.length > 32768) throw new Error("Payload too large");
    await this.db.runAsync(
      "INSERT INTO outbox(owner,mutation_id,kind,payload,created_at) VALUES(?,?,?,?,?) ON CONFLICT(owner,mutation_id) DO NOTHING",
      this.owner,
      mutationId,
      kind,
      encoded,
      this.now(),
    );
    const row = await this.db.getFirstAsync<Row>(
      "SELECT * FROM outbox WHERE owner=? AND mutation_id=?",
      this.owner,
      mutationId,
    );
    if (!row || row.kind !== kind || row.payload !== encoded)
      throw new Error("Mutation ID already has different intent");
    return item(row);
  }
  async claimBatch(limit: number): Promise<OutboxItem[]> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
      throw new Error("Batch size must be 1–100");
    const now = this.now();
    // One atomic SQLite statement: concurrent callers cannot claim the same lease.
    const rows = await this.db.getAllAsync<Row>(
      `UPDATE outbox SET status='inflight',attempts=attempts+1,lease_until=? WHERE sequence IN (
   SELECT sequence FROM outbox WHERE owner=? AND ((status='queued' AND next_attempt<=?) OR (status='inflight' AND lease_until<=?)) AND NOT EXISTS (SELECT 1 FROM outbox earlier WHERE earlier.owner=outbox.owner AND earlier.sequence<outbox.sequence AND ((earlier.status='queued' AND earlier.next_attempt>?) OR (earlier.status='inflight' AND earlier.lease_until>?))) ORDER BY sequence LIMIT ?
  ) RETURNING *`,
      now + 60000,
      this.owner,
      now,
      now,
      now,
      now,
      limit,
    );
    return rows.sort((a, b) => a.sequence - b.sequence).map(item);
  }
  async list(
    field: "entityId" | "threadId",
    id: string,
  ): Promise<PendingAction[]> {
    const rows = await this.db.getAllAsync<
      Row & {
        status: PendingAction["status"];
        last_error: PendingAction["lastError"];
      }
    >(
      "SELECT * FROM outbox WHERE owner=? AND status IN ('queued','inflight','rejected') AND json_extract(payload,?)=? ORDER BY sequence LIMIT 100",
      this.owner,
      `$.${field}`,
      id,
    );
    return rows.map((row) => ({
      ...item(row),
      status: row.status,
      lastError: row.last_error,
    }));
  }
  private async finish(
    i: OutboxItem,
    status: string,
    error: ErrorClass | null,
    next = 0,
  ) {
    await this.db.runAsync(
      "UPDATE outbox SET status=?,last_error=?,next_attempt=?,lease_until=0 WHERE owner=? AND mutation_id=? AND status='inflight' AND attempts=? AND lease_until=?",
      status,
      error,
      next,
      this.owner,
      i.mutationId,
      i.attempts,
      i.leaseUntil,
    );
  }
  async markRetry(i: OutboxItem, error: ErrorClass) {
    await this.finish(
      i,
      "queued",
      error,
      this.now() + Math.min(60000, 1000 * 2 ** Math.min(i.attempts, 6)),
    );
  }
  async markTerminal(i: OutboxItem, error: ErrorClass) {
    await this.finish(i, "rejected", error);
  }
  async markApplied(i: OutboxItem) {
    await this.finish(i, "applied", null);
  }
}
