"use client";

import {
  forwardRef,
  type ComponentProps,
  type ComponentType,
} from "react";
import { useBase } from "@/lib/base-context";

/**
 * Site-only flavor switching for the dual-flavor components that ship a
 * single public API on two primitives (Radix / Base UI).
 *
 * The right panel's Primitive selector (useBase, default "base") decides
 * which implementation renders. Every part of a compound component branches
 * on the same value, so an entire tree always resolves from one flavor
 * module and cross-component contexts stay consistent. Toggling the flavor
 * remounts the subtree (component identity changes); page-level controlled
 * state survives, transient state like open popups resets.
 *
 * Registry consumers never see these wrappers — they install one flavor,
 * targeted at components/ui/<name>.tsx.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function flavored<C extends ComponentType<any>>(
  BaseImpl: C,
  RadixImpl: C,
  displayName: string
): C {
  const Flavored = forwardRef<unknown, ComponentProps<C>>(
    function FlavoredComponent(props, ref) {
      const { base } = useBase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Impl: ComponentType<any> = base === "base" ? BaseImpl : RadixImpl;
      return <Impl {...props} ref={ref} />;
    }
  );
  Flavored.displayName = displayName;
  return Flavored as unknown as C;
}
