import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";
import { getDatabaseUrl } from "./src/db/env";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: getDatabaseUrl() },
});
