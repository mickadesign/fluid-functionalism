import { llmsTxt } from "@/lib/docs/markdown";

// The docs index for coding agents (https://llmstxt.org): every page, with a
// link to its Markdown. Built at deploy time from lib/docs/markdown.ts.
export const dynamic = "force-static";

export function GET() {
  return new Response(llmsTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
