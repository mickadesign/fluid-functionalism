"use client";

import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useRef,
  useState,
  type ComponentProps,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import type { SizeVariant } from "@/lib/size-context";

// ContextMenu is the Dropdown opened where you right-click. A zero-size
// trigger is placed at the pointer and the menu opens from it, so the
// items are the Dropdown's own (MenuItem, DropdownSub, DropdownSearch,
// DropdownSeparator…), with its hover, keys, submenus and motion, on
// whichever flavor the Dropdown is.

interface Point {
  x: number;
  y: number;
}

interface ContextMenuContextValue {
  open: (point: Point, from: HTMLElement | null) => void;
}

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

interface ContextMenuProps {
  children: ReactNode;
  /** Called as the menu opens and closes. */
  onOpenChange?: (open: boolean) => void;
  /** Right-clicks keep the browser's own menu. */
  disabled?: boolean;
  /** Pins the menu's rows to one step of the size ladder. */
  size?: SizeVariant;
}

function ContextMenu({ children, onOpenChange, disabled = false, size }: ContextMenuProps) {
  const [open, setOpen] = useState(false);
  const [point, setPoint] = useState<Point | null>(null);
  // Where focus was when the menu opened: it goes back there on close
  // rather than to the hidden trigger.
  const returnTo = useRef<HTMLElement | null>(null);

  const change = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
    if (next) return;
    const back = returnTo.current;
    returnTo.current = null;
    // After the menu has handed focus to its trigger.
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (!back?.isConnected) return;
      if (!active || active === document.body || active.hasAttribute("data-context-menu-anchor"))
        back.focus({ preventScroll: true });
    });
  };

  const ctx: ContextMenuContextValue = {
    open: (at, from) => {
      if (disabled) return;
      const active = document.activeElement;
      returnTo.current =
        active instanceof HTMLElement && active !== document.body ? active : from;
      setPoint(at);
      change(true);
    },
  };

  return (
    <ContextMenuContext.Provider value={ctx}>
      <DropdownMenu open={open} onOpenChange={change} size={size}>
        {children}
        {point &&
          createPortal(
            // Fixed to the page, outside any scaled or scrolled box, so the
            // menu opens exactly where the pointer was.
            <DropdownTrigger
              render={
                <button
                  type="button"
                  tabIndex={-1}
                  aria-hidden
                  data-context-menu-anchor=""
                  className="pointer-events-none fixed size-0 opacity-0"
                  style={{ left: point.x, top: point.y }}
                />
              }
            />,
            document.body
          )}
      </DropdownMenu>
    </ContextMenuContext.Provider>
  );
}

/** Text fields keep the browser's menu (paste, spelling). */
const EDITABLE = "input, textarea, select, [contenteditable]:not([contenteditable=false])";

interface ContextMenuTriggerProps extends HTMLAttributes<HTMLElement> {
  /** The element that opens the menu, in place of the default div. Its own
   *  handlers run first. */
  render?: ReactElement<HTMLAttributes<HTMLElement>>;
  /** Which right-clicked elements open the menu; the rest keep the
   *  browser's. Text fields always keep the browser's. */
  filter?: (target: Element) => boolean;
  disabled?: boolean;
}

/** The area a right-click opens the menu in. From the keyboard, Shift +
 *  F10 or the Menu key opens it under the focused element. */
function ContextMenuTrigger({
  render,
  filter,
  disabled = false,
  children,
  className,
  onContextMenu,
  onKeyDown,
  ...props
}: ContextMenuTriggerProps) {
  const ctx = useContext(ContextMenuContext);
  if (!ctx) throw new Error("ContextMenuTrigger must be inside <ContextMenu>");

  const opens = (target: EventTarget, defaultPrevented: boolean) =>
    !disabled &&
    !defaultPrevented &&
    target instanceof Element &&
    !target.closest(EDITABLE) &&
    (!filter || filter(target));

  const own = isValidElement(render) ? render.props : undefined;

  const handleContextMenu = (e: MouseEvent<HTMLElement>) => {
    own?.onContextMenu?.(e);
    onContextMenu?.(e);
    // A nested menu that already opened claims the click.
    if (!opens(e.target, e.defaultPrevented)) return;
    e.preventDefault();
    ctx.open({ x: e.clientX, y: e.clientY }, e.currentTarget);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    own?.onKeyDown?.(e);
    onKeyDown?.(e);
    const menuKey = e.key === "ContextMenu" || (e.shiftKey && e.key === "F10");
    if (!menuKey || !opens(e.target, e.defaultPrevented)) return;
    e.preventDefault();
    const rect = (e.target as Element).getBoundingClientRect();
    ctx.open({ x: rect.left + 8, y: rect.bottom }, e.currentTarget);
  };

  if (isValidElement(render)) {
    return cloneElement(render, {
      ...props,
      className: cn(own?.className, className),
      onContextMenu: handleContextMenu,
      onKeyDown: handleKeyDown,
    });
  }
  return (
    <div
      data-slot="context-menu-trigger"
      className={className}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </div>
  );
}

type ContextMenuContentProps = Omit<ComponentProps<typeof DropdownContent>, "side" | "align">;

/** The menu: DropdownContent, opening down and to the right of the
 *  pointer (flipping at the window's edges). */
function ContextMenuContent({ sideOffset = 2, ...props }: ContextMenuContentProps) {
  return <DropdownContent side="bottom" align="start" sideOffset={sideOffset} {...props} />;
}

export { ContextMenu, ContextMenuTrigger, ContextMenuContent };
export type { ContextMenuProps, ContextMenuTriggerProps, ContextMenuContentProps };
