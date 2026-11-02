// The API reference of /docs/ask-user-questions: its PropsTables and the API section
// of /docs/ask-user-questions.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

// ── Props tables ───────────────────────────────────────────────

export const componentProps: PropDef[] = [
  { name: "questions", type: "AskUserQuestion[]", description: "Ordered list of questions to ask. 2–5 options per question is recommended." },
  { name: "currentIndex", type: "number", description: "Controlled index of the active question." },
  { name: "defaultCurrentIndex", type: "number", default: "0", description: "Initial question index (uncontrolled mode)." },
  { name: "onCurrentIndexChange", type: "(index: number) => void", description: "Called when the active question changes." },
  { name: "answers", type: "Record<string, AskUserAnswer>", description: "Controlled answers map keyed by question id." },
  { name: "defaultAnswers", type: "Record<string, AskUserAnswer>", description: "Initial answers (uncontrolled mode)." },
  { name: "onAnswersChange", type: "(answers: Record<string, AskUserAnswer>) => void", description: "Called whenever any answer changes." },
  { name: "onComplete", type: "(answers: Record<string, AskUserAnswer>) => void", description: "Called after the last question is answered or submitted." },
  { name: "onSkip", type: "(questionId: string, index: number) => void", description: "Called when the user clicks Skip on a question." },
  { name: "skipLabel", type: "string", default: '"Skip"', description: "Label for the skip control in the header." },
];

export const questionProps: PropDef[] = [
  { name: "id", type: "string", description: "Stable identifier used to key the answer. Falls back to position." },
  { name: "title", type: "string", description: "Question text shown above the options." },
  { name: "options", type: "AskUserOption[]", description: "2–5 options to choose from. Omit for freeText questions." },
  { name: "multiSelect", type: "boolean", default: "false", description: "Allow multiple options to be selected. Adds a Next button at the bottom." },
  { name: "allowOther", type: "boolean", default: "false", description: "Render an always-visible inline textarea for free-form, multi-line answers. Enter submits (single-select); Shift+Enter inserts a newline." },
  { name: "otherPlaceholder", type: "string", default: '"Describe in your own words…"', description: "Placeholder for the Other textarea." },
  { name: "skippable", type: "boolean", default: "true", description: "Show the Skip control in the header." },
  { name: "nextLabel", type: "string", description: "Label for the Next button in multi-select mode. Defaults to 'Next' or 'Finish'." },
  { name: "layout", type: '"inline" | "stacked"', default: '"inline"', description: "Row layout. 'stacked' places the description on its own line under the title — use when descriptions are long enough to wrap." },
  { name: "chipPosition", type: '"left" | "right"', default: '"right"', description: "Which side of the row the numbered chip sits on. With 'left', the single-select submit arrow still appears on the row's right edge. Works with single/multi-select, allowOther, and inline/stacked layouts." },
  { name: "freeText", type: "boolean", default: "false", description: "Render a single multi-line textarea as the only answer — no option rows. The field auto-focuses; ⌘/⌃+Enter or the bottom submit button commits, and the answer is returned in otherText. Distinct from allowOther (which appends a free-text row alongside options); options is ignored when set." },
  { name: "freeTextPlaceholder", type: "string", default: '"Type your answer…"', description: "Placeholder for the freeText textarea." },
  { name: "freeTextMultiline", type: "boolean", default: "true", description: "Whether the freeText field starts at multi-line height. Set false for a single-line field (one row tall) where plain Enter submits instead of inserting a newline. The textarea still grows to fit longer content either way." },
  { name: "freeTextValidate", type: "(value: string) => string | null", description: "Validate the freeText value on submit (button or ⌘/⌃+Enter). Return an error message to block submission and show it in the footer (left-aligned); return null to allow. The error clears as the user edits." },
];

export const optionProps: PropDef[] = [
  { name: "id", type: "string", description: "Stable identifier returned in the answer. Falls back to position." },
  { name: "title", type: "string", description: "Bold leading label for the option." },
  { name: "description", type: "string", description: "Secondary muted text shown after the title." },
];

export const answerProps: PropDef[] = [
  { name: "questionId", type: "string", description: "Id of the question this answer belongs to." },
  { name: "selectedIds", type: "string[]", description: "Selected option ids. Length 0–1 in single-select, 0–N in multi-select." },
  { name: "otherText", type: "string", description: "Free-form text from the Other input or a freeText question, if any." },
  { name: "skipped", type: "boolean", description: "True when the user skipped the question." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "AskUserQuestions", props: componentProps },
  { title: "AskUserQuestion", props: questionProps },
  { title: "AskUserOption", props: optionProps },
  { title: "AskUserAnswer", props: answerProps },
];
