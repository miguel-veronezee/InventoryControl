import { expect, test } from "vitest";
import { getDatabaseUrl } from "./env";

test("retorna a DATABASE_URL quando definida", () => {
  expect(getDatabaseUrl({ DATABASE_URL: "postgres://x" })).toBe("postgres://x");
});

test.each([{}, { DATABASE_URL: "" }])(
  "explica o que falta quando DATABASE_URL está ausente: %o",
  (env) => {
    expect(() => getDatabaseUrl(env)).toThrow(/DATABASE_URL[\s\S]*\.env\.example/);
  },
);
