// The API reference of /docs/input-message: its PropsTables and the API section
// of /docs/input-message.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const inputMessageProps: PropDef[] = [
  { name: "size", type: '"default" | "compact"', default: "from SizeProvider", description: "Step on the size ladder (see /docs/sizes). Wins over the surrounding SizeProvider." },
  { name: "value", type: "string", description: "Controlled textarea value." },
  { name: "onValueChange", type: "(value: string) => void", description: "Called with the new value on every textarea change." },
  { name: "onSend", type: "(value: string, files: File[]) => void", description: "Fires on Enter (without Shift) or send-button click. Receives the trimmed value and the currently-attached files. Skipped when the value is empty and no files are attached." },
  { name: "placeholder", type: "string", default: '"Ask me anything…"', description: "Placeholder shown when the value is empty. While a file is being dragged over the component (and attachments are enabled), the placeholder swaps to “Drop files here to add to chat”." },
  { name: "leftSlot", type: "ReactNode | (ctx) => ReactNode", description: "Content rendered in the bottom-left action area. May be a render-fn that receives `{ openFilePicker, files }` — `openFilePicker(acceptOverride?)` opens the native file picker (optionally scoped to a subset of accept types, e.g. `\"image/*\"`)." },
  { name: "rightSlot", type: "ReactNode | (ctx) => ReactNode", description: "Content rendered in the bottom-right action area, before the built-in send button. Same render-fn shape as `leftSlot`." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the textarea, send button, and drag-and-drop." },
  { name: "minRows", type: "number", default: "1", description: "Minimum visible rows before the textarea grows." },
  { name: "maxRows", type: "number", default: "8", description: "Maximum visible rows before the textarea starts to scroll." },
  { name: "clickToFocus", type: "boolean", default: "true", description: "When true, clicking anywhere on the surrounding container (outside of buttons / links / inputs) focuses the textarea." },
  { name: "sendLabel", type: "string", default: '"Send"', description: "Accessible label for the send button." },
  { name: "files", type: "File[]", description: "Controlled list of attached files. Pair with `onFilesChange` to enable drag-and-drop and the file-picker slot helper. When omitted, attachment behavior is disabled." },
  { name: "onFilesChange", type: "(files: File[]) => void", description: "Called when files are added (drag-drop or picker) or removed via the preview tile’s × button. Duplicate drops of the same file (same name + size + lastModified) are silently de-duplicated." },
  { name: "accept", type: "string", default: '"image/png,image/jpeg,application/pdf"', description: "Accepted MIME types as a comma-separated string. Used by both the file picker and the drag-and-drop filter." },
  { name: "maxFiles", type: "number", description: "Maximum number of attached files. Extra files beyond this limit are dropped." },
  { name: "filePreviewSize", type: "number", default: "80", description: "Side length (in pixels) of each preview tile. Images use object-cover; PDFs render the first page via pdfjs; other types fall back to a centered icon. A theme-aware inset outline keeps light media edges visible. The pdf.js worker loads from jsDelivr; on a strict CSP, host it yourself and call `setPdfWorkerSrc(\"/pdf.worker.min.mjs\")` from `@/components/ui/file-thumbnail`." },
  { name: "textareaProps", type: "TextareaHTMLAttributes", description: "Extra props forwarded to the underlying textarea (value, onChange, onKeyDown, disabled and placeholder are controlled by the component)." },
  { name: "status", type: '"idle" | "streaming" | "submitted" | "ready" | "error"', description: "Assistant response state. While it is busy (\"streaming\" or \"submitted\"), the send button becomes a Stop control (empty draft) or a Queue action (non-empty draft). When it returns to \"idle\" or \"ready\" the next queued message auto-dispatches via onSend; \"error\" holds the queue until it is cleared. The 4 values of the AI SDK's useChat status pass straight through. Leave undefined for the legacy send-immediately behavior." },
  { name: "onStop", type: "() => void", description: "Fires when the Stop control is pressed (streaming + empty draft). Halt the current response and set status to \"idle\" — that edge immediately dispatches the next queued message." },
  { name: "queue", type: "QueuedMessage[]", description: "Controlled queue of pending messages, rendered as reorderable rows above the textarea. Double-click (or Enter/F2) edits a row back into the composer; the × (or Delete) removes it; drag — or Alt+↑/↓ — reorders. Requires status to be controlled." },
  { name: "onQueueChange", type: "(queue: QueuedMessage[]) => void", description: "Called whenever the queue changes — enqueue, edit, delete, reorder, or auto-dispatch. Each QueuedMessage is { id, text, files }." },
  { name: "showQueue", type: "boolean", default: "true", description: "Render the built-in reorderable queue rows above the textarea. Set to false to suppress them and render the queue yourself (e.g. as full-width rows above the composer) — enqueue and auto-dispatch still run." },
  { name: "history", type: "string[]", default: "[]", description: "Previously-sent messages, oldest first. With the textarea focused, ArrowUp (caret on the first line) recalls the previous message and walks backward; ArrowDown (caret on the last line) walks forward toward the in-progress draft. Editing or sending exits history mode." },
  { name: "placeholderSuggestion", type: "string", description: "Suggested prompt rendered as the placeholder (with a Tab keycap) while the draft is empty. Pressing Tab fills it into the composer — it doesn't send. Takes precedence over placeholder. Shift+Tab still moves focus backward, and once the draft is non-empty Tab resumes normal focus traversal." },
  { name: "suggestions", type: "string[]", description: "Suggested prompts listed under the action bar while the draft is empty. ArrowDown moves a highlight into the list (focus stays in the textarea, tracked via aria-activedescendant), ArrowUp walks back up and out, Enter or click fills the highlighted prompt into the composer. Escape drops the highlight; typing collapses the list. While nothing is highlighted the first row shows a ↓ hint in the slot where the highlighted row shows ↵." },
];

