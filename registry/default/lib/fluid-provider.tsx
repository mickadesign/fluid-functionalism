"use client";

// ---------------------------------------------------------------------------
// One wrapper for the whole system. Put it near the root, once, and every
// component follows the same four settings:
//
//   - motion: MotionConfig reducedMotion="user", so the OS "reduce motion"
//     setting drops transform and layout animations. Fades stay, since they
//     carry meaning.
//   - shape: rounded, pill or sharp corners (ShapeProvider).
//   - size: the 36px default step or the 28px compact one (SizeProvider).
//   - icons: Lucide, unless you pass another set (icons-tabler,
//     icons-phosphor, icons-hugeicons, icons-untitledui) or your own map.
//
// In a Next.js app router project the root layout is a server component, and
// an icon map is made of functions, which can't cross into a client
// component as a prop. Render FluidProvider from a "use client" file that
// imports the icon set itself (components/providers.tsx in the starter).
// ---------------------------------------------------------------------------

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { ShapeProvider, type ShapeVariant } from "@/lib/shape-context";
import { SizeProvider, type SizeVariant } from "@/lib/size-context";
import { IconProvider, type IconComponent, type IconName } from "@/lib/icon-context";

export interface FluidProviderProps {
  children: ReactNode;
  /** Corner style of every component. Readable and switchable at runtime
   *  through useShapeContext(). */
  shape?: ShapeVariant;
  /** Size step of every control. Readable and switchable at runtime through
   *  useSizeContext(). */
  size?: SizeVariant;
  /** Icons by slot name. Slots left out keep Lucide. Pass a module-scope
   *  object: a new object each render re-renders every icon. */
  icons?: Partial<Record<IconName, IconComponent>>;
}

export function FluidProvider({
  children,
  shape = "rounded",
  size = "default",
  icons,
}: FluidProviderProps) {
  return (
    <MotionConfig reducedMotion="user">
      <ShapeProvider defaultShape={shape}>
        <SizeProvider defaultSize={size}>
          <IconProvider icons={icons}>{children}</IconProvider>
        </SizeProvider>
      </ShapeProvider>
    </MotionConfig>
  );
}
