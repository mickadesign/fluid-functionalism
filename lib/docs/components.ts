export interface ComponentEntry {
  slug: string;
  name: string;
  description: string;
}

export const componentList: ComponentEntry[] = [
  { slug: "button", name: "Button", description: "Versatile button with variants, sizes, loading state, and icon support." },
  { slug: "checkbox-group", name: "CheckboxGroup", description: "Checkbox group with merged backgrounds for contiguous selections." },
  { slug: "dialog", name: "Dialog", description: "Modal dialog with smooth enter/exit animations and overlay." },
  { slug: "dropdown", name: "Dropdown", description: "Menu-style dropdown with proximity hover and animated backgrounds." },
  { slug: "input-group", name: "InputGroup", description: "Input field group with proximity hover and validation." },
  { slug: "radio-group", name: "RadioGroup", description: "Radio button group with proximity hover and animated selection." },
  { slug: "subtle-tab", name: "SubtleTab", description: "Tab navigation with smooth pill animations." },
  { slug: "switch", name: "Switch", description: "Toggle switch with animated thumb and label." },
  { slug: "table", name: "Table", description: "Data table with row hover effects and semantic markup." },
  { slug: "thinking-indicator", name: "ThinkingIndicator", description: "Animated status indicator with morphing SVG and cycling text." },
];
