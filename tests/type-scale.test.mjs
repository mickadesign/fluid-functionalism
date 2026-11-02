/**
 * The type scale has one source (registry/default/lib/type-scale.ts) and
 * generated copies (globals.css, registry.json, utils.ts, the class map).
 * These tests fail when a copy is stale and pin the tailwind-merge behavior
 * components rely on.
 */
import { describe, expect, it } from "vitest";
import { twMerge } from "tailwind-merge";
import { generate } from "../scripts/generate-type-scale.mjs";
import { typeStyles, typeScale, typeClasses, fieldTouchClass } from "../registry/default/lib/type-scale.ts";
import { sizeMap } from "../registry/default/lib/size-context.tsx";
import { cn } from "../registry/default/lib/utils.ts";
import { fontWeights } from "../registry/default/lib/font-weight.ts";
import {
  BOLD,
  SEMIBOLD,
  TICK_PATH,
  TYPESET_CHECK,
  TYPESET_SUB_INDENT,
  TYPESET_ROLES,
  TYPESET_SPACE,
  FORCED_COLORS,
  generateTypesetCss,
  selectorList,
  typesetRegistryCss,
  typesetRules,
} from "../lib/typeset/generate.ts";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";

describe("type scale generation", () => {
  it("every generated output is up to date", async () => {
    const files = await generate();
    const stale = Object.entries(files)
      .filter(([, [before, after]]) => before !== after)
      .map(([path]) => path);
    expect(stale, "run `node scripts/generate-type-scale.mjs`").toEqual([]);
  });

  it("class map carries each role's px values as fallbacks", () => {
    for (const [role, step] of Object.entries(typeStyles)) {
      for (const v of ["default", "compact"]) {
        expect(typeClasses[v][role]).toContain(`,${step[v].size}px)]`);
        expect(typeClasses[v][role]).toContain(`,${step[v].leading}px)]`);
      }
    }
  });

  it("typeScale keeps its plain-number shape: font sizes per role and step", () => {
    for (const [role, step] of Object.entries(typeStyles)) {
      expect(typeScale[role]).toEqual({ default: step.default.size, compact: step.compact.size });
    }
    expect(typeScale.body).toEqual({ default: 13, compact: 12 });
  });
});

// Installed components get shadcn's stock `cn` (plain tailwind-merge), so the
// component class strings must survive it, not only FF's extended one.
describe.each([
  ["stock tailwind-merge", twMerge],
  ["FF cn", cn],
])("%s", (_name, merge) => {
  const caption = typeClasses.default.caption;

  it("keeps the role next to a text color", () => {
    expect(merge(caption, "text-muted-foreground")).toBe(`${caption} text-muted-foreground`);
  });

  it("a later leading utility replaces the role leading", () => {
    expect(merge(caption, "leading-none")).toBe(
      "text-[length:var(--fs-caption,12px)] leading-none"
    );
  });

  it("a later role replaces an earlier size and leading", () => {
    expect(merge("text-[13px] leading-snug", caption)).toBe(caption);
  });

  // Fields take 16px on touch screens so iOS Safari doesn't zoom the page
  // into them: a size behind its own variant, so the role's size, its
  // leading, and a field's own leading all stay.
  it("keeps the touch field size beside the role and its leading", () => {
    const body = typeClasses.default.body;
    expect(merge(body, fieldTouchClass)).toBe(`${body} ${fieldTouchClass}`);
    expect(merge(sizeMap.default.field, "leading-6")).toBe(
      `text-[length:var(--fs-body,13px)] ${fieldTouchClass} leading-6`
    );
  });
});

describe("FF cn with theme utilities", () => {
  it.each(["text-caption", "text-micro", "text-site-body"])(
    "%s is a font size, not a color",
    (cls) => {
      expect(cn(cls, "text-muted-foreground")).toBe(`${cls} text-muted-foreground`);
    }
  );

  it("a role utility drops an earlier leading (font-size wins over leading)", () => {
    expect(cn("leading-none", "text-caption")).toBe("text-caption");
  });

  it("a later leading is kept after a role utility", () => {
    expect(cn("text-caption", "leading-none")).toBe("text-caption leading-none");
  });
});

