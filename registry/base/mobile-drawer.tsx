"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { motion } from "motion/react";
import { spring, exitFallbackMs } from "@/lib/springs";
import { omit } from "@/lib/omit";
import { useSurface, SurfaceProvider } from "@/lib/surface-context";
import { surfaceClasses } from "@/lib/surface-classes";

// Built on Base UI Dialog rather than Base UI Drawer: Drawer's
// swipe-to-dismiss writes inline `transform` + `--drawer-swipe-movement-*`
// CSS vars onto its Popup and expects CSS-transition choreography (plus a
// mandatory <Drawer.Viewport>), which fights Motion's transform
// management on the same element. Dialog provides everything we actually
// need — scroll lock (scrollbar-gap safe, blocks iOS touch scrolling),
// focus trap, focus restore timed after close, Esc + outside-click
// dismissal — while leaving the slide animation to Motion.

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  triggerRef?: RefObject<HTMLElement | null>;
}

// Props Motion redefines with incompatible signatures; they must not
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

// Base UI unmounts a closing popup once the animations it can detect on the
// popup element end. It misses the Motion exit spring, which it cuts.
// A close that calls preventUnmountOnClose() in onOpenChange stays mounted
// until the content calls actionsRef.unmount(). A close made by setting
// `open` never reaches onOpenChange, so the root stays open until that close
// is replayed through actionsRef.close(), which does.
function usePopupExit(open: boolean, setOpen: (open: boolean) => void) {
  const actionsRef = useRef<DialogPrimitive.Root.Actions | null>(null);
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

export function MobileDrawer({
  open,
  onClose,
  children,
  triggerRef,
}: MobileDrawerProps) {
  const substrate = useSurface();
  const level = Math.min(substrate + 2, 8);

  // A close holds Base UI's unmount until the Motion exit tween below
  // has played (see usePopupExit). The drawer only reports closes: opening
  // is the parent's job.
  const { actionsRef, rootOpen, onOpenChange } = usePopupExit(open, (next) => {
    if (!next) onClose();
  });

  // Fallback release for the deferred unmount: onAnimationComplete on the
  // panel is the primary signal, but rAF-driven animation callbacks can
  // stall in throttled/background tabs. The longest exit tween is
  // spring.moderate.exit (backdrop), so the fallback tracks that tier's exit
  // duration plus a safety buffer.
  useEffect(() => {
    if (open) return;
    const id = setTimeout(
      () => actionsRef.current?.unmount(),
      exitFallbackMs(spring.moderate)
    );
    return () => clearTimeout(id);
  }, [open, actionsRef]);

  return (
    <DialogPrimitive.Root
      open={rootOpen}
      onOpenChange={onOpenChange}
      actionsRef={actionsRef}
    >
      <DialogPrimitive.Portal>
        {/* Overlay — same scrim as the library's dialogs: an always-on
            bg-black/40 base that stays visible for system-dark users (the
            `dark:` variant only matches the explicit .dark class), boosted
            to /80 in explicit dark mode. */}
        <DialogPrimitive.Backdrop
          render={(backdropProps) => {
            const rest = omit(
              backdropProps as React.HTMLAttributes<HTMLDivElement>,
              ["style"]
            );
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
                // spring.moderate: critically damped, so the panel decelerates
                // into x: 0 without overshooting (a bounce briefly exposed the
                // page background through the gap on the left edge).
                transition={open ? spring.moderate : spring.moderate.exit}
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
