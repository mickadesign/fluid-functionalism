"use client";

import {
  forwardRef,
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import { useShape } from "@/lib/shape-context";
import { useIcon } from "@/lib/icon-context";
import { Slider } from "@/registry/default/slider";
import { Dropdown, useDropdown } from "@/registry/default/dropdown";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ColorFormat = "hex" | "rgb" | "hsl" | "oklch";

interface ParsedColor {
  // HSV (canonical, 0..360 / 0..1 / 0..1)
  h: number;
  s: number;
  v: number;
  a: number;
  // sRGB 0..255
  r: number;
  g: number;
  b: number;
  // Formatted strings
  hex: string;
  rgb: string;
  hsl: string;
  oklch: string;
}

interface ColorPickerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string, parsed: ParsedColor) => void;
  format?: ColorFormat;
  defaultFormat?: ColorFormat;
  onFormatChange?: (format: ColorFormat) => void;
  swatches?: string[];
  hideEyedropper?: boolean;
}

interface ColorPickerPopoverProps extends ColorPickerProps {
  triggerLabel?: string;
  triggerLabelPosition?: "left" | "right";
  triggerShowValue?: boolean;
  triggerShowRemove?: boolean;
  onTriggerRemove?: () => void;
  triggerClassName?: string;
}

interface ColorSwatchProps
  extends Omit<HTMLAttributes<HTMLButtonElement>, "color"> {
  color: string;
  size?: number;
  selected?: boolean;
}

// ---------------------------------------------------------------------------
// Color math (no deps)
// ---------------------------------------------------------------------------

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function clamp255(n: number) {
  return Math.max(0, Math.min(255, n));
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const c = v * s;
  const hh = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hh < 1) { r = c; g = x; b = 0; }
  else if (hh < 2) { r = x; g = c; b = 0; }
  else if (hh < 3) { r = 0; g = c; b = x; }
  else if (hh < 4) { r = 0; g = x; b = c; }
  else if (hh < 5) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const m = v - c;
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const v = max;
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, v };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0, s = 0;
  if (d > 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hh < 1) { r = c; g = x; }
  else if (hh < 2) { r = x; g = c; }
  else if (hh < 3) { g = c; b = x; }
  else if (hh < 4) { g = x; b = c; }
  else if (hh < 5) { r = x; b = c; }
  else { r = c; b = x; }
  const m = l - c / 2;
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

function srgbToLinear(c: number): number {
  c = c / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return clamp01(v) * 255;
}

function linearRgbToOklab(r: number, g: number, b: number): { L: number; a: number; b: number } {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return {
    L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  };
}

function oklabToLinearRgb(L: number, a: number, b: number): { r: number; g: number; b: number } {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return {
    r:  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  };
}

function rgbToOklch(r: number, g: number, b: number): { L: number; C: number; H: number } {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const lab = linearRgbToOklab(lr, lg, lb);
  const C = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  let H = Math.atan2(lab.b, lab.a) * 180 / Math.PI;
  if (H < 0) H += 360;
  return { L: lab.L, C, H };
}

function oklchToRgb(L: number, C: number, H: number): { r: number; g: number; b: number } {
  const a = C * Math.cos(H * Math.PI / 180);
  const b = C * Math.sin(H * Math.PI / 180);
  const lin = oklabToLinearRgb(L, a, b);
  // Clamp to sRGB silently (option a from plan)
  return {
    r: clamp255(linearToSrgb(lin.r)),
    g: clamp255(linearToSrgb(lin.g)),
    b: clamp255(linearToSrgb(lin.b)),
  };
}

function to2hex(n: number): string {
  return Math.round(clamp255(n)).toString(16).padStart(2, "0");
}

function rgbToHexStr(r: number, g: number, b: number, a: number): string {
  if (a >= 1) return `#${to2hex(r)}${to2hex(g)}${to2hex(b)}`;
  return `#${to2hex(r)}${to2hex(g)}${to2hex(b)}${to2hex(a * 255)}`;
}

function expandShortHex(h: string): string {
  if (h.length === 3) return h.split("").map((c) => c + c).join("");
  if (h.length === 4) return h.split("").map((c) => c + c).join("");
  return h;
}

function parseHex(input: string): { r: number; g: number; b: number; a: number } | null {
  const m = input.trim().match(/^#?([0-9a-fA-F]{3,8})$/);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3 || h.length === 4) h = expandShortHex(h);
  if (h.length === 6) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: 1,
    };
  }
  if (h.length === 8) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: parseInt(h.slice(6, 8), 16) / 255,
    };
  }
  return null;
}

