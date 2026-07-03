import type { IconName } from "@/lib/icon-map";

/**
 * Shared demo content for the component previews.
 *
 * The home-page bento cards (`bento-previews.tsx`), the shadcn originals on
 * /compare (`shadcn-previews.tsx`), and the /compare Fluid overrides
 * (`compare-fluid-previews.tsx`) all render the SAME copy so the side-by-side
 * comparison stays honest. Edit content here, once — the preview files only
 * own structure and styling.
 *
 * Where the two libraries name variants differently, entries carry both
 * (e.g. `variant` for Fluid Functionalism, `shadcnVariant` for shadcn/ui).
 */

export const ACCORDION_ITEMS = [
  {
    value: "item-1",
    title: "What is Fluid Functionalism?",
    content:
      "A design philosophy where every animation serves a functional purpose — motion is information, not decoration.",
  },
  {
    value: "item-2",
    title: "How does proximity hover work?",
    content:
      "The closest item to your cursor is highlighted before you click, reducing targeting errors.",
  },
  {
    value: "item-3",
    title: "Why spring physics?",
    content:
      "Springs respond naturally to interruption — if a user reverses mid-transition, the animation adapts.",
  },
  {
    value: "item-4",
    title: "Is it compatible with shadcn/ui?",
    content:
      "Yes. Your existing theme, radius tokens, and setup apply automatically.",
  },
  {
    value: "item-5",
    title: "How do I install a component?",
    content:
      "One CLI command — dependencies and shared utilities resolve themselves.",
  },
] as const;

export const BADGE_ITEMS = [
  { label: "Published", color: "blue", shadcnVariant: "default" },
  { label: "Active", color: "green", shadcnVariant: "secondary" },
  { label: "Declined", color: "red", shadcnVariant: "destructive" },
] as const;

export const BUTTON_ITEMS = [
  { label: "Primary", variant: "primary", shadcnVariant: "default" },
  { label: "Secondary", variant: "secondary", shadcnVariant: "secondary" },
  { label: "Tertiary", variant: "tertiary", shadcnVariant: "outline" },
  { label: "Ghost", variant: "ghost", shadcnVariant: "ghost" },
] as const;

export const CHECKBOX_ITEMS = [
  { id: "spring", label: "Spring physics" },
  { id: "proximity", label: "Proximity hover" },
  { id: "weight", label: "Font weight transitions" },
  { id: "kbd", label: "Keyboard navigation" },
  { id: "dark", label: "Dark mode support" },
] as const;

export const DIALOG_COPY = {
  trigger: "Open Dialog",
  title: "Create teamspace",
  description: "Add a new teamspace to organize your projects.",
  cancel: "Cancel",
  confirm: "Create",
} as const;

export const DROPDOWN_ITEMS: readonly {
  value: string;
  icon: IconName;
  label: string;
}[] = [
  { value: "spring", icon: "circle", label: "Spring animations" },
  { value: "proximity", icon: "star", label: "Proximity hover" },
  { value: "weight", icon: "plus", label: "Font weight shifts" },
  { value: "a11y", icon: "heart", label: "Accessible by default" },
  { value: "primitives", icon: "check", label: "Radix or Base UI" },
  { value: "clarity", icon: "brain", label: "Functional clarity" },
];

export const INPUT_FIELDS: readonly {
  key: string;
  label: string;
  placeholder: string;
  icon: IconName;
}[] = [
  { key: "name", label: "Name", placeholder: "Your name", icon: "user" },
  { key: "email", label: "Email", placeholder: "you@example.com", icon: "mail" },
  {
    key: "website",
    label: "Website",
    placeholder: "fluidfunctionalism.com",
    icon: "globe",
  },
];

export const RADIO_ITEMS = [
  { value: "fast", label: "Fast spring" },
  { value: "moderate", label: "Moderate spring" },
  { value: "slow", label: "Slow spring" },
  { value: "comfortable", label: "Comfortable" },
  { value: "none", label: "No animation" },
] as const;

export const RADIO_DEFAULT = "moderate";

export const SELECT_PLACEHOLDER = "Select role...";
export const SELECT_ROLES = ["Owner", "Editor", "Viewer", "Guest"] as const;
export const SELECT_DEFAULT = "Viewer";

export const SLIDER_OPACITY = { label: "Opacity", initial: 35 } as const;
export const SLIDER_VOLUME = { label: "Volume", initial: 60 } as const;

export const SWITCH_ITEMS = [
  { id: "notifications", label: "Notifications", initial: true },
  { id: "sound", label: "Sound effects", initial: false },
] as const;

export const TABLE_COLUMNS = ["Name", "Role", "Status"] as const;
export const TABLE_ROWS = [
  ["Alice", "Engineer", "Active"],
  ["Bob", "Designer", "Away"],
  ["Carol", "PM", "Active"],
  ["Dan", "Engineer", "Offline"],
] as const;

export const TABS_ITEMS = [
  { value: "overview", label: "Overview" },
  { value: "analytics", label: "Analytics" },
  { value: "settings", label: "Settings" },
  { value: "logs", label: "Logs" },
] as const;

export const TABS_DEFAULT = "overview";

export const TOOLTIP_COPY = {
  trigger: "Hover me",
  content: "Copy to clipboard",
} as const;
