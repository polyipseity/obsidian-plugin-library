import { defineConfig } from "vitest/config";

export default defineConfig({
  assetsInclude: ["**/*.md"],
  test: {
    include: ["tests/**/*.spec.{ts,js,mjs}", "tests/**/*.test.{ts,js,mjs}"],
    setupFiles: ["tests/setup.ts"],
  },
});
