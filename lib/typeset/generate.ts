// The prose stylesheet (`.typeset`) as data, then as CSS or as the registry
// item's `css` object. One path for every consumer: the registry build and
// globals.css (scripts/generate-type-scale.mjs) and the Copy prompt output of
// the playground on /docs/typography. No imports, so node can load this file
// directly; the type scale comes in as an argument, for the px fallbacks.
//
// Nothing to tune: markdown sets in the site's own styles and spacing, read
// from the type scale tokens, so it never looks different from the rest.

/** `semibold` and `bold` from registry/default/lib/font-weight.ts, copied
 *  because this file can't import (tests/type-scale.test.mjs keeps them equal). */
export const SEMIBOLD = "'wght' 550, 'opsz' 18";
export const BOLD = "'wght' 700, 'opsz' 25";

/** The shape of `typeStyles` in registry/default/lib/type-scale.ts. */
export type TypeScaleData = Record<
  string,
  Record<"default" | "compact", { size: number; leading: number }>
>;

type Step = "default" | "compact";
type Decls = Record<string, string>;
type Rule = [selector: string, decls: Decls];

/** The styles prose sets in: h1 display, h2 title, h3 to h6 subtitle,
 *  paragraphs body, figcaption and code caption. Micro stays out: it sizes
 *  key caps, counters, and initials inside components. */
export const TYPESET_ROLES = ["display", "title", "subtitle", "body", "caption"] as const;

/** Room between blocks in px: 12px between paragraphs and 8px under a
 *  title, as on the site's doc pages, then 24px above a section and 20px
 *  above a sub-heading. Compact steps them down, list items aside. The
 *  Spacing table on /docs/typography reads them from here. */
export const TYPESET_SPACE = {
  /** Between blocks: paragraphs, lists, quotes, code, tables, media. */
  block: { default: 12, compact: 8 },
  /** Below a heading, and above a figcaption. */
  heading: { default: 8, compact: 4 },
  /** Above h1 and h2. */
  section: { default: 24, compact: 16 },
  /** Above h3 to h6. */
  subsection: { default: 20, compact: 12 },
  /** Both sides of an hr. */
  rule: { default: 24, compact: 16 },
  /** Between list items, and inside an item. */
  item: { default: 4, compact: 4 },
} as const;

/** The to-do checkbox, drawn like the library's CheckboxItem: a 16px box
 *  (14px compact) with 5px corners (4px), 8px from its text (4px compact),
 *  CheckboxItem's own row gap. Every list puts its text on the same edge,
 *  box + gap: 24px, 18px compact. */
export const TYPESET_CHECK = {
  box: { default: 16, compact: 14 },
  radius: { default: 5, compact: 4 },
  gap: { default: 8, compact: 4 },
} as const;

/** Room between a bullet or a number and its text, as on the site's own
 *  lists (`list-disc pl-5`, items `pl-1`). */
const MARKER_GAP = 4;

/** How far a sub-list's text sits past its parent's, whatever the marker:
 *  less than the list's own indent, so nesting reads without drifting. */
export const TYPESET_SUB_INDENT = { default: 20, compact: 16 } as const;

/** The CheckboxItem tick (24px grid), drawn 2px wider than the box as the
 *  library draws it. tests/type-scale.test.mjs keeps it equal to theirs. */
export const TICK_PATH = "M6 12L10 16L18 8";

/** A ticked to-do's strike-through, drawn: Inter's OS/2 strikeout (top
 *  671 and size 140 of 2048 units), its top measured down from the ascent
 *  (1984), where an inline background starts. */
const STRIKE_TOP = "0.641em";
const STRIKE_SIZE = "max(1px, 0.0684em)";
/** Button's release curve, for the checkbox press. */
const PRESS_EASE = "cubic-bezier(0.23, 1, 0.32, 1)";

/** The fast tier (`spring.fast`, 0.08s) to draw it. CSS can't spring, so
 *  it eases. Unticking takes it away at once. */
