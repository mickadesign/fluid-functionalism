import type { ChangeKind } from "@/lib/changelog/parse";

/** One color per kind, shared by the changelog's entry dots and the
 *  sidebar's: the site accent for New (blue by default, right panel >
 *  Accent), red for Breaking, and for Updated the gray of the timeline's line
 *  (--border, which is translucent: a dot that sits on the line needs an
 *  opaque base under it). */
export const KIND_DOT: Record<ChangeKind, string> = {
  new: "bg-[var(--fluid-accent)]",
  updated: "bg-border",
  breaking: "bg-[var(--destructive)]",
};
