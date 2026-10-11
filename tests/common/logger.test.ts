import { describe, it, expect } from "vitest";
import { makeLogger } from "../../src/logger";
import { rootContext } from "../../src/trace-context";
import { withContext } from "../../src/context-store";

const setup = (options = {}) => {
  const lines: string[] = [];
  const logger = makeLogger({
    write: (line) => lines.push(line),
    clock: { now: () => new Date("2026-10-10T12:00:01.000Z") },
    ...options,
  });
  const records = () => lines.map((line) => JSON.parse(line));

  return { logger, lines, records };
};

describe("logger", () => {
  it("writes one JSON object per line", () => {
    const { logger, lines, records } = setup();
    logger.info("Server started", { port: 8000 });
    expect(lines).toHaveLength(1);
    expect(lines[0]).not.toContain("\n");
    expect(records()).toEqual([
      {
        timestamp: "2026-10-10T12:00:01.000Z",
        level: "info",
        message: "Server started",
        attributes: { port: 8000 },
      },
    ]);
  });

  it("adds traceId nd spanId from the current context", () => {
    const { logger, records } = setup();
    const ctx = rootContext();
    withContext(ctx, () => logger.debug("inside a request"));
    expect(records()[0]).toMatchObject({
      traceId: ctx.traceId,
      spanId: ctx.spanId,
    });
  });

  it("keeps the correlation after an await", async () => {
    const { logger, records } = setup();
    const ctx = rootContext();
    await withContext(ctx, async () => {
      await new Promise((res) => setTimeout(res, 5));
      logger.error("Module initialization failed");
    });

    expect(records()[0].traceId).toBe(ctx.traceId);
  });

  it("drops records below the minimum level", () => {
    const { logger, records } = setup({ minLevel: "warn" });
    logger.debug("a");
    logger.info("b");
    logger.warn("c");
    logger.error("d");

    expect(records().map((line) => line.level)).toEqual(["warn", "error"]);
  });

  it("does not let attributes overwrite core fields", () => {
    const { logger, records } = setup();
    logger.info("real message", { level: "debug", traceId: "forged" });
    expect(records()[0].level).toBe("info");
    expect(records()[0].traceId).toBeUndefined();
  });

  it("serializes errors with name, message and stack", () => {
    const { logger, records } = setup();

    logger.error("Booking failed", { error: new TypeError("timeout") });

    expect(records()[0].attributes.error).toMatchObject({
      name: "TypeError",
      message: "timeout",
    });

    expect(records()[0].attributes.error.stack).toContain("TypeError: timeout");
  });

  it("never throws on circular attributes", () => {
    const { logger, records } = setup();

    const circular: Record<string, unknown> = { labId: 10 };
    circular.selfs = circular;
    console.log(circular);

    expect(() => logger.debug("circular", circular)).not.toThrow();
  });
});
