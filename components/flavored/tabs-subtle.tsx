"use client";

import * as Base from "@/registry/base/tabs-subtle";
import * as Radix from "@/registry/radix/tabs-subtle";
import { flavored } from "@/components/flavored/flavored";

export const TabsSubtle = flavored(
  Base.TabsSubtle,
  Radix.TabsSubtle,
  "Flavored(TabsSubtle)"
);
export const TabsSubtleItem = flavored(
  Base.TabsSubtleItem,
  Radix.TabsSubtleItem,
  "Flavored(TabsSubtleItem)"
);
// The panel is a plain flavor-independent tabpanel in both implementations,
// but it routes through the switch anyway so the whole tree stays one flavor.
export const TabsSubtlePanel = flavored(
  Base.TabsSubtlePanel,
  Radix.TabsSubtlePanel,
  "Flavored(TabsSubtlePanel)"
);

export default TabsSubtle;
