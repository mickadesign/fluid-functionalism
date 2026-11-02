import { AccordionPlayground } from "./accordion";
import { AskUserQuestionsPlayground } from "./ask-user-questions";
import { BannerPlayground } from "./banner";
import { ButtonPlayground } from "./button";
import { CalendarPlayground } from "./calendar";
import { CardPlayground } from "./card";
import { ComboboxPlayground } from "./combobox";
import { CommandMenuPlayground } from "./command-menu";
import { DatePickerPlayground } from "./date-picker";
import { DropdownPlayground } from "./dropdown";
import { InputMessagePlayground } from "./input-message";
import { SidebarPlayground } from "./sidebar";
import type { PlaygroundComponent } from "./types";

export type { PlaygroundParts, PlaygroundProps, PlaygroundComponent } from "./types";

// ---------------------------------------------------------------------------
// The scalable rule: one entry per component slug. Registering a playground
// here means
//   1. its doc page renders the shared module (preview + rail controls), and
//   2. its /demo slide automatically swaps to the playground-driven preview
//      and gains the pen menu that opens the same controls in a popover.
// To add one: create lib/docs/playgrounds/<slug>.tsx following the
// PlaygroundProps render-prop contract, register it below, and compose it in
// the doc page's Playground section.
// ---------------------------------------------------------------------------

export const playgroundMap: Record<string, PlaygroundComponent> = {
  accordion: AccordionPlayground,
  "ask-user-questions": AskUserQuestionsPlayground,
  banner: BannerPlayground,
  button: ButtonPlayground,
  calendar: CalendarPlayground,
  card: CardPlayground,
  combobox: ComboboxPlayground,
  "command-menu": CommandMenuPlayground,
  "date-picker": DatePickerPlayground,
  dropdown: DropdownPlayground,
  "input-message": InputMessagePlayground,
  sidebar: SidebarPlayground,
};
