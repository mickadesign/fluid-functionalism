import { llmsFullTxt } from "@/lib/docs/markdown";

// /llms.txt followed by every doc page's Markdown, for agents that want the
// whole library in one request.
export const dynamic = "force-static";

export function GET() {
  return new Response(llmsFullTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
