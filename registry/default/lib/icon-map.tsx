"use client";

import type { ComponentType } from "react";

// ── Lucide ──────────────────────────────────────────────────
import {
  ChevronRight,
  ChevronDown,
  X,
  Copy,
  Menu,
  Dot,
  Monitor,
  Sun,
  Moon,
  RectangleHorizontal,
  Circle,
  SquareLibrary,
  Clock,
  Star,
  Settings,
  Plus,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Search,
  Loader,
  Users,
  Lock,
  Mail,
  Bell,
  Shield,
  Palette,
  Lightbulb,
  Rocket,
  Heart,
  Paintbrush,
  Brain,
  Globe,
  User,
  ImageIcon,
  Link,
  Check,
  RotateCcw,
  Play,
  Pause,
  Pipette,
  Home,
  MessageCircle,
  Inbox,
  Pencil,
  SkipForward,
  CornerDownRight,
} from "lucide-react";

// ── Tabler ──────────────────────────────────────────────────
import {
  IconChevronRight,
  IconChevronDown,
  IconColorPicker,
  IconX,
  IconCopy,
  IconMenu2,
  IconPoint,
  IconDeviceDesktop,
  IconSun,
  IconMoon,
  IconSquare,
  IconCircle,
  IconLibrary,
  IconClock,
  IconStar,
  IconSettings,
  IconPlus,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconSearch,
  IconLoader2,
  IconUsers,
  IconLock,
  IconMail,
  IconBell,
  IconShield,
  IconPalette,
  IconBulb,
  IconRocket,
  IconHeart,
  IconBrush,
  IconBrain,
  IconGlobe,
  IconUser,
  IconPhoto,
  IconLink,
  IconCheck,
  IconRotate2,
  IconPlayerPlay,
  IconPlayerPause,
  IconHome,
  IconMessageCircle,
  IconInbox,
  IconPencil,
  IconPlayerSkipForward,
  IconCornerDownRight,
} from "@tabler/icons-react";

// ── Phosphor ────────────────────────────────────────────────
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
  SkipForward as PhSkipForward,
  ArrowElbowDownRight as PhArrowElbowDownRight,
} from "@phosphor-icons/react";

