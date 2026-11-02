"use client";

import { useEffect, useRef } from "react";
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
// calls preventUnmountOnClose, and the frame releases the unmount through
// actionsRef once the exit spring ends.
// ---------------------------------------------------------------------------

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
  const actionsRef = useRef<{ unmount: () => void; close: () => void } | null>(null);

  // Fallback release for the deferred unmount, for throttled tabs where the
  // exit's animation callback stalls.
  useEffect(() => {
    if (open) return;
    const id = setTimeout(() => actionsRef.current?.unmount(), exitFallbackMs(spring.fast));
    return () => clearTimeout(id);
  }, [open]);

  return (
    <PopoverPrimitive.Root
      open={open}
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
          details.preventUnmountOnClose();
        }
        onOpenChange(next);
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
          className="z-50 outline-none [--popup-available-height:var(--available-height)]"
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
