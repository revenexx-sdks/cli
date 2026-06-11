import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // Hand-bundled `.hbs` template loaders are not used by the units we test;
    // exclude the heavier integration surfaces so `npm test` stays fast.
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
      exclude: ["lib/commands/services/**", "lib/type-generation/**"],
      reporter: ["text", "html"],
    },
  },
});
