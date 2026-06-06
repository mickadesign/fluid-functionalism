"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownRight } from "lucide-react";
import {
  InputMessage,
  type QueuedMessage,
} from "@/registry/default/input-message";
import { ChatMessage } from "@/registry/default/chat-message";
import { ThinkingIndicator } from "@/registry/default/thinking-indicator";
import { FileThumbnail } from "@/registry/default/file-thumbnail";
import { Button } from "@/registry/radix/button";
import { Dropdown } from "@/registry/default/dropdown";
import { MenuItem } from "@/registry/default/menu-item";
import { Tooltip } from "@/registry/radix/tooltip";
import { useIcon } from "@/lib/icon-context";
import { springs } from "@/registry/default/lib/springs";
import { useShape } from "@/registry/default/lib/shape-context";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";

const MODELS = ["Sonnet 5", "Sonnet 4.6", "Sonnet 4.5", "Haiku 4"] as const;
type Model = (typeof MODELS)[number];

// Sonner-style queued stack tuning. Cards are one truncated line (fixed CARD_H).
// Collapsed, the front card is full and up to STACK_MAX_PEEK cards peek behind
// it (offset up STACK_PEEK px, scaled down STACK_SCALE each); deeper cards hide.
// Hovering fans them into a vertical list (STACK_GAP between cards).
const CARD_H = 44;
const STACK_PEEK = 12;
const STACK_SCALE = 0.05;
const STACK_GAP = 8;
const STACK_MAX_PEEK = 2;

const basicCode = `import { useState } from "react";
import { InputMessage } from "./components";

const [value, setValue] = useState("");

<InputMessage
  value={value}
  onValueChange={setValue}
  onSend={(text) => console.log("send:", text)}
/>`;

const attachmentsCode = `import { useEffect, useRef, useState } from "react";
import { InputMessage, ChatMessage } from "./components";

type Msg = { from: "user" | "assistant"; text: string; files?: File[] };

const [value, setValue] = useState("");
const [files, setFiles] = useState<File[]>([]);
const [messages, setMessages] = useState<Msg[]>([]);

// Pre-fill the composer with a real image + PDF. Images use object-cover;
// PDFs render their first page via pdfjs. Both show the × remove button.
useEffect(() => {
  Promise.all([
    fetch("/avatar.png")
      .then((r) => r.blob())
      .then((b) => new File([b], "avatar.png", { type: "image/png" })),
    fetch("/design-notes.pdf")
      .then((r) => r.blob())
      .then((b) => new File([b], "design-notes.pdf", { type: "application/pdf" })),
  ]).then(setFiles);
}, []);

// Float the composer over the history: measure its height to reserve scroll
// padding, and keep the transcript pinned to the bottom as it grows.
const inputRef = useRef<HTMLDivElement>(null);
const [inputH, setInputH] = useState(0);
useEffect(() => {
  const el = inputRef.current;
  if (!el) return;
  const ro = new ResizeObserver(() => setInputH(el.offsetHeight));
  ro.observe(el);
  setInputH(el.offsetHeight);
  return () => ro.disconnect();
}, []);

const scrollRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  const el = scrollRef.current;
  if (el) el.scrollTop = el.scrollHeight;
}, [messages, inputH]);

<div className="relative w-full h-[440px]">
  <div ref={scrollRef} className="absolute inset-0 overflow-y-auto scrollbar-hide">
    <div
      className="flex min-h-full flex-col justify-start gap-2"
      style={{ paddingBottom: inputH + 12 }}
    >
      {messages.map((m, i) => (
        <ChatMessage key={i} from={m.from} files={m.files}>
          {m.text}
        </ChatMessage>
      ))}
    </div>
  </div>
  <InputMessage
    ref={inputRef}
    className="absolute inset-x-0 bottom-0"
    value={value}
    onValueChange={setValue}
    files={files}
    onFilesChange={setFiles}
    // Send pushes the message along with its attachments into the transcript.
    onSend={(text, attachments) => {
      if (!text && attachments.length === 0) return;
      setMessages((prev) => [
        ...prev,
        { from: "user", text, files: attachments },
      ]);
      setValue("");
      setFiles([]);
    }}
  />
</div>`;

