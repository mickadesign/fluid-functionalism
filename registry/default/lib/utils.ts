import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// The type-scale role utilities (see /docs/typography) are font sizes, but
// tailwind-merge can't know that for custom classes — by default anything
// text-<word> it doesn't recognize is treated as a text *color*, so
// cn("text-body", "text-muted-foreground") would silently drop the size.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        // <generated:type-scale>
        "text-display",
        "text-title",
        "text-subtitle",
        "text-body",
        "text-caption",
        "text-micro",
        "text-site-display",
        "text-site-title",
        "text-site-subtitle",
        "text-site-body",
        "text-site-caption",
        "text-site-micro",
        // </generated:type-scale>
      ],
    },
    // A later size utility drops an earlier leading, as it did up to
    // tailwind-merge 3.7.0. 3.7.1 removed this pairing from its defaults.
    conflictingClassGroups: {
      "font-size": ["leading"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
