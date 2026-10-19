"use client";

import { createContext, useContext } from "react";

/** Whether a live preview may run its own animation (an autoplay, a
 *  scripted cursor, a looping example). On by default, so the Showcase and
 *  the docs pages play as before; the changelog plays each preview as it
 *  scrolls into view, under one page-wide Pause. A preview that animates by itself reads this and
 *  holds still while it is false (list it in ANIMATED_PREVIEWS in
 *  app/changelog/previews.tsx so the changelog gives it the button). */
export const PreviewPlaybackContext = createContext(true);

export function usePreviewPlayback() {
  return useContext(PreviewPlaybackContext);
}
