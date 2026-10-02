"use client";

import {
  createContext,
  forwardRef,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Popover } from "@base-ui/react/popover";
import { Menu } from "@base-ui/react/menu";
import { NumberField } from "@base-ui/react/number-field";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import { nestedRadius, useShape, shapeMap } from "@/lib/shape-context";
import { SizeProvider, useSize, type SizeVariant } from "@/lib/size-context";
import { useSurface, SurfaceProvider } from "@/lib/surface-context";
import { surfaceClasses } from "@/lib/surface-classes";
import { useIcon } from "@/lib/icon-context";
import { useFluidHover, useRegisterFluidHoverItem } from "@/hooks/use-fluid-hover";
import { Elevated } from "@/lib/elevated";
import { Slider } from "@/registry/radix/slider";
import { Tooltip } from "@/registry/radix/tooltip";
import { FluidHoverHighlight } from "@/components/ui/fluid-hover-highlight";

// ---------------------------------------------------------------------------
// ColorPicker holds one color as HSV + alpha and derives every format from
// it. HSV is the saturation square's own coordinate system, and keeping H in
// state lets the hue survive a pass through gray or black, where RGB has no
// hue to give back. Every edit (square, rails, channel fields, swatches,
// eyedropper) emits one string in the selected format (HEX, RGB, HSL,
// OKLCH) plus the parsed color in all of them. ColorPickerPopover puts the
// same panel in a Base UI Popover behind a tile + hex trigger.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ColorFormat = "hex" | "rgb" | "hsl" | "oklch";

// Allows consumers to portal popups inside a CSS-scaled ancestor so
// menu/popover layers visually scale with the picker. ColorPickerPopover
// also points it at its own panel, so the format menu renders inside the
// popover's DOM.
const ColorPickerPortalContainerContext = createContext<HTMLElement | null>(null);

function ColorPickerPortalContainer({
  value,
  children,
}: {
  value: HTMLElement | null;
  children: ReactNode;
}) {
  return (
    <ColorPickerPortalContainerContext.Provider value={value}>
      {children}
    </ColorPickerPortalContainerContext.Provider>
  );
}

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
  /** Hex (3, 4, 6 or 8 digits), rgb(a), hsl(a) or oklch; named colors are
   *  not parsed here. A later value that doesn't parse is ignored (the panel
   *  keeps its color); an unparseable first value starts at pure red. */
  value?: string;
  defaultValue?: string;
  /** Fires with the color formatted in the current format plus the parsed
   *  color in every format. Switching format fires it too, re-emitting the
   *  same color in the new format. */
  onValueChange?: (value: string, parsed: ParsedColor) => void;
  format?: ColorFormat;
  defaultFormat?: ColorFormat;
  onFormatChange?: (format: ColorFormat) => void;
  /** Any CSS color, named colors ("tomato") included. */
  swatches?: string[];
  /** The button already hides itself where `window.EyeDropper` is missing
   *  (the API is Chromium-only). */
  hideEyedropper?: boolean;
  /** Controls the format dropdown's open state. When provided, the dropdown
   *  is fully controlled and ignores user toggles. */
  formatOpen?: boolean;
  /** Initial open state for the format dropdown (uncontrolled). */
  defaultFormatOpen?: boolean;
  /** Pins trigger and popover to one step of the size ladder (default 36px,
   *  compact 28px). Omitted, they follow the surrounding
   *  SizeProvider. */
  size?: SizeVariant;
}

interface ColorPickerPopoverProps extends ColorPickerProps {
  triggerLabel?: string;
  triggerLabelPosition?: "left" | "right";
  /** Shows the color as 6-digit hex next to the tile (alpha left out; the
   *  tile shows it). Default true. */
  triggerShowValue?: boolean;
  /** Adds an X inside the trigger that calls onTriggerRemove without
   *  opening the popover. */
  triggerShowRemove?: boolean;
  onTriggerRemove?: () => void;
  triggerClassName?: string;
  /** Controls the popover's open state. When provided, the popover is fully
   *  controlled and ignores trigger clicks. */
  open?: boolean;
  /** Initial open state for the popover (uncontrolled). */
  defaultOpen?: boolean;
  /** Called when the open state would change (fires even when controlled). */
  onOpenChange?: (open: boolean) => void;
}

