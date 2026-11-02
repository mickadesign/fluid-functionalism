// HTTP content negotiation for the routes that serve Markdown to agents.

/** The q-value an Accept header gives a media type: the most specific range
 *  that matches it wins (`text/markdown` over `text/*` over `*\/*`), and a
 *  type no range matches gets 0. */
export function acceptQuality(accept: string, type: string): number {
  const ranges = [type, `${type.split("/")[0]}/*`, "*/*"];
  let best = { rank: ranges.length, q: 0 };
  for (const part of accept.toLowerCase().split(",")) {
    const [range, ...params] = part.split(";").map((p) => p.trim());
    const rank = ranges.indexOf(range);
    if (rank === -1 || rank >= best.rank) continue;
    const q = Number(params.find((p) => p.startsWith("q="))?.slice(2) ?? 1);
    best = { rank, q: Number.isFinite(q) ? q : 0 };
  }
  return best.q;
}

/** Whether a request for /changelog prefers Markdown to HTML. A browser's
 *  `text/html` or `*\/*` ties or wins, so only an agent that ranks
 *  `text/markdown` higher gets it. */
export function prefersMarkdown(accept: string): boolean {
  const markdown = acceptQuality(accept, "text/markdown");
  const html = Math.max(acceptQuality(accept, "text/html"), acceptQuality(accept, "application/xhtml+xml"));
  return markdown > html;
}
