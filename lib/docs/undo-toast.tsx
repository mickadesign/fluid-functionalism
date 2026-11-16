"use client";

// The toast for an action that can be taken back (a deleted row, a
// deleted view): the message and an Undo button with its keys, inverted
// like a tooltip. Built on Sonner. Mount <UndoToaster /> once, anywhere
// under the app's providers, then call showUndoToast.
import { Toaster, toast } from "sonner";
import { cn } from "@/lib/utils";
import { KeyCaps } from "@/lib/key-cap";
import { fontWeights } from "@/lib/font-weight";
import { useShape } from "@/lib/shape-context";
import { typeClass, useSize } from "@/lib/size-context";
import { useIsMac } from "@/components/ui/command-menu";

/** Says what was done, with its way back. One slot: a second one replaces
 *  the first. Held 6s, so there is time to reach the button. */
export function showUndoToast(message: string, onUndo: () => void) {
  toast.custom(
    (id) => (
      <UndoToast
        message={message}
        onUndo={() => {
          onUndo();
          toast.dismiss(id);
        }}
      />
    ),
    {
      id: "undo",
      duration: 6000,
      // A custom toast's <li> shrinks to fit and left-aligns inside the
      // centered list; full width lets the body's mx-auto center it.
      style: { width: "100%" },
    }
  );
}

function UndoToast({ message, onUndo }: { message: string; onUndo: () => void }) {
  const shape = useShape();
  const size = useSize();
  const mac = useIsMac();
  return (
    <div
      role="status"
      className={cn(
        "mx-auto flex h-9 w-max items-center gap-3 bg-foreground pl-3 pr-1 text-background",
        typeClass("body", size.variant),
        shape.bg
      )}
      style={{ fontVariationSettings: fontWeights.normal }}
    >
      <span className="[text-box:trim-both_cap_alphabetic]">{message}</span>
      <button
        type="button"
        onClick={onUndo}
        className={cn(
          "inline-flex h-7 cursor-pointer items-center gap-1.5 px-2 text-background outline-none transition-colors duration-80 hover:bg-background/15 focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
          shape.input
        )}
        style={{ fontVariationSettings: fontWeights.semibold }}
      >
        Undo
        <KeyCaps keys={mac ? ["⌘", "Z"] : ["Ctrl", "Z"]} tone="inverted" />
      </button>
    </div>
  );
}

/** Where the toasts show: bottom center. */
export function UndoToaster() {
  return <Toaster position="bottom-center" />;
}