const actionsCode = `import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { InputMessage, ChatMessage, Button, Dropdown, MenuItem, Tooltip } from "./components";
import { useIcon } from "@/lib/icon-context";

const MODELS = ["Sonnet 5", "Sonnet 4.6", "Sonnet 4.5", "Haiku 4"] as const;

const [value, setValue] = useState("");
const [messages, setMessages] = useState<{ text: string; files: File[] }[]>([]);
const [files, setFiles] = useState<File[]>([]);
const [modelOpen, setModelOpen] = useState(false);
const [attachOpen, setAttachOpen] = useState(false);
const [model, setModel] = useState<typeof MODELS[number]>("Sonnet 5");

const modelRef = useRef<HTMLDivElement>(null);
const attachRef = useRef<HTMLDivElement>(null);
const scrollRef = useRef<HTMLDivElement>(null);
const inputRef = useRef<HTMLDivElement>(null);
const [inputH, setInputH] = useState(0);

useEffect(() => {
  const handler = (e: MouseEvent) => {
    if (modelRef.current && !modelRef.current.contains(e.target as Node))
      setModelOpen(false);
    if (attachRef.current && !attachRef.current.contains(e.target as Node))
      setAttachOpen(false);
  };
  document.addEventListener("mousedown", handler);
  return () => document.removeEventListener("mousedown", handler);
}, []);

// Measure the floating composer so we can reserve scroll padding under it.
useEffect(() => {
  const el = inputRef.current;
  if (!el) return;
  const ro = new ResizeObserver(() => setInputH(el.offsetHeight));
  ro.observe(el);
  setInputH(el.offsetHeight);
  return () => ro.disconnect();
}, []);

// Keep the history pinned to the latest message as it grows.
useEffect(() => {
  const el = scrollRef.current;
  if (el) el.scrollTop = el.scrollHeight;
}, [messages, inputH]);

const PlusIcon = useIcon("plus");
const ChevronDownIcon = useIcon("chevron-down");
const ImageIcon = useIcon("image");
const FileTextIcon = useIcon("square-library");

<div className="relative w-full h-[440px]">
  <div ref={scrollRef} className="absolute inset-0 overflow-y-auto scrollbar-hide">
    <div
      className="flex min-h-full flex-col justify-start gap-2"
      style={{ paddingBottom: inputH + 12 }}
    >
      {messages.map((m, i) => (
        <ChatMessage key={i} from="user" files={m.files}>
          {m.text}
        </ChatMessage>
      ))}
    </div>
  </div>
  <InputMessage
    ref={inputRef}
    className="absolute inset-x-0 bottom-0"
    value={value}
    onValueChange={setValue}
    files={files}
    onFilesChange={setFiles}
    onSend={(text, attachments) => {
      setMessages((prev) => [...prev, { text, files: attachments }]);
      setValue("");
      setFiles([]);
    }}
    // Drag-and-drop works on the whole container. Click + to choose a type.
    leftSlot={({ openFilePicker }) => (
    <div ref={attachRef} className="relative">
      <Tooltip content="Add" side="top">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Attach files"
          active={attachOpen}
          onClick={() => setAttachOpen((o) => !o)}
        >
          <PlusIcon />
        </Button>
      </Tooltip>
      <AnimatePresence>
        {attachOpen && (
          <motion.div
            className="absolute bottom-full mb-2 left-0 z-10"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4, transition: { duration: 0.1 } }}
            transition={springs.fast}
          >
            <Dropdown>
              <MenuItem
                index={0}
                label="Image"
                icon={ImageIcon}
                onSelect={() => {
                  setAttachOpen(false);
                  openFilePicker("image/png,image/jpeg");
                }}
              />
              <MenuItem
                index={1}
                label="PDF"
                icon={FileTextIcon}
                onSelect={() => {
                  setAttachOpen(false);
                  openFilePicker("application/pdf");
                }}
              />
            </Dropdown>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )}
  rightSlot={
    <div ref={modelRef} className="relative">
      <Tooltip content="Select model" side="top">
        <Button
          variant="ghost"
          size="sm"
          trailingIcon={ChevronDownIcon}
          active={modelOpen}
          onClick={() => setModelOpen((o) => !o)}
        >
          {model}
        </Button>
      </Tooltip>
      <AnimatePresence>
        {modelOpen && (
          <motion.div
            className="absolute bottom-full mb-2 right-0 z-10"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4, transition: { duration: 0.1 } }}
            transition={springs.fast}
          >
            <Dropdown checkedIndex={MODELS.indexOf(model)}>
              {MODELS.map((name, i) => (
                <MenuItem
                  key={name}
                  index={i}
                  label={name}
                  checked={name === model}
                  onSelect={() => {
                    setModel(name);
                    setModelOpen(false);
                  }}
                />
              ))}
            </Dropdown>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  }
  />
</div>`;

const leftOnlyCode = `import { useState } from "react";
import { InputMessage } from "./components";
import { Button } from "./components";
import { useIcon } from "@/lib/icon-context";

const [value, setValue] = useState("");
const PlusIcon = useIcon("plus");

<InputMessage
  value={value}
  onValueChange={setValue}
  leftSlot={
    <Button variant="ghost" size="icon-sm" aria-label="Attach">
      <PlusIcon />
    </Button>
  }
/>`;

const rightOnlyCode = `import { useState } from "react";
import { InputMessage } from "./components";
import { Button } from "./components";
import { useIcon } from "@/lib/icon-context";

const [value, setValue] = useState("");
const ChevronDownIcon = useIcon("chevron-down");

<InputMessage
  value={value}
  onValueChange={setValue}
  rightSlot={
    <Button variant="ghost" size="sm" trailingIcon={ChevronDownIcon}>
      Sonnet 4.6
    </Button>
  }
/>`;

const sendHandlerCode = `import { useState } from "react";
import { InputMessage, ChatMessage } from "./components";

const [value, setValue] = useState("");
const [messages, setMessages] = useState<string[]>([]);

<div className="flex flex-col gap-3">
  {messages.length > 0 && (
    <div className="flex flex-col gap-2">
      {messages.map((m, i) => (
        <ChatMessage key={i} from="user">
          {m}
        </ChatMessage>
      ))}
    </div>
  )}
  <InputMessage
    value={value}
    onValueChange={setValue}
    onSend={(text) => {
      if (text) setMessages((prev) => [...prev, text]);
      setValue("");
    }}
  />
</div>`;

