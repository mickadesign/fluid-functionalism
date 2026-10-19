"use client";

import { useEffect, useRef, useState } from "react";
import { InputMessage } from "@/registry/default/input-message";
import { ChatMessage } from "@/registry/default/chat-message";
import { Button } from "@/registry/radix/button";
import { useIcon } from "@/lib/icon-context";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { PlaygroundLayout } from "@/lib/docs/playground";
import {
  InputMessagePlayground,
  SUGGESTIONS,
} from "@/lib/docs/playgrounds/input-message";
import { QueuedChatDemo } from "./queued-chat-demo";
import { inputMessageProps } from "@/lib/docs/api/input-message";

const basicCode = `import { useState } from "react";
import { InputMessage } from "./components";

const [value, setValue] = useState("");

<div className="w-full max-w-xl">
  <InputMessage
    value={value}
    onValueChange={setValue}
    onSend={(text) => console.log("send:", text)}
  />
</div>`;

const suggestionsCode = `import { useState } from "react";
import { InputMessage } from "./components";

const SUGGESTIONS = [
  "What is Fluid Functionalism about?",
  "How does Micka tune the springs behind these animations?",
  "Install the InputMessage component in my project",
  "Draft a short thank-you note to Micka for the library",
];

const [value, setValue] = useState("");

<div className="w-full max-w-xl">
  <InputMessage
    value={value}
    onValueChange={setValue}
    onSend={() => setValue("")}
    // The ghost placeholder renders with a Tab keycap — Tab fills it into the
    // composer. ArrowDown/ArrowUp walk the list below (focus stays in the
    // textarea) and Enter or click fills the highlighted prompt; the first row
    // shows a ↓ hint until a row is highlighted. Typing collapses the list.
    placeholderSuggestion="Why is every other input box so stiff?"
    suggestions={SUGGESTIONS}
  />
</div>`;

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
    fetch("/micka.png")
      .then((r) => r.blob())
      .then((b) => new File([b], "micka.png", { type: "image/png" })),
    fetch("/Receipt-2581-4039-8265.pdf")
      .then((r) => r.blob())
      .then((b) => new File([b], "Receipt-2581-4039-8265.pdf", { type: "application/pdf" })),
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

const leftOnlyCode = `import { useState } from "react";
import { InputMessage } from "./components";
import { Button } from "./components";
import { useIcon } from "@/lib/icon-context";

const [value, setValue] = useState("");
const PlusIcon = useIcon("plus");

<div className="w-full max-w-xl">
  <InputMessage
    value={value}
    onValueChange={setValue}
    leftSlot={
      <Button variant="ghost" size="icon-sm" aria-label="Attach">
        <PlusIcon />
      </Button>
    }
  />
</div>`;

const rightOnlyCode = `import { useState } from "react";
import { InputMessage } from "./components";
import { Button } from "./components";
import { useIcon } from "@/lib/icon-context";

const [value, setValue] = useState("");
const ChevronDownIcon = useIcon("chevron-down");

<div className="w-full max-w-xl">
  <InputMessage
    value={value}
    onValueChange={setValue}
    rightSlot={
      <Button variant="ghost" size="sm" trailingIcon={ChevronDownIcon}>
        Sonnet 4.6
      </Button>
    }
  />
</div>`;

const sendHandlerCode = `import { useState } from "react";
import { InputMessage, ChatMessage } from "./components";

const [value, setValue] = useState("");
const [messages, setMessages] = useState<string[]>([]);

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
    value={value}
    onValueChange={setValue}
    onSend={(text) => {
      if (text) setMessages((prev) => [...prev, text]);
      setValue("");
    }}
    placeholder="Press Enter to send. Shift+Enter for newline."
  />
</div>`;