// ── HugeIcons ───────────────────────────────────────────────
import { HugeiconsIcon } from "@hugeicons/react";
import HiChevronRight from "@hugeicons/core-free-icons/ArrowRight01Icon";
import HiChevronDown from "@hugeicons/core-free-icons/ArrowDown01Icon";
import HiDropper from "@hugeicons/core-free-icons/DropperIcon";
import HiX from "@hugeicons/core-free-icons/Cancel01Icon";
import HiCopy from "@hugeicons/core-free-icons/Copy01Icon";
import HiMenu from "@hugeicons/core-free-icons/Menu01Icon";
import HiDot from "@hugeicons/core-free-icons/CircleIcon";
import HiMonitor from "@hugeicons/core-free-icons/ComputerIcon";
import HiSun from "@hugeicons/core-free-icons/Sun01Icon";
import HiMoon from "@hugeicons/core-free-icons/Moon01Icon";
import HiRectangle from "@hugeicons/core-free-icons/DashboardCircleIcon";
import HiLibrary from "@hugeicons/core-free-icons/LibraryIcon";
import HiClock from "@hugeicons/core-free-icons/Clock01Icon";
import HiStar from "@hugeicons/core-free-icons/StarIcon";
import HiSettings from "@hugeicons/core-free-icons/Settings01Icon";
import HiPlus from "@hugeicons/core-free-icons/PlusSignIcon";
import HiArrowLeft from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import HiArrowRight from "@hugeicons/core-free-icons/ArrowRight01Icon";
import HiArrowUp from "@hugeicons/core-free-icons/ArrowUp01Icon";
import HiSearch from "@hugeicons/core-free-icons/Search01Icon";
import HiLoader from "@hugeicons/core-free-icons/Loading01Icon";
import HiUsers from "@hugeicons/core-free-icons/UserGroupIcon";
import HiLock from "@hugeicons/core-free-icons/LockIcon";
import HiMail from "@hugeicons/core-free-icons/Mail01Icon";
import HiBell from "@hugeicons/core-free-icons/Notification01Icon";
import HiShield from "@hugeicons/core-free-icons/Shield01Icon";
import HiPalette from "@hugeicons/core-free-icons/PaintBrush01Icon";
import HiLightbulb from "@hugeicons/core-free-icons/BulbIcon";
import HiRocket from "@hugeicons/core-free-icons/Rocket01Icon";
import HiHeart from "@hugeicons/core-free-icons/FavouriteIcon";
import HiPaintbrush from "@hugeicons/core-free-icons/PaintBrush02Icon";
import HiBrain from "@hugeicons/core-free-icons/BrainIcon";
import HiGlobe from "@hugeicons/core-free-icons/GlobeIcon";
import HiUser from "@hugeicons/core-free-icons/UserIcon";
import HiImage from "@hugeicons/core-free-icons/Image01Icon";
import HiLink from "@hugeicons/core-free-icons/Link01Icon";
import HiCheck from "@hugeicons/core-free-icons/Tick02Icon";
import HiRotateCcw from "@hugeicons/core-free-icons/ArrowReloadHorizontalIcon";
import HiHome from "@hugeicons/core-free-icons/Home01Icon";
import HiMessage from "@hugeicons/core-free-icons/BubbleChatIcon";
import HiInbox from "@hugeicons/core-free-icons/InboxIcon";
import HiPencil from "@hugeicons/core-free-icons/PencilEdit01Icon";
import HiSkipForward from "@hugeicons/core-free-icons/NextIcon";
import HiCornerDownRight from "@hugeicons/core-free-icons/ArrowMoveDownRightIcon";

// ── Untitled UI ─────────────────────────────────────────────
// Aliased with a Uui prefix to avoid collisions with the Lucide imports above.
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
  SkipForward as UuiSkipForward,
  CornerDownRight as UuiCornerDownRight,
} from "@untitledui/icons";

// ── Types ───────────────────────────────────────────────────

export interface IconComponentProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export type IconComponent = ComponentType<IconComponentProps>;

export type IconLibrary = "lucide" | "tabler" | "phosphor" | "hugeicons" | "untitledui";

export type IconName =
  | "chevron-right" | "chevron-down" | "x" | "copy" | "menu" | "dot"
  | "monitor" | "sun" | "moon" | "rectangle-horizontal" | "circle"
  | "square-library" | "clock" | "star" | "settings"
  | "plus" | "arrow-left" | "arrow-right" | "arrow-up" | "search" | "loader"
  | "users" | "lock" | "mail" | "bell" | "shield" | "palette"
  | "lightbulb" | "rocket" | "heart" | "paintbrush" | "brain"
  | "globe" | "user"
  | "image" | "link" | "check" | "rotate-ccw"
  | "play" | "pause" | "pipette"
  | "home" | "message-circle" | "inbox"
  | "pencil" | "skip-forward" | "corner-down-right";

export const iconLibraryOrder: IconLibrary[] = ["lucide", "tabler", "phosphor", "hugeicons", "untitledui"];

export const iconLibraryLabels: Record<IconLibrary, string> = {
  lucide: "Lucide",
  tabler: "Tabler",
  phosphor: "Phosphor",
  hugeicons: "HugeIcons",
  untitledui: "Untitled UI",
};

// ── Adapter Factories ───────────────────────────────────────

// Tabler: `strokeWidth` → `stroke` prop
function tabler(Icon: ComponentType<{ size?: number; stroke?: number; className?: string }>): IconComponent {
  return function TablerAdapter({ size, strokeWidth, className }: IconComponentProps) {
    return <Icon size={size} stroke={strokeWidth} className={className} />;
  };
}

