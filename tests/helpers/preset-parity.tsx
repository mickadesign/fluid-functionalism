// Renders a playground's preview and the install its Copy prompt generates
// for the same preset code, both in jsdom, and reads each as a signature:
// the tree of tags, roles, labels, slots, classes and text. Equal signatures
// mean an install draws what the playground draws; a change made to one and
// not the other shows as the first line that differs.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { ComponentType, ReactNode } from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { MotionGlobalConfig } from "motion/react";
import { decodePreset } from "@/lib/preset/codec";
import { PRESET_GENERATORS } from "@/lib/preset/generators";
import { playgroundMap } from "@/lib/docs/playgrounds";
import { IconPlaygroundProvider } from "@/lib/docs/icon-playground";
import { BaseProvider } from "@/lib/base-context";
import { AccentProvider } from "@/lib/docs/accent";
import { HoverModeProvider } from "@/lib/docs/hover-mode";

/** The site's setting providers at their defaults, around both sides: a
 *  playground reads them, and an install drawn inside the same ones is
 *  compared on what the generator wrote, not on which icon set or flavor
 *  an app happens to have. */
function Site({ children }: { children: ReactNode }) {
  return (
    <IconPlaygroundProvider>
      <BaseProvider>
        <AccentProvider defaultPreset="blue" defaultCustom={null}>
          <HoverModeProvider defaultMode="fluid">{children}</HoverModeProvider>
        </AccentProvider>
      </BaseProvider>
    </IconPlaygroundProvider>
  );
}

const here = path.dirname(fileURLToPath(import.meta.url));
/** Where generated files are written to be imported (gitignored). */
const OUT = path.join(here, "..", ".parity");

/** Installed paths that live elsewhere in this repo. */
const REPO_ALIASES: Record<string, string> = {
  "@/components/queued-stack": "@/registry/blocks/queued-stack",
  "@/components/ui/chat-message": "@/registry/default/chat-message",
};

