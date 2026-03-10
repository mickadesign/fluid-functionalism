export interface ComponentEntry {
  slug: string;
  name: string;
  description: string;
}

export const componentList: ComponentEntry[] = [
  { slug: "accordion", name: "Accordion", description: "Collapsible sections with animated expand/collapse and proximity hover in grouped mode." },
  { slug: "badge", name: "Badge", description: "Compact label with solid and dot variants, Tailwind color palette, and three sizes." },
  { slug: "button", name: "Button", description: "Versatile button with variants, sizes, loading state, and icon support." },
  { slug: "checkbox-group", name: "CheckboxGroup", description: "Checkbox group with merged backgrounds for contiguous selections." },
  { slug: "dialog", name: "Dialog", description: "Modal dialog with smooth enter/exit animations and overlay." },
  { slug: "dropdown", name: "Dropdown", description: "Menu-style dropdown with proximity hover and animated backgrounds." },
  { slug: "input-group", name: "InputGroup", description: "Input field group with proximity hover and validation." },
  { slug: "radio-group", name: "RadioGroup", description: "Radio button group with proximity hover and animated selection." },
  { slug: "subtle-tab", name: "SubtleTab", description: "Tab navigation with smooth pill animations." },
  { slug: "select", name: "Select", description: "Animated select menu with bordered/borderless variants and optional icons." },
  { slug: "slider", name: "Slider", description: "Range slider with step snapping, range mode, and animated thumb." },
  { slug: "switch", name: "Switch", description: "Toggle switch with animated thumb and label." },
  { slug: "table", name: "Table", description: "Data table with row hover effects and semantic markup." },
  { slug: "thinking-indicator", name: "ThinkingIndicator", description: "Animated status indicator with morphing SVG and cycling text." },
  { slug: "tooltip", name: "Tooltip", description: "Floating tooltip with spring-based animations and configurable placement." },
];
