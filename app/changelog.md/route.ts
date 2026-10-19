import { loadReleases } from "@/lib/changelog/load";
import { releasesToMarkdown } from "@/lib/changelog/markdown";
import { entryInstall } from "@/lib/changelog/install";

// /changelog.md: the changelog as plain Markdown, for agents. Built once at
// deploy, like the page: the release files only change with a deploy.
export const dynamic = "force-static";

export function GET() {
  return new Response(releasesToMarkdown(loadReleases(), entryInstall), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
