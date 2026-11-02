"use client";

import {
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { fontWeights } from "@/lib/font-weight";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useIcons } from "@/lib/icon-context";
import { spring, exitFallbackMs } from "@/lib/springs";
import { omit } from "@/lib/omit";
import { useShape } from "@/lib/shape-context";
import { useSize, useSizeVariant, typeClass } from "@/lib/size-context";
import { SurfaceProvider, useSurface } from "@/lib/surface-context";
import { surfaceClasses } from "@/lib/surface-classes";
import { Button } from "@/components/ui/button";

const DIALOG_OFFSET = 4;

interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  children?: ReactNode;
}

type DialogActions = DialogPrimitive.Root.Actions;

// Base UI unmounts a closing popup once the animations it can detect on the
// popup element end. It misses the Motion exit spring, which it cuts.
// A close that calls preventUnmountOnClose() in onOpenChange stays mounted
// until the content calls actionsRef.unmount(). A close made by setting
// `open` never reaches onOpenChange, so the root stays open until that close
// is replayed through actionsRef.close(), which does.
function usePopupExit(open: boolean, setOpen: (open: boolean) => void) {
  const actionsRef = useRef<DialogActions | null>(null);
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

// Lets DialogContent release the held unmount once its exit spring ends.
const DialogExitContext = createContext<{
  open: boolean;
  actionsRef: React.RefObject<DialogActions | null>;
} | null>(null);

function Dialog({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  modal,
}: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = openProp ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const { actionsRef, rootOpen, onOpenChange: handleOpenChange } = usePopupExit(
    open,
    setOpen
  );
  const exit = useMemo(() => ({ open, actionsRef }), [open, actionsRef]);

  return (
    <DialogExitContext.Provider value={exit}>
      <DialogPrimitive.Root
        open={rootOpen}
        onOpenChange={handleOpenChange}
        actionsRef={actionsRef}
        modal={modal}
      >
        {children}
      </DialogPrimitive.Root>
    </DialogExitContext.Provider>
  );
}

// Trigger and Close compose either way — `render={<Button/>}` (the
// library's composition API, shared with DropdownTrigger) or Radix-style
// `asChild` with a single child element — so one snippet works everywhere.
// Plain button attributes, which both the trigger and the close accept —
// their state-typed render/className/style function forms stay off the
// public surface.
interface DialogSlotProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Element to render as the control, e.g. a Button. */
  render?: ReactElement;
  /** Compose onto the single child element instead. */
  asChild?: boolean;
}

function slotRender(
  render: ReactElement | undefined,
  asChild: boolean | undefined,
  children: ReactNode
) {
  if (render) return render;
  return asChild && isValidElement(children) ? (children as ReactElement) : undefined;
}

const DialogTrigger = forwardRef<HTMLButtonElement, DialogSlotProps>(
  ({ render, asChild, children, ...props }, ref) => {
    const el = slotRender(render, asChild, children);
    return el ? (
      <DialogPrimitive.Trigger ref={ref} render={el} {...props} />
    ) : (
      <DialogPrimitive.Trigger ref={ref} {...props}>
        {children}
      </DialogPrimitive.Trigger>
    );
  }
);
DialogTrigger.displayName = "DialogTrigger";

const DialogClose = forwardRef<HTMLButtonElement, DialogSlotProps>(
  ({ render, asChild, children, ...props }, ref) => {
    const el = slotRender(render, asChild, children);
    return el ? (
      <DialogPrimitive.Close ref={ref} render={el} {...props} />
    ) : (
      <DialogPrimitive.Close ref={ref} {...props}>
        {children}
      </DialogPrimitive.Close>
    );
  }
);
DialogClose.displayName = "DialogClose";

interface DialogContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Width: sm 400, lg 540, xl 880 (each one notch narrower in compact
   *  regions). `xl` is the canvas for composed layouts — a sidebar beside
   *  a panel — which usually pair it with `className="p-0"` and a fixed
   *  height. */
  size?: "sm" | "lg" | "xl";
  /** Portal target. When set, the overlay and panel render inside this element
   *  (positioned `absolute`) instead of covering the viewport (`fixed`). Pair
   *  with a `position: relative; overflow: hidden` container — and usually
   *  `<Dialog modal={false}>` — to scope a dialog to a bounded region, e.g. a
   *  docs preview. Defaults to the document body / full-viewport behaviour. */
  container?: HTMLElement | null;
  /** The ✕ in the top-right corner. Drop it when the content has its own
   *  way out, e.g. a command menu that closes on Escape and on a pick.
   *  @default true */
  showCloseButton?: boolean;
  /** Where the panel sits: centered, or anchored 12dvh from the top so a
   *  panel whose height follows its content (a command menu) keeps its top
   *  edge still. @default "center" */
  position?: "center" | "top";
}

