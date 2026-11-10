"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { Fragment, useMemo } from "react";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TableKit } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extensions";
import { cn } from "@/lib/utils";
import { useShape } from "@/registry/default/lib/shape-context";
import { useSizeVariant } from "@/lib/size-context";
import { useThemeContext } from "@/registry/default/lib/theme-context";
import { Switch } from "@/registry/radix/switch";
import { Tooltip } from "@/registry/radix/tooltip";
import { typeStyles } from "@/lib/type-scale";
import { selectorList, typesetRules } from "@/lib/typeset/generate";
import { ACCENT_VAR } from "@/lib/accent";

/** Starting HTML of the Markdown section on /docs/typography: a
 *  getting-started doc with most of what markdown writes: 3 heading levels,
 *  bold, italic, strikethrough, inline code, a link, nested bullets, numbers,
 *  and to-dos, a quote, a table, a code block, and a rule. */
export const MARKDOWN_SAMPLE = [
  "<h1>Getting started with Fluid Functionalism</h1>",
  "<p><strong>Flavors</strong> Radix and Base UI · <strong>Stack</strong> React and Tailwind v4 · <strong>License</strong> MIT</p>",
  "<h2>Setup</h2>",
  '<ul data-type="taskList">',
  '<li data-type="taskItem" data-checked="true"><p>Install the type scale and the markdown styles</p></li>',
  '<li data-type="taskItem" data-checked="true"><p>Add a dropdown and a dialog</p></li>',
  '<li data-type="taskItem" data-checked="false"><p>Move every list to fluid hover</p>',
  '<ul data-type="taskList">',
  '<li data-type="taskItem" data-checked="true"><p>Sidebar</p></li>',
  '<li data-type="taskItem" data-checked="false"><p>Command menu</p></li>',
  "</ul></li>",
  '<li data-type="taskItem" data-checked="false"><p>Switch dense screens to compact</p></li>',
  "</ul>",
  "<h2>How it moves</h2>",
  '<p>Every component animates with <strong>3 spring speeds</strong>, and hover <em>glides</em> to the item under your cursor instead of blinking. A label turns <code>semibold</code> without moving its neighbors, since <code>fontWeights</code> pairs each weight with an optical size. The <a href="/docs/motion">motion page</a> has every value.</p>',
  "<blockquote><p>No component invents its own timing, so everything moves at the same pace.</p></blockquote>",
  "<h3>What you get</h3>",
  "<ul>",
  "<li><p>Components in 2 flavors</p><ul><li><p>Radix</p></li><li><p>Base UI</p></li></ul></li>",
  "<li><p>A size ladder of 36px and 28px rows</p></li>",
  "<li><p>A skill for your coding agent</p></li>",
  "</ul>",
  "<h3>Spring speeds</h3>",
  "<table><tbody>",
  "<tr><th><p>Speed</p></th><th><p>Duration</p></th><th><p>Used for</p></th></tr>",
  "<tr><td><p>fast</p></td><td><p>0.08s</p></td><td><p>Hover, tooltips, focus rings</p></td></tr>",
  "<tr><td><p>moderate</p></td><td><p>0.16s</p></td><td><p>Dropdowns and tabs</p></td></tr>",
  "<tr><td><p>slow</p></td><td><p>0.24s</p></td><td><p>Dialogs and drawers</p></td></tr>",
  "</tbody></table>",
  "<h2>Install</h2>",
  "<p>Each piece installs with the shadcn CLI. We planned to <s>ship one big bundle</s> ship one item per component, so you only add what you use:</p>",
  '<pre><code class="language-bash"># One component\nnpx shadcn@latest add https://www.fluidfunctionalism.com/r/dropdown.json\n\n# The skill for your coding agent\nnpx skills add mickadesign/fluid-functionalism</code></pre>',
  "<h3>Next steps</h3>",
  "<ol>",
  "<li><p>Read the craft notes for each component</p></li>",
  "<li><p>Install the skill</p><ol><li><p>Let it read your stack</p></li><li><p>Fix what it flags</p></li></ol></li>",
  "<li><p>Ship it</p></li>",
  "</ol>",
  "<hr>",
  "<p>Found a bug? Open an issue on <strong>GitHub</strong>.</p>",
].join("");

