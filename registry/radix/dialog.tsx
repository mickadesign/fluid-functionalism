"use client";

import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useState,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type ReactElement,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useIcon } from "@/lib/icon-context";
import { spring, exitFallbackMs } from "@/lib/springs";
import { useShape } from "@/lib/shape-context";
import { useSize, useSizeVariant } from "@/lib/size-context";
import { SurfaceProvider, useSurface } from "@/lib/surface-context";
import { surfaceClasses } from "@/lib/surface-classes";
import { Button } from "@/components/ui/button";

const DIALOG_OFFSET = 4;

const DialogOpenContext = createContext(false);

function Dialog({
  children,
  open: controlledOpen,
  defaultOpen,
  onOpenChange,
  ...props
}: DialogPrimitive.DialogProps) {
  // Internal state always tracks changes, and the consumer's onOpenChange is
  // notified alongside it — a listener must not replace state handling, or an
  // uncontrolled dialog with an onOpenChange prop could never open. The Root
  // below is always controlled by `open`, so defaultOpen seeds our state
  // instead of being forwarded.
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false);
  const open = controlledOpen ?? uncontrolledOpen;
  const handleOpenChange = (next: boolean) => {
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return (
    <DialogOpenContext.Provider value={open}>
      <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange} {...props}>
        {children}
      </DialogPrimitive.Root>
    </DialogOpenContext.Provider>
  );
}

// Trigger and Close compose either way — `render={<Button/>}` (the
// library's composition API, shared with DropdownTrigger) or Radix-style
// `asChild` with a single child element — so one snippet works everywhere.
interface DialogSlotProps
  extends Omit<ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>, "asChild"> {
  /** Element to render as the control, e.g. a Button. */
  render?: ReactElement;
  /** Compose onto the single child element instead. */
  asChild?: boolean;
}

const DialogTrigger = forwardRef<HTMLButtonElement, DialogSlotProps>(
  ({ render, asChild, children, ...props }, ref) =>
    render ? (
      <DialogPrimitive.Trigger ref={ref} asChild {...props}>
        {render}
      </DialogPrimitive.Trigger>
    ) : (
      <DialogPrimitive.Trigger ref={ref} asChild={asChild} {...props}>
        {children}
      </DialogPrimitive.Trigger>
    )
);
DialogTrigger.displayName = "DialogTrigger";

const DialogClose = forwardRef<HTMLButtonElement, DialogSlotProps>(
  ({ render, asChild, children, ...props }, ref) =>
    render ? (
      <DialogPrimitive.Close ref={ref} asChild {...props}>
        {render}
      </DialogPrimitive.Close>
    ) : (
      <DialogPrimitive.Close ref={ref} asChild={asChild} {...props}>
        {children}
      </DialogPrimitive.Close>
    )
);
DialogClose.displayName = "DialogClose";

interface DialogContentProps
  extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
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
    const XIcon = useIcon("x");
    const open = useContext(DialogOpenContext);
    const shape = useShape();
    const substrate = useSurface();
    const dialogLevel = Math.min(substrate + DIALOG_OFFSET, 8);
    // The size ladder narrows the dialog one notch in compact regions —
    // width only, the padding stays put.
    const compact = useSize().variant === "compact";
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      if (open) setMounted(true);
    }, [open]);

    // Fallback release for the deferred unmount: onAnimationComplete on the
    // panel is the primary signal, but rAF-driven animation callbacks can
    // stall in throttled/background tabs — leaving an invisible full-screen
    // overlay (and Radix's scroll lock) in place. Both exit tweens run at
    // spring.slow.exit, so the fallback tracks that tier.
    useEffect(() => {
      if (open) return;
      const id = setTimeout(() => setMounted(false), exitFallbackMs(spring.slow));
      return () => clearTimeout(id);
    }, [open]);

    const handleExitComplete = () => {
      if (!open) setMounted(false);
    };

    if (!mounted) return null;

    return (
      <DialogPrimitive.Portal forceMount container={container ?? undefined}>
        <DialogPrimitive.Overlay asChild forceMount>
          <motion.div
            className={cn(
              container ? "absolute" : "fixed",
              "inset-0 z-50 bg-black/40 dark:bg-black/80"
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: open ? 1 : 0 }}
            transition={open ? spring.slow : spring.slow.exit}
          />
        </DialogPrimitive.Overlay>
        <DialogPrimitive.Content ref={ref} asChild forceMount {...props}>
          <motion.div
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
            initial={{ opacity: 0, scale: 0.97, x: "-50%", y: position === "top" ? 0 : "-50%" }}
            animate={{
              opacity: open ? 1 : 0,
              scale: open ? 1 : 0.97,
              x: "-50%",
              y: position === "top" ? 0 : "-50%",
            }}
            transition={open ? spring.slow : spring.slow.exit}
            onAnimationComplete={handleExitComplete}
          >
            <SurfaceProvider value={dialogLevel}>
              {children}
              {showCloseButton && (
                <DialogPrimitive.Close asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-3 top-3"
                  >
                    <XIcon />
                    <span className="sr-only">Close</span>
                  </Button>
                </DialogPrimitive.Close>
              )}
            </SurfaceProvider>
          </motion.div>
        </DialogPrimitive.Content>
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
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => {
  // The title role of the type scale.
  const compact = useSizeVariant() === "compact";
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn(
        compact ? "text-[15px]" : "text-[16px]",
        "text-foreground leading-tight",
        className
      )}
      style={{ fontVariationSettings: "'wght' 700" }}
      {...props}
    />
  );
});
DialogTitle.displayName = "DialogTitle";

const DialogDescription = forwardRef<
  HTMLParagraphElement,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => {
  const compact = useSizeVariant() === "compact";
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn(
        compact ? "text-[12px]" : "text-[13px]",
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
