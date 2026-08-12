import { ButtonPlayground } from "./button";
import { CardPlayground } from "./card";
import { InputMessagePlayground } from "./input-message";
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
  button: ButtonPlayground,
  card: CardPlayground,
  "input-message": InputMessagePlayground,
};