/** jsdom lacks these; the components only need them to exist. */
export function stubBrowser() {
  // Animations land at once: a playground applies its preset after it
  // mounts, and a swap still mid-way (the old icon waiting to leave) would
  // read as a difference from an install that starts in that state.
  MotionGlobalConfig.skipAnimations = true;
  class Observer {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  const g = globalThis as Record<string, unknown>;
  g.ResizeObserver ??= Observer;
  g.IntersectionObserver ??= Observer;
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView ??= () => {};
  Element.prototype.scrollTo ??= (() => {}) as typeof Element.prototype.scrollTo;
  Element.prototype.animate ??= (() => ({
    finished: Promise.resolve(),
    cancel() {},
    finish() {},
    pause() {},
    play() {},
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof Element.prototype.animate;
  Element.prototype.getAnimations ??= () => [];
  (document as unknown as { getAnimations?: () => unknown[] }).getAnimations ??= () => [];
  g.CSS ??= {};
  (g.CSS as { escape?: (v: string) => string }).escape ??= (value: string) => value.replace(/["\\\]\[]/g, "\\$&");
  (g.CSS as { supports?: () => boolean }).supports ??= () => false;
  const rect = { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON: () => ({}) } as DOMRect;
  Range.prototype.getBoundingClientRect ??= () => rect;
  Range.prototype.getClientRects ??= (() => []) as unknown as typeof Range.prototype.getClientRects;
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
}

const tick = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });

/** Waits for the page to stop changing: a first load lands its rows in a
 *  transition, a preset is applied after mounting, and on a busy machine
 *  either can take a while. Two reads in a row that agree, not a fixed
 *  wait. */
const settle = async () => {
  let last = "";
  let same = 0;
  for (let i = 0; i < 60; i++) {
    await tick();
    await tick();
    const now = document.body.innerHTML.length + ":" + document.body.textContent?.length;
    // A table handing its skeletons over to the rows is mid-change even
    // when two reads agree: its swap ends on a timer and a transition,
    // which a loaded machine can hold back past a few ticks.
    const swapping = document.querySelector("[class*='animate-[reveal-out']") !== null;
    same = now === last && !swapping ? same + 1 : 0;
    if (same >= 2) return;
    last = now;
  }
  // Still changing after 60 rounds: comparing it would compare a moment,
  // not the page. A failure of its own, not a difference.
  throw new Error("the page never settled: it was still changing after 3.6s");
};

/** Classes only the site has (its heading font setting): an install can't
 *  carry them, and says so where it leaves one out. */
const SITE_ONLY_CLASSES = new Set(["font-heading-display"]);

/** A subtree as text: one line per element (tag, role, label, slot, sorted
 *  classes) and per text node. Ids and inline styles are left out: ids are
 *  generated, styles are written by animations frame by frame. */
export function signature(root: Element): string {
  const lines: string[] = [];
  const walk = (node: Node, depth: number) => {
    const pad = "  ".repeat(depth);
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.replace(/\s+/g, " ").trim();
      if (text) lines.push(`${pad}"${text}"`);
      return;
    }
    if (!(node instanceof Element)) return;
    // The toasts' own region: the site mounts one in its layout, an
    // install brings its own inside the block.
    if (node.matches("section[aria-label^=Notifications]")) return;
    // A box of no layout (`display: contents`, nothing else on it) draws
    // nothing: what is inside it is read at its level.
    if (node.tagName === "DIV" && node.className === "contents" && node.attributes.length === 1) {
      for (const child of node.childNodes) walk(child, depth);
      return;
    }
    const attrs = ["role", "aria-label", "aria-expanded", "aria-checked", "aria-selected", "aria-pressed", "data-slot", "data-state", "type", "placeholder", "colspan"]
      .map((name) => (node.hasAttribute(name) ? ` ${name}="${node.getAttribute(name)}"` : ""))
      .join("") +
      // A link is a link: where it goes differs by design (the playground's
      // stay on the site; an install's go to the site from outside it).
      (node.hasAttribute("href") ? " href" : "");
    const classes = [...node.classList].filter((c) => !SITE_ONLY_CLASSES.has(c)).sort().join(" ");
    lines.push(`${pad}<${node.tagName.toLowerCase()}${attrs}${classes ? ` class="${classes}"` : ""}>`);
    for (const child of node.childNodes) walk(child, depth + 1);
  };
  walk(root, 0);
  return lines.join("\n");
}

/** The first line where two signatures part, with a little around it. */
export function firstDifference(a: string, b: string): string | null {
  if (a === b) return null;
  const x = a.split("\n");
  const y = b.split("\n");
  let i = 0;
  while (i < x.length && i < y.length && x[i] === y[i]) i++;
  const around = (lines: string[]) => lines.slice(Math.max(0, i - 3), i + 4).join("\n");
  return `line ${i + 1}\n--- playground\n${around(x)}\n--- install\n${around(y)}`;
}

export interface ParityCase {
  /** The docs slug: its playground and its preset share it. */
  slug: string;
  /** The preset code to draw on both sides. */
  code: string;
  /** The generated file to render, by its installed path. */
  main: string;
  /** Its export; the default export when omitted. */
  exportName?: string;
  /** What differs on purpose, written out: applied to both signatures
   *  before they are compared (the site's own identity, which an install
   *  replaces with a placeholder). */
  normalize?: (signature: string) => string;
  /** A button to click first on both sides, by its text (one that opens
   *  what is compared, as a dialog). */
  open?: string;
  /** The root's own classes differ by design (a page fills the window, a
   *  preview fills its frame): compare what is inside it. */
  inside?: boolean;
  /** What to compare, as a selector inside each side. Omitted, it is the
   *  install's outermost element, and in the playground the first element
   *  with the same tag and classes (its preview adds a frame around it). */
  root?: string;
}

const head = (el: Element) => signature(el).split("\n")[0];

async function openFirst(c: ParityCase, scope: Element) {
  if (!c.open) return;
  const control = [...scope.querySelectorAll("button")].find((b) => b.textContent?.includes(c.open!));
  if (!control) throw new Error(`${c.slug}: no button reading "${c.open}"`);
  fireEvent.click(control);
  await settle();
}

/** The playground's preview for a code, as a signature. `like` is the
 *  install's outermost element, to find the same one here. */
export async function playgroundSignature(c: ParityCase, like?: string): Promise<string> {
  const Playground = playgroundMap[c.slug];
  // The playground reads its preset from the address, as on the site.
  window.history.replaceState(null, "", `/docs/${c.slug}?preset=${c.code}`);
  const view = render(
    <Site>
      <Playground>{(parts) => <div data-parity="">{parts.preview}</div>}</Playground>
    </Site>
  );
  await settle();
  const scope = view.container.querySelector("[data-parity]")!;
  await openFirst(c, scope);
  const root = c.root
    ? (scope.querySelector(c.root) ?? document.body.querySelector(c.root))
    : [...scope.querySelectorAll("*")].find((el) => head(el) === like);
  if (!root) {
    const outline = signature(scope).split("\n").slice(0, 14).join("\n");
    view.unmount();
    throw new Error(`${c.slug}: the playground's preview has no ${c.root ?? like}\n${outline}`);
  }
  const text = c.inside ? [...root.children].map(signature).join("\n") : signature(root);
  view.unmount();
  return c.normalize ? c.normalize(text) : text;
}

/** The generated install for a code, written out, imported and drawn. */
export async function installSignature(c: ParityCase): Promise<string> {
  const decoded = decodePreset(c.code);
  if (!decoded.ok) throw new Error(`${c.slug}: ${decoded.error}`);
  const files = PRESET_GENERATORS[decoded.def.tag].files(decoded.preset);
  const dir = path.join(OUT, `${c.slug}-${c.code}`);
  rmSync(dir, { recursive: true, force: true });
  const byImport = new Map(files.map((f) => [`@/${f.target.replace(/\.tsx?$/, "")}`, path.join(dir, f.target)]));
  for (const file of files) {
    const at = path.join(dir, file.target);
    mkdirSync(path.dirname(at), { recursive: true });
    let content = file.content;
    // The generated files import each other by their installed paths.
    for (const [spec, target] of byImport) {
      let rel = path.relative(path.dirname(at), target).replace(/\.tsx?$/, "");
      if (!rel.startsWith(".")) rel = `./${rel}`;
      content = content.split(`"${spec}"`).join(`"${rel}"`);
    }
    for (const [spec, repo] of Object.entries(REPO_ALIASES)) content = content.split(`"${spec}"`).join(`"${repo}"`);
    writeFileSync(at, content);
  }
  const mod = (await import(/* @vite-ignore */ pathToFileURL(path.join(dir, c.main)).href)) as Record<string, ComponentType>;
  const Demo = c.exportName ? mod[c.exportName] : mod.default;
  if (!Demo) throw new Error(`${c.slug}: ${c.main} has no export ${c.exportName ?? "default"}`);
  window.history.replaceState(null, "", "/");
  const view = render(
    <Site>
      <div data-parity="">
        <Demo />
      </div>
    </Site>
  );
  await settle();
  const scope = view.container.querySelector("[data-parity]")!;
  await openFirst(c, scope);
  const root = c.root ? (scope.querySelector(c.root) ?? document.body.querySelector(c.root)) : scope.firstElementChild;
  if (!root) throw new Error(`${c.slug}: no "${c.root}" in the install`);
  const text = c.inside ? [...root.children].map(signature).join("\n") : signature(root);
  view.unmount();
  return c.normalize ? c.normalize(text) : text;
}