const queuedCode = `import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { spring } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import { useIcon } from "@/lib/icon-context";
import {
  InputMessage, ChatMessage, ThinkingIndicator, FileThumbnail, type QueuedMessage,
} from "./components";

// Sent turns dispatched from the queue keep their queued id, so the front
// stack card and the sent bubble can share a layoutId and morph.
type Turn = { from: "user" | "assistant"; text: string; thinking?: boolean; id?: string };

// ── Stack geometry. Collapsed: the front card plus up to 2 peeks behind it
// (12px offsets); expanded: every card in its own slot with 8px gaps.
const CARD_H = 44; // 38 at the compact size step (useQueueCardHeight)
const PEEK = 12;
const GAP = 8;
const MAX_PEEK = 2;

const PencilIcon = useIcon("pencil");
const XIcon = useIcon("x");
const CornerDownRightIcon = useIcon("corner-down-right");

const [value, setValue] = useState("");
const [queue, setQueue] = useState<QueuedMessage[]>([]);
const [status, setStatus] = useState<"idle" | "streaming">("idle");
const [chat, setChat] = useState<Turn[]>([]);
// The message currently playing its queued→sent morph. Morph props apply ONLY
// to this one, ONLY briefly — otherwise every transcript reflow would re-fire
// the layout animation on the settled bubble.
const [morphingId, setMorphingId] = useState<string | null>(null);
const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

// Stand-in for a real assistant: append the user turn plus an assistant
// placeholder in its "thinking" state, hold there for a beat, then stream the
// reply in word-by-word. The final streaming→idle edge releases the next
// queued message.
const respond = (text: string, queuedId?: string) => {
  const reply = \`Replying to "\${text}". A fuller answer that streams in…\`;
  setChat((c) => [...c, { from: "user", text, id: queuedId }, { from: "assistant", text: "", thinking: true }]);
  setStatus("streaming");

  // A dispatched (from-queue) message morphs from its stack card: flag it,
  // then drop the morph props once the transition has settled.
  if (queuedId) {
    setMorphingId(queuedId);
    timers.current.push(setTimeout(() => setMorphingId(null), 450));
  }

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

// Float the composer over the transcript: measure it to reserve scroll
// padding and to position the queue stack, and keep the transcript pinned.
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
}, [chat, inputH, queue]);

// Derived stack heights: the collapsed pile and the fanned-out column.
const collapsedStackH =
  CARD_H + Math.min(Math.max(queue.length - 1, 0), MAX_PEEK) * PEEK;
const expandedStackH =
  queue.length * CARD_H + Math.max(queue.length - 1, 0) * GAP;
// Collapsed, anything past the front card + peeks is hidden — surface that
// overflow as a count on the gutter arrow.
const hiddenCount = Math.max(0, queue.length - (MAX_PEEK + 1));

// Hover fans the stack out (tap-to-expand on touch, where the edit/remove
// group is also always shown); dragging a card reorders it. The pointer
// wiring — window pointermove/up listeners that pick the hovered slot into
// \`queue\` and track \`dragY\` — is elided; the motion targets below are the
// load-bearing part.
const [hovered, setHovered] = useState(false);
const [draggingId, setDraggingId] = useState<string | null>(null);
const [dragY, setDragY] = useState(0);
const expanded = hovered || draggingId !== null;

// Enqueue recoil: once the collapsed pile hits its peek cap a new message
// lands out of sight — recoil the whole stack on growth so it's still felt.
const stackBump = useAnimationControls();
const prevCount = useRef(queue.length);
useEffect(() => {
  const prev = prevCount.current;
  prevCount.current = queue.length;
  if (queue.length > prev && prev > 0 && !expanded) {
    stackBump.set({ y: -7 });
    stackBump.start({
      y: 0,
      transition: { type: "spring", duration: 0.42, bounce: 0.5 },
    });
  }
}, [queue.length]);

const editQueued = (item: QueuedMessage) => {
  setValue(item.text);
  setQueue((q) => q.filter((x) => x.id !== item.id));
};
const removeQueued = (item: QueuedMessage) =>
  setQueue((q) => q.filter((x) => x.id !== item.id));

<div className="relative w-full self-stretch">
  <div ref={scrollRef} className="absolute inset-0 overflow-y-auto scrollbar-hide">
    <div
      className="flex min-h-full flex-col justify-start gap-2"
      // Reserve room under the transcript for the floating composer, plus the
      // collapsed stack while anything is queued.
      style={{ paddingBottom: inputH + 8 + (queue.length > 0 ? collapsedStackH + 8 : 0) }}
    >
      {chat.map((m, i) =>
        m.thinking ? (
          <ChatMessage key={i} from="assistant">
            <ThinkingIndicator showIcon={false} className="px-0 py-0" />
          </ChatMessage>
        ) : m.id && m.id === morphingId ? (
          // Queued→sent morph: the bubble shares the stack card's layoutId;
          // the inner span is layout-corrected so the text doesn't stretch
          // with the box scale.
          <ChatMessage
            key={i}
            from={m.from}
            layoutId={\`qm-\${m.id}\`}
            layout
            initial={false}
            transition={spring.moderate}
          >
            <motion.span layout className="inline-block align-top">
              {m.text}
            </motion.span>
          </ChatMessage>
        ) : (
          <ChatMessage key={i} from={m.from}>{m.text}</ChatMessage>
        )
      )}
    </div>
  </div>

  {/* Render the queue yourself as a Sonner-style stack overlaying just above
      the composer: a pile that fans out on hover. Front card (queue[0]) is
      next to dispatch. Double-click edits, × removes, drag reorders. */}
  <AnimatePresence>
    {queue.length > 0 && (
      <motion.div
        className="absolute inset-x-0 z-10"
        style={{ bottom: inputH + 8 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, height: expanded ? expandedStackH : collapsedStackH }}
        exit={{ opacity: 0 }}
        transition={{ ...spring.moderate, bounce: 0 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Recoils as a whole on enqueue (see stackBump above). */}
        <motion.div animate={stackBump} className="absolute inset-0">
          {/* 40px gutter column: a ↳ arrow, with the total count fading in
              beside it once cards overflow the visible peeks. */}
          <div
            className="absolute bottom-0 left-0 flex items-center justify-end gap-1 pr-1 text-muted-foreground"
            style={{ height: CARD_H, width: 40 }}
          >
            <AnimatePresence>
              {hiddenCount > 0 && (
                <motion.span
                  key="count"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={spring.fast}
                  className="pointer-events-none text-[10px] leading-none tabular-nums text-muted-foreground"
                  style={{ fontVariationSettings: fontWeights.semibold }}
                >
                  {queue.length}
                </motion.span>
              )}
            </AnimatePresence>
            <CornerDownRightIcon size={16} strokeWidth={2} />
          </div>
          <AnimatePresence initial={false}>
            {queue.map((item, i) => {
              const peek = Math.min(i, MAX_PEEK);
              const isDragging = draggingId === item.id;
              const target = expanded
                ? {
                    y: isDragging ? dragY : -i * (CARD_H + GAP),
                    scale: isDragging ? 1.03 : 1,
                    opacity: 1,
                  }
                : { y: -peek * PEEK, scale: 1 - peek * 0.05, opacity: i <= MAX_PEEK ? 1 : 0 };
              return (
                <motion.div
                  key={item.id}
                  // Morph target, shared with the sent bubble — text-only cards
                  // only (attachment layouts differ too much), and dropped
                  // while any drag is in progress (framer's layout projection
                  // fights the animated y otherwise).
                  layoutId={
                    draggingId === null && item.files.length === 0
                      ? \`qm-\${item.id}\`
                      : undefined
                  }
                  onDoubleClick={() => editQueued(item)}
                  initial={{ opacity: 0, y: 14, scale: 0.96 }}
                  animate={target}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.12 } }}
                  transition={isDragging ? { duration: 0 } : spring.moderate}
                  style={{
                    height: CARD_H,
                    transformOrigin: "bottom center",
                    zIndex: isDragging ? 200 : 100 - i,
                    cursor: expanded ? "grab" : "default",
                  }}
                  // left-10/right-10 = equal 40px gutters (the left one holds
                  // the arrow column). rounded-[20px] is the shape.bg token;
                  // pl-2 squares the padding around attachment thumbnails.
                  // Compact step: gap-1.5, pl-3 (pl-1.5 with files), pr-1.
                  className={\`group/qm absolute bottom-0 left-10 right-10 flex select-none items-center gap-2 \${
                    item.files.length > 0 ? "pl-2" : "pl-3.5"
                  } pr-1.5 rounded-[20px] bg-[color-mix(in_oklab,var(--accent),var(--background)_68%)] text-subtitle text-muted-foreground shadow-surface-3 active:cursor-grabbing\`}
                >
                  {/* Attachments: small thumbnails (28px; 24 at the compact
                      step), then a +N chip past 3. */}
                  {item.files.length > 0 && (
                    <div className="pointer-events-none flex shrink-0 items-center gap-1">
                      {item.files.slice(0, 3).map((f, fi) => (
                        <FileThumbnail key={fi} file={f} size={28} radius={12} />
                      ))}
                      {item.files.length > 3 && (
                        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-background/40 text-[11px] leading-3.5 tabular-nums text-foreground">
                          +{item.files.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  <span className="pointer-events-none min-w-0 flex-1 truncate">{item.text}</span>
                  {/* Edit + remove, revealed on hover (always shown on touch,
                      where there is no hover). */}
                  <div className="hidden shrink-0 items-center gap-1 group-hover/qm:flex">
                    <button
                      type="button"
                      onClick={() => editQueued(item)}
                      aria-label={\`Edit queued message: \${item.text}\`}
                      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-hover hover:text-foreground focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
                    >
                      <PencilIcon size={14} strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeQueued(item)}
                      aria-label={\`Remove queued message: \${item.text}\`}
                      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-hover hover:text-foreground focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
                    >
                      <XIcon size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>

  <InputMessage
    ref={inputRef}
    className="absolute inset-x-0 bottom-0"
    value={value}
    onValueChange={setValue}
    status={status}
    queue={queue}
    onQueueChange={setQueue}
    showQueue={false} // render the queue yourself (the stack above) instead
    // Sent user turns, oldest first — ArrowUp/ArrowDown recall them.
    history={chat.filter((m) => m.from === "user").map((m) => m.text)}
    // While idle this sends; the component also calls onSend itself to
    // auto-dispatch the head of the queue on each streaming→idle edge —
    // meta.queuedId tags those so the morph can find its stack card, and a
    // dispatch must leave any in-progress draft untouched.
    onSend={(text, files, meta) => {
      if (text) respond(text, meta?.queuedId);
      if (!meta?.queuedId) setValue("");
    }}
    // Stop ends the current response; returning to idle immediately releases
    // the next queued message.
    onStop={() => { timers.current.forEach(clearTimeout); setStatus("idle"); }}
    placeholder="Send while I'm responding to queue a message…"
  />
</div>

// Queue interactions: double-click (or Enter/F2) a row to edit it back into
// the composer, × (or Delete) to remove, drag or Alt+↑/↓ to reorder.`;

