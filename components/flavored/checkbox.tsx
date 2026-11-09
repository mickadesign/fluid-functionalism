"use client";

import * as Base from "@/registry/base/checkbox";
import * as Radix from "@/registry/radix/checkbox";
import { flavored } from "@/components/flavored/flavored";

// The props match; only the ref element differs (Radix renders a button,
// Base UI a span), so the Radix part is typed as the Base one.
export const Checkbox = flavored(
  Base.Checkbox,
  Radix.Checkbox as unknown as typeof Base.Checkbox,
  "Flavored(Checkbox)"
);
export type { CheckboxProps } from "@/registry/base/checkbox";
