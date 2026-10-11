import { SpanId, TraceId } from "./common/types";
import { randomBytes } from "node:crypto";

const hex = (bytes: number) => randomBytes(bytes).toString("hex");

export const rootContext = () =>
  ({
    traceId: hex(16) as TraceId,
    spanId: hex(8) as SpanId,
  }) as const;

export const childOf = (parent: { traceId: TraceId; spanId: SpanId }) =>
  ({
    traceId: parent.traceId,
    spanId: hex(8) as SpanId,
    parentSpanId: parent.spanId,
  }) as const;
