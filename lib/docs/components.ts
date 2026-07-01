export interface ComponentEntry {
  slug: string;
  name: string;
  description: string;
  isNew?: boolean;
  isUpdated?: boolean;
  /** Tailwind bg class overriding the default blue `isNew` dot in the sidebar. */
  dotColor?: string;
  gridSize?: "large" | "medium" | "small";
}

export interface SystemEntry {
  slug: string;
  name: string;
  description: string;
  isNew?: boolean;
  isUpdated?: boolean;
}

export const systemList: SystemEntry[] = [
  { slug: "surfaces", name: "Surfaces", description: "Eight-level surface and shadow ladder for elevation in light and dark mode.", isNew: true },
  { slug: "scrollbars", name: "Scrollbars", description: "A scrollbar that stays out of the way but never disappears, over shadcn's scroll-fade baseline — restyled to the shape system, native scroll on touch.", isNew: true },
  { slug: "motion", name: "Motion", description: "Spring tokens, faster exits, and reflow-free weight animation — the motion rules shared by every component.", isNew: true },
];

export const componentList: ComponentEntry[] = [
  { slug: "accordion", name: "Accordion", description: "Collapsible sections with animated expand/collapse and proximity hover in grouped mode.", gridSize: "large" },
  { slug: "ask-user-questions", name: "AskUserQuestions", description: "Stepped question flow with single/multi-select, optional 'other' input, and skip.", isNew: true, gridSize: "large" },
  { slug: "badge", name: "Badge", description: "Compact label with solid and dot variants, Tailwind color palette, and three sizes.", gridSize: "small" },
  { slug: "button", name: "Button", description: "Versatile button with variants, sizes, loading state, and icon support.", gridSize: "small" },
  { slug: "chat-message", name: "ChatMessage", description: "Chat transcript bubble with baked-in motion, user/assistant alignment, and file attachments.", isNew: true, gridSize: "small" },
  { slug: "checkbox-group", name: "CheckboxGroup", description: "Checkbox group with merged backgrounds for contiguous selections.", gridSize: "small" },
  { slug: "color-picker", name: "ColorPicker", description: "Color picker with HEX/RGB/HSL/OKLCH formats, alpha, swatches, and popover trigger.", gridSize: "large" },
  { slug: "dialog", name: "Dialog", description: "Modal dialog with smooth enter/exit animations and overlay.", gridSize: "small" },
  { slug: "dropdown", name: "Dropdown", description: "Menu-style dropdown with proximity hover and animated backgrounds.", gridSize: "medium" },
  { slug: "input-copy", name: "InputCopy", description: "Read-only input with copy-to-clipboard button and animated feedback.", gridSize: "small" },
  { slug: "input-group", name: "InputGroup", description: "Input field group with proximity hover and validation.", gridSize: "small" },
  { slug: "input-message", name: "InputMessage", description: "Chat-style message composer with auto-resizing textarea and configurable action slots.", isUpdated: true, gridSize: "medium" },
  { slug: "radio-group", name: "RadioGroup", description: "Radio button group with proximity hover and animated selection.", gridSize: "small" },
  { slug: "select", name: "Select", description: "Animated select menu with bordered/borderless variants and optional icons.", gridSize: "medium" },
  { slug: "slider", name: "Slider", description: "Range slider with step snapping, range mode, and animated thumb.", gridSize: "medium" },
  { slug: "switch", name: "Switch", description: "Toggle switch with animated thumb and label.", gridSize: "small" },
  { slug: "table", name: "Table", description: "Data table with row hover effects and semantic markup.", gridSize: "large" },
  { slug: "tabs", name: "Tabs", description: "Segmented control with sliding indicator and proximity hover.", gridSize: "medium" },
  { slug: "tabs-subtle", name: "TabsSubtle", description: "Tab navigation with smooth pill animations.", gridSize: "medium" },
  { slug: "thinking-indicator", name: "ThinkingIndicator", description: "Animated status indicator with morphing SVG and cycling text.", gridSize: "small" },
  { slug: "thinking-steps", name: "ThinkingSteps", description: "Chain-of-thought display with sequential animation and collapsible steps.", gridSize: "large" },
  { slug: "tooltip", name: "Tooltip", description: "Floating tooltip with spring-based animations and configurable placement.", gridSize: "small" },
];

/** Combined prev/next navigation order for doc pages.
 *  Used by DocPage's arrow nav. Keep in sync with the sidebar order in
 *  `app/components/sidebar.tsx` (Introduction → systemList → componentList). */
export const docOrder: Array<{ slug: string; name: string }> = [
  ...systemList.map((s) => ({ slug: s.slug, name: s.name })),
  ...componentList.map((c) => ({ slug: c.slug, name: c.name })),
];
