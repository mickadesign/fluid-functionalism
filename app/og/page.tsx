"use client";

import { useEffect } from "react";
import { OgStage, OG_STILL } from "./og-stage";

// `npm run og` exports the stage at 2x. The loop lives at /og/video.

// The checkbox row shown mid-hover, so the fluid highlight is in the shot.
const HOVER_ROW = "Janky animations";

// Parks a synthetic cursor on HOVER_ROW: the hook picks the row nearest the
// pointer, so a mousemove at the row's center lights it up. The stage ignores
// the real pointer, so the state holds while you look at it.
function useParkedHover() {
  useEffect(() => {
    const id = window.setTimeout(() => {
      const row = document.querySelector<HTMLElement>(
        `[data-og-stage] [role="checkbox"][aria-label="${HOVER_ROW}"]`
      );
      if (!row) return;
      const r = row.getBoundingClientRect();
      const init = { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
      row.dispatchEvent(new MouseEvent("mouseover", init));
      row.dispatchEvent(new MouseEvent("mousemove", init));
    }, 400);
    return () => window.clearTimeout(id);
  }, []);
}

export default function OgPage() {
  useParkedHover();
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-8">
      <OgStage state={OG_STILL} />
    </div>
  );
}
