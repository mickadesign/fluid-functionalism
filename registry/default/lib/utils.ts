import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// The type-scale role utilities (see /docs/sizes) are font sizes, but
// tailwind-merge can't know that for custom classes — by default anything
// text-<word> it doesn't recognize is treated as a text *color*, so
// cn("text-body", "text-muted-foreground") would silently drop the size.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        "text-display",
        "text-title",
        "text-subtitle",
        "text-body",
        "text-caption",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
