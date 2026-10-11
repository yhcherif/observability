export type Tag<T> = { readonly __tag: T };
export type Tagged<A, B> = A & Tag<B>;
export type TraceId = Tagged<string, "TraceId">;
export type SpanId = Tagged<string, "SpanId">;

export const addTag =
  <T extends string>() =>
  <V>(value: V) =>
    value as Tagged<V, T>;