// MessageScroller ships with the composer: the scroll position of the
// transcript above it.
export const scrollerProps: PropDef[] = [
  { name: "autoScroll", type: "boolean", default: "true", description: "Keep the end in view while content grows and the reader is at the end. Scrolling away by hand lets go; the button or a new anchored row picks it back up." },
  { name: "peek", type: "number", default: "16", description: "Pixels of the previous message left visible above an anchored row." },
  { name: "viewportClassName", type: "string", description: "Classes for the scrolling element: padding, or `scroll-fade` for edge fades." },
  { name: "label", type: "string", default: '"Conversation"', description: "Accessible name of the scrolling region." },
  { name: "className", type: "string", description: "Classes for the outer frame. Give it a height: the scroller fills it. MessageScrollerContent, the column of rows inside, takes a className too (a gap) and renders with `role=\"log\"`." },
];

export const scrollerItemProps: PropDef[] = [
  { name: "anchor", type: "boolean", default: "false", description: "Marks the start of a turn, usually a user message. When the row arrives it glides to the top of the view and the reply grows under it. Rows present at mount never glide." },
  { name: "className", type: "string", description: "Classes for the row wrapper." },
];

export const scrollerButtonProps: PropDef[] = [
  { name: "label", type: "string", default: '"Scroll to latest"', description: "Accessible name. The button is mounted only while the view is away from the end." },
  { name: "className", type: "string", description: "Classes for the round button." },
];

export const scrollerHookProps: PropDef[] = [
  { name: "atEnd", type: "boolean", description: "Whether the view is within 24px of the end." },
  { name: "scrollToEnd", type: "() => void", description: "Glide to the end and follow new output again." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "InputMessage", props: inputMessageProps },
  { title: "MessageScroller", props: scrollerProps },
  { title: "MessageScrollerItem", props: scrollerItemProps },
  { title: "MessageScrollerButton", props: scrollerButtonProps },
  { title: "useMessageScroller", props: scrollerHookProps },
];
