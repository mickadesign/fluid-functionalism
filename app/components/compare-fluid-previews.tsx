"use client";

/**
 * Fluid Functionalism preview overrides used only on /compare. Each entry
 * here replaces the default `previewMap` entry from `bento-previews.tsx` so
 * the comparison reads more directly against the canonical shadcn version
 * (matched button heights, two badge variants, etc).
 */

import { useState } from "react";
import { Badge } from "@/registry/default/badge";
import { Button } from "@/registry/radix/button";
import { InputGroup, InputField } from "@/registry/default/input-group";
import {
  BADGE_ITEMS,
  BUTTON_ITEMS,
  INPUT_FIELDS,
} from "@/app/components/demo-data";

function ButtonPreview() {
  // size="lg" → h-9 / text-[14px], matching shadcn's size="sm" (h-9 / text-sm)
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {BUTTON_ITEMS.map((item) => (
        <Button key={item.label} variant={item.variant} size="lg">
          {item.label}
        </Button>
      ))}
    </div>
  );
}

function BadgePreview() {
  return (
    <div className="flex flex-col items-center gap-3">
      {(["solid", "dot"] as const).map((variant) => (
        <div key={variant} className="flex flex-wrap gap-1.5 items-center justify-center">
          {BADGE_ITEMS.map((item) => (
            <Badge key={item.label} variant={variant} color={item.color}>
              {item.label}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  );
}

function InputGroupPreview() {
  const [values, setValues] = useState<Record<string, string>>({});
  return (
    <div className="w-full max-w-[320px]">
      <InputGroup>
        {INPUT_FIELDS.map((field, i) => (
          <InputField
            key={field.key}
            index={i}
            label={field.label}
            placeholder={field.placeholder}
            value={values[field.key] ?? ""}
            onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
          />
        ))}
      </InputGroup>
    </div>
  );
}

export const compareFluidPreviewMap: Record<string, React.FC> = {
  button: ButtonPreview,
  badge: BadgePreview,
  "input-group": InputGroupPreview,
};
