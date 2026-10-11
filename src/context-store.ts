import { AsyncLocalStorage } from "node:async_hooks";
import { type TraceId, type SpanId } from "./common/types";

const storage = new AsyncLocalStorage<{ traceId: TraceId; spanId: SpanId }>();
// This fail with concurent request
// This fails these two tests:
//   => isolates concurent requests
//   => restores the outer context after a nested run
//let current: { traceId: TraceId; spanId: SpanId } | undefined;

export const withContext = <T>(
  ctx: { traceId: TraceId; spanId: SpanId },
  fn: () => T,
) => {
  //current = ctx;
  //return operation();
  return storage.run(ctx, fn);
};

export const currentContext = () => {
  //return current;
  return storage.getStore();
};
