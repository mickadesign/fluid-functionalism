"use client";

// Docs-site icon playground data: the multi-library icon map behind the
// "press I to cycle icon library" switcher. Lucide is the set that ships
// with icon-context; the other five ship as their own registry libs
// (icons-tabler, icons-phosphor, icons-hugeicons, icons-untitledui,
// icons-fluid), which
// is also how the starter installs the library a visitor picked.

import { defaultIcons, type IconComponent, type IconName } from "@/lib/icon-context";
import { tablerIcons } from "@/registry/default/lib/icons-tabler";
import { phosphorIcons } from "@/registry/default/lib/icons-phosphor";
import { hugeiconsIcons } from "@/registry/default/lib/icons-hugeicons";
import { untitleduiIcons } from "@/registry/default/lib/icons-untitledui";
import { fluidIcons } from "@/registry/default/lib/icons-fluid";

export type IconLibrary = "lucide" | "tabler" | "phosphor" | "hugeicons" | "untitledui" | "fluid";

export const iconLibraryOrder: IconLibrary[] = ["lucide", "tabler", "phosphor", "hugeicons", "untitledui", "fluid"];

export const iconLibraryLabels: Record<IconLibrary, string> = {
  lucide: "Lucide",
  tabler: "Tabler",
  phosphor: "Phosphor",
  hugeicons: "HugeIcons",
  untitledui: "Untitled UI",
  fluid: "Fluid",
};

// ── Unified Map ─────────────────────────────────────────────

export const iconMap: Record<IconLibrary, Record<IconName, IconComponent>> = {
  lucide: defaultIcons,
  tabler: tablerIcons,
  phosphor: phosphorIcons,
  hugeicons: hugeiconsIcons,
  untitledui: untitleduiIcons,
  fluid: fluidIcons,
};
