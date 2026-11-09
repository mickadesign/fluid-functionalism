"use client";

import { createElement } from "react";
import { MenuItem } from "@/registry/default/menu-item";
import { useIcons, type IconComponentProps } from "@/lib/icon-context";
import { useShape } from "@/lib/shape-context";
import { fontWeights } from "@/lib/font-weight";

// Standardized workspace-switcher menu content, shared by every sidebar demo
// with a workspace header (doc page shells + the playground). Rows carry the
// trigger's letter-tile treatment in grey shades; the visible square renders
// at the trigger's 20px, centred on the row's icon slot so the tiles land on
// the sidebar's leading icon axis.

// The menu geometry now lives with the sidebar blocks — one string for the
// doc demos, the playground, and the installable registry payloads alike.
export { SIDEBAR_MENU_GRID, SIDEBAR_MENU_POPUP } from "@/lib/sidebar-menu-grid";

export function WorkspaceMenuItems() {
  const icons = useIcons();
  const shape = useShape();

  // `className` must flow through: MenuItem stacks the icon in a grid cell
  // via `col-start-1 row-start-1` classes — dropping them would land the
  // visible tile in a second grid row, below the invisible sizer.
  const letterTile = (letter: string, colorClasses: string) =>
    function LetterTile({ size = 16, className }: IconComponentProps) {
      return (
        <span
          className={`relative flex shrink-0 ${className ?? ""}`}
          style={{ width: size, height: size }}
        >
          <span
            className={`absolute top-1/2 left-1/2 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-[10px] ${
              { pill: "rounded-full", rounded: "rounded-md", sharp: "rounded-[1px]" }[shape.variant]
            } ${colorClasses}`}
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            {letter}
          </span>
        </span>
      );
    };

  // The bare plus glyph shares the tiles' column axis (both centre on the
  // row's icon slot).
  const PlusShifted = ({ size, strokeWidth, className }: IconComponentProps) =>
    createElement(icons.plus, { size, strokeWidth, className });

  return (
    <>
      <MenuItem index={0} icon={letterTile("A", "bg-foreground text-background")} label="Acme Inc" checked onSelect={() => {}} />
      <MenuItem index={1} icon={letterTile("F", "bg-muted-foreground text-background")} label="Fluid Labs" onSelect={() => {}} />
      <MenuItem index={2} icon={letterTile("P", "bg-muted-foreground/60 text-background")} label="Personal" onSelect={() => {}} />
      <MenuItem index={3} icon={PlusShifted} label="New workspace" onSelect={() => {}} />
    </>
  );
}
