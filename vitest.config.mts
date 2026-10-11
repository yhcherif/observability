import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// TEST_DIST=1 redirects every `../../src/...` import in the tests to `dist/...`
// so the suite runs against the compiled output instead of the sources.
// `dist` is externalized so Node loads it natively through a single module
// cache; otherwise Vite and Node's `require` would each hold their own copy.
const testDist = process.env.TEST_DIST === "1";
const distDir = fileURLToPath(new URL("./dist/", import.meta.url));

export default defineConfig({
  resolve: {
    alias: testDist
      ? [{ find: /^(?:\.\.\/)+src\/(.*)$/, replacement: `${distDir}$1` }]
      : [],
  },
  test: {
    include: ["tests/**/*.test.ts"],
    server: {
      deps: {
        external: testDist ? [/\/dist\//] : [],
      },
    },
  },
});
