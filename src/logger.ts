import { currentContext } from "./context-store";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerOptions {
  clock?: { now: () => Date };
  minLevel?: LogLevel;
  write?: (line: string) => void;
}

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 } satisfies {
  [key in LogLevel]: number;
};

const safeStringify = (value: unknown) => {
  const seen = new WeakSet();
  return JSON.stringify(value, (_key, v: unknown) => {
    if (v instanceof Error) return serializeError(v);
    if (typeof v === "bigint") return v.toString();
    if (typeof v === "object" && v != null) {
      if (seen.has(v)) return "[Circular]";

      seen.add(v);
      return v;
    }
    return v;
  });
};

const serializeError = (error: Error) => ({
  name: error.name,
  message: error.message,
  stack: error.stack,
});

export const makeLogger = ({
  clock = { now: () => new Date() },
  minLevel = "debug",
  write = (line: unknown) => void process.stdout.write(`${line}\n`),
}: LoggerOptions) => {
  const transport = write !== undefined ? write : console.log;
  const log = (level: LogLevel) => (message: string, metadata?: unknown) => {
    if (LEVELS[level] < LEVELS[minLevel]) return;
    const context = currentContext();
    transport(
      safeStringify({
        ...(context !== undefined ? context : {}),
        level,
        message,
        timestamp: clock.now().toISOString(),
        attributes: metadata,
      }),
    );
  };

  return {
    info: log("info"),
    warn: log("warn"),
    debug: log("debug"),
    error: log("error"),
  };
};
