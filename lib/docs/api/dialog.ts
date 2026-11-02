// The API reference of /docs/dialog: its PropsTables and the API section
// of /docs/dialog.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const dialogProps: PropDef[] = [
  { name: "open", type: "boolean", description: "Controlled open state." },
  { name: "defaultOpen", type: "boolean", default: "false", description: "Initial open state." },
  { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when the dialog opens or closes." },
  { name: "modal", type: "boolean", default: "true", description: "Traps focus and locks page scroll while open." },
];

export const dialogSlotProps: PropDef[] = [
  { name: "render", type: "ReactElement", description: "The element that becomes the control, e.g. a Button." },
  { name: "asChild", type: "boolean", default: "false", description: "Compose onto the single child instead. Both spellings work in both flavors." },
  { name: "children", type: "ReactNode", description: "Control content when there is no render element." },
];

export const dialogContentProps: PropDef[] = [
  { name: "size", type: '"sm" | "lg" | "xl"', default: '"sm"', description: "Width: 400, 540, or 880. Compact regions narrow each by 1 notch: 360, 480, 800. xl is the canvas for layouts; add className=\"p-0\" and a fixed height." },
  { name: "container", type: "HTMLElement | null", description: "Portal target. Scopes overlay and panel to a positioned container." },
  { name: "showCloseButton", type: "boolean", default: "true", description: "The ✕ in the corner. Drop it when the content has its own way out." },
  { name: "position", type: '"center" | "top"', default: '"center"', description: "Centered, or anchored 12dvh from the top so a content-sized panel keeps its top edge still." },
  { name: "children", type: "ReactNode", description: "Dialog content." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "Dialog", props: dialogProps },
  { title: "DialogTrigger / DialogClose", props: dialogSlotProps },
  { title: "DialogContent", props: dialogContentProps },
];
