// The API reference of /docs/badge: its PropsTables and the API section
// of /docs/badge.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const badgeProps: PropDef[] = [
  {
    name: "variant",
    type: '"solid" | "dot"',
    default: '"solid"',
    description: "Visual style. Solid uses a tinted background; dot shows a colored indicator.",
  },
  {
    name: "size",
    type: '"default" | "compact"',
    default: "from SizeProvider",
    description:
      "Step on the size ladder (see /docs/sizes). Legacy sm/md/lg values resolve as aliases.",
  },
  {
    name: "color",
    type: "BadgeColor",
    default: '"gray"',
    description:
      "Color from the Tailwind palette: gray, red, orange, amber, yellow, lime, green, emerald, teal, cyan, blue, indigo, violet, purple, fuchsia, pink, rose.",
  },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "Badge", props: badgeProps },
];
