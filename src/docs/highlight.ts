import { createHighlighter, type Highlighter } from "shiki/bundle/web";

let highlighter: Highlighter | null = null;
let loading: Promise<Highlighter> | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (highlighter) return highlighter;
  if (!loading) {
    loading = createHighlighter({
      themes: ["github-dark", "github-light"],
      langs: ["tsx"],
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
  });
}
