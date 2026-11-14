// The API reference of /docs/code-block: its PropsTables and the API section
// of /docs/code-block.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const props: PropDef[] = [
  { name: "code", type: "string", description: "The plain code. Rendered as is when there are no children, and always what the copy button copies." },
  { name: "language", type: "string", description: "Language label in the header, such as `tsx` or `bash`." },
  { name: "title", type: "ReactNode", description: "Header text in place of the language: a file name, a command." },
  { name: "children", type: "ReactNode", description: "Highlighted markup to render in place of the plain code, from Shiki or a markdown renderer." },
  { name: "lineNumbers", type: "boolean", default: "false", description: "Number the lines. Plain code only: highlighted children own their lines." },
  { name: "wrap", type: "boolean", default: "false", description: "Wrap long lines instead of scrolling sideways." },
  { name: "maxHeight", type: "number", description: "Cap the body's height in pixels. Taller code scrolls." },
  { name: "hideHeader", type: "boolean", default: "false", description: "Hide the header. The copy button then floats over the top right corner." },
  { name: "onCopy", type: "() => void", description: "Called after a successful copy." },
  { name: "size", type: '"default" | "compact"', default: "from SizeProvider", description: "Step on the size ladder (see /docs/sizes)." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "CodeBlock", props: props },
];
