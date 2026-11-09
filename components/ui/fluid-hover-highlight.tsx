"use client";

// The site's copy of `@/components/ui/fluid-hover-highlight`: renders fluid
// hover's highlight or standard hover's, as the Hover setting says. See
// hooks/use-fluid-hover.ts.

import * as Fluid from "@/registry/default/fluid-hover-highlight";
import * as Standard from "@/registry/standard/fluid-hover-highlight";
import { useHoverMode } from "@/lib/docs/hover-mode";

export { resolveHighlightTransition } from "@/registry/default/fluid-hover-highlight";
export type {
  FluidHoverHighlightProps,
  FluidHoverSource,
} from "@/registry/default/fluid-hover-highlight";

export function FluidHoverHighlight(props: Fluid.FluidHoverHighlightProps) {
  const mode = useHoverMode();
  return mode === "standard" ? (
    <Standard.FluidHoverHighlight {...(props as Standard.FluidHoverHighlightProps)} />
  ) : (
    <Fluid.FluidHoverHighlight {...props} />
  );
}