interface ColorSwatchProps
  extends Omit<HTMLAttributes<HTMLButtonElement>, "color"> {
  /** Any CSS color; it paints over a checker, so alpha shows. */
  color: string;
  /** Square edge in px. Default 28. */
  size?: number;
  /** Draws the accent ring outside a 2px background gap. */
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

// Hue is wrapped into 0..360 first, so 360 and negative angles are valid
// input. Output channels are unrounded 0..255 floats; rounding happens only
// when a string or display value is built.
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

// A color with no chroma (gray, white, black) returns h = 0 and s = 0: RGB
// has no hue to give back. Callers check `s === 0` and substitute a hue of
// their own (usually the current state hue), which is how H survives S=0 / V=0.
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

// sRGB transfer curve. OKLab is defined on linear light, so channels are
// decoded before the matrices and re-encoded after; linearToSrgb clamps to
// 0..1, which is where out-of-gamut OKLCH values get clipped.
function srgbToLinear(c: number): number {
  c = c / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return clamp01(v) * 255;
}

// Björn Ottosson's OKLab matrices: linear sRGB → LMS → cube root → Lab, and
// its inverse below.
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

// Polar form of OKLab. When C is near 0 the atan2 angle is noise, and the
// 0..255 rounding between edits nudges it too, so the panel keeps a sticky
// OKLCH hue rather than trusting this H after every round-trip.
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

// Out-of-gamut input clips per channel instead of reducing chroma: a chroma
// past the sRGB edge lands on the nearest displayable channel values, and the
// field then shows the chroma of that clipped color.
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

// Alpha is appended only below 1, so opaque colors stay 6-digit. This is
// also the normalizer swatch matching compares against.
function rgbToHexStr(r: number, g: number, b: number, a: number): string {
  if (a >= 1) return `#${to2hex(r)}${to2hex(g)}${to2hex(b)}`;
  return `#${to2hex(r)}${to2hex(g)}${to2hex(b)}${to2hex(a * 255)}`;
}

function expandShortHex(h: string): string {
  if (h.length === 3) return h.split("").map((c) => c + c).join("");
  if (h.length === 4) return h.split("").map((c) => c + c).join("");
  return h;
}

// 3, 4, 6 or 8 digits, "#" optional. 5 and 7 digits pass the regex but fall
// through to null.
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

// Reads the four formats the panel emits: hex, rgb()/rgba(), hsl()/hsla(),
// oklch(). Commas, spaces and "/" all separate parts, and alpha takes 0..1 or
// a percentage. Pure string work with no DOM, so it is safe during render and
// SSR; named colors go through resolveCssColor instead.
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

// Browser-assisted fallback for color strings the manual parser doesn't cover
// (named CSS colors like "red" / "tomato", etc.). A canvas 2d context
// round-trips any valid CSS color through `fillStyle`, which serializes to a
// hex or rgba() string that parseColor understands. Must only be called from
// event handlers or effects — never at module scope or during render — so SSR
// stays safe.
let cssColorCtx: CanvasRenderingContext2D | null = null;

function resolveCssColor(input: string): { r: number; g: number; b: number; a: number } | null {
  const direct = parseColor(input);
  if (direct) return direct;
  const s = input.trim();
  if (!s || typeof document === "undefined") return null;
  if (!cssColorCtx) {
    cssColorCtx = document.createElement("canvas").getContext("2d");
    if (!cssColorCtx) return null;
  }
  const ctx = cssColorCtx;
  // An invalid color assignment leaves fillStyle untouched, so round-trip from
  // two different starting values to detect rejection.
  ctx.fillStyle = "#000000";
  ctx.fillStyle = s;
  const first = String(ctx.fillStyle);
  ctx.fillStyle = "#ffffff";
  ctx.fillStyle = s;
  const second = String(ctx.fillStyle);
  if (first !== second) return null;
  return parseColor(first);
}

// Every format string is built from the one HSV tuple, so all fields of a
// ParsedColor describe the same color. Precision is per format: RGB and HSL
// round to integers, OKLCH prints L% to 1 decimal, C to 3, H to 1. Alpha
// prints (up to 3 decimals) only below 1.
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
// 8px checkerboard from one conic-gradient, behind ColorTile and ColorSwatch
// so a translucent color reads as translucent (the alpha rail repeats it
// inline). --checker-a / --checker-b carry the light and dark values.
const CHECKER_BG: CSSProperties = {
  backgroundImage:
    "conic-gradient(var(--checker-a) 0 25%, var(--checker-b) 0 50%, var(--checker-a) 0 75%, var(--checker-b) 0)",
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

// The HSV plane at the current hue: x = saturation 0 → 1, y = value 1 → 0.
// Pointer position maps straight to state with no color math, and because
// only S and V change here, dragging into the gray or black edge leaves the
// hue untouched. Keyboard: arrows nudge S (left/right) and V (up/down) by
// 0.01, Shift by 0.1, clamped at the edges.
function SaturationSquare({ h, s, v, onChange }: SaturationSquareProps) {
  const ref = useRef<HTMLDivElement>(null);
  // State (not a ref): this gates the ghost hover cursor during render, and a
  // ref mutation wouldn't re-render, letting the ghost stick around.
  const [dragging, setDragging] = useState(false);
  const hasMoved = useRef(false);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const shape = useShape();
  // The square is the first surface inside the picker's 12px padding. Its
  // corner follows the panel rather than reusing the popup-specific p-1 pair.
  const radius = nestedRadius(shape.containerRadius, 12);
  // Rounded: 12px - 12px = 0, square corners. Pill: 24px - 12px = 12px.

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

  // The ghost ring's position, tracked apart from the value: it follows every
  // move so hover previews where a press will land.
  const updateCursorPos = useCallback((clientX: number, clientY: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setCursorPos({
      x: clamp01((clientX - rect.left) / rect.width) * 100,
      y: clamp01((clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  // Primary button only. The press itself sets the color (no drag needed),
  // and pointer capture keeps the drag alive past the edges, where the
  // clamp in updateFromPointer pins the thumb to the border.
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      setDragging(true);
      hasMoved.current = false;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      updateFromPointer(e.clientX, e.clientY);
    },
    [updateFromPointer]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      updateCursorPos(e.clientX, e.clientY);
      if (!dragging) return;
      hasMoved.current = true;
      updateFromPointer(e.clientX, e.clientY);
    },
    [dragging, updateFromPointer, updateCursorPos]
  );

  const onPointerUp = useCallback(() => {
    setDragging(false);
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

  // role="application" hands the arrow keys to this widget. The 2px focus
  // ring shows only when :focus-visible matches (keyboard), never after a
  // press. cursor-none hides the OS cursor: the ghost ring stands in for it,
  // and while dragging the thumb sits under the pointer.
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
        "relative w-full select-none touch-none cursor-none outline-none"
      )}
      style={{
        height: SQUARE_HEIGHT,
        borderRadius: radius,
        boxShadow: focused ? "0 0 0 2px var(--focus-ring, #6B97FF)" : undefined,
      }}
    >
      {/* Black rising from the bottom over white → pure hue: exactly the HSV
          plane for this hue, drawn by CSS. */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          borderRadius: radius,
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${h}, 100%, 50%))`,
        }}
      />
      {/* 18px thumb filled with the live color; 1px white border plus a 1px
          black ring keeps it visible on light and dark regions alike.
          Duration 0 so it never lags the pointer. */}
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
      {/* Ghost ring: the stand-in cursor while hovering. Same 18px as the
          thumb but hollow and 55% white, so it never reads as the value.
          Hidden while dragging, when the real thumb is under the pointer. */}
      {hovered && !dragging && cursorPos && (
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

// Both rails use Slider; passing trackStyle / hideFill / thumbColor routes it
// to its compact engine at any size. hideFill because the gradient is the
// track and a fill would paint over it. The hue thumb shows the pure hue
// (full S and V) it sits on; 0 and 360 are both red, the two ends of the rail.
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
  // Alpha runs on whole percents (0..100, step 1). The gradient layers over
  // the same 8px checker as the tiles, and the thumb shows the opaque color.
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
        backgroundImage: `linear-gradient(to right, ${transparentColor} 0%, ${solidColor} 98%), conic-gradient(var(--checker-a) 0 25%, var(--checker-b) 0 50%, var(--checker-a) 0 75%, var(--checker-b) 0)`,
        backgroundSize: "100% 100%, 8px 8px",
        borderWidth: 0,
      }}
      aria-label="Alpha"
    />
  );
}

// ---------------------------------------------------------------------------
// FormatDropdown
//
// Built on Base UI's Menu primitive, which owns trigger wiring, positioning
// (anchor tracking + collision flipping — the old hand-rolled version computed
// coordinates once on open and detached from the trigger on scroll),
// dismissal, roving highlight, and typeahead. Menu.RadioGroup/RadioItem carry
// the radio semantics. This layer keeps the fluid-hover
// overlays and the spring open/close animation (actionsRef deferred unmount —
// the same verified pattern as Select / Dropdown).
// ---------------------------------------------------------------------------

const FORMAT_LABELS: Record<ColorFormat, string> = {
  hex: "HEX",
  rgb: "RGB",
  hsl: "HSL",
  oklch: "OKLCH",
};

const FORMATS = ["hex", "rgb", "hsl", "oklch"] as const;

// Popup surfaces opt out of the global pill/rounded shape — same rationale as
// the Dropdown component (pill radii distort perceived padding at this scale).
const menuShape = shapeMap.rounded;

interface FormatMenuContextValue {
  registerItem: (index: number, element: HTMLElement | null) => void;
  activeIndex: number | null;
  checkedIndex?: number;
}

const FormatMenuContext = createContext<FormatMenuContextValue | null>(null);

function FormatItem({
  index,
  value,
  label,
  checked,
}: {
  index: number;
  value: ColorFormat;
  label: string;
  checked: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const menuCtx = useContext(FormatMenuContext);
  const shape = useShape();
  const sizeClasses = useSize();
  const compact = sizeClasses.variant === "compact";

  // data-fluid-hover-index (below) lets the popup's onFocus map a focused
  // row back to its index, so keyboard focus moves the same highlight.
  useRegisterFluidHoverItem(menuCtx?.registerItem, index, ref);

  const isActive = menuCtx?.activeIndex === index;

  // The invisible semibold copy reserves the widest width, so the label can
  // move between normal and semibold (checked) without shifting the row.
  // Color goes muted → foreground when hovered or checked, over 80ms.
  return (
    <Menu.RadioItem
      value={value}
      label={label}
      closeOnClick
      render={
        <div
          ref={ref}
          data-fluid-hover-index={index}
          className={cn(
            "relative z-10 flex items-center cursor-pointer outline-none",
            compact ? "px-2.5 py-1.5" : "px-3 py-2",
            sizeClasses.text,
            shape.item
          )}
        />
      }
    >
      <span className="inline-grid">
        <span
          className="col-start-1 row-start-1 invisible"
          style={{ fontVariationSettings: fontWeights.semibold }}
          aria-hidden="true"
        >
          {label}
        </span>
        <span
          className={cn(
            "col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80",
            isActive || checked ? "text-foreground" : "text-muted-foreground"
          )}
          style={{
            fontVariationSettings: checked
              ? fontWeights.semibold
              : fontWeights.normal,
          }}
        >
          {label}
        </span>
      </span>
    </Menu.RadioItem>
  );
}

function FormatDropdown({
  value,
  onChange,
  open: openProp,
  defaultOpen = false,
}: {
  value: ColorFormat;
  onChange: (f: ColorFormat) => void;
  open?: boolean;
  defaultOpen?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const actionsRef = useRef<{ unmount: () => void; close: () => void } | null>(null);
  const shape = useShape();
  const sizeClasses = useSize();
  const portalContainer = useContext(ColorPickerPortalContainerContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const ChevronDownIcon = useIcon("chevron-down");

  const hover = useFluidHover(containerRef);
  const {
    activeIndex,
    setActiveIndex,
    itemRects,
    handlers,
    registerItem,
    remeasure,
  } = hover;

  // Row that holds keyboard focus (:focus-visible only). It drives the focus
  // ring; the highlight follows activeIndex, which hover and focus both set.
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Release Base UI's deferred unmount once the exit tween has played.
  // onAnimationComplete on the motion.div is the primary signal; this timeout
  // is a fallback for throttled/background tabs where rAF-driven animation
  // callbacks can stall (spring.fast.exit is 60ms — 120ms covers it with
  // margin without holding the portal open perceptibly).
  useEffect(() => {
    if (open) return;
    const id = setTimeout(() => actionsRef.current?.unmount(), 120);
    return () => clearTimeout(id);
  }, [open]);

  // The popup keeps its rows registered between opens, so their rects
  // were taken while it was hidden: re-measure once it is open and laid out.
  useEffect(() => {
    if (!open) return;
    remeasure();
  }, [open, remeasure]);

  const checkedIndex = FORMATS.indexOf(value);
  const checkedRect = checkedIndex !== -1 ? itemRects[checkedIndex] : null;
  const focusRect = focusedIndex !== null ? itemRects[focusedIndex] : null;
  const menuCtx = useMemo(
    () => ({ registerItem, activeIndex, checkedIndex }),
    [registerItem, activeIndex, checkedIndex]
  );

  return (
    <Menu.Root
      open={open}
      onOpenChange={(next) => {
        if (!isControlled) setInternalOpen(next);
      }}
      actionsRef={actionsRef}
      // Non-modal: the page keeps scrolling and the Positioner tracks the
      // anchor, so the popup follows its trigger instead of detaching.
      modal={false}
    >
      {/* The trigger holds bg-active and foreground text while open, so it
          reads as the menu's anchor; the chevron flips 180° over 150ms. */}
      <Menu.Trigger
        className={cn(
          "flex items-center justify-between bg-transparent hover:bg-hover hover:text-foreground transition-colors duration-80 outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] cursor-pointer",
          sizeClasses.gap,
          sizeClasses.control,
          sizeClasses.px,
          sizeClasses.text,
          open ? "bg-active text-foreground" : "text-muted-foreground active:bg-active",
          shape.input
        )}
        style={{ fontVariationSettings: fontWeights.medium }}
      >
        <span>{FORMAT_LABELS[value]}</span>
        <ChevronDownIcon
          size={14}
          strokeWidth={1.5}
          className={cn(
            "text-muted-foreground transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </Menu.Trigger>
      <Menu.Portal container={portalContainer ?? undefined}>
        <Menu.Positioner
          side="bottom"
          align="start"
          sideOffset={6}
          className="z-[60] outline-none"
        >
          <motion.div
            initial={{ opacity: 0, y: -4, scaleY: 0.96 }}
            animate={
              open
                ? { opacity: 1, y: 0, scaleY: 1 }
                : { opacity: 0, y: -4, scaleY: 0.96 }
            }
            transition={open ? spring.fast : spring.fast.exit}
            style={{ transformOrigin: "top center" }}
            // Base UI defers unmount while actionsRef is set; release it once
            // the exit spring has finished so the close animation fully plays.
            onAnimationComplete={() => {
              if (!open) actionsRef.current?.unmount();
            }}
          >
            <FormatMenuContext.Provider value={menuCtx}>
              {/* Elevated lifts the menu 2 surface levels above the panel it
                  opens from; min-w keeps it at least as wide as the trigger. */}
              <Menu.Popup
                render={
                  <Elevated
                    offset={2}
                    shadowLevel={3}
                    ref={(node: HTMLDivElement | null) => {
                      (
                        containerRef as React.MutableRefObject<HTMLDivElement | null>
                      ).current = node;
                    }}
                  />
                }
                // The pointer arriving hides the keyboard focus ring. Focus
                // moves the highlight too, but shows the ring only for
                // :focus-visible; blur clears both only once focus leaves the
                // popup, not when it moves between rows.
                onMouseEnter={() => {
                  handlers.onMouseEnter();
                  setFocusedIndex(null);
                }}
                onMouseMove={handlers.onMouseMove}
                onMouseLeave={handlers.onMouseLeave}
                onClick={handlers.onClick}
                onFocus={(e) => {
                  const indexAttr = (e.target as HTMLElement)
                    .closest("[data-fluid-hover-index]")
                    ?.getAttribute("data-fluid-hover-index");
                  if (indexAttr != null) {
                    const idx = Number(indexAttr);
                    setActiveIndex(idx);
                    setFocusedIndex(
                      (e.target as HTMLElement).matches(":focus-visible")
                        ? idx
                        : null
                    );
                  }
                }}
                onBlur={(e) => {
                  if (containerRef.current?.contains(e.relatedTarget as Node))
                    return;
                  setFocusedIndex(null);
                  setActiveIndex(null);
                }}
                className={cn(
                  `relative flex flex-col min-w-[var(--anchor-width)] ${menuShape.container} p-1 select-none outline-none`
                )}
              >
                {/* Selected background: its own layer under the hover
                    highlight, so the checked row stays marked while the
                    pointer is on another row. */}
                <AnimatePresence>
                  {checkedRect && (
                    <motion.div
                      className={`absolute ${menuShape.bg} bg-active pointer-events-none`}
                      initial={false}
                      animate={{
                        top: checkedRect.top,
                        left: checkedRect.left,
                        width: checkedRect.width,
                        height: checkedRect.height,
                        opacity: 1,
                      }}
                      exit={{ opacity: 0, transition: spring.moderate.exit }}
                      transition={{
                        ...spring.moderate,
                        opacity: { duration: 0.08 },
                      }}
                    />
                  )}
                </AnimatePresence>

                {/* Hover background: each hover session fades in on the
                    checked row (from), then glides to the row under the
                    pointer. A row lit by the keyboard fades in where it is. */}
                <FluidHoverHighlight
                  hover={hover}
                  from={checkedRect}
                  className={menuShape.bg}
                />

                {/* Focus ring: one 1px border drawn 2px outside the focused
                    row, gliding between rows on spring.fast. */}
                <AnimatePresence>
                  {focusRect && (
                    <motion.div
                      className={`absolute ${menuShape.focusRing} pointer-events-none z-20 border border-[color:var(--focus-ring,#6B97FF)]`}
                      initial={false}
                      animate={{
                        left: focusRect.left - 2,
                        top: focusRect.top - 2,
                        width: focusRect.width + 4,
                        height: focusRect.height + 4,
                      }}
                      exit={{ opacity: 0, transition: spring.fast.exit }}
                      transition={{
                        ...spring.fast,
                        opacity: { duration: 0.08 },
                      }}
                    />
                  )}
                </AnimatePresence>

                {/* display: contents keeps items direct flex children of the
                    popup so fluid hover measurement and gap layout still work,
                    while the group provides the radio value context. */}
                <Menu.RadioGroup
                  value={value}
                  onValueChange={(next) => onChange(next as ColorFormat)}
                  className="contents"
                >
                  {FORMATS.map((fmt, i) => (
                    <FormatItem
                      key={fmt}
                      index={i}
                      value={fmt}
                      label={FORMAT_LABELS[fmt]}
                      checked={value === fmt}
                    />
                  ))}
                </Menu.RadioGroup>
              </Menu.Popup>
            </FormatMenuContext.Provider>
          </motion.div>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

// ---------------------------------------------------------------------------
// ColorInput
//
// Two internal variants behind one API:
// - TextColorInput: draft-based text input (hex).
// - ScrubColorInput: numeric channels, built on Base UI's NumberField whose
//   ScrubArea provides pointer-lock scrubbing with a virtual cursor,
//   replacing the old hand-rolled pointer-capture logic.
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
  min?: number;
  max?: number;
  /** When true with min and max, wrap (modulo) instead of clamping. Used for angular values like hue. */
  wrap?: boolean;
}

const TextColorInput = forwardRef<HTMLInputElement, ColorInputProps>(
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
      min,
      max,
      wrap = false,
    },
    ref
  ) => {
    // Typing edits a local draft that commits on blur (Enter blurs). While
    // the field has focus, outside value changes leave the draft alone, so a
    // re-render never overwrites text mid-edit.
    const [draft, setDraft] = useState(value);
    const interactingRef = useRef(false);
    const shape = useShape();
    const sizeClasses = useSize();
    const compact = sizeClasses.variant === "compact";

    useEffect(() => {
      if (!interactingRef.current) setDraft(value);
    }, [value]);

    const formatNumber = (n: number) =>
      decimals != null ? n.toFixed(decimals) : String(Math.round(n));

    // Unlike ScrubColorInput, the wrap here also maps max itself to min
    // (360 → 0); harmless for hue, where both are the same angle.
    const commitNumber = (n: number) => {
      let bounded = n;
      if (wrap && min != null && max != null) {
        const range = max - min;
        bounded = ((bounded - min) % range + range) % range + min;
      } else {
        if (min != null) bounded = Math.max(min, bounded);
        if (max != null) bounded = Math.min(max, bounded);
      }
      const formatted = formatNumber(bounded);
      const withSuffix = hasPercent ? `${formatted}%` : formatted;
      setDraft(withSuffix);
      onCommit(withSuffix);
    };

    // Arrow nudges only apply when the field declares a step. The hex field
    // declares none, so there the arrows keep moving the caret.
    const nudge = (direction: 1 | -1, shift: boolean) => {
      const baseStep = shift ? (nudgeShiftStep ?? 10) : (nudgeStep ?? 1);
      const cur = parseFloat(draft.replace("%", ""));
      if (Number.isNaN(cur)) return;
      commitNumber(cur + direction * baseStep);
    };

    return (
      <div
        className={cn(
          "flex items-center px-2 bg-transparent hover:bg-hover active:bg-active transition-colors duration-80 focus-within:ring-1 focus-within:ring-[color:var(--focus-ring,#6B97FF)] select-none",
          sizeClasses.control,
          shape.input,
          className
        )}
        style={{ width }}
      >
        {prefix && (
          <span
            className={cn(
              "text-muted-foreground mr-1 select-none",
              compact ? "text-[11px]" : "text-[12px]"
            )}
          >
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          // Focus selects everything, so typing replaces the old value.
          onFocus={(e) => {
            interactingRef.current = true;
            e.currentTarget.select();
          }}
          onBlur={() => {
            interactingRef.current = false;
            if (draft !== value) {
              const numeric = parseFloat(draft.replace("%", ""));
              if (!Number.isNaN(numeric) && (min != null || max != null)) {
                commitNumber(numeric);
              } else {
                onCommit(draft);
              }
            } else setDraft(value);
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
            "flex-1 min-w-0 bg-transparent text-foreground outline-none tabular-nums",
            sizeClasses.text,
            align === "center" && "text-center",
            align === "right" && "text-right",
            inputClassName
          )}
          style={{ fontVariationSettings: fontWeights.medium }}
        />
      </div>
    );
  }
);

TextColorInput.displayName = "TextColorInput";

// Two gestures share one field. Drag sideways on it to scrub (pointer lock,
// a virtual ↔ cursor, 1px of travel per step); press without dragging to
// edit as text (focus + select all). At rest the input ignores the pointer
// so every press reaches the ScrubArea; once editing, presses go to the
// input for caret placement. Steps: Arrow keys move by nudgeStep (default
// 1), Shift+Arrow by nudgeShiftStep (default 10).
const ScrubColorInput = forwardRef<HTMLInputElement, ColorInputProps>(
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
      inputMode = "numeric",
      nudgeStep,
      nudgeShiftStep,
      hasPercent = false,
      decimals,
      min,
      max,
      wrap = false,
    },
    ref
  ) => {
    const shape = useShape();
    const sizeClasses = useSize();
    const compact = sizeClasses.variant === "compact";
    const inputRef = useRef<HTMLInputElement | null>(null);
    // true = text mode (caret, typing); false = scrub mode (ew-resize cursor,
    // input transparent to the pointer).
    const [editing, setEditing] = useState(false);
    // Set on pointerdown inside the scrub area (capture phase, before Base UI
    // focuses the input for scrubbing) so onFocus can tell scrub-focus apart
    // from keyboard/programmatic focus.
    const pointerDownRef = useRef(false);

    // The parent passes display strings ("50%", "0.12"); NumberField wants a
    // number, and formats it back through `format` below.
    const numeric = parseFloat(String(value).replace("%", ""));
    const fieldValue = Number.isNaN(numeric) ? null : numeric;

    const format = useMemo(() => {
      const f: Intl.NumberFormatOptions = { useGrouping: false };
      if (decimals != null) {
        f.minimumFractionDigits = decimals;
        f.maximumFractionDigits = decimals;
      } else {
        f.maximumFractionDigits = 0;
      }
      if (hasPercent) {
        // style "unit" + unit "percent" renders "50%" while keeping the
        // numeric value on the 0..100 scale (unlike style "percent").
        f.style = "unit";
        f.unit = "percent";
      }
      return f;
    }, [decimals, hasPercent]);

    const setInputRef = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      },
      [ref]
    );

    // Clamps (or wraps), rounds to the field's precision, and hands the parent
    // a display string in the same shape it passed in.
    const commit = useCallback(
      (n: number) => {
        let bounded = n;
        if (wrap && min != null && max != null) {
          // Hue-style wrap: NumberField won't wrap natively, so shim it here
          // (361 → 1, -1 → 359; exactly `max` stays put).
          if (bounded < min || bounded > max) {
            const range = max - min;
            bounded = ((bounded - min) % range + range) % range + min;
          }
        } else {
          if (min != null) bounded = Math.max(min, bounded);
          if (max != null) bounded = Math.min(max, bounded);
        }
        const formatted =
          decimals != null ? bounded.toFixed(decimals) : String(Math.round(bounded));
        onCommit(hasPercent ? `${formatted}%` : formatted);
      },
      [wrap, min, max, decimals, hasPercent, onCommit]
    );

    return (
      <NumberField.Root
        value={fieldValue}
        onValueChange={(next, eventDetails) => {
          if (next == null) return;
          const reason = eventDetails.reason;
          // Preserve the old commit-on-blur typing semantics: ignore the
          // per-keystroke parses and let the input-blur change land the final
          // value. Keyboard nudges, scrubbing, and wheel commit immediately.
          if (
            reason === "input-change" ||
            reason === "input-paste" ||
            reason === "input-clear"
          ) {
            return;
          }
          commit(next);
        }}
        onValueCommitted={(_, eventDetails) => {
          // After a scrub gesture ends, drop the focus Base UI placed on the
          // input so the field returns to its rest state (matching the old
          // behavior). For a no-drag press, ScrubArea dispatches a synthetic
          // click right after this, which re-enters edit mode below.
          if (eventDetails.reason === "scrub") {
            pointerDownRef.current = false;
            inputRef.current?.blur();
          }
        }}
        // Wrapping fields give NumberField no bounds: it would clamp 361 to
        // 360 before commit() got the chance to wrap it to 1.
        min={wrap ? undefined : min}
        max={wrap ? undefined : max}
        step={nudgeStep ?? 1}
        largeStep={nudgeShiftStep ?? 10}
        format={format}
        className={cn(
          "flex items-center bg-transparent hover:bg-hover active:bg-active transition-colors duration-80 focus-within:ring-1 focus-within:ring-[color:var(--focus-ring,#6B97FF)] select-none",
          sizeClasses.control,
          shape.input,
          className
        )}
        style={{ width }}
      >
        <NumberField.ScrubArea
          direction="horizontal"
          pixelSensitivity={1}
          onPointerDownCapture={() => {
            pointerDownRef.current = true;
          }}
          onClick={() => {
            // Real clicks and the synthetic click ScrubArea dispatches after a
            // no-drag press both land here → enter edit mode (focus + select),
            // like the old click-to-edit behavior.
            pointerDownRef.current = false;
            setEditing(true);
            inputRef.current?.focus();
            inputRef.current?.select();
          }}
          className={cn(
            "flex flex-1 min-w-0 items-center self-stretch px-2",
            !editing && "cursor-ew-resize"
          )}
        >
          {/* Stands in for the OS cursor, which pointer lock hides: a black
              ↔ arrow with a white stroke and drop shadow, legible on any
              surface. */}
          <NumberField.ScrubAreaCursor className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
            <svg
              width={24}
              height={14}
              viewBox="0 0 24 14"
              fill="#000"
              stroke="#fff"
              strokeWidth={1}
              aria-hidden="true"
            >
              <path d="M0.5 7l5-5v3.5h13V2l5 5-5 5V8.5h-13V12l-5-5z" />
            </svg>
          </NumberField.ScrubAreaCursor>
          {prefix && (
            <span
              className={cn(
                "text-muted-foreground mr-1 select-none",
                compact ? "text-[11px]" : "text-[12px]"
              )}
            >
              {prefix}
            </span>
          )}
          <NumberField.Input
            ref={setInputRef}
            aria-label={ariaLabel}
            inputMode={inputMode}
            onPointerDown={(e) => {
              // While editing, let the input handle caret placement and text
              // selection itself instead of starting a scrub gesture.
              if (editing) e.stopPropagation();
            }}
            onFocus={(e) => {
              if (pointerDownRef.current) return; // scrub-initiated focus
              setEditing(true);
              e.currentTarget.select();
            }}
            onBlur={() => {
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              } else if (e.key === "Escape") {
                // Revert the draft like the old input: restore the committed
                // value's text before blurring so the input-blur commit is a
                // no-op.
                const input = e.currentTarget;
                const setter = Object.getOwnPropertyDescriptor(
                  window.HTMLInputElement.prototype,
                  "value"
                )?.set;
                if (setter && fieldValue != null) {
                  const restored =
                    decimals != null
                      ? fieldValue.toFixed(decimals)
                      : String(Math.round(fieldValue));
                  setter.call(input, hasPercent ? `${restored}%` : restored);
                  input.dispatchEvent(new Event("input", { bubbles: true }));
                }
                input.blur();
              }
            }}
            className={cn(
              "flex-1 min-w-0 bg-transparent text-foreground outline-none tabular-nums",
              sizeClasses.text,
              align === "center" && "text-center",
              align === "right" && "text-right",
              !editing && "pointer-events-none",
              inputClassName
            )}
            style={{ fontVariationSettings: fontWeights.medium }}
          />
        </NumberField.ScrubArea>
      </NumberField.Root>
    );
  }
);

