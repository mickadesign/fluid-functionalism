import type { DocSlug, DocsHref } from "@/lib/docs/components";
import {
  DOC_SECTIONS,
  type DocSectionTitle,
  type SectionedDocsHref,
} from "@/lib/docs/doc-sections";

export type { DocSectionTitle, SectionedDocsHref };
export { DOC_SECTIONS };

export type UpdateKind = "New" | "Updated" | "Breaking";

/** ISO date YYYY-MM-DD. */
export type IsoDate = `${number}-${number}-${number}`;

/** Sidebar / section / What's New dots: yellow = new, blue = updated, red = breaking. */
export const STATUS_DOT: Record<UpdateKind, string> = {
  Updated: "bg-[var(--warning)]",
  New: "bg-blue-500",
  Breaking: "bg-[var(--destructive)]",
};

/** Kind priority for nav dots when multiple updates hit the same slug. */
const KIND_RANK: Record<UpdateKind, number> = {
  New: 1,
  Updated: 2,
  Breaking: 3,
};

/** Per-href entry: `section` must be a registered DocSection title for that page. */
export type UpdateEntry = {
  [H in DocsHref]: {
    /** Stable id; used as the localStorage dismiss key for announcements. */
    id: string;
    /** ISO date YYYY-MM-DD. */
    date: IsoDate;
    title: string;
    description: string;
    /** Docs path for a known component / system page. */
    href: H;
    /** DocSection title on that page (page must be listed in DOC_SECTIONS). */
    section?: DocSectionTitle<H>;
    /** New (yellow), Updated (blue), or Breaking (red). @default "New" */
    sectionBadge?: UpdateKind;
    /** After this UTC day, hide nav/section dots and announcements (What's New keeps the row). */
    until?: IsoDate;
    /** Show the fixed site Banner until the visitor dismisses it. */
    announce?: boolean;
    /** Banner-only title; falls back to `title`. */
    announceTitle?: string;
    /** Banner-only description; falls back to `description`. */
    announceDescription?: string;
  };
}[DocsHref];

export function updateKind(entry: UpdateEntry): UpdateKind {
  return entry.sectionBadge ?? "New";
}

/** Today's UTC date as YYYY-MM-DD. */
export function todayUtc(now = new Date()): IsoDate {
  return now.toISOString().slice(0, 10) as IsoDate;
}

/** False once `until` is in the past (UTC day). Missing `until` stays active. */
export function isUpdateActive(entry: UpdateEntry, today: IsoDate = todayUtc()): boolean {
  if (!entry.until) return true;
  return entry.until >= today;
}

export function announceDisplayTitle(entry: UpdateEntry): string {
  return entry.announceTitle ?? entry.title;
}

export function announceDisplayDescription(entry: UpdateEntry): string {
  return entry.announceDescription ?? entry.description;
}

/** Newest first. Clear `announce` when the Banner should go away; nav dots
 *  for changelog entries come from here via `resolveNavKind`. */
export const updates = [
  {
    id: "dropdown-submenu",
    date: "2026-10-05",
    until: "2026-10-10",
    title: "Dropdown submenus",
    description: "Nest menus with DropdownSub, SubTrigger, and SubContent.",
    href: "/docs/dropdown",
    section: "Submenus",
    sectionBadge: "Updated",
    announce: true,
  },
] as const satisfies readonly UpdateEntry[];

/** Anchor id for a DocSection title (matches the section heading). */
export function sectionId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** `href`, with `#section` when the update points at a DocSection. */
export function updateHref(entry: UpdateEntry): string {
  if (!entry.section) return entry.href;
  return `${entry.href}#${sectionId(entry.section)}`;
}

/** Kind for a docs section, if an update marks that title. */
export function badgeForSection<H extends SectionedDocsHref>(
  href: H,
  title: DocSectionTitle<H>
): UpdateKind | undefined;
/** Runtime lookup (e.g. DocSection via `usePathname`). */
export function badgeForSection(
  href: string,
  title: string
): UpdateKind | undefined;
export function badgeForSection(
  href: string,
  title: string
): UpdateKind | undefined {
  const entry = updates.find(
    (u) => u.href === href && u.section === title && isUpdateActive(u)
  );
  if (!entry) return undefined;
  return updateKind(entry);
}

/** Active entries marked `announce: true` (newest first). */
export function activeAnnouncements(): UpdateEntry[] {
  return updates.filter((u) => u.announce && isUpdateActive(u));
}

/**
 * First active announce the visitor has not dismissed.
 * Call only after mount / in effects — reads localStorage.
 */
export function nextUndismissedAnnouncement(): UpdateEntry | null {
  return (
    activeAnnouncements().find((u) => !isAnnouncementDismissed(u.id)) ?? null
  );
}

/** First active announce (ignores dismiss state). Prefer `nextUndismissedAnnouncement` after mount. */
export function latestAnnouncement(): UpdateEntry | null {
  return activeAnnouncements()[0] ?? null;
}

/** First non-expired changelog entry (for What's New unread dots). */
export function latestActiveUpdate(): UpdateEntry | null {
  return updates.find((u) => isUpdateActive(u)) ?? null;
}

/** Sidebar / command-menu status from the changelog for a docs slug. */
export function navStatusForSlug(slug: DocSlug | string): UpdateKind | undefined {
  const href = `/docs/${slug}`;
  // Breaking > Updated > New across all active matches for this slug.
  let kind: UpdateKind | undefined;
  for (const entry of updates) {
    if (entry.href !== href || !isUpdateActive(entry)) continue;
    const next = updateKind(entry);
    if (!kind || KIND_RANK[next] > KIND_RANK[kind]) kind = next;
    if (kind === "Breaking") break;
  }
  return kind;
}

/** Changelog status, falling back to static `isNew` / `isUpdated` flags. */
export function resolveNavKind(entry: {
  slug: DocSlug | string;
  isNew?: boolean;
  isUpdated?: boolean;
}): UpdateKind | undefined {
  return (
    navStatusForSlug(entry.slug) ??
    (entry.isUpdated ? "Updated" : entry.isNew ? "New" : undefined)
  );
}

export function announceDismissKey(id: string) {
  return `ff:announce-dismissed:${id}`;
}

export function isAnnouncementDismissed(id: string): boolean {
  try {
    return localStorage.getItem(announceDismissKey(id)) != null;
  } catch {
    return false;
  }
}

const ANNOUNCE_DISMISSED_EVENT = "ff:announce-dismissed";

/** Persist dismiss and notify same-tab listeners (e.g. the site Banner). */
export function dismissAnnouncement(id: string) {
  try {
    localStorage.setItem(announceDismissKey(id), "1");
  } catch {
    // ignore
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(ANNOUNCE_DISMISSED_EVENT, { detail: { id } })
    );
  }
}

/** Mark every currently active announcement as seen. */
export function dismissAllAnnouncements() {
  for (const entry of activeAnnouncements()) {
    dismissAnnouncement(entry.id);
  }
}

/** Subscribe to same-tab announcement dismissals. Returns an unsubscribe. */
export function onAnnouncementDismissed(
  listener: (id: string) => void
): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    const id = (event as CustomEvent<{ id: string }>).detail?.id;
    if (id) listener(id);
  };
  window.addEventListener(ANNOUNCE_DISMISSED_EVENT, handler);
  return () => window.removeEventListener(ANNOUNCE_DISMISSED_EVENT, handler);
}
