export interface ComponentEntry {
  slug: string;
  name: string;
  description: string;
  isNew?: boolean;
  isUpdated?: boolean;
  /** Tailwind bg class overriding the default blue `isNew` / `isUpdated` dot in the sidebar. */
  dotColor?: string;
  gridSize?: "large" | "medium" | "small";
}

export interface SystemEntry {
  slug: string;
  name: string;
  description: string;
  isNew?: boolean;
  isUpdated?: boolean;
  /** Tailwind bg class overriding the default blue `isNew` / `isUpdated` dot in the sidebar. */
  dotColor?: string;
}

export const systemList: SystemEntry[] = [
  { slug: "fluid-hover", name: "Fluid Hover", description: "Hover that never blinks and always follows your cursor to the nearest item.", isNew: true },
  { slug: "motion", name: "Motion", description: "Spring tokens, faster exits, fluid hover, and reflow-free weight animation — the motion rules shared by every component." },
  { slug: "scrollbars", name: "Scrollbars", description: "A scrollbar that stays out of the way but never disappears, over shadcn's scroll-fade baseline — restyled to the shape system, native scroll on touch." },
  { slug: "sizes", name: "Sizes", description: "A two-step size ladder — a 36px default and a 28px compact — shared by buttons, inputs, selects, tabs, and rows." },
  { slug: "surfaces", name: "Surfaces", description: "Eight-level surface and shadow ladder for elevation in light and dark mode." },
];

export const componentList: ComponentEntry[] = [
  { slug: "accordion", name: "Accordion", description: "Collapsible sections with animated expand/collapse and fluid hover in grouped mode.", gridSize: "medium" },
  { slug: "ask-user-questions", name: "AskUserQuestions", description: "Stepped question flow with single/multi-select, optional 'other' input, and skip.", gridSize: "large" },
  { slug: "badge", name: "Badge", description: "Compact label with solid and dot variants, Tailwind color palette, and the two-step size ladder.", gridSize: "small" },
  { slug: "button", name: "Button", description: "Versatile button with variants, sizes, loading state, and icon support.", gridSize: "small" },
  { slug: "card", name: "Card", description: "shadcn's compositional card, dressed in Fluid Functionalism — stacked, inline, and grid layouts, borderless dividers, and 2-D fluid hover.", gridSize: "medium" },
  { slug: "carousel-dots", name: "CarouselDots", description: "Dots for a carousel, static or on autoplay: fluid-hover click areas, and a current pill that fills over each slide.", isNew: true, gridSize: "medium" },
  { slug: "chat-message", name: "ChatMessage", description: "Chat transcript bubble with baked-in motion, user/assistant alignment, and file attachments.", gridSize: "small" },
  { slug: "checkbox-group", name: "CheckboxGroup", description: "Checkbox group with merged backgrounds for contiguous selections.", gridSize: "small" },
  { slug: "color-picker", name: "ColorPicker", description: "Color picker with HEX/RGB/HSL/OKLCH formats, alpha, swatches, and popover trigger.", gridSize: "large" },
  { slug: "combobox", name: "Combobox", description: "Type-to-filter field with keyboard highlight, fluid hover, and a spring-animated list — items are data, rows are yours.", isNew: true, gridSize: "small" },
  { slug: "command-menu", name: "CommandMenu", description: "Type to filter a list of actions, arrow through them, press Enter to run: rows with shortcut caps, groups, suggestions, and a dialog shell on a global shortcut.", isNew: true, gridSize: "large" },
  { slug: "dialog", name: "Dialog", description: "Modal dialog with smooth enter/exit animations and overlay — three widths, the largest a canvas for a sidebar.", isUpdated: true, gridSize: "small" },
  { slug: "dropdown", name: "Dropdown", description: "Menu-style dropdown with fluid hover, animated backgrounds, and an optional search field inside the popup.", isUpdated: true, gridSize: "small" },
  { slug: "input-copy", name: "InputCopy", description: "Read-only input with copy-to-clipboard button and animated feedback.", gridSize: "small" },
  { slug: "input-group", name: "InputGroup", description: "Input field group with fluid hover and validation.", gridSize: "small" },
  { slug: "input-message", name: "InputMessage", description: "Chat-style message composer with auto-resizing textarea and configurable action slots.", gridSize: "medium" },
  { slug: "radio-group", name: "RadioGroup", description: "Radio button group with fluid hover and animated selection.", gridSize: "small" },
  { slug: "select", name: "Select", description: "Animated select menu with bordered/borderless variants and optional icons.", gridSize: "small" },
  { slug: "sidebar", name: "Sidebar", description: "Refined, composable sidebar with offcanvas collapse, a drag-resize rail, and a mobile drawer.", isNew: true, gridSize: "large" },
  { slug: "slider", name: "Slider", description: "One slider, two ladder steps: the default pip/scrubber design and the compact design with range mode and value display.", gridSize: "small" },
  { slug: "switch", name: "Switch", description: "Toggle switch with animated thumb and label.", gridSize: "small" },
  { slug: "table", name: "Table", description: "Data table with row hover effects and semantic markup.", gridSize: "medium" },
  { slug: "tabs", name: "Tabs", description: "Segmented control with sliding indicator and fluid hover.", gridSize: "medium" },
  { slug: "tabs-subtle", name: "TabsSubtle", description: "Tab navigation with smooth pill animations.", gridSize: "small" },
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
