"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

/** The doc slugs the latest changelog release marks, read on the server by
 *  latestMarks() in lib/changelog/load.ts. The one source for every New and
 *  Updated marker on the site. */
export interface ReleaseMarks {
  /** Updated or Breaking in the latest release, minus what it lists as New. */
  updated: string[];
  /** Landed after the latest release: badged New until the release that
   *  lists them (AHEAD_OF_RELEASE in lib/changelog/load.ts). */
  ahead: string[];
}

interface MarkLookup {
  /** Landed since the latest release (the ahead list), not the release's
   *  own New entries, so the New badges and the sidebar's dots only mark
   *  what is new this month. */
  isNew: (slug: string) => boolean;
  isUpdated: (slug: string) => boolean;
}

const NONE: MarkLookup = { isNew: () => false, isUpdated: () => false };

const ReleaseMarksContext = createContext<MarkLookup>(NONE);

export function ReleaseMarksProvider({ marks, children }: { marks: ReleaseMarks; children: ReactNode }) {
  const lookup = useMemo<MarkLookup>(() => {
    const ahead = new Set(marks.ahead);
    const updated = new Set(marks.updated);
    return {
      isNew: (slug) => ahead.has(slug),
      isUpdated: (slug) => updated.has(slug),
    };
  }, [marks]);
  return <ReleaseMarksContext.Provider value={lookup}>{children}</ReleaseMarksContext.Provider>;
}

export function useReleaseMarks(): MarkLookup {
  return useContext(ReleaseMarksContext);
}
