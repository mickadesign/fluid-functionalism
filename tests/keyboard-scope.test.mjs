// @vitest-environment jsdom
/**
 * While keyboard focus is inside a component preview, the site's own
 * shortcuts stand aside and only the previewed component's keys act.
 * Preview roots carry `data-keyboard-scope`; every page-level key listener
 * on the site starts with `if (inKeyboardScope(e.target)) return;`
 * (lib/keyboard-scope.ts). These tests keep both halves from drifting.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { inKeyboardScope, KEYBOARD_SCOPE_SELECTOR } from "../lib/keyboard-scope.ts";

// Under jsdom, Vite serves this file from a `/@fs` URL; strip that prefix.
const repoRoot = new URL("..", import.meta.url).pathname.replace(/^\/@fs/, "");
const SITE_DIRS = ["app", "lib", "components", "hooks"];
const KEY_EVENTS = new Set(["keydown", "keyup", "keypress"]);
const PAGE_TARGETS = new Set([
  "window",
  "document",
  "document.body",
  "document.documentElement",
  "globalThis",
  "self",
]);

// Page-level key listeners that may skip the guard. Keyed by
// `file::enclosing function::handler`. Each needs its reason.
const EXEMPT = {
  // Escape collapses the expanded preview: the key belongs to the preview.
  "lib/docs/playground.tsx::PlaygroundLayout::onKey":
    "Escape collapses the expanded preview, which is the preview's own key",
  // Escape closes the /demo pen menu, which sits outside the stage.
  "app/components/playground-menu.tsx::PlaygroundMenu::onKeyDown":
    "Escape closes the /demo pen menu",
  // Visual only: presses a settings key chip after the shortcut's own
  // (guarded) listener marked the key with preventDefault.
  "app/components/right-panel.tsx::SettingRow::onKeyDown":
    "key chip press, keyed off defaultPrevented from the guarded shortcut",
  // Capture-phase timestamp for the chip press above, acts on nothing.
  "app/components/right-panel.tsx::SettingRow::onKeyCapture":
    "records when the key went down, acts on nothing",
};
// Not listed: lib/starter/install.ts writes a `d` theme hotkey into users'
// apps. It lives in a template literal, so the scan never sees it as code.

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx?|mjs|js)$/.test(name) && !name.endsWith(".d.ts")) out.push(full);
  }
  return out;
}

function siteFiles() {
  return SITE_DIRS.flatMap((d) => {
    try {
      return walk(join(repoRoot, d));
    } catch {
      return [];
    }
  });
}

function parse(file) {
  const text = readFileSync(file, "utf-8");
  const kind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : file.endsWith(".ts") ? ts.ScriptKind.TS : ts.ScriptKind.JS;
  return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
}

const isFunctionLike = (n) =>
  ts.isArrowFunction(n) || ts.isFunctionExpression(n) || ts.isFunctionDeclaration(n) || ts.isMethodDeclaration(n);

/** The nearest named function around `node`: a declaration or `const X = () => …`. */
function enclosingName(node) {
  for (let n = node.parent; n; n = n.parent) {
    if (ts.isFunctionDeclaration(n) && n.name) return n.name.text;
    if (isFunctionLike(n) && ts.isVariableDeclaration(n.parent) && ts.isIdentifier(n.parent.name)) {
      // Skip the handler itself and hook callbacks; keep component/hook names.
      const name = n.parent.name.text;
      if (/^[A-Z]|^use[A-Z]/.test(name)) return name;
    }
  }
  return "(module)";
}

/** Resolve the listener argument to a function node in the same file. */
function resolveHandler(sf, call, arg) {
  if (isFunctionLike(arg)) return arg;
  if (!ts.isIdentifier(arg)) return null;
  const name = arg.text;
  const candidates = [];
  const visit = (n) => {
    if (ts.isFunctionDeclaration(n) && n.name?.text === name) candidates.push(n);
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === name && n.initializer) {
      let init = n.initializer;
      // useCallback(fn, deps) and similar single-wrapper forms.
      if (ts.isCallExpression(init) && init.arguments[0] && isFunctionLike(init.arguments[0])) init = init.arguments[0];
      if (isFunctionLike(init)) candidates.push(init);
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  // Prefer a declaration whose enclosing function also holds the call.
  const contains = (outer, inner) => inner.pos >= outer.pos && inner.end <= outer.end;
  const scoped = candidates.filter((c) => {
    for (let p = c.parent; p; p = p.parent) {
      if (isFunctionLike(p) || ts.isSourceFile(p)) return contains(p, call);
    }
    return true;
  });
  const pool = scoped.length ? scoped : candidates;
  return pool.sort((a, b) => b.pos - a.pos).find((c) => c.pos < call.pos) ?? pool[0] ?? null;
}

function callsInKeyboardScope(fn) {
  let found = false;
  const visit = (n) => {
    if (found) return;
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === "inKeyboardScope") {
      found = true;
      return;
    }
    ts.forEachChild(n, visit);
  };
  visit(fn);
  return found;
}

