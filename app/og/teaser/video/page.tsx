import { notFound } from "next/navigation";
import { Player } from "./player";

// The whole DataTable teaser, cut together from the storyboard's scenes.
// Dev server only, like the storyboard (see ../page.tsx for removal).
// To record it at 1280×720, open this page in an 883×497 viewport at a
// device pixel ratio of 1.45: the frame then fills the window. It loads
// every scene first, then plays the loop.
export default function TeaserVideoPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Player />;
}