// Phosphor: uses filled paths per weight variant, not CSS stroke.
// Map numeric strokeWidth → discrete weight prop.
type PhosphorWeight = "thin" | "light" | "regular" | "bold";
function phosphor(Icon: ComponentType<{ size?: number; weight?: PhosphorWeight; className?: string }>): IconComponent {
  return function PhosphorAdapter({ size, strokeWidth, className }: IconComponentProps) {
    const weight: PhosphorWeight = strokeWidth != null && strokeWidth >= 1.75 ? "regular" : "light";
    return <Icon size={size} weight={weight} className={className} />;
  };
}

// HugeIcons: wraps icon definition in HugeiconsIcon renderer
function hugeicons(iconDef: unknown): IconComponent {
  return function HugeIconsAdapter({ size, strokeWidth, className }: IconComponentProps) {
    return (
      <HugeiconsIcon
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        icon={iconDef as any}
        size={size}
        strokeWidth={strokeWidth}
        className={className}
      />
    );
  };
}

// Untitled UI: standard 24px SVG components — `strokeWidth`/`className` pass
// through natively; only `size` needs mapping to `width`/`height`.
function untitledui(Icon: ComponentType<{ width?: number; height?: number; strokeWidth?: number; className?: string }>): IconComponent {
  return function UntitledUiAdapter({ size, strokeWidth, className }: IconComponentProps) {
    return <Icon width={size} height={size} strokeWidth={strokeWidth} className={className} />;
  };
}

// ── Icon Maps ───────────────────────────────────────────────

const lucideMap: Record<IconName, IconComponent> = {
  "chevron-right": ChevronRight,
  "chevron-down": ChevronDown,
  "pipette": Pipette,
  "x": X,
  "copy": Copy,
  "menu": Menu,
  "dot": Dot,
  "monitor": Monitor,
  "sun": Sun,
  "moon": Moon,
  "rectangle-horizontal": RectangleHorizontal,
  "circle": Circle,
  "square-library": SquareLibrary,
  "clock": Clock,
  "star": Star,
  "settings": Settings,
  "plus": Plus,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "arrow-up": ArrowUp,
  "search": Search,
  "loader": Loader,
  "users": Users,
  "lock": Lock,
  "mail": Mail,
  "bell": Bell,
  "shield": Shield,
  "palette": Palette,
  "lightbulb": Lightbulb,
  "rocket": Rocket,
  "heart": Heart,
  "paintbrush": Paintbrush,
  "brain": Brain,
  "globe": Globe,
  "user": User,
  "image": ImageIcon,
  "link": Link,
  "check": Check,
  "rotate-ccw": RotateCcw,
  "play": Play,
  "pause": Pause,
  "home": Home,
  "message-circle": MessageCircle,
  "inbox": Inbox,
  "pencil": Pencil,
  "skip-forward": SkipForward,
  "corner-down-right": CornerDownRight,
};

const tablerMap: Record<IconName, IconComponent> = {
  "chevron-right": tabler(IconChevronRight),
  "chevron-down": tabler(IconChevronDown),
  "pipette": tabler(IconColorPicker),
  "x": tabler(IconX),
  "copy": tabler(IconCopy),
  "menu": tabler(IconMenu2),
  "dot": tabler(IconPoint),
  "monitor": tabler(IconDeviceDesktop),
  "sun": tabler(IconSun),
  "moon": tabler(IconMoon),
  "rectangle-horizontal": tabler(IconSquare),
  "circle": tabler(IconCircle),
  "square-library": tabler(IconLibrary),
  "clock": tabler(IconClock),
  "star": tabler(IconStar),
  "settings": tabler(IconSettings),
  "plus": tabler(IconPlus),
  "arrow-left": tabler(IconArrowLeft),
  "arrow-right": tabler(IconArrowRight),
  "arrow-up": tabler(IconArrowUp),
  "search": tabler(IconSearch),
  "loader": tabler(IconLoader2),
  "users": tabler(IconUsers),
  "lock": tabler(IconLock),
  "mail": tabler(IconMail),
  "bell": tabler(IconBell),
  "shield": tabler(IconShield),
  "palette": tabler(IconPalette),
  "lightbulb": tabler(IconBulb),
  "rocket": tabler(IconRocket),
  "heart": tabler(IconHeart),
  "paintbrush": tabler(IconBrush),
  "brain": tabler(IconBrain),
  "globe": tabler(IconGlobe),
  "user": tabler(IconUser),
  "image": tabler(IconPhoto),
  "link": tabler(IconLink),
  "check": tabler(IconCheck),
  "rotate-ccw": tabler(IconRotate2),
  "play": tabler(IconPlayerPlay),
  "pause": tabler(IconPlayerPause),
  "home": tabler(IconHome),
  "message-circle": tabler(IconMessageCircle),
  "inbox": tabler(IconInbox),
  "pencil": tabler(IconPencil),
  "skip-forward": tabler(IconPlayerSkipForward),
  "corner-down-right": tabler(IconCornerDownRight),
};