const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, size = "sm", container, showCloseButton = true, position = "center", ...props }, ref) => {
    const icons = useIcons();
    const XIcon = icons.x;
    const shape = useShape();
    const substrate = useSurface();
    const dialogLevel = Math.min(substrate + DIALOG_OFFSET, 8);
    // The size ladder narrows the dialog one notch in compact regions —
    // width only, the padding stays put (see /docs/sizes).
    const compact = useSize().variant === "compact";

    // No `if (!open) return null` here: Base UI's `<DialogPrimitive.Popup>`
    // handles mount/unmount itself. The close holds the unmount (see
    // usePopupExit) and the popup's onAnimationComplete releases it once the
    // exit spring ends. This timeout is the fallback for throttled tabs,
    // where rAF-driven animation callbacks can stall.
    const exit = useContext(DialogExitContext);
    const exitOpen = exit?.open ?? true;
    const exitActionsRef = exit?.actionsRef;
    useEffect(() => {
      if (exitOpen) return;
      const id = setTimeout(
        () => exitActionsRef?.current?.unmount(),
        exitFallbackMs(spring.slow)
      );
      return () => clearTimeout(id);
    }, [exitOpen, exitActionsRef]);

    return (
      <DialogPrimitive.Portal container={container ?? undefined}>
        <DialogPrimitive.Backdrop
          render={(backdropProps, state) => {
            const exiting = state.transitionStatus === "ending";
            const rest = omit(
              backdropProps as React.HTMLAttributes<HTMLDivElement>,
              [
                "style",
                "onDrag",
                "onDragStart",
                "onDragEnd",
                "onAnimationStart",
                "onAnimationEnd",
                "onAnimationIteration",
              ]
            );
            return (
              <motion.div
                {...rest}
                className={cn(
                  container ? "absolute" : "fixed",
                  "inset-0 z-50 bg-black/40 dark:bg-black/80"
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: exiting ? 0 : 1 }}
                transition={exiting ? spring.slow.exit : spring.slow}
              />
            );
          }}
        />
        <DialogPrimitive.Popup
          ref={ref}
          render={(popupProps, state) => {
            const exiting = state.transitionStatus === "ending";
            const { style: baseStyle, ...baseProps } =
              popupProps as React.HTMLAttributes<HTMLDivElement>;
            const rest = omit(baseProps, [
              "onDrag",
              "onDragStart",
              "onDragEnd",
              "onAnimationStart",
              "onAnimationEnd",
              "onAnimationIteration",
            ]);
            return (
              <motion.div
                // Base UI's props first (data attrs, refs, role, etc.)…
                {...rest}
                // …then the consumer's `<DialogContent>` props (className,
                // event handlers, data-*, etc.) land on the visible motion.div.
                {...(props as Omit<
                  React.HTMLAttributes<HTMLDivElement>,
                  | "onDrag"
                  | "onDragStart"
                  | "onDragEnd"
                  | "onAnimationStart"
                  | "onAnimationEnd"
                  | "onAnimationIteration"
                >)}
                className={cn(
                  container ? "absolute" : "fixed",
                  "left-1/2 z-50 w-[calc(100%-2rem)]",
                  position === "top" ? "top-[12dvh]" : "top-1/2",
                  surfaceClasses(dialogLevel),
                  "p-6 focus:outline-none",
                  size === "sm" && (compact ? "max-w-[360px]" : "max-w-[400px]"),
                  size === "lg" && (compact ? "max-w-[480px]" : "max-w-[540px]"),
                  size === "xl" && (compact ? "max-w-[800px]" : "max-w-[880px]"),
                  shape.container,
                  className
                )}
                style={{
                  ...(baseStyle as React.CSSProperties | undefined),
                  ...(props.style as React.CSSProperties | undefined),
                }}
                initial={{ opacity: 0, scale: 0.97, x: "-50%", y: position === "top" ? 0 : "-50%" }}
                animate={{
                  opacity: exiting ? 0 : 1,
                  scale: exiting ? 0.97 : 1,
                  x: "-50%",
                  y: position === "top" ? 0 : "-50%",
                }}
                transition={exiting ? spring.slow.exit : spring.slow}
                onAnimationComplete={() => {
                  if (exiting) exitActionsRef?.current?.unmount();
                }}
              >
                <SurfaceProvider value={dialogLevel}>
                  {children}
                  {showCloseButton && (
                    <DialogPrimitive.Close
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="absolute right-3 top-3"
                        >
                          <XIcon />
                          <span className="sr-only">Close</span>
                        </Button>
                      }
                    />
                  )}
                </SurfaceProvider>
              </motion.div>
            );
          }}
        />
      </DialogPrimitive.Portal>
    );
  }
);
DialogContent.displayName = "DialogContent";

function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 mb-4", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex justify-end gap-2 mt-6", className)}
      {...props}
    />
  );
}

const DialogTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  // The title role of the type scale — see /docs/sizes.
  const compact = useSizeVariant() === "compact";
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn(
        typeClass("title", compact ? "compact" : "default"),
        "text-foreground",
        className
      )}
      style={{ fontVariationSettings: fontWeights.semibold }}
      {...props}
    />
  );
});
DialogTitle.displayName = "DialogTitle";

const DialogDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const compact = useSizeVariant() === "compact";
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn(
        typeClass("body", compact ? "compact" : "default"),
        "text-muted-foreground",
        className
      )}
      {...props}
    />
  );
});
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
};
export type { DialogSlotProps as DialogTriggerProps, DialogSlotProps as DialogCloseProps };