describe("typeset sheet", () => {
  const rules = typesetRules(typeStyles);
  const css = generateTypesetCss(typeStyles);
  const block = (sel) => css.split(`${sel} {`)[1].split("}")[0];
  // The element list a rule opens with: `:where(.typeset p, .typeset li)`.
  const firstWhere = (sel) => {
    let depth = 0;
    for (let i = 0; i < sel.length; i++) {
      if (sel[i] === "(") depth++;
      else if (sel[i] === ")" && --depth === 0) return sel.slice(":where(".length, i);
    }
    return "";
  };
  /** Declarations of the rule for exactly these elements, e.g. "h3, h4". */
  const declsFor = (elements) => {
    const want = elements
      .split(", ")
      .map((part) => `.typeset ${part}`)
      .join(", ");
    const match = rules.filter(([sel]) => !sel.includes("::") && firstWhere(sel) === want);
    expect(match, elements).toHaveLength(1);
    return match[0][1];
  };

  it("uses the library's weights", () => {
    expect(SEMIBOLD).toBe(fontWeights.semibold);
    expect(BOLD).toBe(fontWeights.bold);
  });

  it("reads every style from the type scale tokens at both steps", () => {
    for (const [sel, step, suffix] of [
      [":where(.typeset)", "default", ""],
      [":where(.typeset.typeset-compact)", "compact", "-compact"],
    ]) {
      const decls = block(sel);
      for (const role of TYPESET_ROLES) {
        const { size, leading } = typeStyles[role][step];
        expect(decls).toContain(`--typeset-${role}: var(--fs-${role}${suffix}, ${size}px);`);
        expect(decls).toContain(`--typeset-${role}-leading: var(--lh-${role}${suffix}, ${leading}px);`);
      }
      for (const [name, px] of Object.entries(TYPESET_SPACE)) {
        expect(decls).toContain(`--typeset-space-${name}: ${px[step]}px;`);
      }
    }
  });

  it("sets each element in the site's style", () => {
    const root = rules.find(([sel]) => sel === ":where(.typeset)")[1];
    expect(root["font-size"]).toBe("var(--typeset-body)");
    expect(root["line-height"]).toBe("var(--typeset-body-leading)");
    expect(root.color).toMatch(/^var\(--muted-foreground/);
    // h1 is the display style, and display is bold. The site has 3 heading
    // styles, so h3 to h6 share subtitle.
    expect(declsFor("h1")).toMatchObject({
      "font-size": "var(--typeset-display)",
      "line-height": "var(--typeset-display-leading)",
      "font-variation-settings": fontWeights.bold,
    });
    expect(declsFor("h2")).toMatchObject({ "font-size": "var(--typeset-title)", "line-height": "var(--typeset-title-leading)" });
    expect(declsFor("h3, h4, h5, h6")).toMatchObject({
      "font-size": "var(--typeset-subtitle)",
      "line-height": "var(--typeset-subtitle-leading)",
    });
    expect(declsFor("h1, h2, h3, h4, h5, h6")["font-variation-settings"]).toBe(fontWeights.semibold);
    // Code and keys in caption, code in the foreground; figcaption caption
    // in the muted color.
    expect(declsFor("code")).toMatchObject({ "font-size": "var(--typeset-caption)", color: "var(--foreground, currentColor)" });
    expect(declsFor("kbd")["font-size"]).toBe("var(--typeset-caption)");
    expect(declsFor("figcaption")).toMatchObject({
      "font-size": "var(--typeset-caption)",
      "line-height": "var(--typeset-caption-leading)",
    });
    expect(declsFor("figcaption").color).toMatch(/^var\(--muted-foreground/);
  });

  it("draws to-dos like the library checkbox, never a filled box", () => {
    // The tick is the CheckboxItem's own, in both flavors.
    for (const flavor of ["radix", "base"]) {
      const src = readFileSync(new URL(`../registry/${flavor}/checkbox-group.tsx`, import.meta.url), "utf-8");
      expect(src, flavor).toContain(`d="${TICK_PATH}"`);
    }
    // Box, corners, and the list indent (box + gap) at both steps.
    for (const [sel, step] of [
      [":where(.typeset)", "default"],
      [":where(.typeset.typeset-compact)", "compact"],
    ]) {
      const decls = block(sel);
      expect(decls).toContain(`--typeset-check: ${TYPESET_CHECK.box[step]}px;`);
      expect(decls).toContain(`--typeset-check-radius: ${TYPESET_CHECK.radius[step]}px;`);
      expect(decls).toContain(`--typeset-check-gap: ${TYPESET_CHECK.gap[step]}px;`);
      expect(decls).toContain(`--typeset-indent: ${TYPESET_CHECK.box[step] + TYPESET_CHECK.gap[step]}px;`);
      expect(decls).toContain(`--typeset-sub-indent: ${TYPESET_SUB_INDENT[step]}px;`);
    }
    // Lists like the site's: disc bullets and numbers in the indent, 4px
    // before their text, which lands on the same edge as a to-do's.
    expect(declsFor("ul, ol")["padding-left"]).toBe("calc(var(--typeset-indent) - 4px)");
    expect(declsFor("li")["padding-left"]).toBe("4px");
    // Sub-lists step in less than the list itself.
    expect(declsFor("li ul, li ol")["padding-left"]).toBe("calc(var(--typeset-sub-indent) - 4px)");
    expect(declsFor("ul")["list-style-type"]).toBe("disc");
    expect(declsFor("input[type=checkbox]")).toMatchObject({ appearance: "none", background: "none" });
    // Hover reads the same checked or not: the outline in the hover color.
    expect(declsFor("input[type=checkbox]:checked:not(:disabled):hover")["border-color"]).toBe(
      declsFor("input[type=checkbox]:not(:disabled):hover")["border-color"]
    );
    // The checked tick is the text color through a mask: no fill anywhere.
    const tick = rules.find(([sel]) => sel.includes("input[type=checkbox]:checked") && sel.endsWith("::before"))[1];
    expect(tick.mask).toContain(TICK_PATH);
    expect(tick["-webkit-mask"]).toBe(tick.mask);
    expect(css).not.toContain("accent-color");
    // In forced colors, the browser's own box, since a masked tick vanishes.
    const forced = css.split(`${FORCED_COLORS} {`)[1];
    expect(forced).toContain("appearance: auto;");
    expect(forced).toMatch(/:checked\)[^{]*::before \{\s*display: none;/);
    expect(typesetRegistryCss(typeStyles)["@layer components"][FORCED_COLORS]).toBeDefined();
  });

  it("aligns GFM boxes in tight and loose lists alike", () => {
    // A loose list puts the box in the item's paragraph, not straight in it.
    expect(declsFor(".task-list-item input[type=checkbox]")["vertical-align"]).toBe("-0.25em");
  });

  it("never relies on selectors or wrapping that reflow streamed content", () => {
    expect(css).not.toMatch(/:last-child|:has\(|margin-bottom|text-wrap:\s*(pretty|balance)/);
    // A base layer's balance or pretty is switched off, not just left out.
    expect(css).toContain("text-wrap-style: auto");
    // Newlines between blocks stay whitespace inside a pre-wrap host.
    expect(css).toMatch(/:where\(\.typeset\) \{[^}]*white-space: normal/);
  });

  it("lands every size, line height, and gap on a whole pixel, with nothing to tune", () => {
    for (const [sel, decls] of rules) {
      for (const [prop, value] of Object.entries(decls)) {
        // The sheet's own variables are tokens with px fallbacks, or px.
        // Except the press scale: a ratio that takes 1px off each side of
        // the box.
        if (prop === "--typeset-check-press") {
          const box = parseFloat(decls["--typeset-check"]);
          expect(Number(value) * box, `${prop} in ${sel}`).toBeCloseTo(box - 2, 2);
          continue;
        }
        if (prop.startsWith("--")) {
          expect(value, `${prop} in ${sel}`).toMatch(/^(var\(--(fs|lh)-[a-z]+(-compact)?, \d+px\)|\d+px)$/);
          continue;
        }
        if (!/^(font-size|line-height|margin-top|height)$/.test(prop)) continue;
        expect(value, `${prop} in ${sel}`).toMatch(
          /^(var\(--typeset-[a-z-]+\)|0|auto|1em|\d+px|round\(nearest, [0-9.]+em, 1px\))$/
        );
      }
    }
  });

  it("scopes every element selector whole to .typeset", () => {
    // An outer list or .not-typeset must not reach in: each part of the
    // opening :where() list starts inside .typeset, and so does the opt-out.
    let checked = 0;
    for (const [sel] of rules) {
      if (!sel.startsWith(":where(.typeset ")) continue;
      checked++;
      for (const part of selectorList(firstWhere(sel))) {
        expect(part.startsWith(".typeset "), `${part} in ${sel}`).toBe(true);
      }
      for (const m of sel.matchAll(/:not\(:where\(([^()]*)\)\)/g)) {
        for (const part of selectorList(m[1])) expect(part.startsWith(".typeset "), sel).toBe(true);
      }
    }
    expect(checked).toBeGreaterThan(40);
  });
});

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(name)) files.push(p);
  }
};
walk(new URL("../registry", import.meta.url).pathname);

// Components carry the role classes as literal strings (Tailwind must read
// them in source), so their px fallbacks are copies: keep them on the scale.
describe("role class literals in registry sources", () => {
  it.each(files.map((f) => [f.split("/registry/")[1], f]))("%s", (_rel, file) => {
    const src = readFileSync(file, "utf-8");
    for (const m of src.matchAll(/var\(--(fs|lh)-([a-z]+)(-compact)?,(\d+)px\)/g)) {
      const [, kind, role, compact, px] = m;
      const pair = typeStyles[role]?.[compact ? "compact" : "default"];
      expect(pair, `unknown role ${role}`).toBeDefined();
      expect(Number(px), m[0]).toBe(kind === "fs" ? pair.size : pair.leading);
    }
  });
});

describe("field size class", () => {
  it("is 16px on touch screens only", () => {
    expect(fieldTouchClass).toBe("pointer-coarse:text-[16px]");
  });

  it.each(["default", "compact"])("useSize().field at %s is the body role plus the touch size", (step) => {
    expect(sizeMap[step].field).toBe(`${typeClasses[step].body} ${fieldTouchClass}`);
  });
});

// iOS Safari zooms the page into a focused field set under 16px, so every
// editable field carries the touch size in its className, unconditionally:
// `useSize().field` (body plus `fieldTouchClass`), `fieldTouchClass` after
// another role, or the literal. Registry, docs, and app code all count.
describe("editable fields carry the touch size", () => {
  const repoRoot = new URL("..", import.meta.url).pathname;
  const sources = [];
  const collect = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) collect(p);
      else if (/\.tsx?$/.test(name)) sources.push(p);
    }
  };
  ["registry", "lib", "app"].forEach((dir) => collect(join(repoRoot, dir)));

  // Input types that never open a keyboard.
  const NO_KEYBOARD = new Set(["hidden", "file", "checkbox", "radio", "range", "color", "button", "submit", "reset", "image"]);
  const isField = (tag) =>
    tag === "input" || tag === "textarea" || tag === "Field.Control" || tag.endsWith(".Input");
  const attr = (node, sf, name) =>
    node.attributes.properties.find((a) => ts.isJsxAttribute(a) && a.name.getText(sf) === name);
  // One className part that always applies the touch size.
  const carries = (expr) =>
    ((ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) &&
      expr.text.split(/\s+/).includes(fieldTouchClass)) ||
    (ts.isIdentifier(expr) && expr.text === "fieldTouchClass") ||
    (ts.isPropertyAccessExpression(expr) && expr.name.text === "field");
  // The className as a whole: a bare part, or a top-level argument of cn().
  // A part inside a condition (`compact && ...`) doesn't count.
  const unconditional = (init) => {
    if (!init) return false;
    if (ts.isStringLiteral(init)) return carries(init);
    if (!ts.isJsxExpression(init) || !init.expression) return false;
    const e = init.expression;
    if (carries(e)) return true;
    return (
      ts.isCallExpression(e) &&
      ts.isIdentifier(e.expression) &&
      /^(cn|clsx|twMerge)$/.test(e.expression.text) &&
      e.arguments.some(carries)
    );
  };

  const fields = [];
  const created = [];
  for (const file of sources) {
    const source = readFileSync(file, "utf-8");
    const where = relative(repoRoot, file);
    if (/document\.createElement\(\s*["'](?:textarea|input)["']\s*\)/.test(source)) created.push([where, source]);
    if (!file.endsWith(".tsx")) continue;
    const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (node) => {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tag = node.tagName.getText(sf);
        const type = attr(node, sf, "type")?.initializer;
        const noKeyboard = type && ts.isStringLiteral(type) && NO_KEYBOARD.has(type.text);
        // A read-only field never opens a keyboard, and an element passed as
        // `render` is checked on its own when the walk reaches it.
        if (isField(tag) && !noKeyboard && !attr(node, sf, "readOnly") && !attr(node, sf, "render")) {
          const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
          fields.push([`${where}:${line} <${tag}>`, unconditional(attr(node, sf, "className")?.initializer)]);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  it("finds the fields", () => {
    expect(fields.length).toBeGreaterThan(10);
    expect(created.length).toBeGreaterThan(0);
  });

  it.each(fields)("%s carries the touch size in its className", (_where, ok) => {
    expect(ok).toBe(true);
  });

  // The copy fallbacks build a textarea in script: 16px so iOS doesn't zoom
  // into it, and an explicit range because iOS select() selects nothing.
  it.each(created)("%s sizes and selects its script-made field for iOS", (_where, source) => {
    expect(source).toContain('style.fontSize = "16px"');
    expect(source).toContain("setSelectionRange(0, ");
  });
});
