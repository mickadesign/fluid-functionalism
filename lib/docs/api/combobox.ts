// The API reference of /docs/combobox: its PropsTables and the API section
// of /docs/combobox.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export const comboboxProps: PropDef[] = [
  { name: "items", type: "readonly (string | { value: string; label: string })[]", description: "The options. A string is its own value and label; an object carries value, label, and whatever your rows need." },
  { name: "multiple", type: "boolean", default: "false", description: "Any number of picks. Values become string[]; use ComboboxChips for the field." },
  { name: "value", type: "string | string[]", description: "Selected value. \"\" means none; an array when multiple." },
  { name: "defaultValue", type: "string | string[]", description: "Initial selection." },
  { name: "onValueChange", type: "(value: string | string[]) => void", description: "Called with the pick, \"\" when cleared, or the array when multiple." },
  { name: "filter", type: "(item, query: string) => boolean", description: "Match an item against the query. Default: case-insensitive contains on the label." },
  { name: "onCreate", type: "(query: string) => item | void", description: "Adds a last row that creates the trimmed query whenever no label matches it exactly. Add the item to items and return it to select it." },
  { name: "createLabel", type: "(query: string) => ReactNode", default: 'Create “query”', description: "The create row's label." },
  { name: "hideSelected", type: "boolean", default: "false", description: "Multiple only. Picked items leave the list, so it reads as what is left to add. Deselect from the chips." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the field and the popup." },
  { name: "name", type: "string", description: "Form field name; a hidden input carries the value." },
  { name: "required", type: "boolean", description: "Marks the hidden form input required." },
  { name: "size", type: '"default" | "compact"', description: "Pins field and popup to one size step. Omitted, both follow the SizeProvider." },
];

export const inputProps: PropDef[] = [
  { name: "variant", type: '"bordered" | "borderless"', default: '"bordered"', description: "Framed at rest, or invisible until hovered or focused." },
  { name: "icon", type: "IconComponent", description: "Leading icon inside the field." },
  { name: "placeholder", type: "string", default: '"Search…"', description: "Shown while nothing is typed or selected." },
  { name: "error", type: "string", description: "Error message under the field; tints the ring and sets aria-invalid." },
  { name: "clearable", type: "boolean", default: "false", description: "A ✕ that clears the pick and the query. Its slot is always reserved, so the width never changes." },
  { name: "size", type: '"default" | "compact"', description: "Size for the field alone. Prefer size on Combobox so the popup matches." },
];

export const chipsProps: PropDef[] = [
  { name: "variant", type: '"bordered" | "borderless"', default: '"bordered"', description: "Same field ladder as ComboboxInput." },
  { name: "icon", type: "IconComponent", description: "Leading icon inside the field." },
  { name: "placeholder", type: "string", default: '"Search…"', description: "Shown while nothing is selected or typed." },
  { name: "error", type: "string", description: "Error message under the field; tints the ring and sets aria-invalid." },
  { name: "clearable", type: "boolean", default: "false", description: "A ✕ that clears every chip and the query. Its slot is always reserved." },
  { name: "size", type: '"default" | "compact"', description: "Size for the field alone. Chips and input step down together." },
];

export const contentProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "ComboboxEmpty and ComboboxList." },
  { name: "side", type: '"top" | "bottom" | "left" | "right"', default: '"bottom"', description: "Side of the field the popup prefers." },
  { name: "align", type: '"start" | "center" | "end"', default: '"start"', description: "Alignment against the field." },
  { name: "sideOffset", type: "number", default: "6", description: "Gap to the field, in px." },
];

export const listProps: PropDef[] = [
  { name: "children", type: "(item, index: number) => ReactNode", description: "Return a ComboboxItem per match. Rows get their index from the list." },
];

export const emptyProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "Shown when nothing matches the query." },
  { name: "allSelected", type: "ReactNode", description: "Shown instead when hideSelected has emptied the list with nothing typed." },
];

export const itemProps: PropDef[] = [
  { name: "value", type: "string", description: "The item's value: the string itself, or the object's value." },
  { name: "icon", type: "IconComponent", description: "Leading icon in the row." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the row." },
  { name: "children", type: "ReactNode", description: "The row label." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "Combobox", props: comboboxProps },
  { title: "ComboboxInput", props: inputProps },
  { title: "ComboboxChips", props: chipsProps },
  { title: "ComboboxContent", props: contentProps },
  { title: "ComboboxList", props: listProps },
  { title: "ComboboxItem", props: itemProps },
  { title: "ComboboxEmpty", props: emptyProps },
];
