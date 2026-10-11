import { describe, expect, it } from "vitest";
import { currentContext, withContext } from "../../src/context-store";
import { childOf, rootContext } from "../../src/trace-context";
import { SpanId, TraceId } from "../../src/common/types";

const tick = () => new Promise((res) => setTimeout(res, 5));

describe("context store", () => {
  it("returns undefined outside of any context", () => {
    expect(currentContext()).toBeUndefined();
  });

  it("exposes the context without passing it as a parameter", () => {
    const ctx = rootContext();
    const deepFunction = () => currentContext();
    expect(withContext(ctx, () => deepFunction())).toBe(ctx);
  });

  it("survives an await", async () => {
    const ctx = rootContext();
    const deepFunction = () => currentContext();
    expect(await withContext(ctx, () => deepFunction())).toBe(ctx);
  });

  it("isolates concurent requests", async () => {
    const handle = (ctx: { traceId: TraceId; spanId: SpanId }) =>
      withContext(ctx, async () => {
        await tick();
        return currentContext();
      });

    const a = rootContext();
    const b = rootContext();

    const [seenA, seenB] = await Promise.all([handle(a), handle(b)]);

    expect(seenA).toBe(a);
    expect(seenB).toBe(b);
  });

  it("restores the outer context after a nested run", () => {
    const parent = rootContext();
    const child = childOf(parent);

    withContext(parent, () => {
      withContext(child, () => {
        expect(currentContext()).toBe(child);
      });
      expect(currentContext()).toBe(parent);
    });
  });
});
