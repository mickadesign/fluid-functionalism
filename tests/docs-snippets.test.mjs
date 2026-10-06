// Guards against "preview vs snippet" drift: the docs' code snippets and the
// playground's generated code must keep teaching the load-bearing classes the
// shipped blocks actually use. A retune of a block that doesn't reach the
// docs (or vice versa) fails here instead of shipping silently.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import ts from "typescript";
import { FLAVORED_SINGLE_SOURCE } from "../scripts/postbuild-registry.mjs";

const root = new URL("..", import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), "utf-8");

describe("docs snippets carry the load-bearing design details", () => {
  const gridSrc = read("registry/default/lib/sidebar-menu-grid.ts");
  const grid = gridSrc.match(/SIDEBAR_MENU_GRID =\s*\n?\s*"([^"]+)"/)[1];
  const page = read("app/docs/sidebar/page.tsx");
  const playground = read("lib/docs/playgrounds/sidebar.tsx");
  const blocks = [
    "registry/blocks/sidebar-workspace-header.tsx",
    "registry/blocks/sidebar-user-footer.tsx",
    "registry/blocks/sidebar-app/search-field.tsx",
    "registry/blocks/sidebar-app/inset-topbar.tsx",
  ]
    .map(read)
    .join("\n");

  it("the sidebar page's popup-grid snippet stays in lockstep with the shipped lib", () => {
    // Best case: the snippet interpolates the live constant — drift-proof by
    // construction. Otherwise every grid class must appear verbatim.
    if (!page.includes("${SIDEBAR_MENU_POPUP}")) {
      for (const cls of grid.split(" ")) {
        expect(page, `page snippet is missing "${cls}"`).toContain(cls);
      }
    }
  });

  // One entry per finetune that must survive into what a reader copies.
  const LOAD_BEARING = [
    "delay-200 duration-160", // topbar trigger's late fade after a pin
    "[&>span:first-child]:hidden", // brand trigger drops its hover fill layer
    "left-1.5", // 20px tile centred on the rows' 16px leading axis
    "-ml-0.5", // footer avatar pulled onto the leading axis
    "group/search", // search field's hover-reveal shortcut chip scope
  ];
  for (const literal of LOAD_BEARING) {
    it(`"${literal}" ships in a block and is taught by the docs`, () => {
      expect(blocks, `no block ships "${literal}"`).toContain(literal);
      expect(
        page + playground,
        `the sidebar docs/codegen no longer teach "${literal}"`
      ).toContain(literal);
    });
  }
});

describe("emitted payloads embed only installable sources", () => {
  const dirs = ["public/r", "public/r/base", "public/r/radix"];
  const payloads = dirs.flatMap((d) =>
    readdirSync(join(root, d))
      .filter((f) => f.endsWith(".json"))
      .map((f) => ({ name: join(d, f), data: JSON.parse(read(join(d, f))) }))
  );
  it("no payload imports docs-only paths; flavored payloads are neutralized", () => {
    for (const { name, data } of payloads) {
      // Flat payloads (and true dual-flavor sources) may keep @/registry/
      // imports — the shadcn CLI rewrites those on install. Only the flavored
      // CLONES of single-source items must be neutralized to
      // @/components/ui/* so registryDependencies pick the flavor.
      const flavored =
        (name.includes("/base/") || name.includes("/radix/")) &&
        FLAVORED_SINGLE_SOURCE.has(data.name);
      for (const file of data.files ?? []) {
        if (typeof file.content !== "string") continue;
        expect(file.content, `${name} → ${file.path}`).not.toContain("@/lib/docs");
        if (flavored) {
          expect(file.content, `${name} → ${file.path}`).not.toContain(
            'from "@/registry/'
          );
        }
      }
    }
  });
});

describe("documented imports match where the registry installs each file", () => {
  // The repo resolves `@/components/ui/*` through shims, so a snippet can
  // import a path that only exists here. fluid-hover-highlight ships as
  // `registry:component` and installs at components/, not components/ui/: the
  // Copy prompt and the skill taught the ui/ path, and an agent following
  // them verbatim failed `next build` with TS2307. Every `from "@/…"` that
  // names a registry file must use the path the shadcn CLI writes it to.
  const DEFAULT_DIR = {
    "registry:ui": "components/ui",
    "registry:component": "components",
    "registry:hook": "hooks",
    "registry:lib": "lib",
  };
  const installed = new Map(); // basename → installed specifiers
  for (const item of JSON.parse(read("registry.json")).items) {
    for (const file of item.files ?? []) {
      const dir = DEFAULT_DIR[file.type];
      const path = file.target ?? (dir && `${dir}/${basename(file.path)}`);
      if (!path) continue;
      const spec = "@/" + path.replace(/\.[cm]?[jt]sx?$/, "");
      const specs = installed.get(basename(spec)) ?? new Set();
      installed.set(basename(spec), specs.add(spec));
    }
  }

  function* walk(dir) {
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
      const rel = join(dir, entry.name);
      if (entry.isDirectory()) yield* walk(rel);
      else yield rel;
    }
  }

  // Only string and template literals: a source file's own import
  // declarations are repo code and may use the shims.
  function snippets(rel) {
    const text = read(rel);
    if (rel.endsWith(".md")) return [text];
    const out = [];
    const visit = (node) => {
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
        out.push(node.text);
      else if (ts.isTemplateExpression(node))
        out.push(node.head.text + node.templateSpans.map((s) => s.literal.text).join(""));
      ts.forEachChild(node, visit);
    };
    const kind = rel.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    visit(ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true, kind));
    return out;
  }

  // lib/preset is left out: its generated installs carry their own targets.
  const sources = [
    ...walk("app"),
    ...walk("lib/docs"),
    ...walk("skills/fluid-functionalism"),
  ].filter((rel) => /\.(tsx?|md)$/.test(rel));

  it("every documented @/ import of a registry file uses its installed path", () => {
    const wrong = [];
    for (const rel of sources) {
      for (const snippet of snippets(rel)) {
        for (const [, spec] of snippet.matchAll(/\bfrom\s+["'](@\/[^"']+)["']/g)) {
          const specs = installed.get(basename(spec));
          if (specs && !specs.has(spec))
            wrong.push(`${rel}: "${spec}" installs as ${[...specs].join(" or ")}`);
        }
      }
    }
    expect(wrong).toEqual([]);
  });

  it("maps fluid-hover-highlight to components/, the case that shipped broken", () => {
    expect(installed.get("fluid-hover-highlight")).toEqual(
      new Set(["@/components/fluid-hover-highlight"])
    );
  });
});
