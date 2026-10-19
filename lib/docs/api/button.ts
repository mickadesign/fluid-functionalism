// The API reference of /docs/button: its PropsTables and the API section
// of /docs/button.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const buttonProps: PropDef[] = [
  { name: "variant", type: '"primary" | "secondary" | "tertiary" | "ghost"', default: '"primary"', description: "Visual style of the button." },
  { name: "size", type: '"default" | "compact" | "icon" | "icon-compact"', default: "from SizeProvider", description: "Step on the size ladder (36px default, 28px compact — see /docs/sizes). Legacy sm/md/lg values resolve as aliases." },
  { name: "loading", type: "boolean", default: "false", description: "Shows a spinner and disables the button." },
  { name: "active", type: "boolean", default: "false", description: "Forces the pressed/held visual — e.g. while a dropdown or popover the button opened is showing." },
  { name: "leadingIcon", type: "IconComponent", description: "Icon displayed before the label." },
  { name: "trailingIcon", type: "IconComponent", description: "Icon displayed after the label." },
  { name: "asChild", type: "boolean", default: "false", description: "Merge props onto the child element instead of rendering a <button>." },
  { name: "render", type: "ReactElement", description: "Base UI's spelling of asChild: renders as this element, with the children as its label. Also what the shadcn CLI writes in Base UI projects." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the button." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "Button", props: buttonProps },
];
