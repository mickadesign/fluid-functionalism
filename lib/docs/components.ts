export interface ComponentEntry {
  slug: string;
  name: string;
  description: string;
  gridSize?: "large" | "medium" | "small";
}

export interface SystemEntry {
  slug: string;
  name: string;
  description: string;
  /** Registry item the page's install advertises, when it isn't the slug
   *  (the Motion page installs `springs`). */
  installSlug?: string;
  /** What the install adds, shown under the Installation title in place of
   *  the flavor note, and in the page's Markdown. */
  installNote?: string;
}

export const systemList: SystemEntry[] = [
  { slug: "fluid-hover", name: "Fluid Hover", description: "Hover that glides from item to item under your cursor instead of blinking between them.", installSlug: "use-fluid-hover", installNote: "The useFluidHover hook and its highlight, already in every list and menu." },
  { slug: "motion", name: "Motion", description: "Spring tokens, faster exits, fluid hover, and reflow-free weight animation — the motion rules shared by every component.", installSlug: "springs", installNote: "Installs the springs lib — the fast / moderate / slow spring presets every component animates with." },
  { slug: "reveal", name: "Reveal", description: "1 class reveals a whole page, on load and on scroll.", installNote: "Installs the 4 preset classes, reveal-landing, reveal-product, and their -subtle steps, plus shadcn's Skeleton for slow data." },
  { slug: "scrollbars", name: "Scrollbars", description: "A scrollbar that stays out of the way but never disappears, over shadcn's scroll-fade baseline — restyled to the shape system, native scroll on touch.", installSlug: "scroll-area", installNote: "Installs the ScrollArea component with the shape-system scrollbar and the scroll-fade edge treatment." },
  { slug: "sizes", name: "Sizes", description: "A two-step size ladder — a 36px default and a 28px compact — shared by buttons, inputs, selects, tabs, and rows.", installSlug: "size-context", installNote: "Installs the size-context lib: SizeProvider, the useSize and useTypeScale hooks, the token maps behind both steps, and the type-scale tokens." },
  { slug: "surfaces", name: "Surfaces", description: "Eight-level surface and shadow ladder for elevation in light and dark mode.", installSlug: "elevated", installNote: "Installs the Elevated primitive plus the surface-context and surface-classes libs — the elevation ladder as code." },
  { slug: "typography", name: "Typography", description: "Bold rules that create consistency across the whole component library.", installSlug: "typography", installNote: "The 5 styles for any text, markdown included." },
];

/** Every component doc page, listed or not: for lookups by slug (page
 *  metadata, install prompts, the page's own Markdown). */
