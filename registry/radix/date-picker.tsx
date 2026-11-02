"use client";

import { useEffect, useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";
import { spring, exitFallbackMs } from "@/lib/springs";
import {
  DatePickerCore,
  DatePickerPopupFrame,
  type DatePickerPopoverProps,
  type DatePickerProps,
} from "@/components/ui/date-picker-core";

// ---------------------------------------------------------------------------
// DatePicker on Radix Popover. Radix owns positioning, the portal, outside
// press and focus-out dismissal, Escape, and focus return to the trigger;
// the calendar moves focus to the selected day itself. On close the content
// stays mounted (forceMount) until the exit spring finishes.
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
  const [mounted, setMounted] = useState(false);
  // Set during the render that opens it, so the portal mounts in the same
  // commit as `open`.
  if (open && !mounted) setMounted(true);

  // Fallback release for the deferred unmount, for throttled tabs where the
  // exit's animation callback stalls.
  useEffect(() => {
    if (open) return;
    const id = setTimeout(() => setMounted(false), exitFallbackMs(spring.fast));
    return () => clearTimeout(id);
  }, [open]);

  // A press or focus on the time field itself is not "outside".
  const guardAnchor = (e: { target: EventTarget | null; preventDefault: () => void }) => {
    if (anchorRef?.current?.contains(e.target as Node)) e.preventDefault();
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange} modal={false}>
      {kind === "trigger" ? (
        <PopoverPrimitive.Trigger asChild>{anchor}</PopoverPrimitive.Trigger>
      ) : (
        <PopoverPrimitive.Anchor asChild>{anchor}</PopoverPrimitive.Anchor>
      )}
      {mounted && (
        <PopoverPrimitive.Portal forceMount>
          <PopoverPrimitive.Content
            asChild
            forceMount
            side="bottom"
            align={align}
            sideOffset={6}
            collisionPadding={8}
            // The calendar focuses its day; a time field keeps focus.
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={kind === "anchor" ? (e) => e.preventDefault() : undefined}
            onEscapeKeyDown={(e) => {
              if (escapeBlocked?.()) e.preventDefault();
            }}
            onFocusOutside={guardAnchor}
            onPointerDownOutside={guardAnchor}
            onInteractOutside={guardAnchor}
            className={cn(
              "z-50 outline-none",
              "[--popup-available-height:var(--radix-popover-content-available-height)]"
            )}
          >
            <div>
              <DatePickerPopupFrame
                open={open}
                onExitComplete={() => setMounted(false)}
                className={className}
              >
                {children}
              </DatePickerPopupFrame>
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      )}
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
