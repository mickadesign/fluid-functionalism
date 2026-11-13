"use client";

import { type ComponentProps } from "react";
import { SidebarInput } from "@/components/ui/sidebar";
import { KeyCaps } from "@/lib/key-cap";
import { useSize } from "@/lib/size-context";
import { useIcons } from "@/lib/icon-context";

// ---------------------------------------------------------------------------
// The header's search field, on the menu rows' own rhythm. The leading icon
// sits on the rows' 16px leading axis; pl-8 starts the text on the rows'
// 32px text axis; and the shortcut chip waits at the trailing edge, revealed
// on hover/focus — the placeholder owns the field at rest.
// ---------------------------------------------------------------------------

export interface SidebarSearchFieldProps
  extends Omit<ComponentProps<typeof SidebarInput>, "className"> {
  /** Keystroke shown in the trailing chip. Pass null to drop the chip. */
  shortcut?: string | null;
}

export function SidebarSearchField({
  placeholder = "Search…",
  shortcut = "⌘K",
  ...props
}: SidebarSearchFieldProps) {
  const iconSize = useSize().icon;
  const icons = useIcons();
  const SearchIcon = icons.search;
  return (
    <div className="group/search relative">
      <SearchIcon
        size={iconSize}
        strokeWidth={1.5}
        className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <SidebarInput
        placeholder={placeholder}
        aria-label="Search"
        className="pl-8 pr-12"
        {...props}
      />
      {shortcut && (
        <KeyCaps
          keys={shortcut}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-80 group-hover/search:opacity-100 group-focus-within/search:opacity-100"
        />
      )}
    </div>
  );
}