const STRIKE_ENTER = "color 80ms ease-out, background-size 80ms ease-out";

/** Split a selector list at its top-level commas (not the ones inside
 *  `:is(…)`). Also used by the docs inspector to name the rule it traced. */
export function selectorList(sel: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < sel.length; i++) {
    if (sel[i] === "(") depth++;
    else if (sel[i] === ")") depth--;
    else if (sel[i] === "," && depth === 0) {
      parts.push(sel.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(sel.slice(start).trim());
  return parts;
}

// Every element rule puts its whole selector inside `.typeset`, in a single
// :where(), so nothing outside the sheet can match part of it: an outer list
// doesn't make a first-level list "nested", and a .not-typeset wrapper around
// a page doesn't switch a .typeset inside it off. The opt-out is a
// zero-specificity :not(:where(…)) too, so the whole sheet sits at
// specificity 0 inside @layer components: any utility wins.
const inSheet = (sel: string) =>
  selectorList(sel)
    .map((part) => `.typeset ${part}`)
    .join(", ");
const OPT_OUT = ":not(:where(.typeset .not-typeset, .typeset .not-typeset *))";
const el = (sel: string) => `:where(${inSheet(sel)})${OPT_OUT}`;
// Rhythm still reaches an opted-out root, so it sits in the flow like any
// block; only what's inside it is left alone.
const flowEl = (sel: string) => `:where(${inSheet(sel)}):not(:where(.typeset .not-typeset *))`;

/** Block elements that take the paragraph rhythm. `.tableWrapper` is
 *  Tiptap's table wrapper. Plain divs are left alone: inside prose they're
 *  usually the inside of an embedded component, which spaces itself. */
const BLOCKS = "p, ul, ol, pre, blockquote, figure, table, .typeset-scroll, .tableWrapper, img, video";

const ANY_HEADING = "h1, h2, h3, h4, h5, h6";

const v = (name: string) => `var(--typeset-${name})`;

/** The sheet's own variables at one step: each role's size and line height
 *  from the type scale tokens (px fallbacks, so it works without them), and
 *  the spacing. Every value is a whole pixel. */
function stepDecls(scale: TypeScaleData, step: Step): Decls {
  const s = step === "compact" ? "-compact" : "";
  const d: Decls = {};
  for (const role of TYPESET_ROLES) {
    const { size, leading } = scale[role][step];
    d[`--typeset-${role}`] = `var(--fs-${role}${s}, ${size}px)`;
    d[`--typeset-${role}-leading`] = `var(--lh-${role}${s}, ${leading}px)`;
  }
  for (const [name, px] of Object.entries(TYPESET_SPACE)) {
    d[`--typeset-space-${name}`] = `${px[step]}px`;
  }
  d["--typeset-check"] = `${TYPESET_CHECK.box[step]}px`;
  d["--typeset-check-radius"] = `${TYPESET_CHECK.radius[step]}px`;
  d["--typeset-check-gap"] = `${TYPESET_CHECK.gap[step]}px`;
  // Pressed, the box comes in 1px a side, as a button's surface does.
  d["--typeset-check-press"] = `${+((TYPESET_CHECK.box[step] - 2) / TYPESET_CHECK.box[step]).toFixed(4)}`;
  d["--typeset-indent"] = `${TYPESET_CHECK.box[step] + TYPESET_CHECK.gap[step]}px`;
  d["--typeset-sub-indent"] = `${TYPESET_SUB_INDENT[step]}px`;
  return d;
}

const FOREGROUND = "var(--foreground, currentColor)";
const MUTED = "var(--muted-foreground, color-mix(in oklab, currentColor 65%, transparent))";
const BORDER = "var(--border, color-mix(in oklab, currentColor 14%, transparent))";
const WASH = "color-mix(in oklab, currentColor 7%, transparent)";
// The unchecked box's border on hover, as dark as the library's
// (neutral-400 light, neutral-500 dark).
const BORDER_HOVER = "color-mix(in oklab, var(--foreground, currentColor) 40%, transparent)";
// The tick as a mask: the text color shows through it, so it follows the
// theme and never fills the box.
const TICK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='${TICK_PATH}'/%3E%3C/svg%3E") center / calc(var(--typeset-check) + 2px) no-repeat`;

export function typesetRules(scale: TypeScaleData): Rule[] {
  return [
    [
      ":where(.typeset)",
      {
        ...stepDecls(scale, "default"),
        "font-size": v("body"),
        "line-height": v("body-leading"),
        // Text in the muted color, as on the site; headings, links, code,
        // and table headers take the foreground.
        color: MUTED,
        "overflow-wrap": "break-word",
        // A host like ChatMessage keeps whitespace (pre-wrap); markdown puts
        // newlines between blocks, which would render as blank lines.
        "white-space": "normal",
      },
    ],
    // The compact step: compact roles, tighter spacing. On the .typeset
    // element itself, since .typeset sets the default step.
    [":where(.typeset.typeset-compact)", stepDecls(scale, "compact")],

    // Rhythm: space only above an element that follows another, never below
    // the last one, so appending content (streaming) never moves what's
    // already on screen. No :last-child, no :has(), and no text-wrap
    // pretty or balance: both re-wrap earlier lines as text arrives.
    //
    // Every rule sits at specificity 0, so source order decides. The general
    // rhythm comes first, then each case it must not win.
    [el(`${BLOCKS}, ${ANY_HEADING}, li`), { margin: "0" }],
    // Plain wrapping even where a base layer balances headings or makes
    // paragraphs pretty. The longhand, so a <pre> keeps its nowrap mode.
    [el(`p, li, ${ANY_HEADING}`), { "text-wrap-style": "auto" }],
    [flowEl(`* + :is(${BLOCKS}, .not-typeset)`), { "margin-top": v("space-block") }],
    // More room above a heading than between paragraphs, less below it.
    [el("* + :is(h1, h2)"), { "margin-top": v("space-section") }],
    [el("* + :is(h3, h4, h5, h6)"), { "margin-top": v("space-subsection") }],
    [flowEl(`:is(${ANY_HEADING}) + *`), { "margin-top": v("space-heading") }],
    // A rule takes the same room on both sides.
    [el("hr"), { border: "0", "border-top": `1px solid ${BORDER}`, "margin-top": v("space-rule") }],
    [flowEl("hr + *"), { "margin-top": v("space-rule") }],

    [el(ANY_HEADING), { color: FOREGROUND, "font-variation-settings": SEMIBOLD }],
    [
      el("h1"),
      { "font-size": v("display"), "line-height": v("display-leading"), "font-variation-settings": BOLD },
    ],
    [el("h2"), { "font-size": v("title"), "line-height": v("title-leading") }],
    [el("h3, h4, h5, h6"), { "font-size": v("subtitle"), "line-height": v("subtitle-leading") }],

    [el("strong, b"), { "font-variation-settings": SEMIBOLD }],
    [
      el("a"),
      {
        color: FOREGROUND,
        "text-decoration-line": "underline",
        "text-decoration-color": "color-mix(in oklab, currentColor 35%, transparent)",
        "text-underline-offset": "0.2em",
        transition: "text-decoration-color 80ms ease-out",
      },
    ],
    [el("a:hover"), { "text-decoration-color": "currentColor" }],

    // Bullets and numbers sit in the indent, 4px before their text, the way
    // the site's own lists do: their text lands on the indent, the same
    // edge as a to-do's.
    [el("ul, ol"), { "padding-left": `calc(${v("indent")} - ${MARKER_GAP}px)` }],
    // A sub-list steps in less: its text sits the sub-indent past its
    // parent's.
    [el("li ul, li ol"), { "padding-left": `calc(${v("sub-indent")} - ${MARKER_GAP}px)` }],
    [el("li"), { "padding-left": `${MARKER_GAP}px` }],
    [el("ul"), { "list-style-type": "disc" }],
    [el("ol"), { "list-style-type": "decimal" }],
    // Nested numbers outline the way Notion and Docs do: 1. → a. → i., then
    // the cycle repeats, so a level never reads like its parent.
    [el("ol ol"), { "list-style-type": "lower-alpha" }],
    [el("ol ol ol"), { "list-style-type": "lower-roman" }],
    [el("ol ol ol ol"), { "list-style-type": "decimal" }],
    [el("ol ol ol ol ol"), { "list-style-type": "lower-alpha" }],
    [el("ol ol ol ol ol ol"), { "list-style-type": "lower-roman" }],
    [el("ul ul"), { "list-style-type": "circle" }],
    // Pseudo-elements can't sit inside :where(), so the marker goes after it.
    [`${el("li")}::marker`, { color: MUTED }],
    // List rhythm, inside items too. `li > div > …` is a Tiptap to-do, whose
    // text and nested list sit in a content div.
    [
      el("li + li, li > ul, li > ol, li > p + p, li > div > ul, li > div > ol, li > div > p + p"),
      { "margin-top": v("space-item") },
    ],
    // Task lists, where the checkbox is the marker. Markdown renderers emit
    // GFM's classes (remark-gfm); Tiptap marks the list with data-type and
    // puts the checkbox in a label next to a content div. Its editor view
    // drops data-type from the items, so they're matched through the list.
    [el('.contains-task-list, ul[data-type="taskList"]'), { "list-style-type": "none", "padding-left": "0" }],
    // The box is the marker: no item padding in front of it.
    [el('.contains-task-list > li, ul[data-type="taskList"] > li'), { "padding-left": "0" }],
    // Sub-tasks step in the sub-indent too. A GFM item's box starts its
    // content, so a nested list is padded from there; a Tiptap item nests
    // inside its text column, so the list pulls back from there. A plain
    // list under a GFM to-do starts past the to-do's text.
    [el(".contains-task-list .contains-task-list"), { "padding-left": v("sub-indent") }],
    [
      el('ul[data-type="taskList"] > li > div > ul[data-type="taskList"]'),
      { "margin-left": `calc(${v("sub-indent")} - ${v("indent")})` },
    ],
    [
      el(".task-list-item > :is(ul, ol):not(.contains-task-list)"),
      { "padding-left": `calc(${v("indent")} + ${v("sub-indent")} - ${MARKER_GAP}px)` },
    ],
    // The checkbox, as the library draws it: an outline that steps aside for
    // the tick alone when checked, never a filled box.
    [
      el("input[type=checkbox]"),
      {
        appearance: "none",
        position: "relative",
        margin: "0",
        width: v("check"),
        height: v("check"),
        border: `1.5px solid ${BORDER}`,
        "border-radius": v("check-radius"),
        background: "none",
        cursor: "pointer",
        // Button's press timings: in at 80ms, back out on its 180ms curve.
        transition: `border-color 80ms ease-out, scale 180ms ${PRESS_EASE}`,
      },
    ],
    [el("input[type=checkbox]:not(:disabled):hover"), { "border-color": BORDER_HOVER }],
    [
      el("input[type=checkbox]:not(:disabled):active"),
      { scale: v("check-press"), "transition-duration": "80ms, 80ms" },
    ],
    [el("input[type=checkbox]:checked"), { "border-color": "transparent" }],
    // Hovered, a checked box brings its outline back around the tick, in the
    // same color as an unchecked one: still no fill, and plainly clickable.
    [el("input[type=checkbox]:checked:not(:disabled):hover"), { "border-color": BORDER_HOVER }],
    // Read-only markdown renders disabled boxes: no pointer, no fading.
    [el("input[type=checkbox]:disabled"), { cursor: "default" }],
    // On a pseudo-element, not the box: a mask on the box would hide its
    // focus ring too. Pseudo-elements can't sit inside :where().
    [
      `${el("input[type=checkbox]:checked")}::before`,
      {
        content: '""',
        position: "absolute",
        inset: "0",
        "background-color": FOREGROUND,
        "-webkit-mask": TICK,
        mask: TICK,
        transition: `scale 180ms ${PRESS_EASE}`,
      },
    ],
    // Only the outline presses: the tick scales back up by as much, on the
    // same timing, so it holds its size.
    [
      `${el("input[type=checkbox]:checked:not(:disabled):active")}::before`,
      { scale: `calc(1 / ${v("check-press")})`, "transition-duration": "80ms" },
    ],
    // GFM puts the box inline, centered on the first line, straight in the
    // item or, in a loose list, in its paragraph. Its renderers (remark-gfm,
    // GitHub) write a space after the box, about 4px of the gap; the margin
    // makes up the rest, so the text lands on the indent.
    [
      el(".task-list-item input[type=checkbox]"),
      { "vertical-align": "-0.25em", "margin-right": `calc(${v("check-gap")} - 4px)` },
    ],
    [el('ul[data-type="taskList"] > li'), { display: "flex", gap: v("check-gap"), "align-items": "flex-start" }],
    // One line box tall, so the box centers on the first line of the item.
    [
      el('ul[data-type="taskList"] > li > label'),
      { flex: "none", display: "flex", "align-items": "center", height: v("body-leading"), "user-select": "none" },
    ],
    [el('ul[data-type="taskList"] > li > div'), { flex: "1 1 auto", "min-width": "0" }],
    // Only the checked item's own text: a nested list of sub-tasks keeps its
    // own state, since a strike-through can't be undone by descendants.
    // Checking fades the text in the fast tier; unchecking snaps back.
    [
      el('ul[data-type="taskList"] > li[data-checked="true"] > div > :not(ul, ol)'),
      // The line takes the text color: a faded one all but vanishes on dark.
      { color: MUTED, "text-decoration-line": "line-through", transition: STRIKE_ENTER },
    ],
    // The first paragraph draws its line instead, so it can sweep left to
    // right: inline, a background runs line after line, and a ticked item's
    // line grows across its text, then on to the next line. Where and how
    // thick come from Inter's own strike-through, from the top of the
    // inline box: it lands on the line the browser would draw. Already
    // ticked on load, it's simply there: only a change transitions.
    [
      el('ul[data-type="taskList"] > li > div > p:first-child'),
      {
        display: "inline",
        "background-image": "linear-gradient(currentColor, currentColor)",
        "background-repeat": "no-repeat",
        "background-position": `0 ${STRIKE_TOP}`,
        "background-size": `0% ${STRIKE_SIZE}`,
      },
    ],
    [
      el('ul[data-type="taskList"] > li[data-checked="true"] > div > p:first-child'),
      { "text-decoration-line": "none", "background-size": `100% ${STRIKE_SIZE}` },
    ],

    [
      el("blockquote"),
      {
        "padding-left": "1em",
        "border-left": `2px solid ${BORDER}`,
        color: MUTED,
      },
    ],

    // Code and keys set in caption, code in the foreground like the site's
    // code chips. In a heading they keep its scale, a notch down, so a
    // `## The cn() helper` doesn't drop to caption.
    [
      el("code"),
      {
        color: FOREGROUND,
        "font-size": v("caption"),
        "font-family": "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
      },
    ],
    [
      el(":not(pre) > code"),
      { "background-color": WASH, "border-radius": "4px", padding: "0.1em 0.3em" },
    ],
    [
      el("pre"),
      {
        "font-size": v("caption"),
        "line-height": v("caption-leading"),
        "background-color": WASH,
        "border-radius": "8px",
        padding: "0.75em 1em",
        "overflow-x": "auto",
      },
    ],
    [el("pre code"), { "font-size": "1em", background: "none", padding: "0" }],

    [
      el("kbd"),
      {
        "font-family": "inherit",
        "font-size": v("caption"),
        padding: "0.1em 0.35em",
        "border-radius": "4px",
        border: `1px solid ${BORDER}`,
        "box-shadow": `0 1px 0 ${BORDER}`,
      },
    ],
    [el(`:is(${ANY_HEADING}) :is(code, kbd)`), { "font-size": "round(nearest, 0.875em, 1px)" }],

    [el("table"), { width: "100%", "border-collapse": "collapse", "font-variant-numeric": "tabular-nums" }],
    [
      el("th, td"),
      {
        "text-align": "left",
        "vertical-align": "top",
        padding: "0.5em 0.75em",
        "border-bottom": `1px solid ${BORDER}`,
      },
    ],
    [el("th:first-child, td:first-child"), { "padding-left": "0" }],
    [el("th"), { color: FOREGROUND, "font-variation-settings": SEMIBOLD }],
    // A wrapped table scrolls sideways instead of squeezing its columns.
    // .tableWrapper is Tiptap's table wrapper.
    [el(".typeset-scroll, .tableWrapper"), { "overflow-x": "auto" }],
    [el(".typeset-scroll > table, .tableWrapper > table"), { "min-width": "max-content" }],

    [el("img, video"), { "max-width": "100%", height: "auto", "border-radius": "8px" }],
    [
      el("figcaption"),
      {
        "margin-top": v("space-heading"),
        "font-size": v("caption"),
        "line-height": v("caption-leading"),
        color: MUTED,
      },
    ],
  ];
}

/** Forced colors (Windows high contrast) repaint backgrounds with the page
 *  color and show transparent borders: the masked tick would vanish and a
 *  checked box would look unchecked. There, the box goes back to the
 *  browser's own, which those modes draw. */
export const FORCED_COLORS = "@media (forced-colors: active)";
export function forcedColorsRules(): Rule[] {
  return [
    [el("input[type=checkbox]"), { appearance: "auto" }],
    [`${el("input[type=checkbox]:checked")}::before`, { display: "none" }],
  ];
}

/** Reduced motion keeps the fade and drops the sweep: the line is just
 *  there, or gone, as the text dims. */
export const REDUCED_MOTION = "@media (prefers-reduced-motion: reduce)";
export function reducedMotionRules(): Rule[] {
  return [[el('ul[data-type="taskList"] > li > div > :not(ul, ol)'), { "transition-property": "color" }]];
}

const cssBlock = (rules: Rule[], indent: string) =>
  rules
    .map(([sel, decls]) => {
      const lines = Object.entries(decls).map(([k, val]) => `${indent}  ${k}: ${val};`);
      return `${indent}${sel} {\n${lines.join("\n")}\n${indent}}`;
    })
    .join("\n\n");

/** The sheet as CSS text, wrapped in @layer components. */
export function generateTypesetCss(scale: TypeScaleData): string {
  const body = cssBlock(typesetRules(scale), "  ");
  const forced = cssBlock(forcedColorsRules(), "    ");
  const reduced = cssBlock(reducedMotionRules(), "    ");
  return (
    "/* Fluid Functionalism typeset: https://www.fluidfunctionalism.com/docs/typography */\n" +
    `@layer components {\n${body}\n\n  ${FORCED_COLORS} {\n${forced}\n  }\n\n  ${REDUCED_MOTION} {\n${reduced}\n  }\n}\n`
  );
}

/** The sheet as a shadcn registry `css` object. */
export function typesetRegistryCss(
  scale: TypeScaleData
): Record<string, Record<string, Decls | Record<string, Decls>>> {
  const layer: Record<string, Decls | Record<string, Decls>> = {};
  for (const [sel, decls] of typesetRules(scale)) {
    layer[sel] = { ...((layer[sel] as Decls | undefined) ?? {}), ...decls };
  }
  layer[FORCED_COLORS] = Object.fromEntries(forcedColorsRules());
  layer[REDUCED_MOTION] = Object.fromEntries(reducedMotionRules());
  return { "@layer components": layer };
}
