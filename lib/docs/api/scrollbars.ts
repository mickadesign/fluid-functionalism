// The API reference of /docs/scrollbars: its PropsTables and the API section
// of /docs/scrollbars.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export const scrollAreaProps: PropDef[] = [
  {
    name: "orientation",
    type: '"vertical" | "horizontal" | "both"',
    default: '"vertical"',
    description: "Which axes get scrollbars.",
  },
  {
    name: "viewportClassName",
    type: "string",
    description:
      "Classes for the inner scrolling viewport — where the scroll-fade utility goes.",
  },
  {
    name: "className",
    type: "string",
    description:
      "Classes for the outer container — set the height/width constraint here.",
  },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "ScrollArea", props: scrollAreaProps },
];
