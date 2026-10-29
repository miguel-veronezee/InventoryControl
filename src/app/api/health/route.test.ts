import { afterEach, expect, test, vi } from "vitest";

const execute = vi.fn();
vi.mock("@/db", () => ({ getDb: () => ({ execute }) }));
vi.mock("next/server", () => ({ connection: () => Promise.resolve() }));

const { GET } = await import("./route");

afterEach(() => {
  execute.mockReset();
  vi.useRealTimers();
});

test("responde 200 quando o banco responde", async () => {
  execute.mockResolvedValue([{ "?column?": 1 }]);
  const res = await GET();
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ status: "ok", database: "ok" });
});

test("responde 503 quando o banco falha", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  execute.mockRejectedValue(new Error("connection refused"));
  const res = await GET();
  expect(res.status).toBe(503);
  expect(await res.json()).toEqual({ status: "degraded", database: "down" });
});

test("responde 503 em até 3s quando o banco não responde", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.useFakeTimers();
  execute.mockReturnValue(new Promise(() => {}));
  const pending = GET();
  await vi.advanceTimersByTimeAsync(3000);
  const res = await pending;
  expect(res.status).toBe(503);
  expect(await res.json()).toEqual({ status: "degraded", database: "down" });
});
