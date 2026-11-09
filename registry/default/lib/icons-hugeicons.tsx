"use client";

// ---------------------------------------------------------------------------
// HugeIcons glyphs for every slot the components look up (see icon-context).
// Pass the map to IconProvider and every component draws them:
//
//   <IconProvider icons={hugeiconsIcons}>{children}</IconProvider>
//
// Each adapter maps the shared props (size, strokeWidth, className) onto
// what HugeIcons takes. The free set has no bare play/pause pair, so those
// two slots keep Lucide's.
// ---------------------------------------------------------------------------

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
import HiSquare from "@hugeicons/core-free-icons/SquareIcon";
import HiLibrary from "@hugeicons/core-free-icons/LibraryIcon";
import HiClock from "@hugeicons/core-free-icons/Clock01Icon";
import HiStar from "@hugeicons/core-free-icons/StarIcon";
import HiSettings from "@hugeicons/core-free-icons/Settings01Icon";
import HiPlus from "@hugeicons/core-free-icons/PlusSignIcon";
import HiArrowLeft from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import HiArrowRight from "@hugeicons/core-free-icons/ArrowRight01Icon";
import HiArrowUp from "@hugeicons/core-free-icons/ArrowUp01Icon";
import HiArrowDown from "@hugeicons/core-free-icons/ArrowDown01Icon";
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
import HiScaling from "@hugeicons/core-free-icons/Resize01Icon";
import HiSkipForward from "@hugeicons/core-free-icons/NextIcon";
import HiCornerDownRight from "@hugeicons/core-free-icons/ArrowMoveDownRightIcon";
import HiCornerDownLeft from "@hugeicons/core-free-icons/ArrowMoveDownLeftIcon";
import HiPanelLeft from "@hugeicons/core-free-icons/SidebarLeft01Icon";
import HiPanelRight from "@hugeicons/core-free-icons/SidebarRight01Icon";
import HiChevronsUpDown from "@hugeicons/core-free-icons/UnfoldMoreIcon";
import HiMoreHorizontal from "@hugeicons/core-free-icons/MoreHorizontalIcon";
import HiMoreVertical from "@hugeicons/core-free-icons/MoreVerticalIcon";
import HiCalendar from "@hugeicons/core-free-icons/Calendar01Icon";
import HiFolder from "@hugeicons/core-free-icons/Folder01Icon";
import HiSliders from "@hugeicons/core-free-icons/SlidersHorizontalIcon";
import HiInfo from "@hugeicons/core-free-icons/InformationCircleIcon";
import HiAlertCircle from "@hugeicons/core-free-icons/AlertCircleIcon";
import HiFile from "@hugeicons/core-free-icons/File01Icon";
import HiMinus from "@hugeicons/core-free-icons/MinusSignIcon";
import HiMaximize from "@hugeicons/core-free-icons/ArrowExpand01Icon";
import HiMinimize from "@hugeicons/core-free-icons/ArrowShrink02Icon";
import HiGripVertical from "@hugeicons/core-free-icons/DragDropVerticalIcon";
import HiTag from "@hugeicons/core-free-icons/Tag01Icon";
import { Play, Pause } from "lucide-react";
import type { IconComponent, IconComponentProps, IconName } from "@/lib/icon-context";

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

export const hugeiconsIcons: Record<IconName, IconComponent> = {
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
  "square": hugeicons(HiSquare),
  "square-library": hugeicons(HiLibrary),
  "clock": hugeicons(HiClock),
  "star": hugeicons(HiStar),
  "settings": hugeicons(HiSettings),
  "plus": hugeicons(HiPlus),
  "arrow-left": hugeicons(HiArrowLeft),
  "arrow-right": hugeicons(HiArrowRight),
  "arrow-up": hugeicons(HiArrowUp),
  "arrow-down": hugeicons(HiArrowDown),
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
  "scaling": hugeicons(HiScaling),
  "skip-forward": hugeicons(HiSkipForward),
  "corner-down-right": hugeicons(HiCornerDownRight),
  "corner-down-left": hugeicons(HiCornerDownLeft),
  "panel-left": hugeicons(HiPanelLeft),
  "panel-right": hugeicons(HiPanelRight),
  "chevrons-up-down": hugeicons(HiChevronsUpDown),
  "more-horizontal": hugeicons(HiMoreHorizontal),
  "more-vertical": hugeicons(HiMoreVertical),
  "calendar": hugeicons(HiCalendar),
  "folder": hugeicons(HiFolder),
  "sliders-horizontal": hugeicons(HiSliders),
  "info": hugeicons(HiInfo),
  "circle-alert": hugeicons(HiAlertCircle),
  "file": hugeicons(HiFile),
  "minus": hugeicons(HiMinus),
  "maximize": hugeicons(HiMaximize),
  "minimize": hugeicons(HiMinimize),
  "grip-vertical": hugeicons(HiGripVertical),
  tag: hugeicons(HiTag),
};
