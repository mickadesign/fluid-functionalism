"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { cn } from "@/lib/utils";
import { spring, exitFallbackMs } from "@/lib/springs";
import {
  DatePickerCore,
  DatePickerPopupFrame,
  type DatePickerPopoverProps,
  type DatePickerProps,
} from "@/components/ui/date-picker-core";

// ---------------------------------------------------------------------------
// DatePicker on Base UI Popover. Base UI owns positioning, the portal,
// outside press and focus-out dismissal, Escape, and focus return to the
// trigger; the calendar moves focus to the selected day itself. Every close
// holds the unmount, and the frame releases it through actionsRef once the
// exit spring ends. A close made by the picker itself, such as after a pick,
// is replayed through the root so it gets the same held unmount.
// ---------------------------------------------------------------------------

type PopupActions = { unmount: () => void; close: () => void };

// Base UI unmounts a closing popup once the animations it can detect on the
// popup element end. It misses the Motion exit spring, which it cuts.
// A close that calls preventUnmountOnClose() in onOpenChange stays mounted
// until the content calls actionsRef.unmount(). A close made by setting
// `open` never reaches onOpenChange, so the root stays open until that close
// is replayed through actionsRef.close(), which does.
function usePopupExit(open: boolean, setOpen: (open: boolean) => void) {
  const actionsRef = useRef<PopupActions | null>(null);
  const [rootOpen, setRootOpen] = useState(open);
  if (open && !rootOpen) setRootOpen(true);
  useLayoutEffect(() => {
    if (open || !rootOpen) return;
    // The root fills actionsRef before this effect runs; without it, close
    // straight away rather than stay open.
    if (actionsRef.current) actionsRef.current.close();
    else setRootOpen(false);
  }, [open, rootOpen]);
  const onOpenChange = (
    next: boolean,
    details: { preventUnmountOnClose: () => void }
  ) => {
    if (!next) {
      details.preventUnmountOnClose();
      setRootOpen(false);
    }
    // A replayed close finds `open` already false: nothing to report.
    if (next !== open) setOpen(next);
  };
  return { actionsRef, rootOpen: open || rootOpen, onOpenChange };
}

function DatePickerPopover({
  open,
  onOpenChange,
  kind,
  anchor,
  anchorRef,
  escapeBlocked,
  align = "start",
  className,
  children,
}: DatePickerPopoverProps) {
  const { actionsRef, rootOpen, onOpenChange: handleOpenChange } = usePopupExit(
    open,
    onOpenChange
  );

  // Fallback release for the deferred unmount, for throttled tabs where the
  // exit's animation callback stalls.
  useEffect(() => {
    if (open) return;
    const id = setTimeout(() => actionsRef.current?.unmount(), exitFallbackMs(spring.fast));
    return () => clearTimeout(id);
  }, [open, actionsRef]);

  return (
    <PopoverPrimitive.Root
      open={rootOpen}
      actionsRef={actionsRef}
      modal={false}
      onOpenChange={(next, details) => {
        if (!next) {
          // A press on the time field itself is not "outside", and Escape
          // during a range pick undoes the pick instead of closing.
          if (
            details.reason === "outside-press" &&
            anchorRef?.current?.contains(details.event.target as Node)
          ) {
            return;
          }
          if (details.reason === "escape-key" && escapeBlocked?.()) return;
        }
        handleOpenChange(next, details);
      }}
    >
      {kind === "trigger" ? <PopoverPrimitive.Trigger render={anchor} /> : anchor}
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          side="bottom"
          align={align}
          sideOffset={6}
          collisionPadding={8}
          anchor={kind === "anchor" ? anchorRef : undefined}
          className="z-[var(--z-popover,60)] outline-none [--popup-available-height:var(--available-height)]"
        >
          <PopoverPrimitive.Popup
            // The calendar focuses its day; a time field keeps focus.
            initialFocus={false}
            finalFocus={kind === "trigger"}
            className={cn("outline-none")}
          >
            <DatePickerPopupFrame
              open={open}
              onExitComplete={() => actionsRef.current?.unmount()}
              className={className}
            >
              {children}
            </DatePickerPopupFrame>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

function DatePicker(props: DatePickerProps) {
  return <DatePickerCore {...props} Popover={DatePickerPopover} />;
}

DatePicker.displayName = "DatePicker";

export { DatePicker };
export {
  formatDateLabel,
  formatRangeLabel,
  formatDuration,
  formatTime,
  parseTime,
  shiftEnd,
  buildSlots,
} from "@/components/ui/date-picker-core";
export type {
  DatePickerProps,
  DatePickerSingleProps,
  DatePickerRangeProps,
  DatePickerPreset,
  TimeRange,
  DateRange,
} from "@/components/ui/date-picker-core";
