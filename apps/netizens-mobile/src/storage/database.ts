import { openDatabaseAsync } from "expo-sqlite";
import { migrate } from "./migrations";
export async function openNetizensDatabase() {
  const db = await openDatabaseAsync("netizens.db");
  await migrate(db);
  return db;
}
