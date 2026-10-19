import { fromMarkdown } from "mdast-util-from-markdown";
import type { Code, List, ListItem, Paragraph, PhrasingContent, RootContent } from "mdast";

// ---------------------------------------------------------------------------
// The monthly release files in content/changelog/ are Markdown in one strict
// shape (see changelog-guidelines.md). This module turns a file into data
// and throws on anything outside that shape, so a malformed release fails
// the build and the test instead of rendering half a page.
// ---------------------------------------------------------------------------

export const CHANGE_KINDS = ["new", "breaking", "updated"] as const;
export type ChangeKind = (typeof CHANGE_KINDS)[number];

export const KIND_LABEL: Record<ChangeKind, string> = {
  breaking: "Breaking",
  new: "New",
  updated: "Updated",
};

/** Sentence text: plain runs and inline code, nothing else. */
export type Inline = { type: "text"; value: string } | { type: "code"; value: string };

export type ChangeRef = { type: "pr"; number: number } | { type: "commit"; sha: string };

export interface ChangeEntry {
  kind: ChangeKind;
  name: string;
  /** A site route (`/docs/banner`), or null for a change that spans many
   *  components (a bold label in the file). */
  href: string | null;
  text: Inline[];
  refs: ChangeRef[];
  /** The ```diff block a Breaking entry carries, without its fence. */
  diff: string | null;
  /** The language the diff's lines are in: ```diff alone is TSX, and
   *  ```diff css (or ts, json, bash) names another. Null without a diff. */
  diffLang: DiffLang | null;
}

export interface ChangeGroup {
  kind: ChangeKind;
  entries: ChangeEntry[];
}

export interface Release {
  /** `YYYY-MM`, the month the release covers. */
  month: string;
  /** `YYYY-MM-DD`, the first Friday it shipped. Null for backfilled months. */
  released: string | null;
  title: string;
  intro: Inline[] | null;
  groups: ChangeGroup[];
}

export class ChangelogFormatError extends Error {
  constructor(file: string, line: number | undefined, message: string) {
    super(`${file}${line ? `:${line}` : ""}: ${message}`);
    this.name = "ChangelogFormatError";
  }
}

/** The languages a Breaking diff can be highlighted in, TSX first. */
export const DIFF_LANGS = ["tsx", "ts", "css", "json", "bash"] as const;
export type DiffLang = (typeof DIFF_LANGS)[number];

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const DAY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const REF = /^(#\d+|[0-9a-f]{7,12})$/;
const REFS_TAIL = /\s*\(([^()]+)\)$/;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;
const HEADINGS: Record<string, ChangeKind> = {
  Breaking: "breaking",
  New: "new",
  Updated: "updated",
};

/** The month after `YYYY-MM`, as `YYYY-MM`. */
export function nextMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return m === 12 ? `${year + 1}-01` : `${year}-${String(m + 1).padStart(2, "0")}`;
}

export function parseRelease(source: string, file = "release.md"): Release {
  const fail = (line: number | undefined, message: string): never => {
    throw new ChangelogFormatError(file, line, message);
  };

  // Em dashes are out everywhere (tone-of-voice.md), fences included.
  const dash = source.split("\n").findIndex((l) => l.includes("—"));
  if (dash !== -1) fail(dash + 1, "em dash; use a comma, a colon, or a full stop");

  const front = FRONTMATTER.exec(source);
  if (!front) fail(1, "missing the --- frontmatter block");
  const meta: Record<string, string> = {};
  front![1].split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const match = /^([a-z]+):\s*(.+)$/.exec(line);
    if (!match) fail(i + 2, `frontmatter line is not \`key: value\`: ${line}`);
    const [, key, value] = match!;
    if (!["month", "released", "title"].includes(key)) fail(i + 2, `unknown frontmatter key \`${key}\``);
    meta[key] = value.trim();
  });

  const { month, released, title } = meta;
  if (!month || !MONTH.test(month)) fail(2, "`month` must be YYYY-MM");
  if (!title) fail(2, "`title` is required");
  if (title.length > 90) fail(2, "`title` runs past 90 characters");
  if (/\.$/.test(title)) fail(2, "`title` ends with a period");
  if (released !== undefined) {
    if (!DAY.test(released)) fail(2, "`released` must be YYYY-MM-DD");
    // The pattern lets 2026-02-31 through; Date would roll it into March.
    if (new Date(`${released}T00:00:00Z`).toISOString().slice(0, 10) !== released) {
      fail(2, `\`released\` is not a real day: ${released}`);
    }
    if (released < `${nextMonth(month)}-01`) fail(2, "`released` falls before the month ended");
  }

  // Line numbers in the body are offset by the frontmatter block.
  const offset = front![0].split("\n").length - 1;
  const tree = fromMarkdown(source.slice(front![0].length));
  const lineOf = (node: RootContent | PhrasingContent | ListItem) =>
    node.position ? node.position.start.line + offset : undefined;

  let intro: Inline[] | null = null;
  const groups: ChangeGroup[] = [];
  let current: ChangeGroup | null = null;
  let expectList = false;

  for (const node of tree.children) {
    if (node.type === "heading") {
      if (node.depth !== 2) fail(lineOf(node), "only `##` headings are allowed");
      const label = node.children.length === 1 && node.children[0].type === "text" ? node.children[0].value : "";
      const kind = HEADINGS[label];
      if (!kind) fail(lineOf(node), `unknown section \`${label}\`; use New, Breaking, or Updated`);
      const last = groups[groups.length - 1];
      if (last && CHANGE_KINDS.indexOf(kind) <= CHANGE_KINDS.indexOf(last.kind)) {
        fail(lineOf(node), "sections run New, Breaking, Updated, each once");
      }
      if (expectList) fail(lineOf(node), "the previous section has no entries");
      current = { kind, entries: [] };
      groups.push(current);
      expectList = true;
      continue;
    }
    if (!current) {
      if (node.type === "paragraph" && intro === null) {
        intro = parseInline(node.children, fail, lineOf(node));
        continue;
      }
      fail(lineOf(node), "only one intro paragraph may sit above the first section");
    }
    if (node.type !== "list" || !expectList) {
      fail(lineOf(node), "a section holds exactly one bullet list and nothing else");
    }
    if ((node as List).ordered) fail(lineOf(node), "use `-` bullets, not a numbered list");
    for (const item of (node as List).children) {
      current!.entries.push(parseEntry(item, current!.kind, fail, lineOf));
    }
    expectList = false;
  }

  if (expectList) fail(undefined, "the last section has no entries");
  if (groups.length === 0) fail(undefined, "a release needs at least one section");

  return { month, released: released ?? null, title, intro, groups };
}