const queuedCode = `import { useEffect, useRef, useState } from "react";
import {
  InputMessage, ChatMessage, ThinkingIndicator, FileThumbnail, type QueuedMessage,
} from "./components";

type Turn = { from: "user" | "assistant"; text: string; thinking?: boolean };

const [value, setValue] = useState("");
const [queue, setQueue] = useState<QueuedMessage[]>([]);
const [status, setStatus] = useState<"idle" | "streaming">("idle");
const [chat, setChat] = useState<Turn[]>([]);
const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

// Stand-in for a real assistant: append the user turn plus an assistant
// placeholder in its "thinking" state, hold there for a beat, then stream the
// reply in word-by-word. The final streaming→idle edge releases the next
// queued message.
const respond = (text: string) => {
  const reply = \`Replying to "\${text}". A fuller answer that streams in…\`;
  setChat((c) => [...c, { from: "user", text }, { from: "assistant", text: "", thinking: true }]);
  setStatus("streaming");

  const words = reply.split(" ");
  timers.current.push(setTimeout(() => {
    words.forEach((_, i) => {
      timers.current.push(setTimeout(() => {
        setChat((c) => c.map((m, k) =>
          k === c.length - 1
            ? { from: "assistant", text: words.slice(0, i + 1).join(" ") }
            : m
        ));
        if (i === words.length - 1) setStatus("idle");
      }, i * 150));
    });
  }, 4000)); // think before streaming
};

useEffect(() => () => timers.current.forEach(clearTimeout), []);

<>
  {chat.map((m, i) =>
    m.thinking ? (
      <ChatMessage key={i} from="assistant">
        <ThinkingIndicator showIcon={false} className="px-0 py-0" />
      </ChatMessage>
    ) : (
      <ChatMessage key={i} from={m.from}>{m.text}</ChatMessage>
    )
  )}

  {/* Render the queue yourself as a Sonner-style stack overlaying just above
      the composer: a fixed-height pile that fans out on hover. Front card
      (queue[0]) is next to dispatch. Double-click edits, × removes. */}
  {queue.length > 0 && (
    <div
      className="absolute inset-x-0 z-10"
      style={{ bottom: inputHeight + 8, height: hovered ? expandedH : collapsedH }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {queue.map((item, i) => {
        const peek = Math.min(i, 2);
        const t = hovered
          ? { y: -i * (CARD_H + 8), scale: 1, opacity: 1 }
          : { y: -peek * 12, scale: 1 - peek * 0.05, opacity: i <= 2 ? 1 : 0 };
        return (
          <motion.div
            key={item.id}
            animate={t}
            transition={{ type: "spring", duration: 0.16 }}
            style={{ height: CARD_H, transformOrigin: "bottom center", zIndex: 100 - i }}
            onDoubleClick={() => { setValue(item.text); setQueue((q) => q.filter((x) => x.id !== item.id)); }}
            className="absolute bottom-0 left-7 right-0 flex items-center gap-2 rounded-[20px] bg-[color-mix(in_oklab,var(--accent),var(--background)_45%)] px-3.5 text-[14px] text-muted-foreground shadow-surface-3"
          >
            {/* Attachments: small thumbnails (1 or many; +N past 3). */}
            {item.files.length > 0 && (
              <div className="flex shrink-0 items-center gap-1">
                {item.files.slice(0, 3).map((f, fi) => (
                  <FileThumbnail key={fi} file={f} size={28} className="rounded-md" />
                ))}
                {item.files.length > 3 && <span>+{item.files.length - 3}</span>}
              </div>
            )}
            <span className="min-w-0 flex-1 truncate">{item.text}</span>
            <button onClick={() => setQueue((q) => q.filter((x) => x.id !== item.id))} aria-label="Remove queued message">
              ✕
            </button>
          </motion.div>
        );
      })}
    </div>
  )}

  <InputMessage
    value={value}
    onValueChange={setValue}
    status={status}
    queue={queue}
    onQueueChange={setQueue}
    showQueue={false} // render the queue yourself (full-width rows above) instead
    // Sent user turns, oldest first — ArrowUp/ArrowDown recall them.
    history={chat.filter((m) => m.from === "user").map((m) => m.text)}
    // While idle this sends; the component also calls onSend itself to
    // auto-dispatch the head of the queue on each streaming→idle edge.
    onSend={(text) => { if (text) respond(text); setValue(""); }}
    // Stop ends the current response; returning to idle immediately releases
    // the next queued message.
    onStop={() => { timers.current.forEach(clearTimeout); setStatus("idle"); }}
    placeholder="Send while I'm responding to queue a message…"
  />
</>

// Queue interactions: double-click (or Enter/F2) a row to edit it back into
// the composer, × (or Delete) to remove, drag or Alt+↑/↓ to reorder.`;

const disabledCode = `import { InputMessage } from "./components";

<InputMessage
  value="This composer is disabled"
  onValueChange={() => {}}
  disabled
/>`;

const inputMessageProps: PropDef[] = [
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
  { name: "filePreviewSize", type: "number", default: "80", description: "Side length (in pixels) of each preview tile. Images use object-cover; PDFs render the first page via pdfjs; other types fall back to a centered icon." },
  { name: "textareaProps", type: "TextareaHTMLAttributes", description: "Extra props forwarded to the underlying textarea (value, onChange, onKeyDown, disabled and placeholder are controlled by the component)." },
  { name: "status", type: '"idle" | "streaming"', description: "Assistant response state. When \"streaming\", the send button becomes a Stop control (empty draft) or a Queue action (non-empty draft). On the streaming→idle edge the next queued message auto-dispatches via onSend. Leave undefined for the legacy send-immediately behavior." },
  { name: "onStop", type: "() => void", description: "Fires when the Stop control is pressed (streaming + empty draft). Halt the current response and set status to \"idle\" — that edge immediately dispatches the next queued message." },
  { name: "queue", type: "QueuedMessage[]", description: "Controlled queue of pending messages, rendered as reorderable rows above the textarea. Double-click (or Enter/F2) edits a row back into the composer; the × (or Delete) removes it; drag — or Alt+↑/↓ — reorders. Requires status to be controlled." },
  { name: "onQueueChange", type: "(queue: QueuedMessage[]) => void", description: "Called whenever the queue changes — enqueue, edit, delete, reorder, or auto-dispatch. Each QueuedMessage is { id, text, files }." },
  { name: "showQueue", type: "boolean", default: "true", description: "Render the built-in reorderable queue rows above the textarea. Set to false to suppress them and render the queue yourself (e.g. as full-width rows above the composer) — enqueue and auto-dispatch still run." },
  { name: "history", type: "string[]", default: "[]", description: "Previously-sent messages, oldest first. With the textarea focused, ArrowUp (caret on the first line) recalls the previous message and walks backward; ArrowDown (caret on the last line) walks forward toward the in-progress draft. Editing or sending exits history mode." },
];

