"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { motion } from "framer-motion";
import { spring } from "@/lib/springs";
import { useSurface, SurfaceProvider } from "@/lib/surface-context";
import { surfaceClasses } from "@/lib/surface-classes";

// Built on Base UI Dialog rather than Base UI Drawer: Drawer's
// swipe-to-dismiss writes inline `transform` + `--drawer-swipe-movement-*`
// CSS vars onto its Popup and expects CSS-transition choreography (plus a
// mandatory <Drawer.Viewport>), which fights framer-motion's transform
// management on the same element. Dialog provides everything we actually
// need — scroll lock (scrollbar-gap safe, blocks iOS touch scrolling),
// focus trap, focus restore timed after close, Esc + outside-click
// dismissal — while leaving the slide animation to framer-motion.

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  triggerRef?: RefObject<HTMLElement | null>;
}

// Props framer-motion redefines with incompatible signatures; they must not
// be forwarded from Base UI's render-prop payload onto a motion.div.
type MotionSafeDivProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
>;

export function MobileDrawer({
  open,
  onClose,
  children,
  triggerRef,
}: MobileDrawerProps) {
  const substrate = useSurface();
  const level = Math.min(substrate + 2, 8);

  // With `actionsRef` set, Base UI defers unmounting the portal on close
  // until `actionsRef.current.unmount()` is called, letting the
  // framer-motion exit tween below play out first.
  const actionsRef = useRef<DialogPrimitive.Root.Actions | null>(null);

  // Fallback release for the deferred unmount: onAnimationComplete on the
  // panel is the primary signal, but rAF-driven animation callbacks can
  // stall in throttled/background tabs. The longest exit tween is
  // spring.moderate.exit (120ms) — 250ms covers it with margin without
  // holding the portal open perceptibly.
  useEffect(() => {
    if (open) return;
    const id = setTimeout(() => actionsRef.current?.unmount(), 250);
    return () => clearTimeout(id);
  }, [open]);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      actionsRef={actionsRef}
    >
      <DialogPrimitive.Portal>
        {/* Overlay — same scrim as the library's dialogs: an always-on
            bg-black/40 base that stays visible for system-dark users (the
            `dark:` variant only matches the explicit .dark class), boosted
            to /80 in explicit dark mode. */}
        <DialogPrimitive.Backdrop
          render={(backdropProps) => {
            const {
              style: _style,
              ...rest
            } = backdropProps as React.HTMLAttributes<HTMLDivElement>;
            return (
              <motion.div
                {...(rest as MotionSafeDivProps)}
                className="fixed inset-0 bg-black/40 dark:bg-black/80 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: open ? 1 : 0 }}
                transition={open ? { duration: 0.16 } : spring.moderate.exit}
              />
            );
          }}
        />

        {/* Panel */}
        <DialogPrimitive.Popup
          aria-label="Navigation"
          finalFocus={triggerRef}
          render={(popupProps) => {
            const {
              style: baseStyle,
              ...rest
            } = popupProps as React.HTMLAttributes<HTMLDivElement>;
            return (
              <motion.div
                {...(rest as MotionSafeDivProps)}
                className={`fixed top-0 left-0 bottom-0 w-64 ${surfaceClasses(level, 3)} z-50 overflow-y-auto p-4`}
                style={baseStyle as React.CSSProperties | undefined}
                initial={{ x: "-100%" }}
                animate={{ x: open ? 0 : "-100%" }}
                // spring.settle: critically damped, so the panel decelerates
                // into x: 0 without overshooting (a bounce briefly exposed the
                // page background through the gap on the left edge).
                transition={open ? spring.settle : spring.settle.exit}
                // Release Base UI's deferred unmount once the exit tween has
                // finished so the close animation fully plays.
                onAnimationComplete={() => {
                  if (!open) actionsRef.current?.unmount();
                }}
              >
                <SurfaceProvider value={level}>{children}</SurfaceProvider>
              </motion.div>
            );
          }}
        />
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default MobileDrawer;
