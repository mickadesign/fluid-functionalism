"use client";

import * as Base from "@/registry/base/tabs";
import * as Radix from "@/registry/radix/tabs";
import { flavored } from "@/components/flavored/flavored";

export const Tabs = flavored(
  Base.Tabs,
  Radix.Tabs,
  "Flavored(Tabs)"
);
export const TabsItem = flavored(
  Base.TabsItem,
  Radix.TabsItem,
  "Flavored(TabsItem)"
);
// The panel is a plain flavor-independent tabpanel in both implementations,
// but it routes through the switch anyway so the whole tree stays one flavor.
export const TabsPanel = flavored(
  Base.TabsPanel,
  Radix.TabsPanel,
  "Flavored(TabsPanel)"
);

export default Tabs;
