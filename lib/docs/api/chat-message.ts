// The API reference of /docs/chat-message: its PropsTables and the API section
// of /docs/chat-message.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const chatMessageProps: PropDef[] = [
  { name: "from", type: '"user" | "assistant"', description: "Who sent the message. `user` renders a right-aligned accent bubble; `assistant` renders left-aligned plain text with no background. Also sets the entrance transform-origin." },
  { name: "children", type: "ReactNode", description: "Message body. For the user it renders inside the bubble; for the assistant it renders as plain text. When omitted (attachment-only message) the body is dropped and only the thumbnails show." },
  { name: "time", type: "ReactNode", description: "Timestamp shown before the actions in the hover-revealed meta row. User-message only — ignored on assistant replies. Caller pre-formats it, e.g. \"Wednesday 6:08 PM\"." },
  { name: "actions", type: "ReactNode", description: "Icon-only action buttons (copy, edit, regenerate, …) shown next to the timestamp in the hover-revealed meta row. The row's height is always reserved, so revealing it never shifts the layout." },
  { name: "files", type: "File[]", description: "Optional attachments rendered as square thumbnails above the bubble. Images use object-cover; PDFs render their first page via pdfjs; a theme-aware inset outline keeps pale edges visible." },
  { name: "thumbnailSize", type: "number", default: "64", description: "Side length (in pixels) of each attachment thumbnail." },
  { name: "className", type: "string", description: "Merged onto the outer motion wrapper. Useful for tweaking max-width or spacing." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "ChatMessage", props: chatMessageProps },
];
