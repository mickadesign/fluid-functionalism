// The API reference of /docs/thinking-steps: its PropsTables and the API section
// of /docs/thinking-steps.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

// ─── Props Tables ───────────────────────────────────────────────────────────

export const rootProps: PropDef[] = [
  { name: "size", type: '"default" | "compact"', default: "from SizeProvider", description: "Step on the size ladder (see /docs/sizes). Wins over the surrounding SizeProvider." },
  { name: "defaultOpen", type: "boolean", default: "true", description: "Whether the accordion starts expanded (uncontrolled)." },
  { name: "open", type: "boolean", description: "Controlled open state. Use with onOpenChange." },
  { name: "onOpenChange", type: "(open: boolean) => void", description: "Callback when the open state changes." },
  { name: "running", type: "boolean", description: "The work is still going: the header shimmers, and the list is open while it runs and closes when it ends. Once the reader opens or closes it by hand, their choice holds. Leave undefined for a list that only follows defaultOpen." },
  { name: "className", type: "string", description: "Additional CSS classes for the root container." },
];

export const headerProps: PropDef[] = [
  { name: "children", type: "ReactNode", default: '"Thinking"', description: "Header label text." },
  { name: "meta", type: "ReactNode", description: "Muted text after the label: how long it took (\"12s\"), how many steps (\"2 of 5 done\")." },
];

export const stepProps: PropDef[] = [
  { name: "icon", type: "IconName", default: '"dot"', description: "Icon name from the icon library." },
  { name: "showIcon", type: "boolean", default: "true", description: "Show the icon. When false, displays a small dot instead." },
  { name: "label", type: "string", description: "Step label text." },
  { name: "description", type: "string", description: "Optional secondary text below the label." },
  { name: "meta", type: "ReactNode", description: "Muted text after the label: a duration, a count, a diff stat." },
  { name: "href", type: "string", description: "Turns the label into a link that opens in a new tab, announced as such to screen readers. Only http(s) addresses and paths starting with / are linked; any other value renders the plain label." },
  { name: "status", type: '"complete" | "active" | "pending" | "upcoming" | "error"', default: '"complete"', description: "Step state. Pending steps are hidden until they start; upcoming steps show, muted, for a plan known ahead; active steps shimmer; error steps turn red." },
  { name: "delay", type: "number", default: "0.08", description: "Content fade-in delay in seconds, after the step's height starts expanding." },
  { name: "isLast", type: "boolean", default: "false", description: "Hides the connector line below this step." },
];

export const detailsProps: PropDef[] = [
  { name: "summary", type: "string", description: "Collapsed label text (e.g. \"Explored 6 files\")." },
  { name: "details", type: "string[]", description: "Shorthand list of detail lines rendered automatically." },
  { name: "defaultOpen", type: "boolean", default: "false", description: "Whether the nested accordion starts expanded." },
  { name: "children", type: "ReactNode", description: "Custom content inside the expanded area." },
];

export const sourceProps: PropDef[] = [
  { name: "color", type: "BadgeColor", default: '"gray"', description: "Badge color from the Tailwind palette." },
  { name: "delay", type: "number", default: "0", description: "Entrance animation delay in seconds." },
  { name: "children", type: "ReactNode", description: "Source label text." },
];

export const imageProps: PropDef[] = [
  { name: "src", type: "string", description: "Image URL. The rendered image includes a theme-aware 1px inset outline." },
  { name: "alt", type: "string", default: '""', description: "Alt text for accessibility." },
  { name: "caption", type: "string", description: "Optional caption below the image." },
  { name: "delay", type: "number", default: "0", description: "Entrance animation delay in seconds." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "ThinkingSteps", props: rootProps },
  { title: "ThinkingStepsHeader", props: headerProps },
  { title: "ThinkingStep", props: stepProps },
  { title: "ThinkingStepDetails", props: detailsProps },
  { title: "ThinkingStepSource", props: sourceProps },
  { title: "ThinkingStepImage", props: imageProps },
];
