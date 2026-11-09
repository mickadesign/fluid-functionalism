// The API reference of /docs/breadcrumb: its PropsTables and the API section
// of /docs/breadcrumb.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const breadcrumbProps: PropDef[] = [
  { name: "size", type: '"default" | "compact"', default: "from SizeProvider", description: "Pins the trail to one ladder step: 28px crumbs and 13px text, or 24px and 12px." },
  { name: "separator", type: "ReactNode | null", default: "chevron-right icon", description: "Trailing glyph of every crumb but the last, such as a slash. null drops it." },
  { name: "aria-label", type: "string", default: '"Breadcrumb"', description: "Names the navigation landmark." },
  { name: "...props", type: "HTMLAttributes<HTMLElement>", description: "Passed to the <nav>, which holds the fluid hover scope." },
];

export const breadcrumbLinkProps: PropDef[] = [
  { name: "href", type: "string", description: "Where the crumb goes." },
  { name: "render", type: "ReactElement", description: "Element to render instead of <a>, such as a framework link: render={<Link href=\"/docs\" />}." },
  { name: "asChild", type: "boolean", default: "false", description: "shadcn-style composition: the single child element becomes the link." },
  { name: "...props", type: "AnchorHTMLAttributes", description: "Every native anchor attribute. A link stops at 12rem (10rem compact) and truncates past it, with a tooltip showing the full name; className max-w-* changes the cap." },
];

export const breadcrumbButtonProps: PropDef[] = [
  { name: "type", type: '"button" | "submit" | "reset"', default: '"button"', description: "Native button type." },
  { name: "...props", type: "ButtonHTMLAttributes", description: "Every native button attribute. Pass it to a DropdownTrigger's render prop to open a menu from a step; its chevron points down while the menu is open." },
];

export const breadcrumbPartsProps: PropDef[] = [
  { name: "BreadcrumbList", type: "<ol>", description: "Wraps the items and lays them out on one row." },
  { name: "BreadcrumbItem", type: "<li>", description: "Holds one crumb." },
  { name: "BreadcrumbPage", type: "<span>", description: "The current page: foreground text with aria-current=\"page\". It lights under the hover like the links, and is the one crumb that truncates when the trail runs out of room." },
  { name: "BreadcrumbEllipsis", type: "<span>", description: "The collapsed middle of a trail. Put it in a BreadcrumbButton with an aria-label." },
];

export const breadcrumbCollapseProps: PropDef[] = [
  { name: "count", type: "number", description: "Steps in the full trail, the current page included." },
  { name: "enabled", type: "boolean", default: "true", description: "Off, nothing hides (a trail the reader expanded)." },
  { name: "→ listRef", type: "RefObject<HTMLOListElement>", description: "Put it on BreadcrumbList; the hook measures the list against its Breadcrumb." },
  { name: "→ hidden", type: "number", description: "How many steps to hide, from the second on. Render an ellipsis in their place." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "Breadcrumb", props: breadcrumbProps },
  { title: "BreadcrumbLink", props: breadcrumbLinkProps },
  { title: "BreadcrumbButton", props: breadcrumbButtonProps },
  { title: "useBreadcrumbCollapse", props: breadcrumbCollapseProps },
  { title: "Other parts", props: breadcrumbPartsProps },
];
