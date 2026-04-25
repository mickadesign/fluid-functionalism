export interface ComponentEntry {
  slug: string;
  name: string;
  description: string;
  isNew?: boolean;
  gridSize?: "large" | "medium" | "small";
}

export const componentList: ComponentEntry[] = [
  { slug: "accordion", name: "Accordion", description: "Collapsible sections with animated expand/collapse and proximity hover in grouped mode.", gridSize: "large" },
  { slug: "badge", name: "Badge", description: "Compact label with solid and dot variants, Tailwind color palette, and three sizes.", gridSize: "small" },
  { slug: "button", name: "Button", description: "Versatile button with variants, sizes, loading state, and icon support.", gridSize: "small" },
  { slug: "checkbox-group", name: "CheckboxGroup", description: "Checkbox group with merged backgrounds for contiguous selections.", gridSize: "small" },
  { slug: "color-picker", name: "ColorPicker", description: "Color picker with HEX/RGB/HSL/OKLCH formats, alpha, swatches, and popover trigger.", isNew: true, gridSize: "medium" },
  { slug: "dialog", name: "Dialog", description: "Modal dialog with smooth enter/exit animations and overlay.", gridSize: "small" },
  { slug: "dropdown", name: "Dropdown", description: "Menu-style dropdown with proximity hover and animated backgrounds.", gridSize: "medium" },
  { slug: "input-copy", name: "InputCopy", description: "Read-only input with copy-to-clipboard button and animated feedback.", isNew: true, gridSize: "small" },
  { slug: "input-group", name: "InputGroup", description: "Input field group with proximity hover and validation.", gridSize: "medium" },
  { slug: "radio-group", name: "RadioGroup", description: "Radio button group with proximity hover and animated selection.", gridSize: "small" },
  { slug: "select", name: "Select", description: "Animated select menu with bordered/borderless variants and optional icons.", gridSize: "medium" },
  { slug: "slider", name: "Slider", description: "Range slider with step snapping, range mode, and animated thumb.", gridSize: "medium" },
  { slug: "switch", name: "Switch", description: "Toggle switch with animated thumb and label.", gridSize: "small" },
  { slug: "table", name: "Table", description: "Data table with row hover effects and semantic markup.", gridSize: "large" },
  { slug: "tabs", name: "Tabs", description: "Segmented control with sliding indicator and proximity hover.", isNew: true, gridSize: "medium" },
  { slug: "tabs-subtle", name: "TabsSubtle", description: "Tab navigation with smooth pill animations.", gridSize: "medium" },
  { slug: "thinking-indicator", name: "ThinkingIndicator", description: "Animated status indicator with morphing SVG and cycling text.", gridSize: "small" },
  { slug: "thinking-steps", name: "ThinkingSteps", description: "Chain-of-thought display with sequential animation and collapsible steps.", isNew: true, gridSize: "large" },
  { slug: "tooltip", name: "Tooltip", description: "Floating tooltip with spring-based animations and configurable placement.", gridSize: "small" },
];
