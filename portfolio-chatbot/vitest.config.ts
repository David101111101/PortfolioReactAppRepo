import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    sequence: {
      concurrent: false, // IMPORTANT: prevents rate limit interference
    },
  },
});