ScrubColorInput.displayName = "ScrubColorInput";

const ColorInput = forwardRef<HTMLInputElement, ColorInputProps>(
  ({ scrubbable = false, ...props }, ref) =>
    scrubbable ? (
      <ScrubColorInput ref={ref} {...props} />
    ) : (
      <TextColorInput ref={ref} {...props} />
    )
);

ColorInput.displayName = "ColorInput";

// ---------------------------------------------------------------------------
// EyeDropperButton
// ---------------------------------------------------------------------------

// Typed here because TypeScript's DOM lib doesn't ship EyeDropper.
interface EyeDropperGlobal {
  open(): Promise<{ sRGBHex: string }>;
}

function EyeDropperButton({ onPick }: { onPick: (hex: string) => void }) {
  const [supported, setSupported] = useState(false);
  const shape = useShape();
  const sizeClasses = useSize();
  const PipetteIcon = useIcon("pipette");

  // window.EyeDropper exists only in Chromium-based browsers. Detect it after mount:
  // the server and the first client render both say "unsupported", so there
  // is no hydration mismatch, and the button never appears elsewhere.
  useEffect(() => {
    setSupported(typeof window !== "undefined" && "EyeDropper" in window);
  }, []);

  if (!supported) return null;

  // open() rejects when the user presses Escape. Any rejection is swallowed:
  // cancelling a pick is not an error, and the color stays as it was.
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
        "flex items-center justify-center text-muted-foreground bg-transparent hover:bg-hover hover:text-foreground active:bg-active transition-colors duration-80 outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] cursor-pointer",
        sizeClasses.control,
        sizeClasses.px,
        shape.input
      )}
    >
      <PipetteIcon size={sizeClasses.icon} strokeWidth={1.5} />
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

