"use client";

import type { ComponentType, ReactElement } from "react";
import * as Base from "@/registry/base/dropdown";
import * as Radix from "@/registry/radix/dropdown";
import { flavored } from "@/components/flavored/flavored";

export const Dropdown = flavored(
  Base.Dropdown,
  Radix.Dropdown,
  "Flavored(Dropdown)"
);
export const DropdownLabel = flavored(
  Base.DropdownLabel,
  Radix.DropdownLabel,
  "Flavored(DropdownLabel)"
);
export const DropdownSeparator = flavored(
  Base.DropdownSeparator,
  Radix.DropdownSeparator,
  "Flavored(DropdownSeparator)"
);
export const DropdownMenu = flavored(
  Base.DropdownMenu,
  Radix.DropdownMenu,
  "Flavored(DropdownMenu)"
);

/** The site only composes triggers via `render`, so the flavored wrapper
 *  narrows both flavors' trigger props (Base UI's MenuTriggerProps / the
 *  Radix flavor's button props) to that shared surface. */
interface FlavoredDropdownTriggerProps {
  render?: ReactElement;
  className?: string;
}
export const DropdownTrigger = flavored(
  Base.DropdownTrigger as unknown as ComponentType<FlavoredDropdownTriggerProps>,
  Radix.DropdownTrigger as unknown as ComponentType<FlavoredDropdownTriggerProps>,
  "Flavored(DropdownTrigger)"
);

export const DropdownContent = flavored(
  Base.DropdownContent,
  // Structurally identical public props; only the side/align unions differ
  // (Base UI accepts a few extra logical values).
  Radix.DropdownContent as unknown as typeof Base.DropdownContent,
  "Flavored(DropdownContent)"
);

// Both flavors provide the SAME context object (it lives in menu-item.tsx,
// the shared file), so no flavor probing is needed — whichever flavor's
// provider wraps the caller wins, which also keeps side-by-side renders
// (e.g. /compare-bases) working regardless of the global flavor switch.
export { useDropdown } from "@/registry/default/menu-item";

export type {
  DropdownProps,
  DropdownMenuProps,
  DropdownContentProps,
  DropdownContextValue,
  MenuItemRenderOptions,
} from "@/registry/base/dropdown";

export default Dropdown;