// Tiptap's markdown shortcuts format as you type: "# " heading, "- " list,
// "1. " numbered, "[] " to-do, "> " quote, "```" code, "---" rule, and
// **bold**, *italic*, `code` inline. It emits plain elements, so the sheet
// styles the live document the same way it styles rendered markdown.
const EXTENSIONS = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3, 4, 5, 6] },
    link: { openOnClick: false },
  }),
  TaskList,
  TaskItem.configure({ nested: true }),
  TableKit.configure({ table: { resizable: false, renderWrapper: true } }),
  // Short and per line, like Notion: a long hint wraps and runs into the
  // next block, since the placeholder takes no height.
  Placeholder.configure({
    placeholder: ({ node }) =>
      node.type.name === "heading"
        ? `Heading ${node.attrs.level}`
        : node.type.name === "codeBlock"
          ? "Code"
          : "Write something",
  }),
];

// Made once per editor, so useEditor doesn't re-apply it on every render.
// Its setProps would drop the role Tiptap adds on create, so the role is set
// here too. `relative` keeps the editor above the inspect bands (both
// positioned, painted in tree order).
const editorPropsFor = (label: string) => ({
  attributes: {
    class: "relative outline-none",
    role: "textbox",
    "aria-multiline": "true",
    "aria-label": label,
  },
});

// Tiptap marks the empty line with data-placeholder; show it as a ghost.
const PLACEHOLDER =
  "[&_.is-empty]:before:pointer-events-none [&_.is-empty]:before:float-left [&_.is-empty]:before:h-0 [&_.is-empty]:before:whitespace-nowrap [&_.is-empty]:before:text-muted-foreground [&_.is-empty]:before:content-[attr(data-placeholder)]";

// ── Inspect ──────────────────────────────────────────────
// Hover a text block to see its line boxes (one band per line) and a readout
// of its measured font size and line height. It also shows who owns the
// space around the block: the margin above it (the sheet only
// ever spaces from the top, so that margin can belong to the block itself or
// to a list item or list it opens), padding, and flex gaps, each with the
// sheet rule that set it, so a refinement knows which rule to touch. One
// block at a time: the one under the pointer, or the nearest when the
// pointer sits between blocks, so it never blinks off. Measured from the live
// DOM, in the colors and tooltip of the site's inspector
// (lib/docs/InspectOverlay.tsx); margins in orange, as browser devtools do.

// A type alias, not an interface, so a box passes straight in as a style.
type Box = {
  top: number;
  left: number;
  width: number;
  height: number;
};

interface InspectMark {
  el: HTMLElement;
  /** Border box: what the pointer is matched against. */
  box: Box;
  /** Content box: where the line bands go (inside a code block's padding). */
  content: Box;
  fontSize: number;
  /** Line height in px: one band per line. */
  lineHeight: number;
}

const INSPECT_BLOCKS = ".ProseMirror :is(h1, h2, h3, h4, h5, h6, p, pre, figcaption)";
const INSPECT_LINE = ACCENT_VAR;
const INSPECT_BAND = "color-mix(in oklab, var(--fluid-accent, #6B97FF) 16%, transparent)";
const INSPECT_TONES = {
  margin: { fill: "rgba(255, 168, 82, 0.28)", line: "rgba(240, 140, 40, 0.9)" },
  padding: { fill: "rgba(153, 255, 201, 0.35)", line: "rgba(83, 214, 145, 0.9)" },
} as const;

/** The theme opposite the page's. The tooltip inverts the page
 *  (bg-foreground), so its readout sits in that theme's scope, the way the
 *  forced-theme previews do: muted there is the muted made for that surface. */