export const componentEntries: ComponentEntry[] = [
  { slug: "accordion", name: "Accordion", description: "Collapsible sections with animated expand/collapse and fluid hover in grouped mode.", gridSize: "medium" },
  { slug: "ask-user-questions", name: "AskUserQuestions", description: "Stepped question flow with single/multi-select, optional 'other' input, and skip.", gridSize: "large" },
  { slug: "badge", name: "Badge", description: "Compact label with solid, dot, and ghost variants, Tailwind color palette, and the two-step size ladder.", gridSize: "small" },
  { slug: "banner", name: "Banner", description: "Status message in 5 statuses and 2 contrasts: a status icon, a title, up to 3 actions, and a dismiss that collapses its height. Inline, or fixed full-bleed at the top of the page.", gridSize: "medium" },
  { slug: "breadcrumb", name: "Breadcrumb", description: "A trail of links to the current page: one fluid hover across every crumb, icons, a Dropdown on a step, and a collapsed middle.", gridSize: "small" },
  { slug: "button", name: "Button", description: "Versatile button with variants, sizes, loading state, and icon support.", gridSize: "small" },
  { slug: "calendar", name: "Calendar", description: "Month grid for a day or a range: one fluid hover across both months, a range band that follows the pointer, booked and unavailable days, and week numbers.", gridSize: "medium" },
  { slug: "card", name: "Card", description: "shadcn's compositional card, dressed in Fluid Functionalism — stacked, inline, and grid layouts, borderless dividers, and 2-D fluid hover.", gridSize: "medium" },
  { slug: "carousel-dots", name: "CarouselDots", description: "Dots for a carousel, static or on autoplay: fluid-hover click areas, and a current pill that fills over each slide.", gridSize: "large" },
  { slug: "chat-message", name: "ChatMessage", description: "Chat transcript bubble with baked-in motion, user/assistant alignment, and file attachments.", gridSize: "small" },
  { slug: "checkbox", name: "Checkbox", description: "A single checkbox: a hairline square that darkens on hover and a check that draws itself.", gridSize: "small" },
  { slug: "checkbox-group", name: "CheckboxGroup", description: "Checkbox group with merged backgrounds for contiguous selections.", gridSize: "small" },
  { slug: "color-picker", name: "ColorPicker", description: "Color picker with HEX/RGB/HSL/OKLCH formats, alpha, swatches, and popover trigger.", gridSize: "large" },
  { slug: "combobox", name: "Combobox", description: "Type-to-filter field with keyboard highlight, fluid hover, and a spring-animated list — items are data, rows are yours.", gridSize: "small" },
  { slug: "command-menu", name: "CommandMenu", description: "Type to filter a list of actions, arrow through them, press Enter to run: rows with shortcut caps, groups, suggestions, and a dialog shell on a global shortcut.", gridSize: "large" },
  { slug: "context-menu", name: "ContextMenu", description: "The Dropdown, opened where you right-click: the same items, submenus and keys, in both flavors.", gridSize: "small" },
  { slug: "data-table", name: "DataTable", description: "A table you can sort, search, select from and edit in place. Turn on only the parts you need.", gridSize: "large" },
  { slug: "date-picker", name: "DatePicker", description: "Outline or ghost trigger for a date, a range, or a date and a time: a calendar popover with presets, and time slot lists that show each duration.", gridSize: "small" },
  { slug: "dialog", name: "Dialog", description: "Modal dialog with smooth enter/exit animations and overlay — three widths, the largest a canvas for a sidebar.", gridSize: "small" },
  { slug: "dropdown", name: "Dropdown", description: "Menu-style dropdown with fluid hover, animated backgrounds, and an optional search field inside the popup.", gridSize: "small" },
  { slug: "field", name: "Field", description: "Labels, controls, help text, and errors composed into accessible form fields.", gridSize: "small" },
  { slug: "input", name: "Input", description: "A single-line text field in the Select trigger's hairline, with a neutral focus border.", gridSize: "small" },
  { slug: "input-copy", name: "InputCopy", description: "Read-only input with copy-to-clipboard button and animated feedback.", gridSize: "small" },
  { slug: "input-group", name: "InputGroup", description: "Input field group with fluid hover and validation.", gridSize: "small" },
  { slug: "input-message", name: "InputMessage", description: "Chat-style message composer with auto-resizing textarea and configurable action slots.", gridSize: "medium" },
  { slug: "radio-group", name: "RadioGroup", description: "Radio button group with fluid hover and animated selection.", gridSize: "small" },
  { slug: "select", name: "Select", description: "Animated select menu with bordered/borderless variants and optional icons.", gridSize: "small" },
  { slug: "sidebar", name: "Sidebar", description: "Refined, composable sidebar with offcanvas collapse, a drag-resize rail, and a mobile drawer.", gridSize: "large" },
  { slug: "slider", name: "Slider", description: "One slider, two ladder steps: the default pip/scrubber design and the compact design with range mode and value display.", gridSize: "small" },
  { slug: "switch", name: "Switch", description: "Toggle switch with animated thumb and label.", gridSize: "small" },
  { slug: "table", name: "Table", description: "Data table with row hover effects and semantic markup.", gridSize: "small" },
  { slug: "tabs", name: "Tabs", description: "Tab navigation with smooth pill animations.", gridSize: "small" },
  { slug: "textarea", name: "Textarea", description: "A multi-line text field with the Input's hairline that grows with its content.", gridSize: "small" },
  { slug: "thinking-indicator", name: "ThinkingIndicator", description: "Animated status indicator with morphing SVG and cycling text.", gridSize: "small" },
  { slug: "thinking-steps", name: "ThinkingSteps", description: "Chain-of-thought display with sequential animation and collapsible steps.", gridSize: "large" },
  { slug: "tooltip", name: "Tooltip", description: "Floating tooltip with spring-based animations and configurable placement.", gridSize: "small" },
];

/** Pages live at their URL but listed nowhere yet, so a link can go to a
 *  few people before the launch: not in the sidebar, ⌘K, the Showcase,
 *  /demo, prev/next, the changelog marks, the sitemap, llms.txt or the
 *  README, and noindex. Delete a slug here to launch it. */
export const UNLISTED_SLUGS: ReadonlySet<string> = new Set(["context-menu", "data-table"]);

/** The listed components: what navigation, search and indexes show. */
export const componentList: ComponentEntry[] = componentEntries.filter((c) => !UNLISTED_SLUGS.has(c.slug));

/** The skill page. It sits with the systems in navigation but stays out of
 *  `systemList`: it is not a registry item, and `systemList` feeds the
 *  README's install table and the install prompts. */
export const skillEntry: SystemEntry = {
  slug: "skill",
  name: "Skill",
  description: "Gives your coding agent the components and the craft behind them, then puts both to work on your project.",
};

/** The sidebar's System group, in its order: the systems plus the skill
 *  page, alphabetical like the rest of the list. */
export const systemNavList: SystemEntry[] = [...systemList, skillEntry].sort((a, b) =>
  a.name.localeCompare(b.name)
);

/** Combined prev/next navigation order for doc pages.
 *  Used by DocPage's arrow nav. Keep in sync with the sidebar order in
 *  `app/components/sidebar.tsx` (Introduction → Changelog → systemNavList → componentList). */
export const docOrder: Array<{ slug: string; name: string }> = [
  ...systemNavList.map((s) => ({ slug: s.slug, name: s.name })),
  ...componentList.map((c) => ({ slug: c.slug, name: c.name })),
];