// The color paints on a child layer over the checker, and an inset 1px
// hairline at 25% gray outlines the tile so white or near-transparent
// colors don't vanish into the surface.
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
  ({ color, size = 28, selected, className, onMouseEnter, onMouseLeave, ...props }, ref) => {
    const shape = useShape();
    const [hovered, setHovered] = useState(false);
    // Rings are stacked box-shadows: the inset hairline, a 2px gap in the
    // page background, then a 2px outer ring (accent blue when selected,
    // 40% gray on hover). The gap keeps the ring readable on any swatch color.
    const ring = selected
      ? "inset 0 0 0 1px rgba(127,127,127,0.25), 0 0 0 2px var(--background), 0 0 0 4px #6B97FF"
      : hovered
        ? "inset 0 0 0 1px rgba(127,127,127,0.25), 0 0 0 2px var(--background), 0 0 0 4px rgba(127,127,127,0.4)"
        : "inset 0 0 0 1px rgba(127,127,127,0.25)";
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
          boxShadow: ring,
        }}
        onMouseEnter={(e) => { setHovered(true); onMouseEnter?.(e); }}
        onMouseLeave={(e) => { setHovered(false); onMouseLeave?.(e); }}
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
  // Selection compares normalized lowercase hex (alpha included), so "#FFF",
  // "#ffffff" and "rgb(255, 255, 255)" all mark the same swatch.
  const normalizedCurrent = useMemo(() => {
    const p = parseColor(current);
    return p ? rgbToHexStr(p.r, p.g, p.b, p.a).toLowerCase() : "";
  }, [current]);

  // Named CSS colors ("red", "tomato") need the browser to normalize before
  // the selected-state comparison can match. Resolve them in an effect so
  // render (and SSR) never touch the DOM.
  const [resolvedSwatches, setResolvedSwatches] = useState<Record<string, string>>({});
  useEffect(() => {
    const next: Record<string, string> = {};
    for (const sw of swatches) {
      if (!parseColor(sw)) {
        const p = resolveCssColor(sw);
        if (p) next[sw] = rgbToHexStr(p.r, p.g, p.b, p.a).toLowerCase();
      }
    }
    setResolvedSwatches(next);
  }, [swatches]);

  return (
    <div className="flex flex-wrap gap-2">
      {swatches.map((sw, i) => {
        // Until the effect has resolved a named swatch, its raw name never
        // equals a hex, so it renders unselected on the first render.
        const parsed = parseColor(sw);
        const normalized = parsed
          ? rgbToHexStr(parsed.r, parsed.g, parsed.b, parsed.a).toLowerCase()
          : resolvedSwatches[sw] ?? sw.toLowerCase();
        const isSelected = normalized === normalizedCurrent;
        return (
          // Index in the key: the same color may appear twice in a list.
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
      defaultValue = "#6B97FF",
      onValueChange,
      format,
      defaultFormat = "hex",
      onFormatChange,
      swatches,
      hideEyedropper,
      formatOpen,
      defaultFormatOpen,
      size,
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

    // Internal HSV state (canonical). H is preserved across S=0 / V=0
    // transitions. Deliberately computed once from the initial value only.
    const initialParsed = useMemo(() => {
      const p = parseColor(currentRawValue);
      if (!p) return { h: 0, s: 1, v: 1, a: 1 };
      const hsv = rgbToHsv(p.r, p.g, p.b);
      return { h: hsv.s === 0 ? 0 : hsv.h, s: hsv.s, v: hsv.v, a: p.a };
    }, []);

    const [hsv, setHsv] = useState(initialParsed);

    // Sticky OKLCH hue: preserves the user's stated OKLCH H across the lossy
    // RGB round-trip (so the displayed H doesn't drift after release) and
    // across achromatic colors (where RGB-derived H would collapse to 0).
    // Cleared when the hue moves through another channel: the hue rail, HSL
    // hue, RGB, hex, swatches, the eyedropper, or an outside value. The
    // square, alpha, and HSL S/L edits keep it.
    const oklchHueRef = useRef<number | null>(null);

    // External value sync — when controlled value changes from outside, sync HSV
    // lastEmittedRef holds the string this panel last emitted. When a
    // controlled parent echoes it straight back, the sync skips it, so
    // re-parsing a rounded string never snaps HSV or drops a held hue.
    const lastEmittedRef = useRef<string>("");
    useEffect(() => {
      if (!isControlled) return;
      const emitted = lastEmittedRef.current;
      const cur = value as string;
      if (cur === emitted) return;
      const p = parseColor(cur);
      if (!p) return;
      oklchHueRef.current = null;
      const newHsv = rgbToHsv(p.r, p.g, p.b);
      // A gray, white or black from outside keeps the hue already in state.
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

    // Write path for the square, rails and numeric channel fields: merge into HSV,
    // format in the current format, record it as emitted, then notify.
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

    // Switching format re-emits the same color as a string in the new format
    // through onValueChange, so a consumer storing the string stays in the
    // format the user picked without touching the color.
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

    // Whole-color entry point shared by the hex field, swatches and the
    // eyedropper. An unreadable string is dropped (the color stays put), and
    // a gray, white or black keeps the hue already in state.
    const handleHexCommit = useCallback(
      (input: string) => {
        // resolveCssColor falls back to browser normalization so named CSS
        // colors ("red", "tomato") from swatches work too. (The hex field
        // prefixes "#" to what is typed, so a typed name arrives as "#red"
        // and is rejected.) Safe here: this only ever runs inside event handlers.
        const p = resolveCssColor(input);
        if (!p) return;
        oklchHueRef.current = null;
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

    // The current color at full opacity: the alpha rail's thumb and the
    // opaque end of its gradient.
    const solidHueRgb = useMemo(() => hsvToRgb(hsv.h, hsv.s, hsv.v), [hsv.h, hsv.s, hsv.v]);
    const solidR = Math.round(solidHueRgb.r);
    const solidG = Math.round(solidHueRgb.g);
    const solidB = Math.round(solidHueRgb.b);
    const solidColorString = `rgb(${solidR}, ${solidG}, ${solidB})`;
    const shape = useShape();
    const substrate = useSurface();
    // The picker panel uses bg-card (surface-3) by default; when wrapped in
    // ColorPickerPopover the className override pushes it higher. Either way,
    // announce the panel's effective level so descendants (FormatDropdown,
    // etc.) elevate above it instead of colliding at the same surface.
    const pickerLevel = Math.max(substrate, 3);

    // A size prop pins the whole panel — format dropdown, inputs, eyedropper
    // (React context crosses portals) — to one step of the ladder.
    const root = (
      <SurfaceProvider value={pickerLevel}>
      {/* p-3 is the 12px inset SaturationSquare subtracts from this
          container's radius; change one and the corners stop nesting. */}
      <div
        ref={ref}
        className={cn("flex flex-col gap-2 p-3", surfaceClasses(pickerLevel, 1), shape.container, className)}
        style={{ width: PANEL_WIDTH }}
        {...props}
      >
        <SaturationSquare
          h={hsv.h}
          s={hsv.s}
          v={hsv.v}
          onChange={(s, v) => updateHsv({ s, v })}
        />

        {/* A hue picked on the rail is a new stated hue, so the sticky
            OKLCH hue is dropped and OKLCH H follows the color again. */}
        <div className="flex flex-col [&>*]:mb-0 [&>*+*]:-mt-px">
          <HueSlider h={hsv.h} onChange={(h) => { oklchHueRef.current = null; updateHsv({ h }); }} />
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
          <FormatDropdown
            value={currentFormat}
            onChange={handleFormatChange}
            open={formatOpen}
            defaultOpen={defaultFormatOpen}
          />
          {!hideEyedropper && <EyeDropperButton onPick={handleEyedrop} />}
        </div>

        <ColorInputsRow
          parsed={parsed}
          format={currentFormat}
          oklchHue={oklchHueRef.current}
          // RGB, HSL and OKLCH edits rebuild the color in their own space
          // from the current rounded RGB, convert back to HSV, and substitute
          // a held hue whenever the result has no saturation.
          onChannelChange={(channel, value) => {
            const p = { ...parsed };
            switch (channel) {
              case "hex": handleHexCommit(value as string); return;
              case "r": case "g": case "b": {
                oklchHueRef.current = null;
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
                if (channel === "hSL") oklchHueRef.current = null;
                const hsl = rgbToHsl(p.r, p.g, p.b);
                const h2 = channel === "hSL" ? Number(value) : hsl.h;
                const s2 = channel === "sSL" ? Number(value) / 100 : hsl.s;
                const l2 = channel === "lSL" ? Number(value) / 100 : hsl.l;
                const rgb = hslToRgb(h2, clamp01(s2), clamp01(l2));
                const hsvVal = rgbToHsv(rgb.r, rgb.g, rgb.b);
                // On a gray, a typed HSL hue still becomes the held HSV hue,
                // so the square and hue rail pick it up. S/L edits read the
                // hue back from rounded RGB instead, which is 0 on a gray.
                updateHsv({
                  h: hsvVal.s === 0 ? h2 : hsvVal.h,
                  s: hsvVal.s,
                  v: hsvVal.v,
                });
                return;
              }
              case "L": case "C": case "H": {
                const cur = rgbToOklch(p.r, p.g, p.b);
                // For L/C edits, anchor on the user's last stated H so we
                // don't drift along with chroma changes.
                const baseH = oklchHueRef.current ?? cur.H;
                const L = channel === "L" ? Number(value) / 100 : cur.L;
                const C = channel === "C" ? Number(value) : cur.C;
                const H = channel === "H" ? Number(value) : baseH;
                // Any OKLCH edit makes H sticky: chroma can go to 0 and back
                // and the color returns to the hue the user set.
                oklchHueRef.current = H;
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
      </SurfaceProvider>
    );

    return size ? <SizeProvider size={size}>{root}</SizeProvider> : root;
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
  oklchHue,
  onChannelChange,
}: {
  parsed: ParsedColor;
  format: ColorFormat;
  /** Sticky OKLCH hue override for display (preserves user's stated H across round-trip drift). */
  oklchHue?: number | null;
  onChannelChange: (key: ChannelKey, value: string) => void;
}) {
  const alphaPct = Math.round(parsed.a * 100);

  // HEX is the one plain text field (no scrubbing): the "#" is a fixed
  // prefix, re-added on commit, and 8-digit input carries alpha.
  if (format === "hex") {
    const hexNoHash = parsed.hex.replace(/^#/, "").toUpperCase();
    return (
      <div className="grid grid-cols-2 gap-2">
        <ChannelTooltip label="Hex">
          <ColorInput
            value={hexNoHash}
            onCommit={(next) => onChannelChange("hex", next.startsWith("#") ? next : `#${next}`)}
            ariaLabel="Hex value"
            prefix="#"
          />
        </ChannelTooltip>
        <AlphaInput value={alphaPct} onCommit={(n) => onChannelChange("alphaPercent", String(n))} />
      </div>
    );
  }

  if (format === "rgb") {
    return (
      <div className="grid grid-cols-4 gap-1">
        <ChannelTooltip label="Red"><ColorInput value={String(parsed.r)} onCommit={(n) => onChannelChange("r", n)} ariaLabel="Red" align="center" inputMode="numeric" nudgeStep={1} nudgeShiftStep={10} scrubbable min={0} max={255} /></ChannelTooltip>
        <ChannelTooltip label="Green"><ColorInput value={String(parsed.g)} onCommit={(n) => onChannelChange("g", n)} ariaLabel="Green" align="center" inputMode="numeric" nudgeStep={1} nudgeShiftStep={10} scrubbable min={0} max={255} /></ChannelTooltip>
        <ChannelTooltip label="Blue"><ColorInput value={String(parsed.b)} onCommit={(n) => onChannelChange("b", n)} ariaLabel="Blue" align="center" inputMode="numeric" nudgeStep={1} nudgeShiftStep={10} scrubbable min={0} max={255} /></ChannelTooltip>
        <AlphaInput value={alphaPct} onCommit={(n) => onChannelChange("alphaPercent", String(n))} />
      </div>
    );
  }

  // Hue fields (HSL H here, OKLCH H below) pass `wrap`: hue is an angle, so
  // nudging past 360 continues at 1 instead of sticking at the end.
  if (format === "hsl") {
    const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
    return (
      <div className="grid grid-cols-4 gap-1">
        <ChannelTooltip label="Hue"><ColorInput value={String(Math.round(hsl.h))} onCommit={(n) => onChannelChange("hSL", n)} ariaLabel="Hue" align="center" inputMode="numeric" nudgeStep={1} nudgeShiftStep={10} scrubbable min={0} max={360} wrap /></ChannelTooltip>
        <ChannelTooltip label="Saturation"><ColorInput value={String(Math.round(hsl.s * 100))} onCommit={(n) => onChannelChange("sSL", n)} ariaLabel="Saturation" align="center" inputMode="numeric" nudgeStep={1} nudgeShiftStep={10} scrubbable min={0} max={100} /></ChannelTooltip>
        <ChannelTooltip label="Lightness"><ColorInput value={String(Math.round(hsl.l * 100))} onCommit={(n) => onChannelChange("lSL", n)} ariaLabel="Lightness" align="center" inputMode="numeric" nudgeStep={1} nudgeShiftStep={10} scrubbable min={0} max={100} /></ChannelTooltip>
        <AlphaInput value={alphaPct} onCommit={(n) => onChannelChange("alphaPercent", String(n))} />
      </div>
    );
  }

  // oklch
  // Chroma steps by 0.01 (Shift 0.1) with 2 decimals, capped at 0.4: above
  // the sRGB peak (about 0.32, pure magenta), so every displayable chroma is
  // reachable and anything past the gamut clips on commit.
  const oklch = rgbToOklch(parsed.r, parsed.g, parsed.b);
  const displayH = oklchHue ?? oklch.H;
  return (
    <div className="grid grid-cols-4 gap-1">
      <ChannelTooltip label="Lightness"><ColorInput value={(oklch.L * 100).toFixed(0)} onCommit={(n) => onChannelChange("L", n)} ariaLabel="Lightness" align="center" inputMode="decimal" nudgeStep={1} nudgeShiftStep={10} scrubbable min={0} max={100} /></ChannelTooltip>
      <ChannelTooltip label="Chroma"><ColorInput value={oklch.C.toFixed(2)} onCommit={(n) => onChannelChange("C", n)} ariaLabel="Chroma" align="center" inputMode="decimal" nudgeStep={0.01} nudgeShiftStep={0.1} decimals={2} scrubbable min={0} max={0.4} /></ChannelTooltip>
      <ChannelTooltip label="Hue"><ColorInput value={displayH.toFixed(0)} onCommit={(n) => onChannelChange("H", n)} ariaLabel="Hue" align="center" inputMode="numeric" nudgeStep={1} nudgeShiftStep={10} scrubbable min={0} max={360} wrap /></ChannelTooltip>
      <AlphaInput value={alphaPct} onCommit={(n) => onChannelChange("alphaPercent", String(n))} />
    </div>
  );
}

// Channel fields show bare values with no labels, so a tooltip names each
// one after 300ms of hover.
function ChannelTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip content={label} delayDuration={300}>
      <div>{children}</div>
    </Tooltip>
  );
}

// Alpha shows as a whole percent in every format, so one field reads the
// same whichever format is active.
function AlphaInput({ value, onCommit }: { value: number; onCommit: (n: number) => void }) {
  return (
    <ChannelTooltip label="Alpha">
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
        min={0}
        max={100}
      />
    </ChannelTooltip>
  );
}

// ---------------------------------------------------------------------------
// ColorPickerPopover (trigger button + popover panel)
//
// Built on Base UI's Popover primitive, which owns positioning (anchor
// tracking + collision flipping — the old version placed the panel at a
// captured rect and could overflow the viewport bottom), dismissal (outside
// press, focus-out, Escape only while focus is relevant), and focus
// management (focus moves into the panel on open and restores to the trigger
// on close). The spring open/close animation stays via the actionsRef
// deferred-unmount pattern (same as Select); the previous conditional
// portal unmounted the AnimatePresence container itself, so the exit
// animation never played.
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
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      size,
      ...pickerProps
    },
    ref
  ) => {
    const isOpenControlled = openProp !== undefined;
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const open = isOpenControlled ? openProp : internalOpen;
    const actionsRef = useRef<{ unmount: () => void; close: () => void } | null>(null);
    const [panelEl, setPanelEl] = useState<HTMLDivElement | null>(null);
    const shape = useShape();
    // Resolved with the override directly: this component's own hooks run
    // outside the SizeProvider it renders, so the trigger can't read the pin
    // from context. The portalled panel inherits it from the provider below
    // (React context crosses portals).
    const sizeClasses = useSize(size);
    const compact = sizeClasses.variant === "compact";
    const substrate = useSurface();
    // The floating panel sits two surface levels above where it opens
    // (capped at 8, the top of the ladder), with a level-3 shadow.
    const level = Math.min(substrate + 2, 8);

    const handleOpenChange = useCallback(
      (next: boolean) => {
        if (!isOpenControlled) setInternalOpen(next);
        onOpenChange?.(next);
      },
      [isOpenControlled, onOpenChange]
    );

    // The popover owns the value (unless controlled) because the trigger
    // shows it too. The panel inside is always controlled with currentValue;
    // when that is its own emitted string coming back, lastEmittedRef skips
    // the re-parse.
    const isControlled = pickerProps.value !== undefined;
    const [internalValue, setInternalValue] = useState(pickerProps.value ?? pickerProps.defaultValue ?? "#6B97FF");
    const currentValue = isControlled ? (pickerProps.value as string) : internalValue;

    const handleValueChange = useCallback(
      (v: string, parsed: ParsedColor) => {
        if (!isControlled) setInternalValue(v);
        pickerProps.onValueChange?.(v, parsed);
      },
      [isControlled, pickerProps]
    );

    // Release Base UI's deferred unmount once the exit tween has played.
    // onAnimationComplete on the motion.div is the primary signal; this
    // timeout is a fallback for throttled/background tabs where rAF-driven
    // animation callbacks can stall (spring.moderate.exit is 120ms — 150ms
    // covers it with margin).
    useEffect(() => {
      if (open) return;
      const id = setTimeout(() => actionsRef.current?.unmount(), 150);
      return () => clearTimeout(id);
    }, [open]);

    const XIcon = useIcon("x");
    const parsed = useMemo(() => parseColor(currentValue), [currentValue]);
    // The tile keeps alpha (over the checker); the text label drops it and
    // shows 6-digit uppercase hex whatever the selected format.
    const swatchColor = parsed
      ? rgbToHexStr(parsed.r, parsed.g, parsed.b, parsed.a)
      : currentValue;
    const valueLabel = parsed
      ? rgbToHexStr(parsed.r, parsed.g, parsed.b, 1).replace(/^#/, "").toUpperCase()
      : currentValue;

    // A size prop pins the whole compound (trigger + portalled panel — React
    // context crosses portals) to one step of the ladder.
    const root = (
      <Popover.Root
        open={open}
        onOpenChange={handleOpenChange}
        actionsRef={actionsRef}
        // Non-modal: the page keeps scrolling and the Positioner tracks the
        // anchor, so the panel follows its trigger instead of detaching.
        modal={false}
      >
        <div ref={ref} className="inline-flex">
          <Popover.Trigger
            className={cn(
              "flex items-center border border-border bg-transparent hover:bg-hover transition-colors duration-80 outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] cursor-pointer",
              sizeClasses.gap,
              sizeClasses.control,
              compact ? "px-1.5" : "px-2",
              shape.input,
              triggerClassName
            )}
            style={{ fontVariationSettings: fontWeights.medium }}
          >
            {triggerLabel && triggerLabelPosition === "left" && (
              <span className={cn("text-muted-foreground px-1 select-none", sizeClasses.text)}>
                {triggerLabel}
              </span>
            )}
            <ColorTile color={swatchColor} size={compact ? 16 : 20} />
            {triggerShowValue && (
              <span className={cn("text-foreground tabular-nums", sizeClasses.text)}>
                {valueLabel}
              </span>
            )}
            {triggerLabel && triggerLabelPosition === "right" && (
              <span className={cn("text-muted-foreground px-1 select-none", sizeClasses.text)}>
                {triggerLabel}
              </span>
            )}
            {/* A span with role="button", since a real button can't nest in
                the trigger button. stopPropagation keeps a remove press from
                also toggling the popover. */}
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
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner
              side="bottom"
              align="start"
              sideOffset={6}
              className="z-50 outline-none"
            >
              <motion.div
                initial={{ opacity: 0, y: -4, scaleY: 0.96 }}
                animate={
                  open
                    ? { opacity: 1, y: 0, scaleY: 1 }
                    : { opacity: 0, y: -4, scaleY: 0.96 }
                }
                transition={open ? spring.moderate : spring.moderate.exit}
                // Top-left origin matches align="start": the panel unfolds
                // from the trigger's corner.
                style={{ transformOrigin: "top left" }}
                // Base UI defers unmount while actionsRef is set; release it
                // once the exit spring has finished so the close animation
                // fully plays.
                onAnimationComplete={() => {
                  if (!open) actionsRef.current?.unmount();
                }}
              >
                {/* The panel node goes into state, not a ref, so the portal
                    container context re-renders once the node exists. */}
                <Popover.Popup
                  render={<div ref={setPanelEl} />}
                  className="outline-none"
                >
                  {/* The format menu portals into this panel, so it lives
                      inside the popover's DOM and scales with it. */}
                  <ColorPickerPortalContainer value={panelEl}>
                    <SurfaceProvider value={level}>
                      <ColorPicker
                        {...pickerProps}
                        value={currentValue}
                        onValueChange={handleValueChange}
                        className={cn(
                          surfaceClasses(level, 3),
                          pickerProps.className
                        )}
                      />
                    </SurfaceProvider>
                  </ColorPickerPortalContainer>
                </Popover.Popup>
              </motion.div>
            </Popover.Positioner>
          </Popover.Portal>
        </div>
      </Popover.Root>
    );

    return size ? <SizeProvider size={size}>{root}</SizeProvider> : root;
  }
);

ColorPickerPopover.displayName = "ColorPickerPopover";

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

// parseColor and buildParsed are exported so code outside the panel can read
// a color string or build the same ParsedColor shape onValueChange hands out.
export {
  ColorPicker,
  ColorPickerPopover,
  ColorPickerPortalContainer,
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