function parseColor(input: string): { r: number; g: number; b: number; a: number } | null {
  const s = input.trim();
  if (!s) return null;
  if (s.startsWith("#") || /^[0-9a-fA-F]{3,8}$/.test(s)) {
    return parseHex(s);
  }
  const rgbM = s.match(/^rgba?\(\s*([^)]+)\)$/i);
  if (rgbM) {
    const parts = rgbM[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const r = parseFloat(parts[0]);
    const g = parseFloat(parts[1]);
    const b = parseFloat(parts[2]);
    let a = 1;
    if (parts[3] !== undefined) {
      a = parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
    }
    if ([r, g, b, a].some(Number.isNaN)) return null;
    return { r: clamp255(r), g: clamp255(g), b: clamp255(b), a: clamp01(a) };
  }
  const hslM = s.match(/^hsla?\(\s*([^)]+)\)$/i);
  if (hslM) {
    const parts = hslM[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const h = parseFloat(parts[0]);
    const sat = parts[1].endsWith("%") ? parseFloat(parts[1]) / 100 : parseFloat(parts[1]);
    const l = parts[2].endsWith("%") ? parseFloat(parts[2]) / 100 : parseFloat(parts[2]);
    let a = 1;
    if (parts[3] !== undefined) {
      a = parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
    }
    if ([h, sat, l, a].some(Number.isNaN)) return null;
    const rgb = hslToRgb(h, clamp01(sat), clamp01(l));
    return { r: clamp255(rgb.r), g: clamp255(rgb.g), b: clamp255(rgb.b), a: clamp01(a) };
  }
  const oklchM = s.match(/^oklch\(\s*([^)]+)\)$/i);
  if (oklchM) {
    const parts = oklchM[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const L = parts[0].endsWith("%") ? parseFloat(parts[0]) / 100 : parseFloat(parts[0]);
    const C = parseFloat(parts[1]);
    const H = parseFloat(parts[2]);
    let a = 1;
    if (parts[3] !== undefined) {
      a = parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
    }
    if ([L, C, H, a].some(Number.isNaN)) return null;
    const rgb = oklchToRgb(clamp01(L), Math.max(0, C), H);
    return { r: clamp255(rgb.r), g: clamp255(rgb.g), b: clamp255(rgb.b), a: clamp01(a) };
  }
  return null;
}

