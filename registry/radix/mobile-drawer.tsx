"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { spring, exitFallbackMs } from "@/lib/springs";
import { useSurface, SurfaceProvider } from "@/lib/surface-context";
import { surfaceClasses } from "@/lib/surface-classes";

// Built on Radix Dialog: it provides scroll lock, focus trap, focus restore,
// Esc + outside-click dismissal, while leaving the slide animation to
// framer-motion. Radix has no actionsRef-style deferred unmount, so the
// portal lifetime is managed with local `mounted` state (the same pattern
// the Dialog component uses): mount on open, keep the portal alive with
// `forceMount` through the exit tween, and unmount once the panel's exit
// animation completes.

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  triggerRef?: RefObject<HTMLElement | null>;
}

export function MobileDrawer({
  open,
  onClose,
  children,
  triggerRef,
}: MobileDrawerProps) {
  const substrate = useSurface();
  const level = Math.min(substrate + 2, 8);

  // Portal lifetime: mounts as soon as `open` flips true; on close it stays
  // mounted (forceMount below) until the exit tween finishes.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  // Fallback release for the deferred unmount: onAnimationComplete on the
  // panel is the primary signal, but rAF-driven animation callbacks can
  // stall in throttled/background tabs. The longest exit tween is
  // spring.moderate.exit (backdrop), so the fallback tracks that tier's exit
  // duration plus a safety buffer.
  useEffect(() => {
    if (open) return;
    const id = setTimeout(() => setMounted(false), exitFallbackMs(spring.moderate));
    return () => clearTimeout(id);
  }, [open]);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      {mounted && (
        <DialogPrimitive.Portal forceMount>
          {/* Overlay — same scrim as the library's dialogs: an always-on
              bg-black/40 base that stays visible for system-dark users (the
              `dark:` variant only matches the explicit .dark class), boosted
              to /80 in explicit dark mode. */}
          <DialogPrimitive.Overlay asChild forceMount>
            <motion.div
              className="fixed inset-0 bg-black/40 dark:bg-black/80 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: open ? 1 : 0 }}
              transition={open ? { duration: 0.16 } : spring.moderate.exit}
            />
          </DialogPrimitive.Overlay>

          {/* Panel */}
          <DialogPrimitive.Content
            asChild
            forceMount
            aria-label="Navigation"
            // Radix warns when Content has no Description; opting out with an
            // explicit undefined clears the rendered attribute, which is what
            // the DescriptionWarning in @radix-ui/react-dialog checks.
            aria-describedby={undefined}
            // Explicit focus restore: fires when the portal unmounts after
            // the exit tween, so focus lands back on the hamburger trigger.
            onCloseAutoFocus={(event) => {
              if (triggerRef?.current) {
                event.preventDefault();
                triggerRef.current.focus();
              }
            }}
          >
            <motion.div
              className={`fixed top-0 left-0 bottom-0 w-64 ${surfaceClasses(level, 3)} z-50 overflow-y-auto p-4`}
              initial={{ x: "-100%" }}
              animate={{ x: open ? 0 : "-100%" }}
              // spring.moderate: critically damped, so the panel decelerates
              // into x: 0 without overshooting (a bounce briefly exposed the
              // page background through the gap on the left edge).
              transition={open ? spring.moderate : spring.moderate.exit}
              // Release the deferred unmount once the exit tween has
              // finished so the close animation fully plays.
              onAnimationComplete={() => {
                if (!open) setMounted(false);
              }}
            >
              {/* Radix's TitleWarning checks for a rendered DialogTitle
                  element (aria-label alone does not satisfy it), so ship a
                  visually hidden Title; aria-labelledby then resolves to
                  it, giving the drawer its "Navigation" accessible name. */}
              <DialogPrimitive.Title className="sr-only">
                Navigation
              </DialogPrimitive.Title>
              <SurfaceProvider value={level}>{children}</SurfaceProvider>
            </motion.div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      )}
    </DialogPrimitive.Root>
  );
}

export default MobileDrawer;
