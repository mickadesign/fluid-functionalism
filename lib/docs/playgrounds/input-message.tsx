"use client";

import { useEffect, useRef, useState } from "react";
import {
  InputMessage,
  type QueuedMessage,
} from "@/registry/default/input-message";
import { ChatMessage } from "@/registry/default/chat-message";
import { Button } from "@/registry/radix/button";
import { Switch } from "@/registry/radix/switch";
import { Tooltip } from "@/registry/radix/tooltip";
import { useIcon } from "@/lib/icon-context";
import {
  PLAY_SWITCH,
  PlayDivider,
  PlayField,
  PlaySection,
  PlaySelect,
  PlaygroundPanel,
} from "@/lib/docs/playground";
import {
  QueuedStack,
  collapsedStackHeight,
  useQueueCardHeight,
} from "./queued-stack";
import type { PlaygroundProps } from "./types";

// ── InputMessage playground ──────────────────────────────
// A live sandbox: the controls drive a real InputMessage (floating over a
// small transcript on the doc page), with the matching code kept in sync in
// the doc page's Code tab.

export const SUGGESTIONS = [
  "What is Fluid Functionalism about?",
  "How does Micka tune the springs behind these animations?",
  "Install the InputMessage component in my project",
  "Draft a short thank-you note to Micka for the library",
];

export const PLACEHOLDER_PROMPT = "Why is every other input box so stiff?";

type PlayStatus = "off" | "idle" | "streaming";

function buildImPlaygroundCode(o: {
  suggestion: boolean;
  suggestionsOn: boolean;
  historyOn: boolean;
  leftSlot: boolean;
  rightSlot: boolean;
  attachments: boolean;
  minRows: number;
  disabled: boolean;
  status: PlayStatus;
}) {
  const queueOn = o.status !== "off";
  const filesOn = o.leftSlot || o.attachments;
  const imports = ["InputMessage", "ChatMessage"];
  if (o.leftSlot || o.rightSlot) imports.push("Button");
  if (o.leftSlot) imports.push("Tooltip");
  if (queueOn) imports.push("type QueuedMessage");

  const l: string[] = [];
  l.push(
    o.attachments
      ? `import { useEffect, useState } from "react";`
      : `import { useState } from "react";`
  );
  l.push(`import { ${imports.join(", ")} } from "./components";`);
  if (o.leftSlot || o.rightSlot)
    l.push(`import { useIcon } from "@/lib/icon-context";`);
  l.push(``);
  if (o.suggestionsOn) {
    l.push(`const SUGGESTIONS = [`);
    for (const s of SUGGESTIONS) l.push(`  ${JSON.stringify(s)},`);
    l.push(`];`);
    l.push(``);
  }
  l.push(`const [value, setValue] = useState("");`);
  l.push(`const [messages, setMessages] = useState<{ text: string; files: File[] }[]>([`);
  l.push(`  { text: "Make my input box feel less stiff", files: [] },`);
  l.push(`]);`);
  if (filesOn) l.push(`const [files, setFiles] = useState<File[]>([]);`);
  if (queueOn) {
    l.push(`const [queue, setQueue] = useState<QueuedMessage[]>([]);`);
    l.push(`const [status, setStatus] = useState<"idle" | "streaming">(${JSON.stringify(o.status)});`);
  }
  if (o.leftSlot) l.push(`const PlusIcon = useIcon("plus");`);
  if (o.rightSlot) l.push(`const ChevronDownIcon = useIcon("chevron-down");`);
  if (o.attachments) {
    l.push(``);
    l.push(`// Pre-fill the composer with a real image + PDF. Images use object-cover;`);
    l.push(`// PDFs render their first page via pdfjs. Both show the × remove button.`);
    l.push(`useEffect(() => {`);
    l.push(`  Promise.all([`);
    l.push(`    fetch("/micka.png")`);
    l.push(`      .then((r) => r.blob())`);
    l.push(`      .then((b) => new File([b], "micka.png", { type: "image/png" })),`);
    l.push(`    fetch("/Receipt-2581-4039-8265.pdf")`);
    l.push(`      .then((r) => r.blob())`);
    l.push(`      .then((b) => new File([b], "Receipt-2581-4039-8265.pdf", { type: "application/pdf" })),`);
    l.push(`  ]).then(setFiles);`);
    l.push(`}, []);`);
  }
  l.push(``);
  l.push(`<InputMessage`);
  l.push(`  value={value}`);
  l.push(`  onValueChange={setValue}`);
  l.push(`  onSend={(text, sent) => {`);
  l.push(`    if (text || sent.length) setMessages((m) => [...m, { text, files: sent }]);`);
  l.push(`    setValue("");`);
  if (filesOn) l.push(`    setFiles([]);`);
  l.push(`  }}`);
  if (o.suggestion)
    l.push(`  placeholderSuggestion=${JSON.stringify(PLACEHOLDER_PROMPT)}`);
  if (o.suggestionsOn) l.push(`  suggestions={SUGGESTIONS}`);
  if (o.historyOn)
    l.push(`  // ArrowUp recalls sent messages, ArrowDown walks back to the draft.`);
  if (o.historyOn) l.push(`  history={messages.map((m) => m.text).filter(Boolean)}`);
  if (o.minRows > 1) l.push(`  minRows={${o.minRows}}`);
  if (o.disabled) l.push(`  disabled`);
  if (filesOn) {
    l.push(`  files={files}`);
    l.push(`  onFilesChange={setFiles}`);
  }
  if (o.leftSlot) {
    l.push(`  leftSlot={({ openFilePicker }) => (`);
    l.push(`    <Tooltip content="Attach" side="top">`);
    l.push(`      <Button variant="ghost" size="icon-sm" aria-label="Attach files" onClick={() => openFilePicker()}>`);
    l.push(`        <PlusIcon />`);
    l.push(`      </Button>`);
    l.push(`    </Tooltip>`);
    l.push(`  )}`);
  }
  if (o.rightSlot) {
    l.push(`  rightSlot={`);
    l.push(`    <Button variant="ghost" size="sm" trailingIcon={ChevronDownIcon}>`);
    l.push(`      Sonnet 5`);
    l.push(`    </Button>`);
    l.push(`  }`);
  }
  if (queueOn) {
    l.push(`  // While streaming, submits enqueue; flipping back to idle dispatches`);
    l.push(`  // the head of the queue through onSend.`);
    l.push(`  status={status}`);
    l.push(`  queue={queue}`);
    l.push(`  onQueueChange={setQueue}`);
    l.push(`  onStop={() => setStatus("idle")}`);
    l.push(`  // Suppress the built-in queue rows and render the queue yourself —`);
    l.push(`  // e.g. the stacked cards above the composer (see Queued messages).`);
    l.push(`  showQueue={false}`);
  }
  l.push(`/>`);
  return l.join("\n");
}

