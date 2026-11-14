"use client";

import { startTransition, useEffect, useState } from "react";

/**
 * False on the server and at first paint, true once the page's fonts have
 * loaded. A docs demo holds its table on skeleton rows until then: the
 * server can't know the fonts or the box its columns will be measured in,
 * so rows it sent shift once the page hydrates (a column 100px narrower, a
 * table 160px shorter, and everything under it moving up). The rows land
 * in a transition, which never blocks a frame.
 */
export function useFontsReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    const land = () => {
      if (live) startTransition(() => setReady(true));
    };
    if (document.fonts) document.fonts.ready.then(land, land);
    else land();
    return () => {
      live = false;
    };
  }, []);
  return ready;
}