function buildParsed(h: number, s: number, v: number, a: number): ParsedColor {
  const { r, g, b } = hsvToRgb(h, s, v);
  const hsl = rgbToHsl(r, g, b);
  const oklch = rgbToOklch(r, g, b);
  const hex = rgbToHexStr(r, g, b, a);
  const rgbStr = a >= 1
    ? `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
    : `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${Number(a.toFixed(3))})`;
  const hslStr = a >= 1
    ? `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`
    : `hsla(${Math.round(hsl.h)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%, ${Number(a.toFixed(3))})`;
  const oklchStr = a >= 1
    ? `oklch(${(oklch.L * 100).toFixed(1)}% ${oklch.C.toFixed(3)} ${oklch.H.toFixed(1)})`
    : `oklch(${(oklch.L * 100).toFixed(1)}% ${oklch.C.toFixed(3)} ${oklch.H.toFixed(1)} / ${Number(a.toFixed(3))})`;
  return {
    h, s, v, a,
    r: Math.round(r), g: Math.round(g), b: Math.round(b),
    hex, rgb: rgbStr, hsl: hslStr, oklch: oklchStr,
  };
}

function formatValueByFormat(parsed: ParsedColor, fmt: ColorFormat): string {
  switch (fmt) {
    case "hex": return parsed.hex;
    case "rgb": return parsed.rgb;
    case "hsl": return parsed.hsl;
    case "oklch": return parsed.oklch;
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PANEL_WIDTH = 280;
const SQUARE_HEIGHT = 156;
const CHECKER_BG: CSSProperties = {
  backgroundImage:
    "conic-gradient(#bbb 0 25%, #fff 0 50%, #bbb 0 75%, #fff 0)",
  backgroundSize: "8px 8px",
};

// ---------------------------------------------------------------------------
// SaturationSquare
// ---------------------------------------------------------------------------

interface SaturationSquareProps {
  h: number;
  s: number;
  v: number;
  onChange: (s: number, v: number) => void;
}

function SaturationSquare({ h, s, v, onChange }: SaturationSquareProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const hasMoved = useRef(false);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const shape = useShape();

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const x = clamp01((clientX - rect.left) / rect.width);
      const y = clamp01((clientY - rect.top) / rect.height);
      onChange(x, 1 - y);
    },
    [onChange]
  );

  const updateCursorPos = useCallback((clientX: number, clientY: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setCursorPos({
      x: clamp01((clientX - rect.left) / rect.width) * 100,
      y: clamp01((clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      dragging.current = true;
      hasMoved.current = false;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      updateFromPointer(e.clientX, e.clientY);
    },
    [updateFromPointer]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      updateCursorPos(e.clientX, e.clientY);
      if (!dragging.current) return;
      hasMoved.current = true;
      updateFromPointer(e.clientX, e.clientY);
    },
    [updateFromPointer, updateCursorPos]
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
    hasMoved.current = false;
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const step = e.shiftKey ? 0.1 : 0.01;
      let nextS = s, nextV = v, handled = true;
      if (e.key === "ArrowLeft") nextS = clamp01(s - step);
      else if (e.key === "ArrowRight") nextS = clamp01(s + step);
      else if (e.key === "ArrowUp") nextV = clamp01(v + step);
      else if (e.key === "ArrowDown") nextV = clamp01(v - step);
      else handled = false;
      if (handled) {
        e.preventDefault();
        onChange(nextS, nextV);
      }
    },
    [onChange, s, v]
  );

  const { r, g, b } = hsvToRgb(h, s, v);
  const thumbColor = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;

  return (
    <div
      ref={ref}
      role="application"
      aria-label="Saturation and brightness"
      tabIndex={0}
      onFocus={(e) => { if (e.currentTarget.matches(":focus-visible")) setFocused(true); }}
      onBlur={() => setFocused(false)}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => {
        setHovered(false);
        setCursorPos(null);
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onKeyDown={onKeyDown}
      className={cn(
        "relative w-full select-none touch-none cursor-none overflow-hidden outline-none",
        shape.bg
      )}
      style={{
        height: SQUARE_HEIGHT,
        background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${h}, 100%, 50%))`,
        boxShadow: focused ? "0 0 0 2px #6B97FF" : undefined,
      }}
    >
      <motion.div
        className="absolute pointer-events-none rounded-full"
        initial={false}
        animate={{
          left: `${s * 100}%`,
          top: `${(1 - v) * 100}%`,
          width: 18,
          height: 18,
        }}
        transition={{ duration: 0 }}
        style={{
          transform: "translate(-50%, -50%)",
          border: "1px solid white",
          boxShadow: "0 0 0 1px rgba(0,0,0,1)",
          backgroundColor: thumbColor,
        }}
      />
      {hovered && !dragging.current && cursorPos && (
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            left: `${cursorPos.x}%`,
            top: `${cursorPos.y}%`,
            width: 18,
            height: 18,
            transform: "translate(-50%, -50%)",
            border: "2px solid rgba(255, 255, 255, 0.55)",
            boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.2)",
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// HueSlider
// ---------------------------------------------------------------------------

function HueSlider({ h, onChange }: { h: number; onChange: (h: number) => void }) {
  const hueColor = `hsl(${h}, 100%, 50%)`;
  return (
    <Slider
      value={h}
      onChange={(v) => onChange(typeof v === "number" ? v : v[0])}
      min={0}
      max={360}
      step={1}
      showValue={false}
      hideFill
      thumbColor={hueColor}
      thumbBorderColor="rgba(255,255,255,0.9)"
      trackStyle={{
        background:
          "linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))",
        borderColor: "transparent",
      }}
      aria-label="Hue"
    />
  );
}

// ---------------------------------------------------------------------------
// AlphaSlider
// ---------------------------------------------------------------------------

function AlphaSlider({
  a,
  solidColor,
  solidR,
  solidG,
  solidB,
  onChange,
}: {
  a: number;
  solidColor: string;
  solidR: number;
  solidG: number;
  solidB: number;
  onChange: (a: number) => void;
}) {
  // Use color-aware transparent stop (same hue, alpha 0) so the gradient stays
  // chromatically consistent and reaches fully opaque at 100% with no edge gap.
  const transparentColor = `rgba(${solidR}, ${solidG}, ${solidB}, 0)`;
  return (
    <Slider
      value={Math.round(a * 100)}
      onChange={(v) => onChange((typeof v === "number" ? v : v[0]) / 100)}
      min={0}
      max={100}
      step={1}
      showValue={false}
      hideFill
      thumbColor={solidColor}
      thumbBorderColor="rgba(255,255,255,0.9)"
      trackStyle={{
        backgroundImage: `linear-gradient(to right, ${transparentColor} 0%, ${solidColor} 98%), conic-gradient(#bbb 0 25%, #fff 0 50%, #bbb 0 75%, #fff 0)`,
        backgroundSize: "100% 100%, 8px 8px",
        borderColor: "transparent",
      }}
      aria-label="Alpha"
    />
  );
}

// ---------------------------------------------------------------------------
// FormatDropdown (custom, lightweight)
// ---------------------------------------------------------------------------

const FORMAT_LABELS: Record<ColorFormat, string> = {
  hex: "HEX",
  rgb: "RGB",
  hsl: "HSL",
  oklch: "OKLCH",
};

function FormatItem({
  index,
  label,
  checked,
  onSelect,
}: {
  index: number;
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { registerItem, activeIndex, checkedIndex } = useDropdown();
  const shape = useShape();

  useEffect(() => {
    registerItem(index, ref.current);
    return () => registerItem(index, null);
  }, [index, registerItem]);

  const isActive = activeIndex === index;

  return (
    <div
      ref={ref}
      data-proximity-index={index}
      role="menuitemradio"
      aria-checked={checked}
      aria-label={label}
      tabIndex={index === (checkedIndex ?? 0) ? 0 : -1}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        `relative z-10 flex items-center px-3 py-2 text-[13px] cursor-pointer outline-none transition-colors duration-80`,
        shape.item,
        isActive || checked ? "text-foreground" : "text-muted-foreground"
      )}
      style={{
        fontVariationSettings: checked ? fontWeights.semibold : fontWeights.normal,
      }}
    >
      {label}
    </div>
  );
}

