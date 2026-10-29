import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getDatabaseUrl } from "./env";
import * as schema from "./schema";

type Db = PostgresJsDatabase<typeof schema>;

// Kept on globalThis so hot reload in dev does not open a new pool on every edit.
const globalForDb = globalThis as unknown as { db?: Db };

export function getDb(): Db {
  globalForDb.db ??= drizzle(postgres(getDatabaseUrl(), { connect_timeout: 3 }), { schema });
  return globalForDb.db;
}