const phosphorMap: Record<IconName, IconComponent> = {
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
  "skip-forward": phosphor(PhSkipForward),
  "corner-down-right": phosphor(PhArrowElbowDownRight),
};

const hugeiconsMap: Record<IconName, IconComponent> = {
  "chevron-right": hugeicons(HiChevronRight),
  "chevron-down": hugeicons(HiChevronDown),
  "pipette": hugeicons(HiDropper),
  "x": hugeicons(HiX),
  "copy": hugeicons(HiCopy),
  "menu": hugeicons(HiMenu),
  "dot": hugeicons(HiDot),
  "monitor": hugeicons(HiMonitor),
  "sun": hugeicons(HiSun),
  "moon": hugeicons(HiMoon),
  "rectangle-horizontal": hugeicons(HiRectangle),
  "circle": hugeicons(HiDot),
  "square-library": hugeicons(HiLibrary),
  "clock": hugeicons(HiClock),
  "star": hugeicons(HiStar),
  "settings": hugeicons(HiSettings),
  "plus": hugeicons(HiPlus),
  "arrow-left": hugeicons(HiArrowLeft),
  "arrow-right": hugeicons(HiArrowRight),
  "arrow-up": hugeicons(HiArrowUp),
  "search": hugeicons(HiSearch),
  "loader": hugeicons(HiLoader),
  "users": hugeicons(HiUsers),
  "lock": hugeicons(HiLock),
  "mail": hugeicons(HiMail),
  "bell": hugeicons(HiBell),
  "shield": hugeicons(HiShield),
  "palette": hugeicons(HiPalette),
  "lightbulb": hugeicons(HiLightbulb),
  "rocket": hugeicons(HiRocket),
  "heart": hugeicons(HiHeart),
  "paintbrush": hugeicons(HiPaintbrush),
  "brain": hugeicons(HiBrain),
  "globe": hugeicons(HiGlobe),
  "user": hugeicons(HiUser),
  "image": hugeicons(HiImage),
  "link": hugeicons(HiLink),
  "check": hugeicons(HiCheck),
  "rotate-ccw": hugeicons(HiRotateCcw),
  "play": Play,
  "pause": Pause,
  "home": hugeicons(HiHome),
  "message-circle": hugeicons(HiMessage),
  "inbox": hugeicons(HiInbox),
  "pencil": hugeicons(HiPencil),
  "skip-forward": hugeicons(HiSkipForward),
  "corner-down-right": hugeicons(HiCornerDownRight),
};

const untitleduiMap: Record<IconName, IconComponent> = {
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
  "skip-forward": untitledui(UuiSkipForward),
  "corner-down-right": untitledui(UuiCornerDownRight),
};

// ── Unified Map ─────────────────────────────────────────────

export const iconMap: Record<IconLibrary, Record<IconName, IconComponent>> = {
  lucide: lucideMap,
  tabler: tablerMap,
  phosphor: phosphorMap,
  hugeicons: hugeiconsMap,
  untitledui: untitleduiMap,
};