function useInverseTheme(): "light" | "dark" {
  const { theme } = useThemeContext();
  const [osDark, setOsDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setOsDark(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return theme === "dark" || (theme === "system" && osDark) ? "light" : "dark";
}

const pxLabel = (value: number) => {
  const n = Math.round(value * 10) / 10;
  return `${Number.isInteger(n) ? n : n.toFixed(1)}px`;
};

/** Every block's boxes relative to `frame`, in document order. */
function measureBlocks(frame: HTMLElement): InspectMark[] {
  const base = frame.getBoundingClientRect();
  const blocks = Array.from(frame.querySelectorAll<HTMLElement>(INSPECT_BLOCKS));
  return blocks.map((el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const [pt, pr, pb, pl] = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(parseFloat);
    const box = { top: r.top - base.top, left: r.left - base.left, width: r.width, height: r.height };
    return {
      el,
      box,
      content: { top: box.top + pt, left: box.left + pl, width: box.width - pl - pr, height: box.height - pt - pb },
      fontSize: parseFloat(cs.fontSize),
      lineHeight: parseFloat(cs.lineHeight),
    };
  });
}

/** Distance from a point to a box (0 inside). */
const distance = (x: number, y: number, b: Box) =>
  Math.hypot(
    Math.max(b.left - x, 0, x - (b.left + b.width)),
    Math.max(b.top - y, 0, y - (b.top + b.height))
  );

// ── Spacing: who owns the space around a block, and which rule set it ──

interface SpaceMark {
  kind: "Margin top" | "Padding top" | "Padding bottom" | "Gap";
  value: number;
  /** The element the space belongs to, e.g. "li". */
  owner: string;
  /** The sheet rule that set it, as its matching selector. */
  rule: string | null;
  band: Box;
  tone: keyof typeof INSPECT_TONES;
}

// The sheet's own rules (the ones generateTypesetCss writes), to trace a
// margin or padding back to its selector. Values don't change selectors.
const SHEET_RULES = typesetRules(typeStyles);

/** The selector list a sheet rule opens with, `:where(.typeset p, …)`,
 *  split at its top-level commas. */
function whereParts(sel: string): string[] {
  if (!sel.startsWith(":where(")) return [];
  let depth = 0;
  let i = 0;
  for (; i < sel.length; i++) {
    if (sel[i] === "(") depth++;
    else if (sel[i] === ")" && --depth === 0) break;
  }
  return selectorList(sel.slice(":where(".length, i));
}

const safeMatches = (el: Element, sel: string) => {
  try {
    return el.matches(sel);
  } catch {
    return false;
  }
};

/** The last sheet rule (same specificity, so order wins) that sets `prop`
 *  on `el`, as its selector. */
function ruleFor(el: HTMLElement, prop: "margin-top" | "padding-top" | "padding-bottom" | "gap"): string | null {
  const short = prop === "margin-top" ? "margin" : prop === "gap" ? "gap" : "padding";
  for (let i = SHEET_RULES.length - 1; i >= 0; i--) {
    const [sel, decls] = SHEET_RULES[i];
    const value = decls[prop] ?? decls[short];
    if (value === undefined || sel.includes("::") || !safeMatches(el, sel)) continue;
    const part = whereParts(sel).find((p) => safeMatches(el, p)) ?? sel;
    // An element list reads better as the element it matched: the block
    // itself at the end, the one before it in front of a `+`.
    const tag = (n: Element | null) => n?.tagName.toLowerCase() ?? "*";
    const readable = part
      .replace(/^\.typeset /, "")
      .replace(/:is\([^)]*\)$/, tag(el))
      .replace(/:is\([^)]*\)/, tag(el.previousElementSibling));
    return readable;
  }
  return null;
}

const isRow = (n: HTMLElement) => {
  const cs = getComputedStyle(n);
  return /flex/.test(cs.display) && !cs.flexDirection.startsWith("column");
};