function FormatDropdown({
  value,
  onChange,
}: {
  value: ColorFormat;
  onChange: (f: ColorFormat) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const shape = useShape();
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (open && triggerRef.current) {
      setRect(triggerRef.current.getBoundingClientRect());
    } else {
      setRect(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        !panelRef.current?.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const formats = ["hex", "rgb", "hsl", "oklch"] as const;
  const checkedIdx = formats.indexOf(value);
  const ChevronDownIcon = useIcon("chevron-down");

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex items-center justify-between gap-2 h-9 px-3 text-[13px] text-foreground border border-border bg-transparent hover:bg-accent/40 transition-colors duration-80 outline-none focus-visible:ring-1 focus-visible:ring-[#6B97FF] cursor-pointer",
          shape.input
        )}
        style={{ fontVariationSettings: fontWeights.medium }}
      >
        <span>{FORMAT_LABELS[value]}</span>
        <ChevronDownIcon size={14} strokeWidth={1.5} className="text-muted-foreground" />
      </button>
      {open && rect && typeof document !== "undefined" && createPortal(
        <div
          style={{
            position: "fixed",
            top: rect.bottom + 6,
            left: rect.left,
            zIndex: 60,
          }}
        >
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -4, scaleY: 0.96 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            transition={springs.fast}
            style={{ transformOrigin: "top center", minWidth: rect.width }}
          >
            <Dropdown checkedIndex={checkedIdx} className="!w-auto min-w-full">
              {formats.map((fmt, i) => (
                <FormatItem
                  key={fmt}
                  index={i}
                  label={FORMAT_LABELS[fmt]}
                  checked={value === fmt}
                  onSelect={() => {
                    onChange(fmt);
                    setOpen(false);
                  }}
                />
              ))}
            </Dropdown>
          </motion.div>
        </div>,
        document.body
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// ColorInput (a single styled text input, used for hex)
// ---------------------------------------------------------------------------

interface ColorInputProps {
  value: string;
  onCommit: (next: string) => void;
  ariaLabel: string;
  width?: string;
  className?: string;
  inputClassName?: string;
  align?: "left" | "center" | "right";
  prefix?: ReactNode;
  inputMode?: "numeric" | "decimal" | "text";
  nudgeStep?: number;
  nudgeShiftStep?: number;
  hasPercent?: boolean;
  decimals?: number;
  scrubbable?: boolean;
}

const ColorInput = forwardRef<HTMLInputElement, ColorInputProps>(
  (
    {
      value,
      onCommit,
      ariaLabel,
      width,
      className,
      inputClassName,
      align = "left",
      prefix,
      inputMode = "text",
      nudgeStep,
      nudgeShiftStep,
      hasPercent = false,
      decimals,
      scrubbable = false,
    },
    ref
  ) => {
    const [draft, setDraft] = useState(value);
    const [editing, setEditing] = useState(false);
    const interactingRef = useRef(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const scrubRef = useRef<{
      startX: number;
      startValue: number;
      scrubbing: boolean;
      pointerId: number;
    } | null>(null);
    const shape = useShape();

    useEffect(() => {
      if (!interactingRef.current) setDraft(value);
    }, [value]);

    const setInputRef = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      },
      [ref]
    );

    const formatNumber = (n: number) =>
      decimals != null ? n.toFixed(decimals) : String(Math.round(n));

    const commitNumber = (n: number) => {
      const formatted = formatNumber(n);
      const withSuffix = hasPercent ? `${formatted}%` : formatted;
      setDraft(withSuffix);
      onCommit(withSuffix);
    };

    const nudge = (direction: 1 | -1, shift: boolean) => {
      const baseStep = shift ? (nudgeShiftStep ?? 10) : (nudgeStep ?? 1);
      const cur = parseFloat(draft.replace("%", ""));
      if (Number.isNaN(cur)) return;
      commitNumber(cur + direction * baseStep);
    };

    const onWrapperPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!scrubbable || editing) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const cur = parseFloat(draft.replace("%", ""));
      if (Number.isNaN(cur)) return;
      scrubRef.current = {
        startX: e.clientX,
        startValue: cur,
        scrubbing: false,
        pointerId: e.pointerId,
      };
      // Block focus while we wait to see if this is a click or a drag
      e.preventDefault();
      wrapperRef.current?.setPointerCapture(e.pointerId);
    };

    const onWrapperPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      const state = scrubRef.current;
      if (!state) return;
      const dx = e.clientX - state.startX;
      if (!state.scrubbing && Math.abs(dx) > 3) {
        state.scrubbing = true;
        interactingRef.current = true;
      }
      if (state.scrubbing) {
        const baseStep = e.shiftKey ? (nudgeShiftStep ?? 10) : (nudgeStep ?? 1);
        commitNumber(state.startValue + dx * baseStep);
      }
    };

    const onWrapperPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      const state = scrubRef.current;
      if (!state) return;
      scrubRef.current = null;
      try {
        wrapperRef.current?.releasePointerCapture(e.pointerId);
      } catch {}
      if (state.scrubbing) {
        interactingRef.current = false;
        // Sync draft back to the (possibly clamped) value from parent
        setDraft(value);
        return;
      }
      // Click without drag → enter edit mode and focus the input
      setEditing(true);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    };

    return (
      <div
        ref={wrapperRef}
        onPointerDown={onWrapperPointerDown}
        onPointerMove={onWrapperPointerMove}
        onPointerUp={onWrapperPointerUp}
        onPointerCancel={onWrapperPointerUp}
        className={cn(
          "flex items-center h-9 px-2 border border-border bg-transparent hover:bg-accent/60 active:bg-accent/80 transition-colors duration-80 focus-within:ring-1 focus-within:ring-[#6B97FF] select-none",
          shape.input,
          scrubbable && !editing && "cursor-ew-resize",
          className
        )}
        style={{ width }}
      >
        {prefix && (
          <span className="text-[12px] text-muted-foreground mr-1 select-none">
            {prefix}
          </span>
        )}
        <input
          ref={setInputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => {
            interactingRef.current = true;
            setEditing(true);
            e.currentTarget.select();
          }}
          onBlur={() => {
            interactingRef.current = false;
            setEditing(false);
            if (draft !== value) onCommit(draft);
            else setDraft(value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              (e.currentTarget as HTMLInputElement).blur();
            } else if (e.key === "Escape") {
              setDraft(value);
              (e.currentTarget as HTMLInputElement).blur();
            } else if (
              (nudgeStep != null || nudgeShiftStep != null) &&
              (e.key === "ArrowUp" || e.key === "ArrowDown")
            ) {
              e.preventDefault();
              nudge(e.key === "ArrowUp" ? 1 : -1, e.shiftKey);
            }
          }}
          inputMode={inputMode}
          aria-label={ariaLabel}
          className={cn(
            "flex-1 min-w-0 bg-transparent text-foreground text-[13px] outline-none tabular-nums",
            align === "center" && "text-center",
            align === "right" && "text-right",
            scrubbable && !editing && "pointer-events-none",
            inputClassName
          )}
          style={{ fontVariationSettings: fontWeights.medium }}
        />
      </div>
    );
  }
);

