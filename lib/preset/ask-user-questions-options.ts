// ---------------------------------------------------------------------------
// AskUserQuestions preset (tag "q") — installable. Question data and the
// shared literal emitter live here so the playground's Code tab and the
// install generator can never drift.
//
// Same codec compat rules as every component: append-only value arrays,
// defaults at index 0, only append fields, under 53 bits.
// ---------------------------------------------------------------------------

import {
  registerPresetComponent,
  encodePreset,
  decodePreset,
  type PresetComponentDef,
  type PresetField,
} from "./codec";
import { DEFAULT_GLOBALS, type PresetGlobals } from "./sidebar-options";

export interface AskUserQuestionsPlayState {
  type: "options" | "freeText";
  layout: "inline" | "stacked";
  chip: "right" | "left";
  multiSelect: boolean;
  allowOther: boolean;
  multiline: boolean;
  count: 1 | 2 | 3;
  skippable: boolean;
}

export type AskUserQuestionsPreset = AskUserQuestionsPlayState & PresetGlobals;

export const DEFAULT_AUQ_STATE: AskUserQuestionsPlayState = {
  type: "options",
  layout: "inline",
  chip: "right",
  multiSelect: false,
  allowOther: false,
  multiline: true,
  count: 3,
  skippable: true,
};

export const DEFAULT_AUQ_PRESET: AskUserQuestionsPreset = {
  ...DEFAULT_AUQ_STATE,
  ...DEFAULT_GLOBALS,
};

// Defaults-first ordering (count [3, 1, 2]). The globals were APPENDED when
// the preset became installable — older codes decode with default globals.
export const AUQ_PRESET_FIELDS: readonly PresetField[] = [
  { key: "type", values: ["options", "freeText"], bits: 2 },
  { key: "layout", values: ["inline", "stacked"], bits: 2 },
  { key: "chip", values: ["right", "left"], bits: 1 },
  { key: "multiSelect", values: [false, true], bits: 1 },
  { key: "allowOther", values: [false, true], bits: 1 },
  { key: "multiline", values: [true, false], bits: 1 },
  { key: "count", values: [3, 1, 2], bits: 3 },
  { key: "skippable", values: [true, false], bits: 1 },
  { key: "flavor", values: ["radix", "base"], bits: 3 },
  { key: "shape", values: ["rounded", "pill", "sharp"], bits: 2 },
  { key: "size", values: ["default", "compact"], bits: 2 },
];

export const AUQ_PRESET_DEF: PresetComponentDef = {
  tag: "q",
  label: "AskUserQuestions",
  docsPath: "/docs/ask-user-questions",
  versions: { a: AUQ_PRESET_FIELDS },
  currentVersion: "a",
  defaults: DEFAULT_AUQ_PRESET as unknown as PresetComponentDef["defaults"],
  installable: true,
};
registerPresetComponent(AUQ_PRESET_DEF);

export function encodeAuqPreset(
  config: Partial<AskUserQuestionsPreset>
): string {
  return encodePreset(AUQ_PRESET_DEF, config);
}

export type AuqDecodeResult =
  | { ok: true; preset: AskUserQuestionsPreset; version: string }
  | { ok: false; error: string };

export function decodeAuqPreset(code: string): AuqDecodeResult {
  const res = decodePreset(code);
  if (!res.ok) return res;
  if (res.def.tag !== "q") {
    return { ok: false, error: `Not an AskUserQuestions preset (tag "${res.def.tag}").` };
  }
  return {
    ok: true,
    preset: res.preset as unknown as AskUserQuestionsPreset,
    version: res.version,
  };
}

export const AUQ_DEFAULT_CODE = encodeAuqPreset({});

// ── Question data + literal emitter (shared by Code tab and installer) ─────

