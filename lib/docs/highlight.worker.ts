// Colors code samples off the main thread (see highlight-client.ts). Shiki's
// grammars and its regex engine load here, so neither their start-up nor a
// long sample ever holds up a frame of the page. Self-contained on purpose:
// a worker has no `document`, so it shares no module with the page. Keep
// the options in step with `highlight()` in highlight.ts.
import { createHighlighter, type Highlighter } from "shiki/bundle/web";

type Request = { id: number; code: string };

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<Request>) => void) | null;
  postMessage: (message: { id: number; html?: string; error?: string }) => void;
};

let loading: Promise<Highlighter> | null = null;
const highlighter = () =>
  (loading ??= createHighlighter({ themes: ["github-dark", "github-light"], langs: ["tsx"] }));

scope.onmessage = async (event) => {
  const { id, code } = event.data;
  try {
    const html = (await highlighter()).codeToHtml(code.trim(), {
      lang: "tsx",
      themes: { dark: "github-dark", light: "github-light" },
      defaultColor: false,
    });
    scope.postMessage({ id, html });
  } catch (error) {
    scope.postMessage({ id, error: String(error) });
  }
};
