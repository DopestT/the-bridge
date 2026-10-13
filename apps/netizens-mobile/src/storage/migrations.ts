import { schema, type LocalDatabase } from "./schema.ts";
export async function migrate(db: LocalDatabase): Promise<void> {
  const version = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  if ((version?.user_version ?? 0) > 1)
    throw new Error("Unsupported local database version");
  await db.execAsync(schema);
}
