"use client";

import { track } from "@vercel/analytics";
import type { ButtonSize } from "@/registry/radix/button";
import { CopyPromptButton } from "@/lib/docs/copy-prompt-button";
import { buildStarterPrompt } from "@/lib/docs/install-prompt";
import { useThemeContext } from "@/registry/default/lib/theme-context";
import { useShapeContext } from "@/lib/shape-context";
import { useSizeContext } from "@/lib/size-context";
import { useIconLibrary } from "@/lib/docs/icon-playground";
import { useBase } from "@/lib/base-context";
import type { StarterSettings } from "@/lib/starter/settings";
import { useHeadingFont } from "@/lib/docs/heading-font";

/** The current "Make them yours" settings, as the starter spells them. */
function useStarterSettings(): StarterSettings {
  const { theme } = useThemeContext();
  const { shape } = useShapeContext();
  const { size } = useSizeContext();
  const { iconLibrary } = useIconLibrary();
  const { base } = useBase();
  return { theme, shape, size, icons: iconLibrary, base };
}

/**
 * Home page "Copy install prompt": a brief that has a coding agent start a
 * new app from the starter, with every component and the visitor's "Make
 * them yours" settings and heading font. The prompt follows the settings
 * live (panel or T, R, S, I, F). On the home page and in the right panel.
 */
export function StarterPromptButton({ size, className }: { size?: ButtonSize; className?: string }) {
  const settings = useStarterSettings();
  const { font, custom, weight } = useHeadingFont();
  return (
    <CopyPromptButton
      label="Copy install prompt"
      prompt={buildStarterPrompt(settings, { font, custom, weight })}
      size={size}
      className={className}
      onCopy={() => track("Starter prompt copied", { base: settings.base, headingFont: font })}
    />
  );
}
