"use client";

import { useState } from "react";
import { SizeProvider, sizeMap, type SizeVariant } from "@/registry/default/lib/size-context";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { Button } from "@/registry/radix/button";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/flavored/select";
import { TabsSubtle, TabsSubtleItem } from "@/components/flavored/tabs-subtle";
import { InputGroup, InputField } from "@/registry/default/input-group";
import { cn } from "@/registry/default/lib/utils";
import { ListFilter, Plus, Search, SquareKanban, Table2 } from "lucide-react";

// ---------------------------------------------------------------------------
// The toolbar demo: the same toolbar line at each step of the ladder. Lives
// beside the page so the changelog can show it too (a page file may only
// export the page).
// ---------------------------------------------------------------------------

export const SORT_OPTIONS = [
  { value: "updated", label: "Last updated" },
  { value: "created", label: "Created" },
  { value: "name", label: "Name" },
];

/** Toolbar search — the real InputGroup field, label hidden for inline use.
 *  Hover, focus and sizing all come from the component. */
function SearchField() {
  const [query, setQuery] = useState("");

  return (
    <InputGroup className="w-24">
      <InputField
        index={0}
        label="Search"
        labelHidden
        icon={Search}
        placeholder="Search…"
        value={query}
        onChange={setQuery}
      />
    </InputGroup>
  );
}

/** Spec-sheet height guides for a toolbar row: a blue line along the row's
 *  top and bottom edges, and a double-headed arrow with the height on the
 *  right. Desktop-only decoration — on phones it would collide with the
 *  wrapped controls. */
function HeightGuides({ height }: { height: number }) {
  const line = { backgroundColor: "#6B97FF", opacity: 0.5 };
  return (
    <div aria-hidden className="pointer-events-none hidden sm:block">
      <div className="absolute inset-x-0 top-0 h-px" style={line} />
      <div className="absolute inset-x-0 bottom-0 h-px" style={line} />
      <div className="absolute right-0 inset-y-0 flex items-center gap-1">
        <svg
          width={8}
          height={height}
          viewBox={`0 0 8 ${height}`}
          fill="none"
        >
          <path
            d={`M4,1.5 V${height - 1.5}`}
            stroke="#6B97FF"
            strokeWidth={1.25}
            strokeLinecap="round"
          />
          <path
            d={`M1.5,5 L4,1.5 L6.5,5`}
            stroke="#6B97FF"
            strokeWidth={1.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={`M1.5,${height - 5} L4,${height - 1.5} L6.5,${height - 5}`}
            stroke="#6B97FF"
            strokeWidth={1.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          className="text-site-caption tabular-nums text-foreground"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          {height}px
        </span>
      </div>
    </div>
  );
}

function ToolbarRow({ variant }: { variant: SizeVariant }) {
  const [view, setView] = useState(0);
  const [sort, setSort] = useState("updated");
  const compactStep = variant === "compact";
  // Control-to-control spacing comes from the ladder: gap is 8px at the
  // default step and 4px at compact — density is spacing as much as height.
  const gap = sizeMap[variant].gap;

  return (
    <SizeProvider size={variant}>
      <div className="flex w-full flex-col items-start gap-3">
        <span className="text-site-caption text-muted-foreground select-none">
          {variant === "default" ? "Default · 36px" : "Compact · 28px"}
        </span>
        <div className="relative w-full">
          <div
            className={cn("flex w-full flex-wrap items-center sm:pr-[44px]", gap)}
          >
            <TabsSubtle activeLabel selectedIndex={view} onSelect={setView}>
              <TabsSubtleItem index={0} icon={Table2} label="Table" />
              <TabsSubtleItem index={1} icon={SquareKanban} label="Board" />
            </TabsSubtle>
            <div className={cn("ml-auto flex items-center", gap)}>
              {/* Mobile shows the trimmed toolbar — tabs, filter, primary
                  action; search and sort return at sm. display:contents keeps
                  the row's gap running through the wrapper at sm+. */}
              <div className="hidden sm:contents">
                <SearchField />
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger placeholder="Sort by" className="min-w-36 w-36" />
                  <SelectContent>
                    {SORT_OPTIONS.map((o, i) => (
                      <SelectItem key={o.value} value={o.value} index={i}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="tertiary"
                size={compactStep ? "icon-compact" : "icon"}
                aria-label="Filter"
              >
                <ListFilter />
              </Button>
              <Button leadingIcon={Plus}>New</Button>
            </div>
          </div>
          <HeightGuides height={compactStep ? 28 : 36} />
        </div>
      </div>
    </SizeProvider>
  );
}

export function ToolbarDemo() {
  return (
    <div className="flex w-full flex-col gap-8">
      <ToolbarRow variant="default" />
      <ToolbarRow variant="compact" />
    </div>
  );
}