export default function InputMessageDoc() {
  const [basicValue, setBasicValue] = useState("");
  const [actionsValue, setActionsValue] = useState("");
  const [actionsMessages, setActionsMessages] = useState<
    { text: string; files: File[] }[]
  >([]);
  const [leftValue, setLeftValue] = useState("");
  const [rightValue, setRightValue] = useState("");
  const [handlerValue, setHandlerValue] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  // State for the "With Left and Right Actions" demo: attached files,
  // model-picker open state, and the currently-selected model.
  const [files, setFiles] = useState<File[]>([]);
  const [modelOpen, setModelOpen] = useState(false);
  const [model, setModel] = useState<Model>("Sonnet 5");
  const [attachOpen, setAttachOpen] = useState(false);
  const modelRef = useRef<HTMLDivElement>(null);
  const attachRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node))
        setModelOpen(false);
      if (attachRef.current && !attachRef.current.contains(e.target as Node))
        setAttachOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // The composer floats over the scrollable history. We reserve bottom space
  // equal to its measured height so the newest message rests just above the
  // edge, while older messages scroll cleanly behind the opaque composer
  // instead of being hard-cropped at its top edge.
  const actionsInputRef = useRef<HTMLDivElement>(null);
  const [actionsInputH, setActionsInputH] = useState(0);
  useEffect(() => {
    const el = actionsInputRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setActionsInputH(el.offsetHeight));
    ro.observe(el);
    setActionsInputH(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  // Keep the message history pinned to the latest message as it grows.
  const actionsScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = actionsScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [actionsMessages, actionsInputH]);

  // "Attachments" demo: a composer pre-filled with a real image + PDF, loaded
  // from public assets at mount. Sending pushes the message (with its
  // attachments) into a transcript and an assistant reply follows.
  const [attachValue, setAttachValue] = useState("");
  const [attachFiles, setAttachFiles] = useState<File[]>([]);
  const [attachMessages, setAttachMessages] = useState<
    { from: "user" | "assistant"; text: string; files?: File[] }[]
  >([]);
  // Keep the originally-loaded files so "Reset" can re-fill the composer.
  const initialAttachFiles = useRef<File[]>([]);
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/micka.png")
        .then((r) => r.blob())
        .then((b) => new File([b], "micka.png", { type: b.type || "image/png" })),
      fetch("/design-notes.pdf")
        .then((r) => r.blob())
        .then(
          (b) =>
            new File([b], "design-notes.pdf", {
              type: b.type || "application/pdf",
            })
        ),
    ])
      .then((files) => {
        if (cancelled) return;
        initialAttachFiles.current = files;
        setAttachFiles(files);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const resetAttachDemo = () => {
    setAttachMessages([]);
    setAttachValue("");
    setAttachFiles(initialAttachFiles.current);
  };

  // Same floating-composer treatment as the main Example: measure the composer
  // to reserve scroll padding, and keep the transcript pinned to the bottom.
  const attachInputRef = useRef<HTMLDivElement>(null);
  const [attachInputH, setAttachInputH] = useState(0);
  useEffect(() => {
    const el = attachInputRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setAttachInputH(el.offsetHeight));
    ro.observe(el);
    setAttachInputH(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  const attachScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = attachScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [attachMessages, attachInputH]);

  // "Queued messages" demo: while the assistant is "responding" (status =
  // "streaming"), submitting enqueues instead of sending. The queue
  // auto-dispatches one message per streaming→idle edge; Stop ends the current
  // response and releases the next.
  const [queuedValue, setQueuedValue] = useState("");
  const [queue, setQueue] = useState<QueuedMessage[]>([]);
  const [chatStatus, setChatStatus] = useState<"idle" | "streaming">("idle");
  const [queuedChat, setQueuedChat] = useState<
    // `id` is set on user turns that were dispatched from the queue, so the
    // front stack card and this sent bubble share a layoutId and morph.
    { from: "user" | "assistant"; text: string; thinking?: boolean; id?: string }[]
  >([]);
  // A single pausable stepper drives the in-flight reply (think → stream
  // word-by-word). Only one reply animates at a time, so one controller is
  // enough. The replay button uses it to pause/resume; the cascade pauses with
  // it, since status only reaches "idle" once a reply finishes streaming.
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  // Whether the queued stack is hovered (fanned out) vs collapsed into a pile.
  const [stackHovered, setStackHovered] = useState(false);
  const stepRef = useRef<{
    id: ReturnType<typeof setTimeout> | null;
    cb: (() => void) | null;
    remaining: number;
    startedAt: number;
  }>({ id: null, cb: null, remaining: 0, startedAt: 0 });

  const fireStep = () => {
    const s = stepRef.current;
    s.id = null;
    const cb = s.cb;
    s.cb = null;
    cb?.();
  };
  // Arm the next step. While paused, it stays armed (cb set) but doesn't tick.
  const armStep = (cb: () => void, delay: number) => {
    const s = stepRef.current;
    s.cb = cb;
    s.remaining = delay;
    if (pausedRef.current) return;
    s.startedAt = performance.now();
    s.id = setTimeout(fireStep, delay);
  };
  const clearStep = () => {
    const s = stepRef.current;
    if (s.id != null) clearTimeout(s.id);
    s.id = null;
    s.cb = null;
    s.remaining = 0;
  };
  const pauseAnim = () => {
    const s = stepRef.current;
    if (s.id != null) {
      clearTimeout(s.id);
      s.id = null;
      // Keep only the time left in the current step.
      s.remaining = Math.max(0, s.remaining - (performance.now() - s.startedAt));
    }
    pausedRef.current = true;
    setPaused(true);
  };
  const resumeAnim = () => {
    pausedRef.current = false;
    setPaused(false);
    const s = stepRef.current;
    if (s.cb != null && s.id == null) {
      s.startedAt = performance.now();
      s.id = setTimeout(fireStep, s.remaining);
    }
  };

  const respond = (text: string, queuedId?: string) => {
    const reply = `Replying to “${text}”. Here's a fuller answer that streams in a word at a time so you can watch the queue release the next message.`;
    // Append the user turn plus an assistant placeholder in its "thinking"
    // state, then keep status streaming through the think + stream phases.
    // `queuedId` (set when dispatched from the queue) lets the sent bubble share
    // a layoutId with the front stack card, so it morphs in.
    setQueuedChat((c) => [
      ...c,
      { from: "user", text, id: queuedId },
      { from: "assistant", text: "", thinking: true },
    ]);
    setChatStatus("streaming");

    // Patch the trailing assistant turn (the placeholder) by ref-from-end —
    // nothing else appends while we're streaming, so it's reliably last.
    const patchAssistant = (
      fn: (m: { text: string; thinking?: boolean }) => {
        text: string;
        thinking?: boolean;
      }
    ) =>
      setQueuedChat((c) => {
        const next = [...c];
        for (let k = next.length - 1; k >= 0; k--) {
          if (next[k].from === "assistant") {
            next[k] = { from: "assistant", ...fn(next[k]) };
            break;
          }
        }
        return next;
      });

    // Think (4000ms), then reveal words one at a time (150ms each) — all on the
    // pausable stepper so the replay button can pause/resume mid-flight.
    const words = reply.split(" ");
    const revealWord = (i: number) => {
      patchAssistant(() => ({
        text: words.slice(0, i + 1).join(" "),
        thinking: false,
      }));
      if (i === words.length - 1) {
        setChatStatus("idle");
        return;
      }
      armStep(() => revealWord(i + 1), 150);
    };
    armStep(() => revealWord(0), 4000);
  };

  // Cancel any in-flight step on unmount so a late callback can't fire.
  useEffect(() => () => clearStep(), []);

  // Auto-demo: load this section already paused mid-reply, with a few messages
  // queued (some carrying attachments) so the feature reads at a glance. It
  // starts paused — the front card nudges the user to press ▶ to resume and
  // watch the queue release. Reset clears it; it doesn't re-run.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/micka.png")
        .then((r) => r.blob())
        .then((b) => new File([b], "photo.png", { type: b.type || "image/png" })),
      fetch("/design-notes.pdf")
        .then((r) => r.blob())
        .then(
          (b) =>
            new File([b], "design-notes.pdf", {
              type: b.type || "application/pdf",
            })
        ),
    ])
      .then(([img, pdf]) => {
        if (cancelled) return;
        // Pause before arming so the reply holds at "thinking".
        pausedRef.current = true;
        setPaused(true);
        respond("Show me how queued messages work");
        setQueue([
          { id: crypto.randomUUID(), text: "Press ▶ to send these", files: [img] },
          { id: crypto.randomUUID(), text: "Compare these two files", files: [img, pdf] },
          { id: crypto.randomUUID(), text: "Then summarize the result", files: [] },
        ]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // Run once on mount.
  }, []);

  const queuedInputRef = useRef<HTMLDivElement>(null);
  const [queuedInputH, setQueuedInputH] = useState(0);
  useEffect(() => {
    const el = queuedInputRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setQueuedInputH(el.offsetHeight));
    ro.observe(el);
    setQueuedInputH(el.offsetHeight);
    return () => ro.disconnect();
  }, []);
  const queuedScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = queuedScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [queuedChat, queuedInputH, queue]);

  const resetQueuedDemo = () => {
    clearStep();
    pausedRef.current = false;
    setPaused(false);
    setQueuedChat([]);
    setQueue([]);
    setQueuedValue("");
    setChatStatus("idle");
  };

  // The queue renders as a Sonner-style stack above the composer (showQueue is
  // off), so the demo owns the edit / delete handlers.
  const editQueuedMsg = (item: QueuedMessage) => {
    setQueuedValue(item.text); // silent replace of the current draft
    setQueue((q) => q.filter((x) => x.id !== item.id));
    requestAnimationFrame(() => {
      const el = queuedInputRef.current?.querySelector("textarea");
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  };
  const removeQueuedMsg = (item: QueuedMessage) =>
    setQueue((q) => q.filter((x) => x.id !== item.id));

  // Stack heights. Collapsed grows a little for the first couple cards then
  // stays FIXED (caps at STACK_MAX_PEEK); expanded fits the full fanned-out list.
  const stackCount = queue.length;
  const collapsedStackH =
    CARD_H + Math.min(Math.max(stackCount - 1, 0), STACK_MAX_PEEK) * STACK_PEEK;
  const expandedStackH =
    stackCount * CARD_H + Math.max(stackCount - 1, 0) * STACK_GAP;

  // Drag-to-reorder the (expanded) stack. Manual, because framer's Reorder
  // can't share an element with the stacking transforms. The stack stays
  // expanded while dragging even if the pointer leaves.
  const stackRef = useRef<HTMLDivElement>(null);
  // `pointerDownId` = a pointer is held on this card (drag may not have started
  // yet); `draggingId` = it crossed the move threshold and is actively dragging.
  const [pointerDownId, setPointerDownId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragY, setDragY] = useState(0);
  const dragStartYRef = useRef(0);
  const queueLenRef = useRef(queue.length);
  queueLenRef.current = queue.length;
  const stackExpanded =
    stackHovered || pointerDownId !== null || draggingId !== null;
  const slotY = (i: number) => -i * (CARD_H + STACK_GAP);

  // Drag-to-reorder. The dragged card follows the pointer (offset driven below);
  // the rest snap to their new slots, and on release the dragged card snaps to
  // its slot too. Window listeners mean a release anywhere ends the drag.
  useEffect(() => {
    if (!pointerDownId) return;
    let started = false;
    const onMove = (e: PointerEvent) => {
      const el = stackRef.current;
      if (!el) return;
      if (!started) {
        if (Math.abs(e.clientY - dragStartYRef.current) < 4) return;
        started = true;
        setDraggingId(pointerDownId);
      }
      const rect = el.getBoundingClientRect();
      const fromBottom = rect.bottom - e.clientY;
      // Reorder the array so the others make room (the dragged card itself is
      // positioned by `dragY`, not its slot, while dragging).
      setQueue((q) => {
        const slot = Math.max(
          0,
          Math.min(q.length - 1, Math.floor(fromBottom / (CARD_H + STACK_GAP)))
        );
        const cur = q.findIndex((x) => x.id === pointerDownId);
        if (cur === -1 || cur === slot) return q;
        const moved = q[cur];
        const next = [...q];
        next.splice(cur, 1);
        next.splice(slot, 0, moved);
        return next;
      });
      const minY = -(queueLenRef.current - 1) * (CARD_H + STACK_GAP);
      setDragY(
        Math.max(minY, Math.min(0, e.clientY - rect.bottom + CARD_H / 2))
      );
    };
    const onUp = () => {
      setPointerDownId(null);
      setDraggingId(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [pointerDownId]);

  const shape = useShape();
  const PlusIcon = useIcon("plus");
  const ChevronDownIcon = useIcon("chevron-down");
  const ImageIcon = useIcon("image");
  const FileTextIcon = useIcon("square-library");
  const ResetIcon = useIcon("rotate-ccw");
  const PlayIcon = useIcon("play");
  const PauseIcon = useIcon("pause");
  const XIcon = useIcon("x");

  return (
    <DocPage
      title="InputMessage"
      slug="input-message"
      description="Chat-style message composer with an auto-resizing textarea, flexible left/right action slots, and a built-in send button on a Surface-2 substrate."
    >
      <DocSection title="Example">
        <ComponentPreview
          code={actionsCode}
          minHeightClass="h-[440px]"
          align="bottom"
          padding="compact"
          playbackButton={
            actionsMessages.length > 0
              ? {
                  icon: <ResetIcon size={16} strokeWidth={1.5} />,
                  tooltip: "Clear messages",
                  onClick: () => setActionsMessages([]),
                }
              : undefined
          }
        >
          <div className="relative w-full self-stretch">
            <div
              ref={actionsScrollRef}
              className="absolute inset-0 overflow-y-auto scrollbar-hide"
            >
              <div
                className="flex min-h-full flex-col justify-start gap-2"
                style={{ paddingBottom: actionsInputH + 12 }}
              >
                {actionsMessages.map((m, i) => (
                  <ChatMessage key={i} from="user" files={m.files}>
                    {m.text}
                  </ChatMessage>
                ))}
              </div>
            </div>
            <InputMessage
              ref={actionsInputRef}
              className="absolute inset-x-0 bottom-0"
              value={actionsValue}
              onValueChange={setActionsValue}
              files={files}
              onFilesChange={setFiles}
              onSend={(text, attachments) => {
                setActionsMessages((prev) => [
                  ...prev,
                  { text, files: attachments },
                ]);
                setActionsValue("");
                setFiles([]);
              }}
              leftSlot={({ openFilePicker }) => (
                <div ref={attachRef} className="relative">
                  <Tooltip content="Add" side="top">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Attach files"
                      active={attachOpen}
                      onClick={() => setAttachOpen((o) => !o)}
                    >
                      <PlusIcon />
                    </Button>
                  </Tooltip>
                  <AnimatePresence>
                    {attachOpen && (
                      <motion.div
                        className="absolute bottom-full mb-2 left-0 z-10"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4, transition: { duration: 0.1 } }}
                        transition={springs.fast}
                      >
                        <Dropdown>
                          <MenuItem
                            index={0}
                            label="Image"
                            icon={ImageIcon}
                            onSelect={() => {
                              setAttachOpen(false);
                              openFilePicker("image/png,image/jpeg");
                            }}
                          />
                          <MenuItem
                            index={1}
                            label="PDF"
                            icon={FileTextIcon}
                            onSelect={() => {
                              setAttachOpen(false);
                              openFilePicker("application/pdf");
                            }}
                          />
                        </Dropdown>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              rightSlot={
                <div ref={modelRef} className="relative">
                  <Tooltip content="Select model" side="top">
                    <Button
                      variant="ghost"
                      size="sm"
                      trailingIcon={ChevronDownIcon}
                      active={modelOpen}
                      onClick={() => setModelOpen((o) => !o)}
                    >
                      {model}
                    </Button>
                  </Tooltip>
                  <AnimatePresence>
                    {modelOpen && (
                      <motion.div
                        className="absolute bottom-full mb-2 right-0 z-10"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4, transition: { duration: 0.1 } }}
                        transition={springs.fast}
                      >
                        <Dropdown checkedIndex={MODELS.indexOf(model)}>
                          {MODELS.map((name, i) => (
                            <MenuItem
                              key={name}
                              index={i}
                              label={name}
                              checked={name === model}
                              onSelect={() => {
                                setModel(name);
                                setModelOpen(false);
                              }}
                            />
                          ))}
                        </Dropdown>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              }
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Basic">
        <ComponentPreview code={basicCode} minHeightClass="min-h-[280px]">
          <div className="w-full max-w-xl">
            <InputMessage
              value={basicValue}
              onValueChange={setBasicValue}
              onSend={() => setBasicValue("")}
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Attachments">
        <ComponentPreview
          code={attachmentsCode}
          minHeightClass="h-[440px]"
          align="bottom"
          padding="compact"
          playbackButton={
            attachMessages.length > 0
              ? {
                  icon: <ResetIcon size={16} strokeWidth={1.5} />,
                  tooltip: "Reset",
                  onClick: resetAttachDemo,
                }
              : undefined
          }
        >
          <div className="relative w-full self-stretch">
            <div
              ref={attachScrollRef}
              className="absolute inset-0 overflow-y-auto scrollbar-hide"
            >
              <div
                className="flex min-h-full flex-col justify-start gap-2"
                style={{ paddingBottom: attachInputH + 12 }}
              >
                {attachMessages.map((m, i) => (
                  <ChatMessage key={i} from={m.from} files={m.files}>
                    {m.text}
                  </ChatMessage>
                ))}
              </div>
            </div>
            <InputMessage
              ref={attachInputRef}
              className="absolute inset-x-0 bottom-0"
              value={attachValue}
              onValueChange={setAttachValue}
              files={attachFiles}
              onFilesChange={setAttachFiles}
              onSend={(text, attachments) => {
                if (!text && attachments.length === 0) return;
                setAttachMessages((prev) => [
                  ...prev,
                  { from: "user", text, files: attachments },
                ]);
                setAttachValue("");
                setAttachFiles([]);
              }}
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Queued messages">
        <ComponentPreview
          code={queuedCode}
          minHeightClass="h-[440px]"
          align="bottom"
          padding="compact"
          playbackButton={
            // While a reply is animating, the button pauses it; once paused it
            // resumes; when settled it resets the demo.
            paused
              ? {
                  icon: <PlayIcon size={16} strokeWidth={1.5} />,
                  tooltip: "Resume",
                  onClick: resumeAnim,
                }
              : chatStatus === "streaming"
                ? {
                    icon: <PauseIcon size={16} strokeWidth={1.5} />,
                    tooltip: "Pause",
                    onClick: pauseAnim,
                  }
                : queuedChat.length > 0 || queue.length > 0
                  ? {
                      icon: <ResetIcon size={16} strokeWidth={1.5} />,
                      tooltip: "Reset",
                      onClick: resetQueuedDemo,
                    }
                  : undefined
          }
        >
          <div className="relative w-full self-stretch">
            <div
              ref={queuedScrollRef}
              className="absolute inset-0 overflow-y-auto scrollbar-hide"
            >
              <div
                className="flex min-h-full flex-col justify-end gap-2"
                style={{
                  paddingBottom:
                    queuedInputH + 8 + (stackCount > 0 ? collapsedStackH + 8 : 0),
                }}
              >
                {queuedChat.map((m, i) =>
                  m.thinking ? (
                    <ChatMessage key={i} from="assistant">
                      <ThinkingIndicator
                        showIcon={false}
                        className="px-0 py-0"
                      />
                    </ChatMessage>
                  ) : m.id ? (
                    // Dispatched from the queue: morph in from the front card via
                    // the shared layoutId (skip the normal entrance so it's a pure
                    // morph; `layout` lets the size change animate too).
                    <ChatMessage
                      key={i}
                      from={m.from}
                      layoutId={`qm-${m.id}`}
                      layout
                      initial={false}
                      transition={springs.moderate}
                    >
                      {/* Counter-scale the text so the box morph doesn't stretch
                          it (framer scales the container; this keeps the glyphs at
                          their natural size). */}
                      <motion.span layout className="inline-block align-top">
                        {m.text}
                      </motion.span>
                    </ChatMessage>
                  ) : (
                    <ChatMessage key={i} from={m.from}>
                      {m.text}
                    </ChatMessage>
                  )
                )}
              </div>
            </div>

            {/* Queued messages — Sonner-style stack overlaying just above the
                composer. Collapsed it's a fixed-height pile (front card full,
                the rest peeking behind); hovering fans them into a list. Front
                card (queue[0]) is next to dispatch. Double-click edits, × removes. */}
            <AnimatePresence>
              {stackCount > 0 && (
                <motion.div
                  ref={stackRef}
                  className="absolute inset-x-0 z-10"
                  style={{ bottom: queuedInputH + 8 }}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    height: stackExpanded ? expandedStackH : collapsedStackH,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ ...springs.moderate, bounce: 0 }}
                  onMouseEnter={() => setStackHovered(true)}
                  onMouseLeave={() => setStackHovered(false)}
                >
                  {/* Queue affordance — sits in the left gutter, outside the
                      cards, aligned with the front (next-to-send) message to
                      signify these are waiting to be sent. */}
                  <div
                    className="pointer-events-none absolute bottom-0 left-0 flex items-center justify-center text-muted-foreground"
                    style={{ height: CARD_H, width: 28 }}
                  >
                    <CornerDownRight size={16} strokeWidth={2} />
                  </div>
                  <AnimatePresence initial={false}>
                    {queue.map((item, i) => {
                      const peek = Math.min(i, STACK_MAX_PEEK);
                      const isDragging = draggingId === item.id;
                      // While dragging, the card follows the pointer (dragY); the
                      // rest sit at their slots and shift to make room.
                      const target = stackExpanded
                        ? {
                            y: isDragging ? dragY : slotY(i),
                            scale: isDragging ? 1.03 : 1,
                            opacity: 1,
                          }
                        : {
                            y: -peek * STACK_PEEK,
                            scale: 1 - peek * STACK_SCALE,
                            opacity: i <= STACK_MAX_PEEK ? 1 : 0,
                          };
                      return (
                        <motion.div
                          key={item.id}
                          // Shared id with the sent bubble — when this card is the
                          // one that dispatches (the front), it morphs into the
                          // inline message. Safe alongside the manual transforms:
                          // every card's layout box is the same static absolute
                          // slot, so framer's layout projection stays identity.
                          layoutId={`qm-${item.id}`}
                          onDoubleClick={() => editQueuedMsg(item)}
                          // Press to grab; the window listeners (above) drive the
                          // follow + reorder and end the drag on release anywhere.
                          onPointerDown={(e) => {
                            if (!stackExpanded || e.button !== 0) return;
                            dragStartYRef.current = e.clientY;
                            setDragY(slotY(i));
                            setPointerDownId(item.id);
                          }}
                          initial={{ opacity: 0, y: 14, scale: 0.96 }}
                          animate={target}
                          exit={{
                            opacity: 0,
                            scale: 0.9,
                            transition: { duration: 0.12 },
                          }}
                          transition={
                            isDragging ? { duration: 0 } : springs.moderate
                          }
                          style={{
                            height: CARD_H,
                            transformOrigin: "bottom center",
                            zIndex: isDragging ? 200 : 100 - i,
                            cursor: stackExpanded ? "grab" : "default",
                          }}
                          // Same surface as a sent ChatMessage bubble, but muted
                          // text (not sent yet). Narrower than the composer, with
                          // a left gutter for the queue affordance icon.
                          className={`group/qm absolute bottom-0 left-7 right-0 flex select-none items-center gap-2 bg-[color-mix(in_oklab,var(--accent),var(--background)_45%)] px-3.5 text-[14px] text-muted-foreground shadow-surface-3 active:cursor-grabbing ${shape.bg}`}
                        >
                          {/* Attachments — small rounded thumbnails inside the
                              card. Works for 1 or many: up to 3 show, the rest
                              collapse into a +N tile. */}
                          {item.files.length > 0 && (
                            <div className="pointer-events-none flex shrink-0 items-center gap-1">
                              {item.files.slice(0, 3).map((f, fi) => (
                                <FileThumbnail
                                  key={`${f.name}-${f.size}-${fi}`}
                                  file={f}
                                  size={28}
                                  className="rounded-md"
                                />
                              ))}
                              {item.files.length > 3 && (
                                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-background/40 text-[11px] font-medium tabular-nums text-foreground/80">
                                  +{item.files.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                          <span className="pointer-events-none min-w-0 flex-1 truncate">
                            {item.text ||
                              `${item.files.length} attachment${
                                item.files.length === 1 ? "" : "s"
                              }`}
                          </span>
                          <Tooltip content="Remove" side="top">
                            <button
                              type="button"
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeQueuedMsg(item);
                              }}
                              aria-label={`Remove queued message: ${item.text}`}
                              className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-hover hover:text-foreground focus-visible:ring-1 focus-visible:ring-[#6B97FF]"
                            >
                              <XIcon size={14} strokeWidth={2.5} />
                            </button>
                          </Tooltip>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
            <InputMessage
              ref={queuedInputRef}
              className="absolute inset-x-0 bottom-0"
              value={queuedValue}
              onValueChange={setQueuedValue}
              status={chatStatus}
              queue={queue}
              onQueueChange={setQueue}
              showQueue={false}
              // Sent user turns, oldest first — ArrowUp/ArrowDown walk them.
              history={queuedChat
                .filter((m) => m.from === "user")
                .map((m) => m.text)}
              onSend={(text, _files, meta) => {
                if (text) respond(text, meta?.queuedId);
                setQueuedValue("");
              }}
              onStop={() => {
                clearStep();
                pausedRef.current = false;
                setPaused(false);
                // Finalize the in-flight assistant turn: if it never got past
                // thinking, mark it stopped; otherwise keep the partial text.
                setQueuedChat((c) => {
                  const next = [...c];
                  for (let k = next.length - 1; k >= 0; k--) {
                    if (next[k].from === "assistant") {
                      if (next[k].thinking || next[k].text === "") {
                        next[k] = { from: "assistant", text: "Stopped." };
                      } else {
                        next[k] = { ...next[k], thinking: false };
                      }
                      break;
                    }
                  }
                  return next;
                });
                setChatStatus("idle");
              }}
              placeholder="Send while I’m responding to queue a message…"
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Left Slot Only">
        <ComponentPreview code={leftOnlyCode} minHeightClass="min-h-[280px]">
          <div className="w-full max-w-xl">
            <InputMessage
              value={leftValue}
              onValueChange={setLeftValue}
              onSend={() => setLeftValue("")}
              leftSlot={
                <Button variant="ghost" size="icon-sm" aria-label="Attach">
                  <PlusIcon />
                </Button>
              }
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Right Slot Only">
        <ComponentPreview code={rightOnlyCode} minHeightClass="min-h-[280px]">
          <div className="w-full max-w-xl">
            <InputMessage
              value={rightValue}
              onValueChange={setRightValue}
              onSend={() => setRightValue("")}
              rightSlot={
                <Button variant="ghost" size="sm" trailingIcon={ChevronDownIcon}>
                  Sonnet 4.6
                </Button>
              }
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Send Handler">
        <ComponentPreview
          code={sendHandlerCode}
          minHeightClass="min-h-[280px]"
          playbackButton={
            messages.length > 0
              ? {
                  icon: <ResetIcon size={16} strokeWidth={1.5} />,
                  tooltip: "Clear messages",
                  onClick: () => setMessages([]),
                }
              : undefined
          }
        >
          <div className="w-full max-w-xl flex flex-col gap-3">
            {messages.length > 0 && (
              <div className="flex flex-col gap-2">
                {messages.map((m, i) => (
                  <ChatMessage key={i} from="user">
                    {m}
                  </ChatMessage>
                ))}
              </div>
            )}
            <InputMessage
              value={handlerValue}
              onValueChange={setHandlerValue}
              onSend={(text) => {
                if (text) setMessages((prev) => [...prev, text]);
                setHandlerValue("");
              }}
              placeholder="Press Enter to send. Shift+Enter for newline."
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Disabled">
        <ComponentPreview code={disabledCode} minHeightClass="min-h-[280px]">
          <div className="w-full max-w-xl">
            <InputMessage
              value="This composer is disabled"
              onValueChange={() => {}}
              disabled
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <PropsTable props={inputMessageProps} />
      </DocSection>
    </DocPage>
  );
}