/** The space around `el` and who owns it, as bands relative to `frame`. */
function spacingOf(el: HTMLElement, frame: HTMLElement): SpaceMark[] {
  const root = frame.querySelector<HTMLElement>(".ProseMirror");
  if (!root) return [];
  const base = frame.getBoundingClientRect();
  const rel = (n: Element): Box => {
    const r = n.getBoundingClientRect();
    return { top: r.top - base.top, left: r.left - base.left, width: r.width, height: r.height };
  };
  const name = (n: Element) => n.tagName.toLowerCase();
  const out: SpaceMark[] = [];

  const padding = (n: HTMLElement, side: "top" | "bottom") => {
    const cs = getComputedStyle(n);
    const value = parseFloat(side === "top" ? cs.paddingTop : cs.paddingBottom);
    if (value < 0.5) return;
    const b = rel(n);
    const border = parseFloat(side === "top" ? cs.borderTopWidth : cs.borderBottomWidth);
    out.push({
      kind: side === "top" ? "Padding top" : "Padding bottom",
      value,
      owner: name(n),
      rule: ruleFor(n, side === "top" ? "padding-top" : "padding-bottom"),
      band: {
        top: side === "top" ? b.top + border : b.top + b.height - border - value,
        left: b.left,
        width: b.width,
        height: value,
      },
      tone: "padding",
    });
  };

  // Above: the block's own padding, then its margin, then up through every
  // ancestor it opens (a first child shares its parent's space above).
  padding(el, "top");
  let node: HTMLElement = el;
  while (node !== root) {
    const mt = parseFloat(getComputedStyle(node).marginTop);
    if (mt >= 0.5) {
      const b = rel(node);
      out.push({
        kind: "Margin top",
        value: mt,
        owner: name(node),
        rule: ruleFor(node, "margin-top"),
        band: { top: b.top - mt, left: b.left, width: b.width, height: mt },
        tone: "margin",
      });
    }
    const parent: HTMLElement | null = node.parentElement;
    if (!parent || parent === root) break;
    // A sibling before it stacks above it, so the space is the block's own;
    // in a flex row (a to-do's checkbox) siblings sit beside it instead.
    if (node.previousElementSibling && !isRow(parent)) break;
    padding(parent, "top");
    if (getComputedStyle(parent).display === "table-cell") break;
    node = parent;
  }

  // Below: the block's own padding, then any ancestor it closes. The sheet
  // never adds margin below, so that's all the space under it.
  padding(el, "bottom");
  node = el;
  while (node !== root) {
    const parent: HTMLElement | null = node.parentElement;
    if (!parent || parent === root) break;
    if (node.nextElementSibling && !isRow(parent)) break;
    padding(parent, "bottom");
    if (getComputedStyle(parent).display === "table-cell") break;
    node = parent;
  }

  // Gap: the nearest flex or grid ancestor that spaces its children, like a
  // to-do's checkbox and its text.
  for (let n = el.parentElement; n && n !== root; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (!/flex|grid/.test(cs.display)) continue;
    const gap = Math.max(parseFloat(cs.columnGap) || 0, parseFloat(cs.rowGap) || 0);
    const [a, b] = Array.from(n.children);
    if (gap < 0.5 || !a || !b) break;
    const ra = rel(a);
    const rb = rel(b);
    const host = rel(n);
    out.push({
      kind: "Gap",
      value: gap,
      owner: name(n),
      rule: ruleFor(n as HTMLElement, "gap"),
      band: { top: host.top, left: ra.left + ra.width, width: Math.max(1, rb.left - ra.left - ra.width), height: host.height },
      tone: "padding",
    });
    break;
  }
  return out;
}

/** An editable `.typeset` document, like a Notion page: no source pane,
 *  markdown shortcuts format in place. It follows the page's size step (S). */
