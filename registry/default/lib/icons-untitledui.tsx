"use client";

// ---------------------------------------------------------------------------
// Untitled UI glyphs for every slot the components look up (see icon-context).
// Pass the map to IconProvider and every component draws them:
//
//   <IconProvider icons={untitleduiIcons}>{children}</IconProvider>
//
// Each adapter maps the shared props (size, strokeWidth, className) onto
// what Untitled UI takes. The free set has no bare play/pause pair, so
// those two slots keep Lucide's.
// ---------------------------------------------------------------------------

import {
  ChevronRight as UuiChevronRight,
  ChevronDown as UuiChevronDown,
  Dropper as UuiDropper,
  XClose as UuiX,
  Copy01 as UuiCopy,
  Menu01 as UuiMenu,
  Monitor01 as UuiMonitor,
  Sun as UuiSun,
  Moon01 as UuiMoon,
  Square as UuiSquare,
  Circle as UuiCircle,
  BookClosed as UuiBook,
  Clock as UuiClock,
  Star01 as UuiStar,
  Settings01 as UuiSettings,
  Plus as UuiPlus,
  ArrowLeft as UuiArrowLeft,
  ArrowRight as UuiArrowRight,
  ArrowUp as UuiArrowUp,
  ArrowDown as UuiArrowDown,
  SearchMd as UuiSearch,
  Loading01 as UuiLoader,
  Users01 as UuiUsers,
  Lock01 as UuiLock,
  Mail01 as UuiMail,
  Bell01 as UuiBell,
  Shield01 as UuiShield,
  Palette as UuiPalette,
  Lightbulb01 as UuiLightbulb,
  Rocket01 as UuiRocket,
  Heart as UuiHeart,
  Brush01 as UuiBrush,
  CpuChip01 as UuiCpuChip,
  Globe01 as UuiGlobe,
  User01 as UuiUser,
  Image01 as UuiImage,
  Link01 as UuiLink,
  Check as UuiCheck,
  RefreshCcw01 as UuiRotateCcw,
  Home01 as UuiHome,
  MessageCircle01 as UuiMessage,
  Inbox01 as UuiInbox,
  Pencil01 as UuiPencil,
  Scale01 as UuiScaling,
  SkipForward as UuiSkipForward,
  CornerDownRight as UuiCornerDownRight,
  CornerDownLeft as UuiCornerDownLeft,
  LayoutLeft as UuiLayoutLeft,
  LayoutRight as UuiLayoutRight,
  ChevronSelectorVertical as UuiChevronSelectorVertical,
  DotsHorizontal as UuiDotsHorizontal,
  DotsVertical as UuiDotsVertical,
  Sliders01 as UuiSliders,
  InfoCircle as UuiInfo,
  AlertCircle as UuiAlertCircle,
  File01 as UuiFile,
  Minus as UuiMinus,
  Calendar as UuiCalendar,
  Folder as UuiFolder,
} from "@untitledui/icons";
import { Play, Pause } from "lucide-react";
import type { ComponentType } from "react";
import type { IconComponent, IconComponentProps, IconName } from "@/lib/icon-context";

// Untitled UI: standard 24px SVG components — `strokeWidth`/`className` pass
// through natively; only `size` needs mapping to `width`/`height`.
function untitledui(Icon: ComponentType<{ width?: number; height?: number; strokeWidth?: number; className?: string }>): IconComponent {
  return function UntitledUiAdapter({ size, strokeWidth, className }: IconComponentProps) {
    return <Icon width={size} height={size} strokeWidth={strokeWidth} className={className} />;
  };
}

export const untitleduiIcons: Record<IconName, IconComponent> = {
  "chevron-right": untitledui(UuiChevronRight),
  "chevron-down": untitledui(UuiChevronDown),
  "pipette": untitledui(UuiDropper),
  "x": untitledui(UuiX),
  "copy": untitledui(UuiCopy),
  "menu": untitledui(UuiMenu),
  // No bare dot in the set — reuse Circle (matches HugeIcons' dot handling).
  "dot": untitledui(UuiCircle),
  "monitor": untitledui(UuiMonitor),
  "sun": untitledui(UuiSun),
  "moon": untitledui(UuiMoon),
  "rectangle-horizontal": untitledui(UuiSquare),
  "circle": untitledui(UuiCircle),
  "square-library": untitledui(UuiBook),
  "clock": untitledui(UuiClock),
  "star": untitledui(UuiStar),
  "settings": untitledui(UuiSettings),
  "plus": untitledui(UuiPlus),
  "arrow-left": untitledui(UuiArrowLeft),
  "arrow-right": untitledui(UuiArrowRight),
  "arrow-up": untitledui(UuiArrowUp),
  "arrow-down": untitledui(UuiArrowDown),
  "search": untitledui(UuiSearch),
  "loader": untitledui(UuiLoader),
  "users": untitledui(UuiUsers),
  "lock": untitledui(UuiLock),
  "mail": untitledui(UuiMail),
  "bell": untitledui(UuiBell),
  "shield": untitledui(UuiShield),
  "palette": untitledui(UuiPalette),
  "lightbulb": untitledui(UuiLightbulb),
  "rocket": untitledui(UuiRocket),
  "heart": untitledui(UuiHeart),
  "paintbrush": untitledui(UuiBrush),
  // No brain icon in the free set — CpuChip01 carries the "intelligence" metaphor.
  "brain": untitledui(UuiCpuChip),
  "globe": untitledui(UuiGlobe),
  "user": untitledui(UuiUser),
  "image": untitledui(UuiImage),
  "link": untitledui(UuiLink),
  "check": untitledui(UuiCheck),
  "rotate-ccw": untitledui(UuiRotateCcw),
  // Only enclosed Pause variants exist; fall back to Lucide for a bare pair
  // (matches HugeIcons' play/pause handling).
  "play": Play,
  "pause": Pause,
  "home": untitledui(UuiHome),
  "message-circle": untitledui(UuiMessage),
  "inbox": untitledui(UuiInbox),
  "pencil": untitledui(UuiPencil),
  "scaling": untitledui(UuiScaling),
  "skip-forward": untitledui(UuiSkipForward),
  "corner-down-right": untitledui(UuiCornerDownRight),
  "corner-down-left": untitledui(UuiCornerDownLeft),
  "panel-left": untitledui(UuiLayoutLeft),
  "panel-right": untitledui(UuiLayoutRight),
  "chevrons-up-down": untitledui(UuiChevronSelectorVertical),
  "more-horizontal": untitledui(UuiDotsHorizontal),
  "more-vertical": untitledui(UuiDotsVertical),
  "calendar": untitledui(UuiCalendar),
  "folder": untitledui(UuiFolder),
  "sliders-horizontal": untitledui(UuiSliders),
  "info": untitledui(UuiInfo),
  "circle-alert": untitledui(UuiAlertCircle),
  "file": untitledui(UuiFile),
  "minus": untitledui(UuiMinus),
};
