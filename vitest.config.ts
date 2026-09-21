import { defineConfig } from "vitest/config";

/**
 * The CLI bundles Handlebars templates as strings (`esbuild --loader:.hbs=text`).
 * Mirror that here so modules that import them (the `generate` command's
 * generators) can be loaded by tests that walk the whole command tree.
 */
const hbsAsText = () => ({
  name: "hbs-as-text",
  transform(code: string, id: string) {
    if (id.endsWith(".hbs")) return { code: `export default ${JSON.stringify(code)};`, map: null };
    return null;
  },
});

export default defineConfig({
  plugins: [hbsAsText()],
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    setupFiles: ["tests/setup.ts"],
    environment: "node",
    // Hand-bundled `.hbs` template loaders are not used by the units we test;
    // exclude the heavier integration surfaces so `npm test` stays fast.
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts", "lib/**/*.tsx"],
      exclude: ["lib/commands/services/**", "lib/type-generation/**"],
      reporter: ["text", "html"],
    },
  },
});