export function TypesetEditor({ content, label }: { content: string; label: string }) {
  const shape = useShape();
  const inverse = useInverseTheme();
  const typesetClassName = useSizeVariant() === "compact" ? "typeset-compact" : undefined;
  const [editorProps] = useState(() => editorPropsFor(label));
  const [inspect, setInspect] = useState(false);
  const [marks, setMarks] = useState<InspectMark[]>([]);
  const [hovered, setHovered] = useState<number | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: EXTENSIONS,
    content,
    // Rendered on the client only; the static copy below covers SSR.
    immediatelyRender: false,
    editorProps,
  });

  // Re-measure on every edit, resize, and change of step.
  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!inspect || !frame || !editor) return;
    const measure = () => setMarks(measureBlocks(frame));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(frame);
    editor.on("update", measure);
    return () => {
      ro.disconnect();
      editor.off("update", measure);
    };
  }, [inspect, editor, typesetClassName]);

  // The block under the pointer, or the nearest one from a gap.
  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const frame = frameRef.current;
    if (!inspect || !frame || marks.length === 0) return;
    const base = frame.getBoundingClientRect();
    const x = e.clientX - base.left;
    const y = e.clientY - base.top;
    let best = 0;
    marks.forEach((m, i) => {
      if (distance(x, y, m.box) < distance(x, y, marks[best].box)) best = i;
    });
    setHovered((h) => (h === best ? h : best));
  };

  const mark = inspect && hovered !== null ? marks[hovered] : undefined;
  const spacing = useMemo(
    () => (mark && frameRef.current ? spacingOf(mark.el, frameRef.current) : []),
    [mark]
  );

  // A click in the page margin lands at the end of the document, as in Notion.
  const focusEnd = (e: MouseEvent<HTMLDivElement>) => {
    if (!editor || (e.target as HTMLElement).closest(".ProseMirror")) return;
    e.preventDefault();
    editor.commands.focus("end");
  };

  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden border border-border/60 transition-[border-color] duration-150 ease-out focus-within:border-foreground/40",
        shape.container
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/60 py-1.5 pl-4 pr-2">
        <p className="hidden min-w-0 text-site-caption text-muted-foreground sm:block">
          Type <code>#</code> for a heading, <code>-</code> for a list, <code>[]</code> for a to-do,{" "}
          <code>&gt;</code> for a quote.
        </p>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <Switch
            label="Inspect"
            checked={inspect}
            onToggle={() => {
              setInspect((v) => !v);
              setHovered(null);
            }}
            className="h-8 px-2 rounded-md"
          />
        </div>
      </div>
      <div
        onMouseDown={focusEnd}
        className="cursor-text bg-background px-5 py-6 sm:px-8 sm:py-8"
      >
        <div
          ref={frameRef}
          onPointerMove={pick}
          onPointerLeave={() => setHovered(null)}
          className="relative w-full text-foreground"
        >
          {/* The bands paint under the text (the editor root is positioned
              and comes later). None of the overlay takes the pointer. */}
          {mark && (
            <div
              aria-hidden
              className="pointer-events-none absolute"
              style={{
                ...mark.content,
                backgroundImage: `repeating-linear-gradient(to bottom, ${INSPECT_BAND} 0 ${mark.lineHeight}px, transparent ${mark.lineHeight}px ${mark.lineHeight * 2}px)`,
                outline: `1px solid ${INSPECT_LINE}`,
              }}
            />
          )}
          {spacing.map((sp, i) => (
            <div
              key={i}
              aria-hidden
              className="pointer-events-none absolute flex items-center justify-center"
              style={{
                ...sp.band,
                background: INSPECT_TONES[sp.tone].fill,
                outline: `1px dashed ${INSPECT_TONES[sp.tone].line}`,
                outlineOffset: -1,
              }}
            >
              <span className="font-mono text-[9px] leading-none text-foreground" style={{ fontVariationSettings: fontWeights.semibold }}>
                {Math.round(sp.value * 10) / 10}
              </span>
            </div>
          ))}
          <div className={cn("typeset", typesetClassName, PLACEHOLDER)}>
            {editor ? (
              <EditorContent editor={editor} />
            ) : (
              // Our own constant sample, never user input.
              <div className="tiptap ProseMirror" dangerouslySetInnerHTML={{ __html: content }} />
            )}
          </div>
          {mark && (
            <Tooltip
              forceOpen
              side="top"
              sideOffset={8}
              content={
                <div className={cn(inverse, "grid grid-cols-[auto_auto] gap-x-4 font-mono text-[11px] leading-4 tabular-nums")}>
                  <span className="text-muted-foreground">Font size</span>
                  <span className="text-right">{pxLabel(mark.fontSize)}</span>
                  <span className="text-muted-foreground">Line height</span>
                  <span className="text-right">{pxLabel(mark.lineHeight)}</span>
                  {spacing.map((sp, i) => (
                    <Fragment key={i}>
                      <span className="mt-1.5 text-muted-foreground">{sp.kind}</span>
                      <span className="mt-1.5 text-right">{pxLabel(sp.value)}</span>
                      <span className="col-span-2 text-muted-foreground">
                        {sp.owner}
                        {sp.rule ? ` · ${sp.rule}` : ""}
                      </span>
                    </Fragment>
                  ))}
                </div>
              }
              className="!px-3 !py-2.5 max-w-[300px]"
            >
              <div aria-hidden className="pointer-events-none absolute" style={mark.content} />
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
