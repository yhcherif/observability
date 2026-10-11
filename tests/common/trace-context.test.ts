import { describe, expect, it } from "vitest";
import { childOf, rootContext } from "../../src/trace-context";

describe("routContext()", () => {
  it("generates a W3C-formatted ids", () => {
    const ctx = rootContext();
    expect(ctx.traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(ctx.spanId).toMatch(/^[0-9a-f]{16}$/);
  });

  it("generates a different traceId on every call", () => {
    const ids = new Set(
      Array.from({ length: 1000 }, () => rootContext().traceId),
    );
    expect(ids).toHaveLength(1000);
  });
});

describe("childOf()", () => {
  it("has a parent", () => {
    const root = rootContext();
    expect(childOf(root).parentSpanId).toMatch(root.spanId);
  });

  it("stays in the same trace", () => {
    const root = rootContext();
    expect(childOf(root).traceId).toBe(root.traceId);
  });

  it("points to its parent with a new spanId", () => {
    const parent = rootContext();
    const child = childOf(parent);
    expect(parent.traceId).toBe(child.traceId);
    expect(child.spanId).not.toEqual(parent.spanId);
  });

  it("let you have multiple-layer chain", () => {
    const root = rootContext();
    const child = childOf(root);
    const grandChild = childOf(child);
    expect(grandChild.parentSpanId).toBe(child.spanId);
    expect(child.parentSpanId).toBe(root.spanId);
  });
});