ColorInput.displayName = "ColorInput";

// ---------------------------------------------------------------------------
// EyeDropperButton
// ---------------------------------------------------------------------------

interface EyeDropperGlobal {
  open(): Promise<{ sRGBHex: string }>;
}

function EyeDropperButton({ onPick }: { onPick: (hex: string) => void }) {
  const [supported, setSupported] = useState(false);
  const shape = useShape();
  const PipetteIcon = useIcon("pipette");

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "EyeDropper" in window);
  }, []);

  if (!supported) return null;

  const handleClick = async () => {
    try {
      const Ctor = (window as unknown as { EyeDropper: new () => EyeDropperGlobal }).EyeDropper;
      const eye = new Ctor();
      const result = await eye.open();
      onPick(result.sRGBHex);
    } catch {
      // user cancelled
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Pick color from screen"
      className={cn(
        "flex items-center justify-center h-9 px-3 text-foreground border border-border bg-transparent hover:bg-accent/40 transition-colors duration-80 outline-none focus-visible:ring-1 focus-visible:ring-[#6B97FF] cursor-pointer",
        shape.input
      )}
    >
      <PipetteIcon size={16} strokeWidth={1.5} />
    </button>
  );
}

// ---------------------------------------------------------------------------
// ColorTile (small colored square — checker behind alpha)
// ---------------------------------------------------------------------------

