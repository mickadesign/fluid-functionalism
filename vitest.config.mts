import { configDefaults, defineConfig } from "vitest/config";

// The preset and registry tests are plain node `.mjs` files. Component tests
// are `.tsx` and opt into jsdom per file with `// @vitest-environment jsdom`,
// so nothing here changes the environment globally.
const root = new URL(".", import.meta.url).pathname.replace(/\/$/, "");

export default defineConfig({
  test: {
    // Agent worktrees under .claude/ hold their own checkout of this suite and
    // their own node_modules. Collecting them runs every component test two or
    // three more times against a mismatched React copy, which fails loudly and
    // buries the real result. CI never sees them because .claude is gitignored,
    // so this only bites local runs, which is exactly where the noise misled.
    exclude: [...configDefaults.exclude, ".claude/**"],
    // The preset suites type-check generated files through a real TypeScript
    // program. Each suite now shares one program, so only the first check in a
    // file pays for parsing the repo and lib.d.ts; on a shared CI runner that
    // first one can still take a few seconds, and the 5s default left no room.
    testTimeout: 15_000,
  },
  resolve: {
    alias: { "@": root },
  },
  // tsconfig says `jsx: "preserve"` for Next; Vite 8's oxc transform must
  // compile it for the test runner instead.
  oxc: {
    jsx: { runtime: "automatic" },
  },
});
