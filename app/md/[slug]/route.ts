import { docMarkdown, llmsTxt, MARKDOWN_PAGES } from "@/lib/docs/markdown";
import { SITE } from "@/lib/docs/install-brief";

// The Markdown version of every doc page. Reached as /docs/<slug>.md and
// /docs.md, or as /docs/<slug> with `Accept: text/markdown` (rewrites in
// next.config.ts); `index` is the /docs page.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ slug: "index" }, ...MARKDOWN_PAGES.map((page) => ({ slug: page.slug }))];
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = slug === "index" ? llmsTxt() : docMarkdown(slug);
  if (body === null) return new Response("Not found\n", { status: 404 });
  const page = slug === "index" ? `${SITE}/docs` : `${SITE}/docs/${slug}`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // /docs/<slug> serves this or the HTML page depending on Accept.
      Vary: "Accept",
      // The HTML page stays the one search engines index.
      Link: `<${page}>; rel="canonical"`,
    },
  });
}
