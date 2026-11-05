"use client";

// ---------------------------------------------------------------------------
// Phosphor glyphs for every slot the components look up (see icon-context).
// Pass the map to IconProvider and every component draws them:
//
//   <IconProvider icons={phosphorIcons}>{children}</IconProvider>
//
// Each adapter maps the shared props (size, strokeWidth, className) onto
// what Phosphor takes. Phosphor draws filled paths per weight, so strokeWidth
// picks a weight instead of a stroke.
// ---------------------------------------------------------------------------

import {
  CaretRight as PhCaretRight,
  CaretDown as PhCaretDown,
  Eyedropper as PhEyedropper,
  X as PhX,
  Copy as PhCopy,
  List as PhList,
  DotOutline as PhDotOutline,
  Monitor as PhMonitor,
  Sun as PhSun,
  Moon as PhMoon,
  Rectangle as PhRectangle,
  Circle as PhCircle,
  Books as PhBooks,
  Clock as PhClock,
  Star as PhStar,
  Gear as PhGear,
  Plus as PhPlus,
  ArrowLeft as PhArrowLeft,
  ArrowRight as PhArrowRight,
  ArrowUp as PhArrowUp,
  ArrowDown as PhArrowDown,
  MagnifyingGlass as PhMagnifyingGlass,
  Spinner as PhSpinner,
  Users as PhUsers,
  Lock as PhLock,
  Envelope as PhEnvelope,
  Bell as PhBell,
  Shield as PhShield,
  Palette as PhPalette,
  Lightbulb as PhLightbulb,
  Rocket as PhRocket,
  Heart as PhHeart,
  PaintBrush as PhPaintBrush,
  Brain as PhBrain,
  Globe as PhGlobe,
  User as PhUser,
  Image as PhImage,
  Link as PhLink,
  Check as PhCheck,
  ArrowCounterClockwise as PhRotateCcw,
  Play as PhPlay,
  Pause as PhPause,
  House as PhHouse,
  ChatCircle as PhChatCircle,
  Tray as PhTray,
  Pencil as PhPencil,
  Resize as PhResize,
  SkipForward as PhSkipForward,
  ArrowElbowDownRight as PhArrowElbowDownRight,
  ArrowElbowDownLeft as PhArrowElbowDownLeft,
  SidebarSimple as PhSidebarSimple,
  CaretUpDown as PhCaretUpDown,
  DotsThree as PhDotsThree,
  DotsThreeVertical as PhDotsThreeVertical,
  SlidersHorizontal as PhSlidersHorizontal,
  Info as PhInfo,
  WarningCircle as PhWarningCircle,
  File as PhFile,
  Minus as PhMinus,
  CalendarBlank as PhCalendarBlank,
  FolderSimple as PhFolderSimple,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";
import type { IconComponent, IconComponentProps, IconName } from "@/lib/icon-context";

// Phosphor: uses filled paths per weight variant, not CSS stroke.
// Map numeric strokeWidth → discrete weight prop.
type PhosphorWeight = "thin" | "light" | "regular" | "bold";
function phosphor(Icon: ComponentType<{ size?: number; weight?: PhosphorWeight; className?: string }>): IconComponent {
  return function PhosphorAdapter({ size, strokeWidth, className }: IconComponentProps) {
    const weight: PhosphorWeight = strokeWidth != null && strokeWidth >= 1.75 ? "regular" : "light";
    return <Icon size={size} weight={weight} className={className} />;
  };
}

// Phosphor ships no right-hand sidebar glyph — mirror the left one.
function phosphorFlipped(Icon: ComponentType<{ size?: number; weight?: PhosphorWeight; className?: string }>): IconComponent {
  return function PhosphorFlippedAdapter({ size, strokeWidth, className }: IconComponentProps) {
    const weight: PhosphorWeight = strokeWidth != null && strokeWidth >= 1.75 ? "regular" : "light";
    return <Icon size={size} weight={weight} className={`-scale-x-100 ${className ?? ""}`} />;
  };
}

export const phosphorIcons: Record<IconName, IconComponent> = {
  "chevron-right": phosphor(PhCaretRight),
  "chevron-down": phosphor(PhCaretDown),
  "pipette": phosphor(PhEyedropper),
  "x": phosphor(PhX),
  "copy": phosphor(PhCopy),
  "menu": phosphor(PhList),
  "dot": phosphor(PhDotOutline),
  "monitor": phosphor(PhMonitor),
  "sun": phosphor(PhSun),
  "moon": phosphor(PhMoon),
  "rectangle-horizontal": phosphor(PhRectangle),
  "circle": phosphor(PhCircle),
  "square-library": phosphor(PhBooks),
  "clock": phosphor(PhClock),
  "star": phosphor(PhStar),
  "settings": phosphor(PhGear),
  "plus": phosphor(PhPlus),
  "arrow-left": phosphor(PhArrowLeft),
  "arrow-right": phosphor(PhArrowRight),
  "arrow-up": phosphor(PhArrowUp),
  "arrow-down": phosphor(PhArrowDown),
  "search": phosphor(PhMagnifyingGlass),
  "loader": phosphor(PhSpinner),
  "users": phosphor(PhUsers),
  "lock": phosphor(PhLock),
  "mail": phosphor(PhEnvelope),
  "bell": phosphor(PhBell),
  "shield": phosphor(PhShield),
  "palette": phosphor(PhPalette),
  "lightbulb": phosphor(PhLightbulb),
  "rocket": phosphor(PhRocket),
  "heart": phosphor(PhHeart),
  "paintbrush": phosphor(PhPaintBrush),
  "brain": phosphor(PhBrain),
  "globe": phosphor(PhGlobe),
  "user": phosphor(PhUser),
  "image": phosphor(PhImage),
  "link": phosphor(PhLink),
  "check": phosphor(PhCheck),
  "rotate-ccw": phosphor(PhRotateCcw),
  "play": phosphor(PhPlay),
  "pause": phosphor(PhPause),
  "home": phosphor(PhHouse),
  "message-circle": phosphor(PhChatCircle),
  "inbox": phosphor(PhTray),
  "pencil": phosphor(PhPencil),
  "scaling": phosphor(PhResize),
  "skip-forward": phosphor(PhSkipForward),
  "corner-down-right": phosphor(PhArrowElbowDownRight),
  "corner-down-left": phosphor(PhArrowElbowDownLeft),
  "panel-left": phosphor(PhSidebarSimple),
  "panel-right": phosphorFlipped(PhSidebarSimple),
  "chevrons-up-down": phosphor(PhCaretUpDown),
  "more-horizontal": phosphor(PhDotsThree),
  "more-vertical": phosphor(PhDotsThreeVertical),
  "calendar": phosphor(PhCalendarBlank),
  "folder": phosphor(PhFolderSimple),
  "sliders-horizontal": phosphor(PhSlidersHorizontal),
  "info": phosphor(PhInfo),
  "circle-alert": phosphor(PhWarningCircle),
  "file": phosphor(PhFile),
  "minus": phosphor(PhMinus),
};
