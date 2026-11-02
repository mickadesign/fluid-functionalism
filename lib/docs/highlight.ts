import { createHighlighter, type Highlighter } from "shiki/bundle/web";
import { DIFF_LANGS, type DiffLang } from "@/lib/changelog/parse";

let highlighter: Highlighter | null = null;
let loading: Promise<Highlighter> | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (highlighter) return highlighter;
  if (!loading) {
    loading = createHighlighter({
      themes: ["github-dark", "github-light"],
      langs: [...DIFF_LANGS],
    }).then((h) => {
      highlighter = h;
      return h;
    });
  }
  return loading;
}

export async function highlight(code: string): Promise<string> {
  const h = await getHighlighter();
  return h.codeToHtml(code.trim(), {
    lang: "tsx",
    themes: { dark: "github-dark", light: "github-light" },
    defaultColor: false,
  });
}

/** A ```diff block, highlighted in its own language (TSX unless the fence
 *  names another): each line keeps its syntax colors and gets `diff add` /
 *  `diff remove` from its `+` / `-` marker, which the page turns into a
 *  tinted line with the marker in a gutter. */
export async function highlightDiff(diff: string, lang: DiffLang = "tsx"): Promise<string> {
  const h = await getHighlighter();
  const lines = diff.replace(/\n+$/, "").split("\n");
  const marks = lines.map((line) => (line.startsWith("+") ? "add" : line.startsWith("-") ? "remove" : null));
  // Releases write `- code`, a space after the marker; plain unified diffs
  // write `-code`. Drop the space too when every line has one, so the code
  // starts at the gutter's edge either way.
  const spaced = lines.every((line) => !line || /^[+\- ]( |$)/.test(line));
  const code = lines.map((line) => (/^[+\- ]/.test(line) ? line.slice(spaced ? 2 : 1) : line)).join("\n");
  return h.codeToHtml(code, {
    lang,
    themes: { dark: "github-dark", light: "github-light" },
    defaultColor: false,
    transformers: [
      {
        line(node, line) {
          const mark = marks[line - 1];
          if (mark) this.addClassToHast(node, ["diff", mark]);
        },
      },
    ],
  });
}
