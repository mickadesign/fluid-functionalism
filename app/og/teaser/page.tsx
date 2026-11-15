import { notFound } from "next/navigation";
import { Board } from "./board";

// Storyboard for the DataTable teaser (X post, muted, loops). Temporary and
// dev server only: production answers 404.
// Remove with: app/og/teaser (this page, board.tsx, scene-list.ts,
// scenes.tsx, scene/) and its .claude/launch.json entry.
// Each frame is an iframe of /og/teaser/scene?id=N, laid out at 883×497 CSS
// px and scaled to the frame, so menus and portals scale with the scene.
// To record it at 1280×720, open the same URL in an 883×497 viewport at a
// device pixel ratio of 1.45 (see ZOOM in scene-list.ts). CSS zoom on the
// page threw menu placement off, so the scale lives outside the page.
export default function TeaserStoryboardPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Board />;
}
