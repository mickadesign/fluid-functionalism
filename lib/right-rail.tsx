"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

// ---------------------------------------------------------------------------
// A slot in the desktop right rail (below "Make them yours") that any page can
// fill. The page keeps ownership of the content — it renders through a portal
// into this target, so React context and state still flow from the page tree.
// Used by the Card doc's Playground to park its controls in the rail while the
// live preview stays in the main column.
// ---------------------------------------------------------------------------

interface RightRailValue {
  node: HTMLElement | null;
  setNode: (node: HTMLElement | null) => void;
}

const RightRailContext = createContext<RightRailValue>({
  node: null,
  setNode: () => {},
});

export function RightRailProvider({ children }: { children: ReactNode }) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  return (
    <RightRailContext.Provider value={{ node, setNode }}>
      {children}
    </RightRailContext.Provider>
  );
}

/** Rendered inside the right panel. `display: contents` so it adds no box (and
 *  no stray flex gap) until a page portals content into it. */
export function RightRailTarget() {
  const { setNode } = useContext(RightRailContext);
  return <div ref={setNode} className="contents" />;
}

/** The rail's DOM node, or null when the rail isn't mounted (below xl it's
 *  display:none — callers should fall back to inline rendering there). */
export function useRightRailNode() {
  return useContext(RightRailContext).node;
}
