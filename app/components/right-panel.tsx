"use client";

import { useEffect, useState } from "react";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { Button } from "@/registry/radix/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/flavored/select";
import {
  useShape,
  useShapeContext,
  type ShapeVariant,
} from "@/lib/shape-context";
import { useThemeContext, type Theme } from "@/registry/default/lib/theme-context";
import { useIcon } from "@/lib/icon-context";
import {
  useIconLibrary,
  iconLibraryOrder,
  iconLibraryLabels,
  type IconLibrary,
} from "@/lib/docs/icon-playground";
import { SurfaceProvider } from "@/lib/surface-context";
import { Tooltip } from "@/registry/radix/tooltip";
import { useBase, type Base } from "@/lib/base-context";

const REPO = "mickadesign/fluid-functionalism";

function formatStars(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return String(n);
}

/** GitHub mark, shaped as an IconComponent so it can ride Button's leadingIcon slot. */
function GitHubIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

/** Standalone GitHub star-count button — rendered next to the "Make them yours" heading. */
export function GitHubStarButton() {
  const shapeCtx = useShape();
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    fetch(`https://api.github.com/repos/${REPO}`, {
      headers: { Accept: "application/vnd.github.v3+json" },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.stargazers_count != null) {
          setStars(data.stargazers_count);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <Button
      variant="ghost"
      size="sm"
      leadingIcon={GitHubIcon}
      aria-label="View on GitHub"
      className={shapeCtx.button}
      onClick={() =>
        window.open(
          `https://github.com/${REPO}`,
          "_blank",
          "noopener,noreferrer"
        )
      }
    >
      {stars !== null && (
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {formatStars(stars)}
        </span>
      )}
    </Button>
  );
}

/** The inner settings content — reused in the right column and mobile drawer. */
export function SettingsContent({ tooltipSide = "left" }: { tooltipSide?: "left" | "right" | "top" | "bottom" }) {
  const { theme, setTheme } = useThemeContext();
  const { shape, setShape } = useShapeContext();
  const { iconLibrary, setIconLibrary } = useIconLibrary();
  const { base, setBase } = useBase();

  const MonitorIcon = useIcon("monitor");
  const SunIcon = useIcon("sun");
  const MoonIcon = useIcon("moon");
  const RectHorizIcon = useIcon("rectangle-horizontal");
  const CircleIcon = useIcon("circle");
  const PaletteIcon = useIcon("palette");
  const RadixIcon = useIcon("circle");
  const BaseUiIcon = useIcon("square-library");

  const themeOptions = [
    { label: "System", value: "system" as Theme, icon: MonitorIcon },
    { label: "Light", value: "light" as Theme, icon: SunIcon },
    { label: "Dark", value: "dark" as Theme, icon: MoonIcon },
  ];

  const shapeOptions = [
    { label: "Rounded", value: "rounded" as ShapeVariant, icon: RectHorizIcon },
    { label: "Pill", value: "pill" as ShapeVariant, icon: CircleIcon },
  ];

  const iconOptions = iconLibraryOrder.map((lib) => ({
    label: iconLibraryLabels[lib],
    value: lib,
    icon: PaletteIcon,
  }));

  const baseOptions = [
    { label: "Radix", value: "radix" as Base, icon: RadixIcon },
    { label: "Base UI", value: "base" as Base, icon: BaseUiIcon },
  ];

  return (
    <div className="flex flex-col gap-2">
      {/* Theme, Radius & Icons selects */}
      <div className="flex flex-col gap-1.5 py-3">
        <Tooltip content={<span>Press &ensp;<kbd className="font-mono opacity-50">T</kbd>&ensp; to cycle</span>} side={tooltipSide}>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">Theme</span>
            <Select value={theme} onValueChange={(v) => setTheme(v as Theme)}>
              <SelectTrigger
                variant="borderless"
                className="min-w-0 w-auto h-7 px-2 text-[13px]"
                icon={themeOptions.find((o) => o.value === theme)?.icon}
              />
              <SelectContent>
                {themeOptions.map((o, i) => (
                  <SelectItem key={o.value} value={o.value} index={i} icon={o.icon}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Tooltip>
        <Tooltip content={<span>Press &ensp;<kbd className="font-mono opacity-50">R</kbd>&ensp; to toggle</span>} side={tooltipSide}>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">Radius</span>
            <Select value={shape} onValueChange={(v) => setShape(v as ShapeVariant)}>
              <SelectTrigger
                variant="borderless"
                className="min-w-0 w-auto h-7 px-2 text-[13px]"
                icon={shapeOptions.find((o) => o.value === shape)?.icon}
              />
              <SelectContent>
                {shapeOptions.map((o, i) => (
                  <SelectItem key={o.value} value={o.value} index={i} icon={o.icon}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Tooltip>
        <Tooltip content={<span>Press &ensp;<kbd className="font-mono opacity-50">I</kbd>&ensp; to cycle</span>} side={tooltipSide}>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">Icons</span>
            <Select value={iconLibrary} onValueChange={(v) => setIconLibrary(v as IconLibrary)}>
              <SelectTrigger
                variant="borderless"
                className="min-w-0 w-auto h-7 px-2 text-[13px]"
              />
              <SelectContent>
                {iconOptions.map((o, i) => (
                  <SelectItem key={o.value} value={o.value} index={i}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Tooltip>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Primitive</span>
          <Select value={base} onValueChange={(v) => setBase(v as Base)}>
            <SelectTrigger
              variant="borderless"
              className="min-w-0 w-auto h-7 px-2 text-[13px]"
            />
            <SelectContent>
              {baseOptions.map((o, i) => (
                <SelectItem key={o.value} value={o.value} index={i}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Credit */}
      <div className="flex items-center gap-2">
        <img
          src="/micka.png"
          alt=""
          className="w-5 h-5 rounded-full object-cover shrink-0"
        />
        <p className="text-[13px] text-muted-foreground">
          Created by{" "}
          <a
            href="https://x.com/micka_design"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded text-muted-foreground hover:text-foreground transition-colors duration-80 outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] focus-visible:ring-offset-2"
          >
            @micka_design
          </a>
        </p>
      </div>

    </div>
  );
}

/** Desktop-only right column that mirrors the left sidebar styling. */
export function RightPanel() {
  return (
    // max-xl:fixed — during the xl-fade-block fade-out the panel keeps
    // display:block for the transition (allow-discrete), which would hold its
    // 264px of flex space and make the content reflow a second time when
    // display finally flips to none. Fixed positioning below xl removes it
    // from flow at the breakpoint (single reflow) while it fades in place:
    // top-0/right-0 + mt-4/mr-2 land on the same 8px/16px inset as the pinned
    // sticky state.
    <aside className="shrink-0 w-64 p-4 sticky top-4 self-start mt-4 mr-2 rounded-lg bg-muted xl-fade-block max-xl:fixed max-xl:top-0 max-xl:right-0 max-xl:z-40 max-xl:pointer-events-none">
      <SurfaceProvider value={2}>
        <div className="flex items-center justify-between pl-1 pt-2 pb-2">
          <h2
            className="text-[16px] text-foreground leading-none"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            Make them yours
          </h2>
          <GitHubStarButton />
        </div>
        <SettingsContent tooltipSide="left" />
      </SurfaceProvider>
    </aside>
  );
}
