import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SceneHost } from "../scenes";

// One storyboard scene at its real size (1280×720), for the board's iframes
// and for recording. Dev server only.
export default function TeaserScenePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Suspense>
      <SceneHost />
    </Suspense>
  );
}
