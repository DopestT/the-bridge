export interface LocalDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(
    sql: string,
    ...params: (string | number | null)[]
  ): Promise<unknown>;
  getAllAsync<T>(
    sql: string,
    ...params: (string | number | null)[]
  ): Promise<T[]>;
  getFirstAsync<T>(
    sql: string,
    ...params: (string | number | null)[]
  ): Promise<T | null>;
}
export const schema = `
PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS projections (
 owner TEXT NOT NULL, collection TEXT NOT NULL, id TEXT NOT NULL,
 body TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('canonical','pending','rejected')),
 updated_at INTEGER NOT NULL, PRIMARY KEY(owner,collection,id)
);
CREATE TABLE IF NOT EXISTS outbox (
 sequence INTEGER PRIMARY KEY AUTOINCREMENT, owner TEXT NOT NULL,
 mutation_id TEXT NOT NULL, kind TEXT NOT NULL, payload TEXT NOT NULL,
 created_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
 status TEXT NOT NULL DEFAULT 'queued', next_attempt INTEGER NOT NULL DEFAULT 0,
 lease_until INTEGER NOT NULL DEFAULT 0, last_error TEXT,
 UNIQUE(owner,mutation_id)
);
CREATE INDEX IF NOT EXISTS outbox_pending ON outbox(owner,status,sequence);
PRAGMA user_version=1;
`;
