// The API reference of /docs/color-picker: its PropsTables and the API section
// of /docs/color-picker.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const colorPickerProps: PropDef[] = [
  { name: "value", type: "string", description: "Controlled color value (any of the supported formats)." },
  { name: "defaultValue", type: "string", default: '"#6B97FF"', description: "Initial color when uncontrolled." },
  { name: "onValueChange", type: "(value, parsed) => void", description: "Fired on every change. Receives the formatted string and a parsed color object with all formats." },
  { name: "format", type: '"hex" | "rgb" | "hsl" | "oklch"', description: "Controlled format selection." },
  { name: "defaultFormat", type: '"hex" | "rgb" | "hsl" | "oklch"', default: '"hex"', description: "Initial format when uncontrolled." },
  { name: "onFormatChange", type: "(format) => void", description: "Fired when the user switches format." },
  { name: "swatches", type: "(string | { color: string; label?: string })[]", description: "Optional preset swatches. A label names the color in a tooltip and to screen readers. When omitted, the strip is hidden." },
  { name: "hideEyedropper", type: "boolean", default: "false", description: "Force-hide the eyedropper button (it is automatically hidden in unsupported browsers)." },
];

export const popoverProps: PropDef[] = [
  { name: "triggerLabel", type: "string", description: "Optional label rendered alongside the color tile." },
  { name: "triggerLabelPosition", type: '"left" | "right"', default: '"left"', description: "Position of the label relative to the color tile." },
  { name: "triggerShowValue", type: "boolean", default: "true", description: "Show the hex value (without alpha) next to the tile." },
  { name: "triggerShowRemove", type: "boolean", default: "false", description: "Render an X button on the trigger." },
  { name: "onTriggerRemove", type: "() => void", description: "Fired when the X button is clicked." },
  { name: "triggerClassName", type: "string", description: "Custom classes on the trigger button." },
  { name: "...ColorPickerProps", type: "ColorPickerProps", description: "All ColorPicker props are forwarded to the panel." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "ColorPicker", props: colorPickerProps },
  { title: "ColorPickerPopover", props: popoverProps },
];