// Each option carries a short description for the inline layout and a longer
// one for stacked, where descriptions get their own line and room to breathe.
export const AUQ_OPTION_QUESTIONS = [
  {
    id: "role",
    title: "How do you plan to use Fluid Functionalism?",
    options: [
      {
        id: "design",
        title: "Designer",
        short: "Prototyping flows and pages",
        long: "Prototyping flows and pages fast, then handing the patterns to the team.",
      },
      {
        id: "eng",
        title: "Engineer",
        short: "Shipping production UI",
        long: "Shipping production UI with springs and tokens instead of hand-rolled CSS.",
      },
      {
        id: "pm",
        title: "PM",
        short: "Aligning the team on patterns",
        long: "Aligning the team on one set of interaction patterns everyone can point to.",
      },
      {
        id: "founder",
        title: "Founder",
        short: "Bootstrapping a product",
        long: "Bootstrapping a product that needs to look credible from day one.",
      },
    ],
  },
  {
    id: "drew",
    title: "What drew you to Fluid Functionalism?",
    options: [
      {
        id: "motion",
        title: "Motion",
        short: "Springs that feel alive",
        long: "Spring-driven motion that feels alive instead of scripted.",
      },
      {
        id: "craft",
        title: "Craft",
        short: "Pixel-level polish",
        long: "Pixel-level polish across typography, spacing, and focus states.",
      },
      {
        id: "tokens",
        title: "Tokens",
        short: "Shape and elevation systems",
        long: "Shape and elevation systems that compose beyond single components.",
      },
    ],
  },
  {
    id: "recommend",
    title: "Would you recommend Fluid Functionalism to a teammate?",
    options: [
      {
        id: "yes",
        title: "Yes",
        short: "Already have",
        long: "Already have — it sets the bar for polished React surfaces.",
      },
      {
        id: "soon",
        title: "Soon",
        short: "Once it covers more ground",
        long: "Once it covers more ground — a few primitives are still missing.",
      },
      {
        id: "unsure",
        title: "Not sure yet",
        short: "Still evaluating",
        long: "Still evaluating — one real flow will settle it.",
      },
    ],
  },
] as const;

export const AUQ_FREE_TEXT_QUESTIONS = [
  {
    id: "name",
    title: "What should we call your workspace?",
    placeholder: "e.g. Acme Design",
  },
  {
    id: "goal",
    title: "Describe what you're hoping to build.",
    placeholder: "A sentence or two is plenty…",
  },
  {
    id: "feedback",
    title: "Anything else you'd like us to know?",
    placeholder: "Type your answer…",
  },
] as const;

export const AUQ_OTHER_PLACEHOLDER = "Something else?";

/** Emit the questions array literal for a configuration — the exact lines
 *  the Code tab shows, reused verbatim by the install generator. */
export function auqQuestionLines(
  o: Pick<
    AskUserQuestionsPlayState,
    "type" | "layout" | "chip" | "multiSelect" | "allowOther" | "multiline" | "count" | "skippable"
  >,
  indent = "",
  decl = `const questions = [`
): string[] {
  const l: string[] = [];
  const pad = (line: string) => `${indent}${line}`;
  l.push(pad(decl));
  if (o.type === "freeText") {
    for (const q of AUQ_FREE_TEXT_QUESTIONS.slice(0, o.count)) {
      l.push(pad(`  {`));
      l.push(pad(`    id: ${JSON.stringify(q.id)},`));
      l.push(pad(`    title: ${JSON.stringify(q.title)},`));
      l.push(pad(`    freeText: true,`));
      if (!o.multiline)
        l.push(pad(`    freeTextMultiline: false, // single-line; Enter submits`));
      l.push(pad(`    freeTextPlaceholder: ${JSON.stringify(q.placeholder)},`));
      if (!o.skippable) l.push(pad(`    skippable: false,`));
      l.push(pad(`  },`));
    }
  } else {
    for (const q of AUQ_OPTION_QUESTIONS.slice(0, o.count)) {
      l.push(pad(`  {`));
      l.push(pad(`    id: ${JSON.stringify(q.id)},`));
      l.push(pad(`    title: ${JSON.stringify(q.title)},`));
      if (o.layout === "stacked") l.push(pad(`    layout: "stacked",`));
      if (o.chip === "left") l.push(pad(`    chipPosition: "left",`));
      if (o.multiSelect) l.push(pad(`    multiSelect: true,`));
      if (o.allowOther) {
        l.push(pad(`    allowOther: true,`));
        l.push(pad(`    otherPlaceholder: ${JSON.stringify(AUQ_OTHER_PLACEHOLDER)},`));
      }
      if (!o.skippable) l.push(pad(`    skippable: false,`));
      l.push(pad(`    options: [`));
      for (const opt of q.options) {
        const desc = o.layout === "stacked" ? opt.long : opt.short;
        l.push(
          pad(
            `      { id: ${JSON.stringify(opt.id)}, title: ${JSON.stringify(opt.title)}, description: ${JSON.stringify(desc)} },`
          )
        );
      }
      l.push(pad(`    ],`));
      l.push(pad(`  },`));
    }
  }
  l.push(pad(`];`));
  return l;
}