function parseEntry(
  item: ListItem,
  kind: ChangeKind,
  fail: (line: number | undefined, message: string) => never,
  lineOf: (node: RootContent | PhrasingContent | ListItem) => number | undefined
): ChangeEntry {
  const line = lineOf(item);
  const [first, ...rest] = item.children;
  if (!first || first.type !== "paragraph") fail(line, "an entry starts with its label and sentence");
  const paragraph = first as Paragraph;

  let diff: string | null = null;
  let diffLang: DiffLang | null = null;
  for (const extra of rest) {
    if (extra.type !== "code") fail(lineOf(extra), "an entry holds one line, plus a diff block when Breaking");
    const code = extra as Code;
    if (kind !== "breaking") fail(lineOf(extra), "only Breaking entries carry a code block");
    if (code.lang !== "diff") fail(lineOf(extra), "the migration block must be fenced as ```diff");
    if (diff !== null) fail(lineOf(extra), "a Breaking entry carries exactly one diff block");
    const lang = code.meta?.trim() || "tsx";
    if (!(DIFF_LANGS as readonly string[]).includes(lang)) {
      fail(lineOf(extra), `\`\`\`diff ${lang}\` is not a diff language; use ${DIFF_LANGS.join(", ")}`);
    }
    diff = code.value;
    diffLang = lang as DiffLang;
  }
  if (kind === "breaking" && diff === null) fail(line, "a Breaking entry needs a ```diff block");

  // The label: [Name](/route) or **Name**.
  const [label, ...sentence] = paragraph.children;
  let name: string;
  let href: string | null;
  if (label?.type === "link") {
    name = plainText(label.children);
    href = label.url;
    // A site route: one leading slash. `//host` and `/\host` leave the site.
    if (!/^\/(?![/\\])/.test(href)) fail(line, `label links to \`${href}\`; use a site route`);
  } else if (label?.type === "strong") {
    name = plainText(label.children);
    href = null;
  } else {
    fail(line, "an entry starts with `[Name](/docs/slug)` or `**Name**`");
  }
  if (!name!) fail(line, "the label is empty");

  const text = parseInline(sentence, fail, line);
  const head = text[0];
  if (!head || head.type !== "text" || !head.value.startsWith(": ")) {
    fail(line, "a colon and a space follow the label");
  }
  head.value = head.value.slice(2);
  if (!head.value) text.shift();

  const tail = text[text.length - 1];
  const refsMatch = tail?.type === "text" ? REFS_TAIL.exec(tail.value) : null;
  if (!refsMatch) fail(line, "an entry ends with its refs: `(#52)` or `(#52, a28dd34)`");
  const refs = refsMatch![1].split(",").map((raw) => {
    const ref = raw.trim();
    if (!REF.test(ref)) fail(line, `\`${ref}\` is not a PR (#52) or a 7-character SHA`);
    return ref.startsWith("#")
      ? ({ type: "pr", number: Number(ref.slice(1)) } as const)
      : ({ type: "commit", sha: ref } as const);
  });
  if (refs.length > 3) fail(line, "3 refs at most; keep the PR, or the commits that carry the change");
  tail.value = tail.value.slice(0, refsMatch!.index);
  if (!tail.value) text.pop();

  const last = text[text.length - 1];
  if (!last || last.type !== "text" || !/[.!?]$/.test(last.value)) {
    fail(line, "the sentence ends with a period before the refs");
  }
  const lead = text[0];
  if (lead.type === "text" && !/^[A-Z0-9]/.test(lead.value)) {
    fail(line, "the sentence starts with a capital");
  }

  return { kind, name: name!, href: href!, text, refs, diff, diffLang };
}

function plainText(nodes: PhrasingContent[]): string {
  return nodes.map((n) => ("value" in n ? n.value : "children" in n ? plainText(n.children) : "")).join("");
}

function parseInline(
  nodes: PhrasingContent[],
  fail: (line: number | undefined, message: string) => never,
  line: number | undefined
): Inline[] {
  const out: Inline[] = [];
  for (const node of nodes) {
    if (node.type === "text") {
      const value = node.value.replace(/\s+/g, " ");
      const prev = out[out.length - 1];
      if (prev?.type === "text") prev.value += value;
      else out.push({ type: "text", value });
    } else if (node.type === "inlineCode") {
      out.push({ type: "code", value: node.value });
    } else {
      fail(line, `only plain text and inline code go in a sentence, found ${node.type}`);
    }
  }
  return out;
}

/** Every entry in a release, in page order. */
export function releaseEntries(release: Release): ChangeEntry[] {
  return release.groups.flatMap((g) => g.entries);
}
