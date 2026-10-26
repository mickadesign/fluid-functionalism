import type { Metadata } from "next";
import { entryInstall } from "@/lib/changelog/install";
import { loadReleases } from "@/lib/changelog/load";
import { highlightDiff } from "@/lib/docs/highlight";
import { ChangelogView, type ReleaseView } from "@/app/changelog/changelog-view";
import { OG_IMAGES, OG_VIDEOS } from "@/lib/og-media";

const DESCRIPTION = "Every change to Fluid Functionalism, month by month. A release lands on the first Friday.";

export const metadata: Metadata = {
  title: "Changelog · Fluid Functionalism",
  description: DESCRIPTION,
  // Agents find the Markdown version from the page's <head>.
  alternates: { canonical: "/changelog", types: { "text/markdown": "/changelog.md" } },
  // Replaced wholesale, not merged, over the root layout's: repeat the card.
  openGraph: {
    title: "Changelog · Fluid Functionalism",
    description: DESCRIPTION,
    images: OG_IMAGES,
    videos: OG_VIDEOS,
  },
};

export default async function ChangelogPage() {
  const releases: ReleaseView[] = await Promise.all(
    loadReleases().map(async (release) => ({
      ...release,
      groups: await Promise.all(
        release.groups.map(async (group) => ({
          ...group,
          entries: await Promise.all(
            group.entries.map(async (entry, i) => ({
              ...entry,
              id: `${release.month}-${group.kind}-${i}`,
              diffHtml: entry.diff ? await highlightDiff(entry.diff, entry.diffLang ?? "tsx") : null,
              // The same answer /changelog.md gives, so the Copy migration
              // prompt re-installs exactly the item the Markdown names.
              install: entryInstall(entry),
            }))
          ),
        }))
      ),
    }))
  );

  return (
    <div className="py-20 sm:py-28 w-full max-w-[680px] mx-auto mt-12 lg:mt-0">
      <ChangelogView releases={releases} />
    </div>
  );
}
