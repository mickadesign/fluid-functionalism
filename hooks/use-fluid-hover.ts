"use client";

// The site's copy of `@/hooks/use-fluid-hover`, which every registry
// component imports. It runs both implementations and hands the component
// the one the Hover setting picks: fluid (`registry/default`) or standard
// (`registry/standard`), the file an install from `r/standard/` gets. Both
// are always called so the hook order never changes when the setting flips;
// rows register with both, the pointer only drives the active one.

import { useCallback, useEffect, type RefObject } from "react";
import * as Fluid from "@/registry/default/hooks/use-fluid-hover";
import * as Standard from "@/registry/standard/hooks/use-fluid-hover";
import { useHoverMode } from "@/lib/docs/hover-mode";

export {
  useRegisterFluidHoverItem,
  useFluidHoverSelect,
  ACTIVE_ATTR,
  ACTIVE_INDEX_ATTR,
  pickNearest,
  isOwnEvent,
} from "@/registry/default/hooks/use-fluid-hover";
export type { FluidHoverActiveStore, ItemRect, PickNearestInput, UseFluidHoverReturn, UseFluidHoverOptions } from "@/registry/default/hooks/use-fluid-hover";

export function useFluidHover<T extends HTMLElement>(
  containerRef: RefObject<T | null>,
  options: Fluid.UseFluidHoverOptions = {}
): Fluid.UseFluidHoverReturn {
  const fluid = Fluid.useFluidHover(containerRef, options);
  const standard = Standard.useFluidHover(containerRef, options);
  const mode = useHoverMode();
  const active = mode === "standard" ? standard : fluid;

  // The idle one lets go of its highlight, so only the active one marks a row.
  const { setActiveIndex: clearFluid } = fluid;
  const { setActiveIndex: clearStandard } = standard;
  useEffect(() => {
    (mode === "standard" ? clearFluid : clearStandard)(null);
  }, [mode, clearFluid, clearStandard]);

  const { registerItem: registerFluid, remeasure: remeasureFluid, measureItems: measureFluid } = fluid;
  const {
    registerItem: registerStandard,
    remeasure: remeasureStandard,
    measureItems: measureStandard,
  } = standard;
  const registerItem = useCallback(
    (index: number, element: HTMLElement | null) => {
      registerFluid(index, element);
      registerStandard(index, element);
    },
    [registerFluid, registerStandard]
  );
  const remeasure = useCallback(() => {
    remeasureFluid();
    remeasureStandard();
  }, [remeasureFluid, remeasureStandard]);
  const measureItems = useCallback(() => {
    measureFluid();
    measureStandard();
  }, [measureFluid, measureStandard]);

  return { ...active, registerItem, remeasure, measureItems };
}