/** Every `window|document.addEventListener("keydown"|…, handler)` in a file. */
function pageKeyListeners(file) {
  const sf = parse(file);
  const rel = relative(repoRoot, file);
  const found = [];
  const visit = (n) => {
    if (
      ts.isCallExpression(n) &&
      ts.isPropertyAccessExpression(n.expression) &&
      n.expression.name.text === "addEventListener" &&
      n.arguments.length >= 2 &&
      ts.isStringLiteralLike(n.arguments[0]) &&
      KEY_EVENTS.has(n.arguments[0].text)
    ) {
      const target = n.expression.expression.getText(sf).replace(/\?/g, "");
      if (PAGE_TARGETS.has(target)) {
        const arg = n.arguments[1];
        const handler = resolveHandler(sf, n, arg);
        const line = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
        const handlerName = ts.isIdentifier(arg) ? arg.text : "(inline)";
        found.push({
          rel,
          line,
          event: n.arguments[0].text,
          key: `${rel}::${enclosingName(n)}::${handlerName}`,
          resolved: handler !== null,
          guarded: handler !== null && callsInKeyboardScope(handler),
        });
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return found;
}

const listeners = siteFiles().flatMap(pageKeyListeners);

describe("site keyboard shortcuts stand aside inside previews", () => {
  it("finds the site's page-level key listeners", () => {
    // A sanity floor so a broken scan cannot pass by finding nothing.
    expect(listeners.length).toBeGreaterThanOrEqual(15);
  });

  it("every page-level key listener calls inKeyboardScope or is exempt", () => {
    const failures = listeners
      .filter((l) => !l.guarded && !(l.key in EXEMPT))
      .map((l) =>
        l.resolved
          ? `${l.rel}:${l.line} "${l.event}" listener (${l.key}) never calls inKeyboardScope. ` +
            `Start the handler with:\n  // Keys typed in a preview belong to the component in it.\n` +
            `  if (inKeyboardScope(e.target)) return;\n` +
            `(import from "@/lib/keyboard-scope"), or add "${l.key}" to EXEMPT in tests/keyboard-scope.test.mjs with a reason.`
          : `${l.rel}:${l.line} "${l.event}" listener (${l.key}): could not find the handler's function in the file. ` +
            `Pass an inline function or a same-file function/const so the guard can be checked.`
      );
    expect(failures, failures.join("\n\n")).toEqual([]);
  });

  it("every EXEMPT entry still matches a listener", () => {
    const keys = new Set(listeners.map((l) => l.key));
    const stale = Object.keys(EXEMPT).filter((k) => !keys.has(k));
    expect(stale, "remove or rename these EXEMPT entries").toEqual([]);
  });
});

describe("preview roots are keyboard scopes", () => {
  // Every surface that renders a live component inside the site's chrome.
  const ROOTS = [
    ["lib/docs/ComponentPreview.tsx", 1], // docs previews and playgrounds
    ["app/components/bento-card.tsx", 1], // Showcase tiles, /compare panes
    ["app/demo/page.tsx", 1], // the /demo slide stage
    ["app/docs/sizes/page.tsx", 2], // the two stripped-down preview frames
    ["app/changelog/changelog-view.tsx", 1], // changelog entry stages
    ["app/compare-bases/page.tsx", 2], // Row and SingleRow
    ["app/docs/skill/hero-shared.tsx", 1], // the skill examples' two-up frame
  ];

  it.each(ROOTS)("%s carries data-keyboard-scope", (file, count) => {
    const src = readFileSync(join(repoRoot, file), "utf-8");
    const hits = src.match(/data-keyboard-scope=""/g) ?? [];
    expect(hits.length, `${file} should mark ${count} preview root(s)`).toBeGreaterThanOrEqual(count);
  });
});

describe("registry parts with page-wide shortcuts honor keyboard scopes", () => {
  it.each([
    "registry/default/sidebar-core.tsx",
    "registry/default/command-menu.tsx",
    "registry/default/lib/theme-context.tsx",
  ])(
    "%s references data-keyboard-scope",
    (file) => {
      const src = readFileSync(join(repoRoot, file), "utf-8");
      expect(src).toContain("[data-keyboard-scope]");
    }
  );
});

describe("inKeyboardScope", () => {
  it("is true inside a scope and false outside", () => {
    document.body.innerHTML = `
      <div data-keyboard-scope=""><button id="inside"></button></div>
      <button id="outside"></button>`;
    expect(KEYBOARD_SCOPE_SELECTOR).toBe("[data-keyboard-scope]");
    expect(inKeyboardScope(document.getElementById("inside"))).toBe(true);
    expect(inKeyboardScope(document.querySelector("[data-keyboard-scope]"))).toBe(true);
    expect(inKeyboardScope(document.getElementById("outside"))).toBe(false);
    expect(inKeyboardScope(document.body)).toBe(false);
    expect(inKeyboardScope(window)).toBe(false);
    expect(inKeyboardScope(null)).toBe(false);
  });
});
