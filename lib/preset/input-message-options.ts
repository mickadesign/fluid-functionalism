// ---------------------------------------------------------------------------
// InputMessage playground state: the single source for the playground rail,
// the code generators (teaching snippet + installable preset), and the preset
// codec. Pure data — no React, safe on the server and in route handlers.
//
// Codec compat rules (same as shadcn's preset codec):
//   1. Never reorder existing value arrays — only append.
//   2. Every field's DEFAULT sits at index 0.
//   3. Only append new fields at the END of INPUT_MESSAGE_PRESET_FIELDS.
//   4. Stay under 53 bits total (JS safe-integer limit).
// tests/preset-input-message.test.mjs enforces 2 and 4 and pins 1/3 with a
// golden.
// ---------------------------------------------------------------------------

import {
  registerPresetComponent,
  encodePreset,
  decodePreset,
  type PresetComponentDef,
  type PresetField,
} from "./codec";
import { DEFAULT_GLOBALS, type PresetGlobals } from "./sidebar-options";

export type { PresetField };

/** The queue section's status control: "off" hides the queue wiring entirely;
 *  "idle"/"streaming" enable it seeded in that status. */
export type InputMessageStatus = "off" | "idle" | "streaming";

export interface InputMessagePlayState {
  // Composer
  /** Tab-fillable ghost placeholder. */
  suggestion: boolean;
  /** Suggested prompts above the composer while it's empty. */
  suggestionsOn: boolean;
  /** ArrowUp recalls sent messages, ArrowDown walks back to the draft. */
  historyOn: boolean;
  /** Pre-fill the composer with sample attachments (enables files wiring). */
  attachments: boolean;
  /** 1–3 in the rail; the codec table is append-only if more are added. */
  minRows: number;
  disabled: boolean;
  // Slots
  /** Attach button before the textarea (enables files wiring too). */
  leftSlot: boolean;
  /** Model-picker button before the send button. */
  rightSlot: boolean;
  // Queue
  status: InputMessageStatus;
}

export type InputMessagePreset = InputMessagePlayState & PresetGlobals;

export const INPUT_MESSAGE_DEFAULT_STATE: InputMessagePlayState = {
  suggestion: true,
  suggestionsOn: true,
  historyOn: true,
  attachments: false,
  minRows: 1,
  disabled: false,
  leftSlot: true,
  rightSlot: false,
  status: "off",
};

export const INPUT_MESSAGE_DEFAULT_PRESET: InputMessagePreset = {
  ...INPUT_MESSAGE_DEFAULT_STATE,
  ...DEFAULT_GLOBALS,
};

// Value arrays are ordered DEFAULT-FIRST. Globals ride at the END with the
// same shapes as the sidebar's, so every playground packs them alike.
export const INPUT_MESSAGE_PRESET_FIELDS: readonly PresetField[] = [
  { key: "suggestion", values: [true, false], bits: 1 },
  { key: "suggestionsOn", values: [true, false], bits: 1 },
  { key: "historyOn", values: [true, false], bits: 1 },
  { key: "attachments", values: [false, true], bits: 1 },
  { key: "minRows", values: [1, 2, 3], bits: 3 },
  { key: "disabled", values: [false, true], bits: 1 },
  { key: "leftSlot", values: [true, false], bits: 1 },
  { key: "rightSlot", values: [false, true], bits: 1 },
  { key: "status", values: ["off", "idle", "streaming"], bits: 3 },
  // ── Site-level globals, appended LAST (same shapes as the sidebar's) ──
  { key: "flavor", values: ["radix", "base"], bits: 3 },
  { key: "shape", values: ["rounded", "pill", "sharp"], bits: 2 },
  { key: "size", values: ["default", "compact"], bits: 2 },
];

// ── Demo content, shared by the playground preview and both generators ──────

export const IM_SUGGESTIONS: string[] = [
  "What is Fluid Functionalism about?",
  "How does Micka tune the springs behind these animations?",
  "Install the InputMessage component in my project",
  "Draft a short thank-you note to Micka for the library",
];

export const IM_PLACEHOLDER_PROMPT = "Why is every other input box so stiff?";

/** The transcript's seed message — read at a glance, and gives ArrowUp
 *  history recall something to recall. */
export const IM_SEED_MESSAGE = "Make my input box feel less stiff";

// ── Registration (tag "m") ──────────────────────────────────────────────────

export const INPUT_MESSAGE_PRESET_DEF: PresetComponentDef = {
  tag: "m",
  label: "InputMessage",
  docsPath: "/docs/input-message",
  versions: { a: INPUT_MESSAGE_PRESET_FIELDS },
  currentVersion: "a",
  defaults: INPUT_MESSAGE_DEFAULT_PRESET as unknown as PresetComponentDef["defaults"],
  installable: true,
};
registerPresetComponent(INPUT_MESSAGE_PRESET_DEF);

export function encodeInputMessagePreset(
  config: Partial<InputMessagePreset>
): string {
  return encodePreset(INPUT_MESSAGE_PRESET_DEF, config);
}

export type InputMessageDecodeResult =
  | { ok: true; preset: InputMessagePreset; version: string }
  | { ok: false; error: string };

export function decodeInputMessagePreset(
  code: string
): InputMessageDecodeResult {
  const res = decodePreset(code);
  if (!res.ok) return res;
  if (res.def.tag !== "m") {
    return {
      ok: false,
      error: `Not an InputMessage preset (tag "${res.def.tag}").`,
    };
  }
  return {
    ok: true,
    preset: res.preset as unknown as InputMessagePreset,
    version: res.version,
  };
}

export const INPUT_MESSAGE_DEFAULT_CODE = encodeInputMessagePreset({});