interface ColorTileProps {
  color: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

function ColorTile({ color, size = 24, className, style }: ColorTileProps) {
  const shape = useShape();
  return (
    <span
      className={cn("inline-block relative shrink-0 overflow-hidden", shape.bg, className)}
      style={{
        width: size,
        height: size,
        ...CHECKER_BG,
        boxShadow: "inset 0 0 0 1px rgba(127,127,127,0.25)",
        ...style,
      }}
    >
      <span
        className="absolute inset-0"
        style={{ backgroundColor: color }}
      />
    </span>
  );
}

// ---------------------------------------------------------------------------
// ColorSwatch (clickable strip swatch)
// ---------------------------------------------------------------------------

const ColorSwatch = forwardRef<HTMLButtonElement, ColorSwatchProps>(
  ({ color, size = 28, selected, className, ...props }, ref) => {
    const shape = useShape();
    return (
      <button
        ref={ref}
        type="button"
        aria-label={`Select color ${color}`}
        className={cn(
          "relative shrink-0 overflow-hidden cursor-pointer outline-none transition-shadow duration-100",
          shape.bg,
          className
        )}
        style={{
          width: size,
          height: size,
          ...CHECKER_BG,
          boxShadow: selected
            ? "inset 0 0 0 1px rgba(127,127,127,0.25), 0 0 0 2px var(--background), 0 0 0 4px #6B97FF"
            : "inset 0 0 0 1px rgba(127,127,127,0.25)",
        }}
        {...props}
      >
        <span
          className="absolute inset-0"
          style={{ backgroundColor: color }}
        />
      </button>
    );
  }
);

ColorSwatch.displayName = "ColorSwatch";

// ---------------------------------------------------------------------------
// SwatchStrip
// ---------------------------------------------------------------------------

function SwatchStrip({
  swatches,
  current,
  onPick,
}: {
  swatches: string[];
  current: string;
  onPick: (color: string) => void;
}) {
  const normalizedCurrent = useMemo(() => {
    const p = parseColor(current);
    return p ? rgbToHexStr(p.r, p.g, p.b, p.a).toLowerCase() : "";
  }, [current]);

  return (
    <div className="flex flex-wrap gap-1.5">
      {swatches.map((sw, i) => {
        const parsed = parseColor(sw);
        const normalized = parsed
          ? rgbToHexStr(parsed.r, parsed.g, parsed.b, parsed.a).toLowerCase()
          : sw.toLowerCase();
        const isSelected = normalized === normalizedCurrent;
        return (
          <ColorSwatch
            key={`${sw}-${i}`}
            color={sw}
            size={28}
            selected={isSelected}
            onClick={() => onPick(sw)}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ColorPicker (panel)
// ---------------------------------------------------------------------------

const ColorPicker = forwardRef<HTMLDivElement, ColorPickerProps>(
  (
    {
      value,
      defaultValue = "#ff0000",
      onValueChange,
      format,
      defaultFormat = "hex",
      onFormatChange,
      swatches,
      hideEyedropper,
      className,
      ...props
    },
    ref
  ) => {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(value ?? defaultValue);
    const currentRawValue = isControlled ? (value as string) : internalValue;

    const isFormatControlled = format !== undefined;
    const [internalFormat, setInternalFormat] = useState<ColorFormat>(defaultFormat);
    const currentFormat = isFormatControlled ? (format as ColorFormat) : internalFormat;

    // Internal HSV state (canonical). H is preserved across S=0 / V=0 transitions.
    const initialParsed = useMemo(() => {
      const p = parseColor(currentRawValue);
      if (!p) return { h: 0, s: 1, v: 1, a: 1 };
      const hsv = rgbToHsv(p.r, p.g, p.b);
      return { h: hsv.s === 0 ? 0 : hsv.h, s: hsv.s, v: hsv.v, a: p.a };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const [hsv, setHsv] = useState(initialParsed);

    // External value sync — when controlled value changes from outside, sync HSV
    const lastEmittedRef = useRef<string>("");
    useEffect(() => {
      if (!isControlled) return;
      const emitted = lastEmittedRef.current;
      const cur = value as string;
      if (cur === emitted) return;
      const p = parseColor(cur);
      if (!p) return;
      const newHsv = rgbToHsv(p.r, p.g, p.b);
      setHsv((prev) => ({
        h: newHsv.s === 0 ? prev.h : newHsv.h,
        s: newHsv.s,
        v: newHsv.v,
        a: p.a,
      }));
    }, [value, isControlled]);

    const parsed = useMemo(
      () => buildParsed(hsv.h, hsv.s, hsv.v, hsv.a),
      [hsv]
    );

    const updateHsv = useCallback(
      (next: { h?: number; s?: number; v?: number; a?: number }) => {
        const merged = { ...hsv, ...next };
        setHsv(merged);
        const p = buildParsed(merged.h, merged.s, merged.v, merged.a);
        const formatted = formatValueByFormat(p, currentFormat);
        lastEmittedRef.current = formatted;
        if (!isControlled) setInternalValue(formatted);
        onValueChange?.(formatted, p);
      },
      [hsv, currentFormat, isControlled, onValueChange]
    );

    const handleFormatChange = useCallback(
      (f: ColorFormat) => {
        if (!isFormatControlled) setInternalFormat(f);
        onFormatChange?.(f);
        // Re-emit value in new format
        const formatted = formatValueByFormat(parsed, f);
        lastEmittedRef.current = formatted;
        if (!isControlled) setInternalValue(formatted);
        onValueChange?.(formatted, parsed);
      },
      [isFormatControlled, isControlled, onFormatChange, onValueChange, parsed]
    );

    const handleHexCommit = useCallback(
      (input: string) => {
        const p = parseColor(input);
        if (!p) return;
        const newHsv = rgbToHsv(p.r, p.g, p.b);
        const merged = {
          h: newHsv.s === 0 ? hsv.h : newHsv.h,
          s: newHsv.s,
          v: newHsv.v,
          a: p.a,
        };
        setHsv(merged);
        const next = buildParsed(merged.h, merged.s, merged.v, merged.a);
        const formatted = formatValueByFormat(next, currentFormat);
        lastEmittedRef.current = formatted;
        if (!isControlled) setInternalValue(formatted);
        onValueChange?.(formatted, next);
      },
      [hsv.h, currentFormat, isControlled, onValueChange]
    );

    const handleSwatchPick = useCallback(
      (sw: string) => {
        handleHexCommit(sw);
      },
      [handleHexCommit]
    );

    const handleEyedrop = useCallback(
      (hex: string) => {
        handleHexCommit(hex);
      },
      [handleHexCommit]
    );

    const solidHueRgb = useMemo(() => hsvToRgb(hsv.h, hsv.s, hsv.v), [hsv.h, hsv.s, hsv.v]);
    const solidR = Math.round(solidHueRgb.r);
    const solidG = Math.round(solidHueRgb.g);
    const solidB = Math.round(solidHueRgb.b);
    const solidColorString = `rgb(${solidR}, ${solidG}, ${solidB})`;
    const shape = useShape();

    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-2 p-3 bg-card border border-border/60", shape.container, className)}
        style={{ width: PANEL_WIDTH }}
        {...props}
      >
        <SaturationSquare
          h={hsv.h}
          s={hsv.s}
          v={hsv.v}
          onChange={(s, v) => updateHsv({ s, v })}
        />

        <div className="flex flex-col -my-1">
          <HueSlider h={hsv.h} onChange={(h) => updateHsv({ h })} />
          <AlphaSlider
            a={hsv.a}
            solidColor={solidColorString}
            solidR={solidR}
            solidG={solidG}
            solidB={solidB}
            onChange={(a) => updateHsv({ a })}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <FormatDropdown value={currentFormat} onChange={handleFormatChange} />
          {!hideEyedropper && <EyeDropperButton onPick={handleEyedrop} />}
        </div>

        <ColorInputsRow
          parsed={parsed}
          format={currentFormat}
          onChannelChange={(channel, value) => {
            const p = { ...parsed };
            switch (channel) {
              case "hex": handleHexCommit(value as string); return;
              case "r": case "g": case "b": {
                const r = channel === "r" ? Number(value) : p.r;
                const g = channel === "g" ? Number(value) : p.g;
                const b = channel === "b" ? Number(value) : p.b;
                const hsvVal = rgbToHsv(r, g, b);
                updateHsv({
                  h: hsvVal.s === 0 ? hsv.h : hsvVal.h,
                  s: hsvVal.s,
                  v: hsvVal.v,
                });
                return;
              }
              case "hSL": case "sSL": case "lSL": {
                const hsl = rgbToHsl(p.r, p.g, p.b);
                const h2 = channel === "hSL" ? Number(value) : hsl.h;
                const s2 = channel === "sSL" ? Number(value) / 100 : hsl.s;
                const l2 = channel === "lSL" ? Number(value) / 100 : hsl.l;
                const rgb = hslToRgb(h2, clamp01(s2), clamp01(l2));
                const hsvVal = rgbToHsv(rgb.r, rgb.g, rgb.b);
                updateHsv({
                  h: hsvVal.s === 0 ? h2 : hsvVal.h,
                  s: hsvVal.s,
                  v: hsvVal.v,
                });
                return;
              }
              case "L": case "C": case "H": {
                const cur = rgbToOklch(p.r, p.g, p.b);
                const L = channel === "L" ? Number(value) / 100 : cur.L;
                const C = channel === "C" ? Number(value) : cur.C;
                const H = channel === "H" ? Number(value) : cur.H;
                const rgb = oklchToRgb(clamp01(L), Math.max(0, C), H);
                const hsvVal = rgbToHsv(rgb.r, rgb.g, rgb.b);
                updateHsv({
                  h: hsvVal.s === 0 ? hsv.h : hsvVal.h,
                  s: hsvVal.s,
                  v: hsvVal.v,
                });
                return;
              }
              case "alphaPercent": {
                const a = clamp01(Number(value) / 100);
                updateHsv({ a });
                return;
              }
            }
          }}
        />

        {swatches && swatches.length > 0 && (
          <SwatchStrip
            swatches={swatches}
            current={parsed.hex}
            onPick={handleSwatchPick}
          />
        )}
      </div>
    );
  }
);

ColorPicker.displayName = "ColorPicker";

// ---------------------------------------------------------------------------
// ColorInputsRow — adapts inputs to format
// ---------------------------------------------------------------------------

type ChannelKey =
  | "hex"
  | "r" | "g" | "b"
  | "hSL" | "sSL" | "lSL"
  | "L" | "C" | "H"
  | "alphaPercent";

function ColorInputsRow({
  parsed,
  format,
  onChannelChange,
}: {
  parsed: ParsedColor;
  format: ColorFormat;
  onChannelChange: (key: ChannelKey, value: string) => void;
}) {
  const alphaPct = Math.round(parsed.a * 100);

  if (format === "hex") {
    const hexNoHash = parsed.hex.replace(/^#/, "").toUpperCase();
    return (
      <div className="grid grid-cols-2 gap-2">
        <ColorInput
          value={hexNoHash}
          onCommit={(next) => onChannelChange("hex", next.startsWith("#") ? next : `#${next}`)}
          ariaLabel="Hex value"
          prefix="#"
        />
        <AlphaInput value={alphaPct} onCommit={(n) => onChannelChange("alphaPercent", String(n))} />
      </div>
    );
  }

  if (format === "rgb") {
    return (
      <div className="grid grid-cols-4 gap-1">
        <ColorInput value={String(parsed.r)} onCommit={(n) => onChannelChange("r", n)} ariaLabel="Red" align="center" inputMode="numeric" nudgeStep={1} nudgeShiftStep={10} scrubbable />
        <ColorInput value={String(parsed.g)} onCommit={(n) => onChannelChange("g", n)} ariaLabel="Green" align="center" inputMode="numeric" nudgeStep={1} nudgeShiftStep={10} scrubbable />
        <ColorInput value={String(parsed.b)} onCommit={(n) => onChannelChange("b", n)} ariaLabel="Blue" align="center" inputMode="numeric" nudgeStep={1} nudgeShiftStep={10} scrubbable />
        <AlphaInput value={alphaPct} onCommit={(n) => onChannelChange("alphaPercent", String(n))} />
      </div>
    );
  }

  if (format === "hsl") {
    const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
    return (
      <div className="grid grid-cols-4 gap-1">
        <ColorInput value={String(Math.round(hsl.h))} onCommit={(n) => onChannelChange("hSL", n)} ariaLabel="Hue" align="center" inputMode="numeric" nudgeStep={1} nudgeShiftStep={10} scrubbable />
        <ColorInput value={String(Math.round(hsl.s * 100))} onCommit={(n) => onChannelChange("sSL", n)} ariaLabel="Saturation" align="center" inputMode="numeric" nudgeStep={1} nudgeShiftStep={10} scrubbable />
        <ColorInput value={String(Math.round(hsl.l * 100))} onCommit={(n) => onChannelChange("lSL", n)} ariaLabel="Lightness" align="center" inputMode="numeric" nudgeStep={1} nudgeShiftStep={10} scrubbable />
        <AlphaInput value={alphaPct} onCommit={(n) => onChannelChange("alphaPercent", String(n))} />
      </div>
    );
  }

  // oklch
  const oklch = rgbToOklch(parsed.r, parsed.g, parsed.b);
  return (
    <div className="grid grid-cols-4 gap-1">
      <ColorInput value={(oklch.L * 100).toFixed(0)} onCommit={(n) => onChannelChange("L", n)} ariaLabel="Lightness" align="center" inputMode="decimal" nudgeStep={1} nudgeShiftStep={10} scrubbable />
      <ColorInput value={oklch.C.toFixed(2)} onCommit={(n) => onChannelChange("C", n)} ariaLabel="Chroma" align="center" inputMode="decimal" nudgeStep={0.01} nudgeShiftStep={0.1} decimals={2} scrubbable />
      <ColorInput value={oklch.H.toFixed(0)} onCommit={(n) => onChannelChange("H", n)} ariaLabel="Hue" align="center" inputMode="numeric" nudgeStep={1} nudgeShiftStep={10} scrubbable />
      <AlphaInput value={alphaPct} onCommit={(n) => onChannelChange("alphaPercent", String(n))} />
    </div>
  );
}

function AlphaInput({ value, onCommit }: { value: number; onCommit: (n: number) => void }) {
  return (
    <ColorInput
      value={`${value}%`}
      onCommit={(input) => {
        const n = parseFloat(input.replace("%", ""));
        if (Number.isNaN(n)) return;
        onCommit(Math.max(0, Math.min(100, Math.round(n))));
      }}
      ariaLabel="Alpha"
      align="center"
      inputMode="numeric"
      nudgeStep={1}
      nudgeShiftStep={10}
      hasPercent
      scrubbable
    />
  );
}

// ---------------------------------------------------------------------------
// ColorPickerPopover (trigger button + portal panel)
// ---------------------------------------------------------------------------

const ColorPickerPopover = forwardRef<HTMLDivElement, ColorPickerPopoverProps>(
  (
    {
      triggerLabel,
      triggerLabelPosition = "left",
      triggerShowValue = true,
      triggerShowRemove = false,
      onTriggerRemove,
      triggerClassName,
      ...pickerProps
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const shape = useShape();

    const isControlled = pickerProps.value !== undefined;
    const [internalValue, setInternalValue] = useState(pickerProps.value ?? pickerProps.defaultValue ?? "#ff0000");
    const currentValue = isControlled ? (pickerProps.value as string) : internalValue;

    const onValueChange = useCallback(
      (v: string, parsed: ParsedColor) => {
        if (!isControlled) setInternalValue(v);
        pickerProps.onValueChange?.(v, parsed);
      },
      [isControlled, pickerProps]
    );

    useEffect(() => {
      if (open && triggerRef.current) {
        setRect(triggerRef.current.getBoundingClientRect());
      } else {
        setRect(null);
      }
    }, [open]);

    useEffect(() => {
      if (!open) return;
      const onClick = (e: MouseEvent) => {
        if (
          !panelRef.current?.contains(e.target as Node) &&
          !triggerRef.current?.contains(e.target as Node)
        ) {
          setOpen(false);
        }
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      document.addEventListener("mousedown", onClick);
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("mousedown", onClick);
        document.removeEventListener("keydown", onKey);
      };
    }, [open]);

    const XIcon = useIcon("x");
    const parsed = useMemo(() => parseColor(currentValue), [currentValue]);
    const swatchColor = parsed
      ? rgbToHexStr(parsed.r, parsed.g, parsed.b, parsed.a)
      : currentValue;
    const valueLabel = parsed
      ? rgbToHexStr(parsed.r, parsed.g, parsed.b, 1).replace(/^#/, "").toUpperCase()
      : currentValue;

    return (
      <div ref={ref} className="inline-flex">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            "flex items-center gap-2 h-9 px-2 border border-border bg-transparent hover:bg-accent/40 transition-colors duration-80 outline-none focus-visible:ring-1 focus-visible:ring-[#6B97FF] cursor-pointer",
            shape.input,
            triggerClassName
          )}
          style={{ fontVariationSettings: fontWeights.medium }}
        >
          {triggerLabel && triggerLabelPosition === "left" && (
            <span className="text-[13px] text-muted-foreground px-1 select-none">
              {triggerLabel}
            </span>
          )}
          <ColorTile color={swatchColor} size={20} />
          {triggerShowValue && (
            <span className="text-[13px] text-foreground tabular-nums">
              {valueLabel}
            </span>
          )}
          {triggerLabel && triggerLabelPosition === "right" && (
            <span className="text-[13px] text-muted-foreground px-1 select-none">
              {triggerLabel}
            </span>
          )}
          {triggerShowRemove && (
            <span
              role="button"
              aria-label="Remove color"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onTriggerRemove?.();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  e.preventDefault();
                  onTriggerRemove?.();
                }
              }}
              className="ml-1 text-muted-foreground hover:text-foreground cursor-pointer flex items-center"
            >
              <XIcon size={14} strokeWidth={1.5} />
            </span>
          )}
        </button>
        {open && rect && typeof document !== "undefined" && createPortal(
          <div
            style={{
              position: "fixed",
              top: rect.bottom + 6,
              left: rect.left,
              zIndex: 50,
            }}
          >
            <AnimatePresence>
              <motion.div
                ref={panelRef}
                initial={{ opacity: 0, y: -4, scaleY: 0.96 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -4, scaleY: 0.96 }}
                transition={springs.moderate}
                style={{ transformOrigin: "top left" }}
              >
                <ColorPicker
                  {...pickerProps}
                  value={currentValue}
                  onValueChange={onValueChange}
                  className={cn(
                    "shadow-[0_4px_12px_rgba(0,0,0,0.02)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
                    pickerProps.className
                  )}
                />
              </motion.div>
            </AnimatePresence>
          </div>,
          document.body
        )}
      </div>
    );
  }
);

ColorPickerPopover.displayName = "ColorPickerPopover";

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  ColorPicker,
  ColorPickerPopover,
  ColorSwatch,
  ColorTile,
  parseColor,
  buildParsed,
};

export type {
  ColorPickerProps,
  ColorPickerPopoverProps,
  ColorSwatchProps,
  ColorFormat,
  ParsedColor,
};