const disabledCode = `import { InputMessage } from "./components";

<div className="w-full max-w-xl">
  <InputMessage
    value="This composer is disabled"
    onValueChange={() => {}}
    disabled
  />
</div>`;

// ── Playground ───────────────────────────────────────────
// The state + controls live in the shared module (lib/docs/playgrounds) so
// the /demo slide can drive the same sandbox from its pen menu; this page
// wraps the live preview in ComponentPreview with the synced code snippet.

function InputMessagePlaygroundSection() {
  return (
    <InputMessagePlayground>
      {({ preview, controls, code }) => (
        <PlaygroundLayout
          controls={controls}
          preview={
            <ComponentPreview
              code={code}
              padding="compact"
              minHeightClass="h-[560px]"
              align="bottom"
            >
              {preview}
            </ComponentPreview>
          }
        />
      )}
    </InputMessagePlayground>
  );
}

export default function InputMessageDoc() {
  const [basicValue, setBasicValue] = useState("");
  const [suggestValue, setSuggestValue] = useState("");
  const [leftValue, setLeftValue] = useState("");
  const [rightValue, setRightValue] = useState("");
  const [handlerValue, setHandlerValue] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

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
      fetch("/Receipt-2581-4039-8265.pdf")
        .then((r) => r.blob())
        .then(
          (b) =>
            new File([b], "Receipt-2581-4039-8265.pdf", {
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

  const PlusIcon = useIcon("plus");
  const ChevronDownIcon = useIcon("chevron-down");
  const ResetIcon = useIcon("rotate-ccw");

  return (
    <DocPage
      title="InputMessage"
      slug="input-message"
      description="Chat-style message composer with an auto-resizing textarea, flexible left/right action slots, and a built-in send button on a Surface-2 substrate."
    >
      <DocSection title="Playground">
        <InputMessagePlaygroundSection />
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

      <DocSection title="Suggestions">
        <ComponentPreview code={suggestionsCode} minHeightClass="min-h-[360px]">
          <div className="w-full max-w-xl">
            <InputMessage
              value={suggestValue}
              onValueChange={setSuggestValue}
              onSend={() => setSuggestValue("")}
              placeholderSuggestion="Why is every other input box so stiff?"
              suggestions={SUGGESTIONS}
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
        <QueuedChatDemo code={queuedCode} />
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
