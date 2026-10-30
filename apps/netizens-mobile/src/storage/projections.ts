import { isAccountErased } from "../auth/account-erasure.ts";
import type { LocalDatabase } from "./schema.ts";
export type ProjectionState = "canonical" | "pending" | "rejected";
export type Collection =
  | "citizens"
  | "places"
  | "entities"
  | "memberships"
  | "discussion"
  | "notifications"
  | "threads"
  | "navigation"
  | "checkpoints";
export class ProjectionStore {
  private db: LocalDatabase;
  readonly owner: string;
  constructor(db: LocalDatabase, owner: string) {
    if (!owner) throw new Error("Citizen required");
    this.db = db;
    this.owner = owner;
  }
  async put(
    collection: Collection,
    id: string,
    body: unknown,
    state: ProjectionState = "canonical",
  ) {
    if (isAccountErased(this.owner)) throw new Error("Account erased");
    await this.db.runAsync(
      "INSERT INTO projections(owner,collection,id,body,state,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(owner,collection,id) DO UPDATE SET body=excluded.body,state=excluded.state,updated_at=excluded.updated_at",
      this.owner,
      collection,
      id,
      JSON.stringify(body),
      state,
      Date.now(),
    );
    if (isAccountErased(this.owner)) { await this.clearAccount(); throw new Error("Account erased"); }
  }
  async get<T>(
    collection: Collection,
    id: string,
  ): Promise<{ body: T; state: ProjectionState } | null> {
    if (isAccountErased(this.owner)) return null;
    const row = await this.db.getFirstAsync<{
      body: string;
      state: ProjectionState;
    }>(
      "SELECT body,state FROM projections WHERE owner=? AND collection=? AND id=?",
      this.owner,
      collection,
      id,
    );
    if (isAccountErased(this.owner)) return null;
    return row ? { body: JSON.parse(row.body) as T, state: row.state } : null;
  }
  async remove(collection: Collection, id: string) {
    await this.db.runAsync(
      "DELETE FROM projections WHERE owner=? AND collection=? AND id=?",
      this.owner,
      collection,
      id,
    );
  }
  async clearAccount() {
    await this.db.runAsync("DELETE FROM projections WHERE owner=?", this.owner);
    await this.db.runAsync("DELETE FROM outbox WHERE owner=?", this.owner);
  }
}
