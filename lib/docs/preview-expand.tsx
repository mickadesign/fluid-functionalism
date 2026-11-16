"use client";

import { createContext, useContext, type ReactNode } from "react";

// Site-only: a playground that can lift its preview into a full-window layer
// (PlaygroundLayout's `expandable`). The layout owns the state and the
// motion; ComponentPreview reads this to draw the expand / collapse button
// and, while expanded, the controls' pen menu in its header.

export interface PreviewExpandValue {
  expanded: boolean;
  toggle: () => void;
  /** The pen menu with the playground controls, shown in the header while
   *  expanded (the right rail is covered then). */
  menu: ReactNode;
}

export const PreviewExpandContext = createContext<PreviewExpandValue | null>(null);

export function usePreviewExpand() {
  return useContext(PreviewExpandContext);
}
