// The API reference of /docs/fluid-hover: its PropsTables and the API section
// of /docs/fluid-hover.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const hookOptions: PropDef[] = [
  { name: "axis", type: '"y" | "x" | "xy"', default: '"y"', description: "Which way the list runs: y for lists, x for strips, xy for grids." },
  { name: "isItemDisabled", type: "(el: HTMLElement) => boolean", description: "Skips an item: never lit, never clicked. Runs on every move, so keep it cheap." },
  { name: "gapClick", type: "boolean | { maxDistance?: number }", default: "true", description: "A click between items goes to the lit one. false turns it off. maxDistance limits it to clicks within that many px." },
];

export const hookReturn: PropDef[] = [
  { name: "handlers", type: "{ onMouseEnter, onMouseMove, onMouseLeave, onClick }", description: "Spread onto the container. Mouse only. onClick is the gap click." },
  { name: "registerItem", type: "(index, element | null) => void", description: "Give it to each row. Indices start at 0 and must not change while the list is on screen." },
  { name: "activeIndex", type: "number | null", description: "The lit item, or null. Also set as data-fluid-hover-active on the item." },
  { name: "setActiveIndex", type: "(index | null) => void", description: "Light an item yourself, for keyboard focus. The hook never moves focus." },
  { name: "itemRects", type: "ItemRect[]", description: "Each item's box inside the container. Survives a parent scale, not a rotation." },
  { name: "isMeasured", type: "boolean", description: "True once every item has a box. Measured again on register and on resize." },
  { name: "remeasure", type: "() => void", description: "Measure again and hide the highlight until done. Call it when a popup opens." },
  { name: "session", type: "number", description: "Counts pointer entries. The highlight fades in fresh on each one." },
];

export const highlightProps: PropDef[] = [
  { name: "hover", type: "ReturnType<typeof useFluidHover>", description: "The hook. The highlight reads what it needs from it." },
  { name: "hidden", type: "boolean", default: "false", description: "Show nothing, keep the state. A closed popup." },
  { name: "from", type: "ItemRect | null", description: "Where a fresh entry fades in from. Dropdowns pass the checked row when the pointer enters." },
  { name: "className", type: "string", description: "Radius and z-index. The container must be position: relative." },
  { name: "transition", type: "Transition | false", default: "spring.fast", description: "The travel. false snaps in place after a reflow." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "useFluidHover options", props: hookOptions },
  { title: "useFluidHover return value", props: hookReturn },
  { title: "FluidHoverHighlight", props: highlightProps },
];
