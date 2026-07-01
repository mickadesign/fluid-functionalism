"use client";

import { useRef, useEffect, forwardRef, type HTMLAttributes } from "react";
import Link from "next/link";
import { useNavMenu } from "@/components/ui/nav-menu";
import type { IconComponent } from "@/lib/icon-context";
import { cn } from "@/lib/utils";
import { fontWeights } from "@/lib/font-weight";
import { useShape } from "@/lib/shape-context";

interface NavItemProps
  extends Omit<HTMLAttributes<HTMLAnchorElement>, "href"> {
  label: string;
  href: string;
  index: number;
  icon?: IconComponent;
  isNew?: boolean;
  isUpdated?: boolean;
  /** Tailwind background class for the status dot. Defaults to blue for both
   *  `isNew` and `isUpdated`. Set to override the new-dot colour per item. */
  dotColorClass?: string;
}

const NavItem = forwardRef<HTMLAnchorElement, NavItemProps>(
  ({ label, href, index, icon: Icon, isNew, isUpdated, dotColorClass, className, ...props }, ref) => {
    const internalRef = useRef<HTMLAnchorElement>(null);
    const { registerItem, registerSlug, activeIndex, activeSlug, activeRouteIndex } =
      useNavMenu();

    useEffect(() => {
      registerItem(index, internalRef.current);
      registerSlug(index, href);
      return () => {
        registerItem(index, null);
        registerSlug(index, null);
      };
    }, [index, href, registerItem, registerSlug]);

    const isActive = activeIndex === index;
    const isActiveRoute = activeSlug === href;
    const shape = useShape();

    // Roving tabindex: the active-route item gets 0, others -1. When no item in
    // this menu matches activeSlug (e.g. on an unrelated route), fall back to
    // making the first item tabbable so the menu stays keyboard-reachable.
    const activeRouteExists = activeRouteIndex !== null;
    const tabIdx = isActiveRoute ? 0 : activeRouteExists ? -1 : index === 0 ? 0 : -1;

    return (
      <Link
        ref={(node) => {
          (
            internalRef as React.MutableRefObject<HTMLAnchorElement | null>
          ).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref)
            (
              ref as React.MutableRefObject<HTMLAnchorElement | null>
            ).current = node;
        }}
        href={href}
        data-nav-index={index}
        tabIndex={tabIdx}
        aria-current={isActiveRoute ? "page" : undefined}
        className={cn(
          `relative z-10 flex items-center ${shape.item} px-3 py-1.5 cursor-pointer outline-none`,
          className
        )}
        {...props}
      >
        {Icon && (
          <Icon
            size={16}
            strokeWidth={isActiveRoute || isActive ? 2 : 1.5}
            className={cn(
              "shrink-0 mr-2 transition-[color,stroke-width] duration-80",
              isActiveRoute || isActive ? "text-foreground" : "text-muted-foreground"
            )}
          />
        )}
        <span className="inline-grid flex-1 text-[13px]">
          <span
            className="col-start-1 row-start-1 invisible"
            style={{ fontVariationSettings: fontWeights.semibold }}
            aria-hidden="true"
          >
            {label}
          </span>
          <span
            className={cn(
              "col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80",
              isActiveRoute || isActive
                ? "text-foreground"
                : "text-muted-foreground"
            )}
            style={{
              fontVariationSettings: isActiveRoute
                ? fontWeights.semibold
                : fontWeights.normal,
            }}
          >
            {label}
            {isUpdated ? (
              <span className="inline-block ml-2 size-1.5 rounded-full bg-blue-500 align-middle" />
            ) : isNew ? (
              <span
                className={cn(
                  "inline-block ml-2 size-1.5 rounded-full align-middle",
                  dotColorClass ?? "bg-blue-500"
                )}
              />
            ) : null}
          </span>
        </span>
      </Link>
    );
  }
);

NavItem.displayName = "NavItem";

export { NavItem };
export default NavItem;
