import { sql } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/db";

const TIMEOUT_MS = 3000;

export async function GET() {
  // Never prerender: the answer must reflect the database at request time.
  await connection();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      getDb().execute(sql`select 1`),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("database health check timed out")), TIMEOUT_MS);
      }),
    ]);
    return Response.json({ status: "ok", database: "ok" });
  } catch (error) {
    console.error("health check failed", error);
    return Response.json({ status: "degraded", database: "down" }, { status: 503 });
  } finally {
    clearTimeout(timer);
  }
}
