// The API reference of /docs/carousel-dots: its PropsTables and the API section
// of /docs/carousel-dots.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const props: PropDef[] = [
  { name: "count", type: "number", description: "How many dots to show." },
  { name: "value", type: "number", description: "Index of the current dot." },
  { name: "onValueChange", type: "(index: number) => void", description: "Called with a clicked dot's index, and with the next index each time autoplay finishes a slide." },
  { name: "autoplay", type: "boolean | { duration?, paused?, loop? }", description: "The current pill fills over duration (default 3000ms), then the next slide comes in. paused holds the fill; loop (default true) wraps to the first slide. Omit for a static, solid pill." },
  { name: "progress", type: "number | MotionValue<number>", description: "Drive the fill yourself, 0 to 1, when something else owns the clock. Takes precedence over autoplay." },
  { name: "getLabel", type: "(index: number) => string", default: '"Go to slide N"', description: "Accessible name for each dot." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "CarouselDots", props: props },
];
