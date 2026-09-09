import { configDefaults, defineConfig } from "vitest/config";

// The preset and registry tests are plain node `.mjs` files. Component tests
// are `.tsx` and opt into jsdom per file with `// @vitest-environment jsdom`,
// so nothing here changes the environment globally.
const root = new URL(".", import.meta.url).pathname.replace(/\/$/, "");

export default defineConfig({
  resolve: {
    alias: { "@": root },
  },
  // tsconfig says `jsx: "preserve"` for Next; Vite 8's oxc transform must
  // compile it for the test runner instead.
  oxc: {
    jsx: { runtime: "automatic" },
  },
  test: {
    // Claude Code keeps git worktrees under `.claude/worktrees/<name>/`, each
    // with its own copy of `tests/`. Without this, `npm test` from the main
    // checkout globs those copies too. The directory is git-ignored, so only
    // local runs are affected.
    exclude: [...configDefaults.exclude, ".claude/**"],
  },
});
