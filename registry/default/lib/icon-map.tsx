"use client";

import type { ComponentType } from "react";

// ── Lucide ──────────────────────────────────────────────────
import {
  ChevronRight,
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
  ArrowRight,
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
} from "lucide-react";

// ── Tabler ──────────────────────────────────────────────────
import {
  IconChevronRight,
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
  IconArrowRight,
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
} from "@tabler/icons-react";

// ── Phosphor ────────────────────────────────────────────────
import {
  CaretRight as PhCaretRight,
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
  ArrowRight as PhArrowRight,
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
} from "@phosphor-icons/react";

// ── HugeIcons ───────────────────────────────────────────────
import { HugeiconsIcon } from "@hugeicons/react";
import HiChevronRight from "@hugeicons/core-free-icons/ArrowRight01Icon";
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
import HiArrowRight from "@hugeicons/core-free-icons/ArrowRight01Icon";
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

// ── Types ───────────────────────────────────────────────────

export interface IconComponentProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export type IconComponent = ComponentType<IconComponentProps>;

export type IconLibrary = "lucide" | "tabler" | "phosphor" | "hugeicons";

export type IconName =
  | "chevron-right" | "x" | "copy" | "menu" | "dot"
  | "monitor" | "sun" | "moon" | "rectangle-horizontal" | "circle"
  | "square-library" | "clock" | "star" | "settings"
  | "plus" | "arrow-right" | "search" | "loader"
  | "users" | "lock" | "mail" | "bell" | "shield" | "palette"
  | "lightbulb" | "rocket" | "heart" | "paintbrush" | "brain"
  | "globe" | "user"
  | "image" | "link" | "check" | "rotate-ccw"
  | "play" | "pause";

export const iconLibraryOrder: IconLibrary[] = ["lucide", "tabler", "phosphor", "hugeicons"];

export const iconLibraryLabels: Record<IconLibrary, string> = {
  lucide: "Lucide",
  tabler: "Tabler",
  phosphor: "Phosphor",
  hugeicons: "HugeIcons",
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

// ── Icon Maps ───────────────────────────────────────────────

const lucideMap: Record<IconName, IconComponent> = {
  "chevron-right": ChevronRight,
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
  "arrow-right": ArrowRight,
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
};

const tablerMap: Record<IconName, IconComponent> = {
  "chevron-right": tabler(IconChevronRight),
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
  "arrow-right": tabler(IconArrowRight),
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
};

const phosphorMap: Record<IconName, IconComponent> = {
  "chevron-right": phosphor(PhCaretRight),
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
  "arrow-right": phosphor(PhArrowRight),
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
};

const hugeiconsMap: Record<IconName, IconComponent> = {
  "chevron-right": hugeicons(HiChevronRight),
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
  "arrow-right": hugeicons(HiArrowRight),
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
};

// ── Unified Map ─────────────────────────────────────────────

export const iconMap: Record<IconLibrary, Record<IconName, IconComponent>> = {
  lucide: lucideMap,
  tabler: tablerMap,
  phosphor: phosphorMap,
  hugeicons: hugeiconsMap,
};