export function InputMessagePlayground({ children }: PlaygroundProps) {
  const PlusIcon = useIcon("plus");
  const ChevronDownIcon = useIcon("chevron-down");

  const [suggestion, setSuggestion] = useState(true);
  const [suggestionsOn, setSuggestionsOn] = useState(true);
  const [historyOn, setHistoryOn] = useState(true);
  const [minRows, setMinRows] = useState("1");
  const [disabled, setDisabled] = useState(false);
  const [leftSlotOn, setLeftSlotOn] = useState(true);
  const [rightSlotOn, setRightSlotOn] = useState(false);
  const [attachments, setAttachments] = useState(false);
  const [status, setStatus] = useState<PlayStatus>("off");

  const [value, setValue] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const filesOn = leftSlotOn || attachments;

  // "Attachments" toggle pre-fills the composer with a real image + PDF
  // (fetched once from public assets, then cached).
  const sampleFilesRef = useRef<File[] | null>(null);
  useEffect(() => {
    if (!attachments) {
      setFiles([]);
      return;
    }
    let cancelled = false;
    (async () => {
      if (!sampleFilesRef.current) {
        sampleFilesRef.current = await Promise.all([
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
        ]);
      }
      if (!cancelled) setFiles(sampleFilesRef.current);
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [attachments]);
  const [queue, setQueue] = useState<QueuedMessage[]>([]);
  // Seed one sent message so the transcript (and ArrowUp history recall)
  // reads at a glance.
  const [messages, setMessages] = useState<{ text: string; files: File[] }[]>([
    { text: "Make my input box feel less stiff", files: [] },
  ]);

  const queueOn = status !== "off";
  const cardH = useQueueCardHeight();

  // Float the composer over the transcript (same treatment as the demos
  // below): measure it to reserve scroll padding and position the queue
  // stack, and keep the transcript pinned to the latest message.
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

  // Double-click a queued card to pull it back into the composer.
  const editQueued = (item: QueuedMessage) => {
    setValue(item.text);
    if (filesOn) setFiles(item.files);
    setQueue((q) => q.filter((x) => x.id !== item.id));
    requestAnimationFrame(() => {
      const el = inputRef.current?.querySelector("textarea");
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  };

  const code = buildImPlaygroundCode({
    suggestion,
    suggestionsOn,
    historyOn,
    leftSlot: leftSlotOn,
    rightSlot: rightSlotOn,
    attachments,
    minRows: Number(minRows),
    disabled,
    status,
  });

  const randomize = () => {
    const pick = <T,>(arr: readonly T[]) =>
      arr[Math.floor(Math.random() * arr.length)];
    setSuggestion(Math.random() > 0.3);
    setSuggestionsOn(Math.random() > 0.3);
    setHistoryOn(Math.random() > 0.4);
    setMinRows(pick(["1", "1", "2", "3"] as const));
    setDisabled(false);
    setLeftSlotOn(Math.random() > 0.4);
    setRightSlotOn(Math.random() > 0.5);
    setAttachments(Math.random() > 0.7);
    setStatus(pick(["off", "off", "idle", "streaming"] as const));
  };

  const controls = (
    <PlaygroundPanel onShuffle={randomize}>
      <PlaySection label="Composer" />
      <div>
        <Switch
          label="Placeholder suggestion"
          checked={suggestion}
          onToggle={() => setSuggestion((v) => !v)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Suggested prompts"
          checked={suggestionsOn}
          onToggle={() => setSuggestionsOn((v) => !v)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="History recall"
          checked={historyOn}
          onToggle={() => setHistoryOn((v) => !v)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Attachments"
          checked={attachments}
          onToggle={() => setAttachments((v) => !v)}
          className={PLAY_SWITCH}
        />
        <PlayField label="Min rows">
          <PlaySelect
            value={minRows}
            onChange={setMinRows}
            options={[
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "3", label: "3" },
            ]}
          />
        </PlayField>
        <Switch
          label="Disabled"
          checked={disabled}
          onToggle={() => setDisabled((v) => !v)}
          className={PLAY_SWITCH}
        />
      </div>

      <PlayDivider />

      <PlaySection label="Slots" />
      <div>
        <Switch
          label="Left slot"
          checked={leftSlotOn}
          onToggle={() => setLeftSlotOn((v) => !v)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Right slot"
          checked={rightSlotOn}
          onToggle={() => setRightSlotOn((v) => !v)}
          className={PLAY_SWITCH}
        />
      </div>

      <PlayDivider />

      <PlaySection label="Queue" />
      <div>
        <PlayField label="Status">
          <PlaySelect
            value={status}
            onChange={(v) => setStatus(v as PlayStatus)}
            options={[
              { value: "off", label: "Off" },
              { value: "idle", label: "Idle" },
              { value: "streaming", label: "Streaming" },
            ]}
          />
        </PlayField>
      </div>
    </PlaygroundPanel>
  );

  // Everything below `ref`/`className` is identical between the two previews —
  // one composer, one set of state.
  const composerProps = {
    value,
    onValueChange: setValue,
    onSend: (text: string, sent: File[]) => {
      if (text || sent.length)
        setMessages((m) => [...m, { text, files: sent }]);
      setValue("");
      if (filesOn) setFiles([]);
    },
    placeholderSuggestion: suggestion ? PLACEHOLDER_PROMPT : undefined,
    suggestions: suggestionsOn ? SUGGESTIONS : undefined,
    history: historyOn
      ? messages.map((m) => m.text).filter(Boolean)
      : undefined,
    minRows: Number(minRows),
    disabled,
    files: filesOn ? files : undefined,
    onFilesChange: filesOn ? setFiles : undefined,
    leftSlot: leftSlotOn
      ? ({ openFilePicker }: { openFilePicker: () => void }) => (
          <Tooltip content="Attach" side="top">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Attach files"
              onClick={() => openFilePicker()}
            >
              <PlusIcon />
            </Button>
          </Tooltip>
        )
      : undefined,
    rightSlot: rightSlotOn ? (
      <Button variant="ghost" size="sm" trailingIcon={ChevronDownIcon}>
        Sonnet 5
      </Button>
    ) : undefined,
    status: queueOn ? (status as "idle" | "streaming") : undefined,
    queue: queueOn ? queue : undefined,
    onQueueChange: queueOn ? setQueue : undefined,
    onStop: queueOn ? () => setStatus("idle") : undefined,
  } as const;

  const preview = (
    <div className="relative w-full self-stretch">
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto scrollbar-hide"
      >
        <div
          className="flex min-h-full flex-col justify-start gap-2"
          style={{
            paddingBottom:
              inputH +
              8 +
              (queueOn && queue.length > 0
                ? collapsedStackHeight(queue.length, cardH) + 8
                : 0),
          }}
        >
          {messages.map((m, i) => (
            <ChatMessage key={i} from="user" files={m.files}>
              {m.text}
            </ChatMessage>
          ))}
        </div>
      </div>
      {queueOn && (
        <QueuedStack
          queue={queue}
          onQueueChange={setQueue}
          onEdit={editQueued}
          onRemove={(item) =>
            setQueue((q) => q.filter((x) => x.id !== item.id))
          }
          bottom={inputH + 8}
        />
      )}
      <InputMessage
        ref={inputRef}
        className="absolute inset-x-0 bottom-0"
        {...composerProps}
        showQueue={false}
      />
    </div>
  );

  // Compact variant for the demo slide: the same state-driven composer,
  // without the transcript — the built-in queue rows stand in for the
  // stacked-cards demo.
  //
  // The composer is pinned to the TOP of a fixed-height stage rather than laid
  // out in flow. Its height changes constantly — the suggestion list sits
  // inside the box below the textarea and collapses on the first keystroke —
  // and inside the demo card's centered preview area that re-centers the whole
  // box, sliding the input row out from under the cursor as you type. Anchoring
  // the top keeps the textarea still while the list collapses beneath it.
  const demoPreview = (
    <div className="relative h-[340px] w-full max-w-[440px]">
      <InputMessage className="absolute inset-x-0 top-0" {...composerProps} />
    </div>
  );

  return children({ preview, demoPreview, controls, code });
}
