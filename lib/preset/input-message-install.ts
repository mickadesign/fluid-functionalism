// ---------------------------------------------------------------------------
// Install-grade code generation for InputMessage presets. Where the
// playground's buildImPlaygroundCode emits a TEACHING snippet (free
// identifiers, "./components" imports), this emits COMPILABLE files: a chat
// composer floating over a transcript (the exact structure the playground
// previews), wired per the preset — suggestions, history recall, attachment
// wiring, slots, and (in queue mode) the shipped QueuedStack block with the
// queued→sent morph — plus a provider page.
// tests/preset-input-message.test.mjs compiles the output across the state
// space.
// ---------------------------------------------------------------------------

import type { PresetFile } from "./sidebar-install";
import type { PresetGenerator } from "./generators";
import {
  type InputMessagePreset,
  IM_SUGGESTIONS,
  IM_PLACEHOLDER_PROMPT,
  IM_SEED_MESSAGE,
} from "./input-message-options";

export type { PresetFile };

const USER_BUBBLE_CLASS =
  "whitespace-pre-wrap break-words px-3.5 py-2 text-[14px] text-pretty bg-[color-mix(in_oklab,var(--accent),var(--background)_45%)] text-foreground";

function composerFile(p: InputMessagePreset): string {
  const queueOn = p.status !== "off";
  const filesOn = p.leftSlot || p.attachments;
  const slots = p.leftSlot || p.rightSlot;

  const l: string[] = [];
  l.push(`"use client";`);
  l.push(``);
  l.push(`import { useEffect, useRef, useState } from "react";`);
  if (queueOn) l.push(`import { motion } from "motion/react";`);
  l.push(
    `import { InputMessage${queueOn ? ", type QueuedMessage" : ""} } from "@/components/ui/input-message";`
  );
  if (slots) l.push(`import { Button } from "@/components/ui/button";`);
  if (p.leftSlot) l.push(`import { Tooltip } from "@/components/ui/tooltip";`);
  if (filesOn)
    l.push(`import { FileThumbnail } from "@/components/ui/file-thumbnail";`);
  if (queueOn) {
    l.push(`import {`);
    l.push(`  QueuedStack,`);
    l.push(`  collapsedStackHeight,`);
    l.push(`  useQueueCardHeight,`);
    l.push(`} from "@/components/queued-stack";`);
  }
  if (slots) l.push(`import { useIcons } from "@/lib/icon-context";`);
  l.push(`import { useShape } from "@/lib/shape-context";`);
  if (queueOn) l.push(`import { spring } from "@/lib/springs";`);
  l.push(``);

  if (p.suggestionsOn) {
    l.push(`const SUGGESTIONS = [`);
    for (const s of IM_SUGGESTIONS) l.push(`  ${JSON.stringify(s)},`);
    l.push(`];`);
    l.push(``);
  }

  l.push(`interface Message {`);
  if (queueOn) {
    l.push(`  id: string;`);
    l.push(`  from: "user" | "assistant";`);
  }
  l.push(`  text: string;`);
  if (filesOn) l.push(`  files: File[];`);
  l.push(`}`);
  l.push(``);

  l.push(`export function ChatComposer() {`);
  l.push(`  const shape = useShape();`);
  if (slots) l.push(`  const icons = useIcons();`);
  if (p.leftSlot) l.push(`  const PlusIcon = icons.plus;`);
  if (p.rightSlot) l.push(`  const ChevronDownIcon = icons["chevron-down"];`);
  if (queueOn) l.push(`  const cardH = useQueueCardHeight();`);
  l.push(`  const [value, setValue] = useState("");`);
  const seed = queueOn
    ? `    { id: "seed", from: "user", text: ${JSON.stringify(IM_SEED_MESSAGE)}${filesOn ? ", files: []" : ""} },`
    : `    { text: ${JSON.stringify(IM_SEED_MESSAGE)}${filesOn ? ", files: []" : ""} },`;
  l.push(`  const [messages, setMessages] = useState<Message[]>([`);
  l.push(seed);
  l.push(`  ]);`);
  if (filesOn) l.push(`  const [files, setFiles] = useState<File[]>([]);`);
  if (queueOn) {
    l.push(`  const [queue, setQueue] = useState<QueuedMessage[]>([]);`);
    if (p.status === "streaming") {
      l.push(`  // Seeded mid-stream (the preset's configuration): sends enqueue`);
      l.push(`  // immediately; Stop flips to idle and dispatches the head.`);
    }
    l.push(
      `  const [status, setStatus] = useState<"idle" | "streaming">(${JSON.stringify(p.status)});`
    );
    l.push(``);
    l.push(`  // The id of the message currently playing its queued→sent morph. The`);
    l.push(`  // morph props are applied ONLY to this one, ONLY for the brief`);
    l.push(`  // transition — then cleared, so a settled bubble never re-animates its`);
    l.push(`  // layout when the transcript reflows underneath it.`);
    l.push(`  const [morphingId, setMorphingId] = useState<string | null>(null);`);
    l.push(`  const morphTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);`);
    l.push(`  useEffect(`);
    l.push(`    () => () => {`);
    l.push(`      if (morphTimerRef.current) clearTimeout(morphTimerRef.current);`);
    l.push(`    },`);
    l.push(`    []`);
    l.push(`  );`);
    l.push(``);
    l.push(`  // Fake reply — swap for your backend. The streaming → idle edge is what`);
    l.push(`  // auto-dispatches the next queued message through onSend.`);
    l.push(`  const replyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);`);
    l.push(`  useEffect(`);
    l.push(`    () => () => {`);
    l.push(`      if (replyTimerRef.current) clearTimeout(replyTimerRef.current);`);
    l.push(`    },`);
    l.push(`    []`);
    l.push(`  );`);
    l.push(`  const respond = (text: string) => {`);
    l.push(`    setStatus("streaming");`);
    l.push(`    replyTimerRef.current = setTimeout(() => {`);
    l.push(`      setMessages((m) => [`);
    l.push(`        ...m,`);
    l.push(`        {`);
    l.push(`          id: crypto.randomUUID(),`);
    l.push(`          from: "assistant",`);
    l.push(
      `          text: \`Replying to “\${text}” — swap this stub for your backend.\`,`
    );
    if (filesOn) l.push(`          files: [],`);
    l.push(`        },`);
    l.push(`      ]);`);
    l.push(`      setStatus("idle");`);
    l.push(`    }, 2600);`);
    l.push(`  };`);
  }
  if (p.attachments) {
    l.push(``);
    l.push(`  // Pre-fill the composer with sample attachments — swap the URLs for`);
    l.push(`  // assets of your own. Images use object-cover; PDFs render page 1.`);
    l.push(`  useEffect(() => {`);
    l.push(`    Promise.all([`);
    l.push(`      fetch("/sample.png")`);
    l.push(`        .then((r) => r.blob())`);
    l.push(`        .then((b) => new File([b], "sample.png", { type: "image/png" })),`);
    l.push(`      fetch("/sample.pdf")`);
    l.push(`        .then((r) => r.blob())`);
    l.push(
      `        .then((b) => new File([b], "sample.pdf", { type: "application/pdf" })),`
    );
    l.push(`    ])`);
    l.push(`      .then(setFiles)`);
    l.push(`      .catch(() => {});`);
    l.push(`  }, []);`);
  }
  l.push(``);
  l.push(`  // Float the composer over the transcript: measure it to reserve scroll`);
  l.push(
    queueOn
      ? `  // padding (plus the collapsed queue stack) and to position the stack, and`
      : `  // padding, and keep the transcript pinned to the latest message.`
  );
  if (queueOn) l.push(`  // keep the transcript pinned to the latest message.`);
  l.push(`  const inputRef = useRef<HTMLDivElement>(null);`);
  l.push(`  const [inputH, setInputH] = useState(0);`);
  l.push(`  useEffect(() => {`);
  l.push(`    const el = inputRef.current;`);
  l.push(`    if (!el) return;`);
  l.push(`    const ro = new ResizeObserver(() => setInputH(el.offsetHeight));`);
  l.push(`    ro.observe(el);`);
  l.push(`    setInputH(el.offsetHeight);`);
  l.push(`    return () => ro.disconnect();`);
  l.push(`  }, []);`);
  l.push(``);
  l.push(`  const scrollRef = useRef<HTMLDivElement>(null);`);
  l.push(`  useEffect(() => {`);
  l.push(`    const el = scrollRef.current;`);
  l.push(`    if (el) el.scrollTop = el.scrollHeight;`);
  if (queueOn) {
    l.push(`    // \`queue\` is a dep: enqueuing grows the reserved bottom padding,`);
    l.push(`    // which must re-pin the scroll too.`);
  }
  l.push(`  }, [messages, inputH${queueOn ? ", queue" : ""}]);`);
  if (queueOn) {
    l.push(``);
    l.push(`  // Double-click a queued card (or its ✎) to pull it back into the composer.`);
    l.push(`  const editQueued = (item: QueuedMessage) => {`);
    l.push(`    setValue(item.text);`);
    if (filesOn) l.push(`    setFiles(item.files);`);
    l.push(`    setQueue((q) => q.filter((x) => x.id !== item.id));`);
    l.push(`    requestAnimationFrame(() => {`);
    l.push(`      const el = inputRef.current?.querySelector("textarea");`);
    l.push(`      if (el) {`);
    l.push(`        el.focus();`);
    l.push(`        el.setSelectionRange(el.value.length, el.value.length);`);
    l.push(`      }`);
    l.push(`    });`);
    l.push(`  };`);
    l.push(``);
    l.push(`  // Height of the collapsed queue pile — reserved under the transcript`);
    l.push(`  // alongside the composer.`);
    l.push(`  const collapsedStackH = collapsedStackHeight(queue.length, cardH);`);
  }
  l.push(``);

  // ── JSX ──
  l.push(`  return (`);
  l.push(`    <div className="relative w-full self-stretch">`);
  l.push(`      <div ref={scrollRef} className="absolute inset-0 overflow-y-auto scrollbar-hide">`);
  l.push(`        <div`);
  l.push(`          className="flex min-h-full flex-col justify-start gap-2"`);
  l.push(
    queueOn
      ? `          style={{ paddingBottom: inputH + 8 + (queue.length > 0 ? collapsedStackH + 8 : 0) }}`
      : `          style={{ paddingBottom: inputH + 8 }}`
  );
  l.push(`        >`);
  const filesBlock = (ind: string) => [
    `${ind}{m.files.length > 0 && (`,
    `${ind}  <div className="flex flex-wrap justify-end gap-1.5">`,
    `${ind}    {m.files.map((file, fi) => (`,
    "" + ind + "      <FileThumbnail key={`${file.name}-${fi}`} file={file} size={64} />",
    `${ind}    ))}`,
    `${ind}  </div>`,
    `${ind})}`,
  ];
  const userBubble = (ind: string, key: string) => {
    const out: string[] = [];
    out.push(
      `${ind}<div ${key} className="flex max-w-[80%] flex-col items-end gap-1.5 self-end">`
    );
    if (filesOn) out.push(...filesBlock(`${ind}  `));
    if (filesOn) out.push(`${ind}  {m.text !== "" && (`);
    const bInd = filesOn ? `${ind}    ` : `${ind}  `;
    out.push(`${bInd}<div`);
    out.push(
      "" + bInd + "  className={`" + USER_BUBBLE_CLASS + " ${shape.bg}`}"
    );
    out.push(`${bInd}>`);
    out.push(`${bInd}  {m.text}`);
    out.push(`${bInd}</div>`);
    if (filesOn) out.push(`${ind}  )}`);
    out.push(`${ind}</div>`);
    return out;
  };
  if (!queueOn) {
    l.push(`          {messages.map((m, i) => (`);
    l.push(...userBubble(`            `, `key={i}`));
    l.push(`          ))}`);
  } else {
    l.push(`          {messages.map((m) =>`);
    l.push(`            m.from === "assistant" ? (`);
    l.push(`              <div`);
    l.push(`                key={m.id}`);
    l.push(`                className="max-w-[80%] self-start whitespace-pre-wrap break-words py-2 text-[14px] text-foreground"`);
    l.push(`              >`);
    l.push(`                {m.text}`);
    l.push(`              </div>`);
    l.push(`            ) : m.id === morphingId ? (`);
    l.push(`              // Mid-morph: shares a layoutId with the front stack card; the`);
    l.push(`              // inner span is layout-corrected so the text doesn't stretch.`);
    l.push(`              <motion.div`);
    l.push("                key={m.id}");
    l.push("                layoutId={`qm-${m.id}`}");
    l.push(`                layout`);
    l.push(`                initial={false}`);
    l.push(`                transition={spring.moderate}`);
    l.push(`                style={{ transformOrigin: "bottom right" }}`);
    l.push(
      "                className={`max-w-[80%] self-end " + USER_BUBBLE_CLASS + " ${shape.bg}`}"
    );
    l.push(`              >`);
    l.push(`                <motion.span layout className="inline-block align-top">`);
    l.push(`                  {m.text}`);
    l.push(`                </motion.span>`);
    l.push(`              </motion.div>`);
    l.push(`            ) : (`);
    l.push(...userBubble(`              `, `key={m.id}`));
    l.push(`            )`);
    l.push(`          )}`);
  }
  l.push(`        </div>`);
  l.push(`      </div>`);
  if (queueOn) {
    l.push(``);
    l.push(`      {/* Queued messages — Sonner-style stack floated just above the`);
    l.push(`          composer (front card = next to dispatch). */}`);
    l.push(`      <QueuedStack`);
    l.push(`        queue={queue}`);
    l.push(`        onQueueChange={setQueue}`);
    l.push(`        onEdit={editQueued}`);
    l.push(`        onRemove={(item) => setQueue((q) => q.filter((x) => x.id !== item.id))}`);
    l.push(`        bottom={inputH + 8}`);
    l.push("        morphLayoutId={(item) => `qm-${item.id}`}");
    l.push(`      />`);
    l.push(``);
  }
  l.push(`      <InputMessage`);
  l.push(`        ref={inputRef}`);
  l.push(`        className="absolute inset-x-0 bottom-0"`);
  l.push(`        value={value}`);
  l.push(`        onValueChange={setValue}`);
  if (queueOn) {
    l.push(`        onSend={(text, sent, meta) => {`);
    l.push(`          if (text || sent.length) {`);
    l.push(`            const id = meta?.queuedId ?? crypto.randomUUID();`);
    l.push(
      `            setMessages((m) => [...m, { id, from: "user", text${filesOn ? ", files: sent" : ""} }]);`
    );
    l.push(`            if (text) respond(text);`);
    l.push(`            // A dispatched (from-queue) text message morphs from its stack`);
    l.push(`            // card; attachment cards fade instead (their layouts differ).`);
    l.push(`            if (meta?.queuedId && sent.length === 0) {`);
    l.push(`              setMorphingId(meta.queuedId);`);
    l.push(`              if (morphTimerRef.current) clearTimeout(morphTimerRef.current);`);
    l.push(`              morphTimerRef.current = setTimeout(() => setMorphingId(null), 450);`);
    l.push(`            }`);
    l.push(`          }`);
    l.push(`          // Only clear the composer for an actual user submit — a queued`);
    l.push(`          // dispatch must leave any in-progress draft untouched.`);
    l.push(`          if (!meta?.queuedId) {`);
    l.push(`            setValue("");`);
    if (filesOn) l.push(`            setFiles([]);`);
    l.push(`          }`);
    l.push(`        }}`);
  } else {
    l.push(`        onSend={(text, sent) => {`);
    l.push(
      `          if (text || sent.length) setMessages((m) => [...m, { text${filesOn ? ", files: sent" : ""} }]);`
    );
    l.push(`          setValue("");`);
    if (filesOn) l.push(`          setFiles([]);`);
    l.push(`        }}`);
  }
  if (p.suggestion)
    l.push(
      `        placeholderSuggestion=${JSON.stringify(IM_PLACEHOLDER_PROMPT)}`
    );
  if (p.suggestionsOn) l.push(`        suggestions={SUGGESTIONS}`);
  if (p.historyOn) {
    l.push(`        // ArrowUp recalls sent messages, ArrowDown walks back to the draft.`);
    l.push(
      queueOn
        ? `        history={messages.filter((m) => m.from === "user").map((m) => m.text).filter(Boolean)}`
        : `        history={messages.map((m) => m.text).filter(Boolean)}`
    );
  }
  if (p.minRows > 1) l.push(`        minRows={${p.minRows}}`);
  if (p.disabled) l.push(`        disabled`);
  if (filesOn) {
    l.push(`        files={files}`);
    l.push(`        onFilesChange={setFiles}`);
  }
  if (p.leftSlot) {
    l.push(`        leftSlot={({ openFilePicker }) => (`);
    l.push(`          <Tooltip content="Attach" side="top">`);
    l.push(`            <Button`);
    l.push(`              variant="ghost"`);
    l.push(`              size="icon-sm"`);
    l.push(`              aria-label="Attach files"`);
    l.push(`              onClick={() => openFilePicker()}`);
    l.push(`            >`);
    l.push(`              <PlusIcon />`);
    l.push(`            </Button>`);
    l.push(`          </Tooltip>`);
    l.push(`        )}`);
  }
  if (p.rightSlot) {
    l.push(`        rightSlot={`);
    l.push(`          <Button variant="ghost" size="sm" trailingIcon={ChevronDownIcon}>`);
    l.push(`            Sonnet 5`);
    l.push(`          </Button>`);
    l.push(`        }`);
  }
  if (queueOn) {
    l.push(`        // While streaming, submits enqueue; flipping back to idle`);
    l.push(`        // dispatches the head of the queue through onSend.`);
    l.push(`        status={status}`);
    l.push(`        queue={queue}`);
    l.push(`        onQueueChange={setQueue}`);
    l.push(`        onStop={() => {`);
    l.push(`          if (replyTimerRef.current) clearTimeout(replyTimerRef.current);`);
    l.push(`          setStatus("idle");`);
    l.push(`        }}`);
    l.push(`        // The built-in queue rows are replaced by the stacked cards above.`);
    l.push(`        showQueue={false}`);
  }
  l.push(`      />`);
  l.push(`    </div>`);
  l.push(`  );`);
  l.push(`}`);
  return l.join("\n") + "\n";
}

function pageFile(p: InputMessagePreset): string {
  const l: string[] = [];
  const providers: [string, string][] = [];
  if (p.shape !== "rounded") providers.push(["ShapeProvider", ` defaultShape="${p.shape}"`]);
  if (p.size === "compact") providers.push(["SizeProvider", ` size="compact"`]);
  l.push(`"use client";`);
  l.push(``);
  l.push(`import { ChatComposer } from "@/components/chat-composer";`);
  if (p.shape !== "rounded") l.push(`import { ShapeProvider } from "@/lib/shape-context";`);
  if (p.size === "compact") l.push(`import { SizeProvider } from "@/lib/size-context";`);
  l.push(``);
  l.push(`// Generated from a fluidfunctionalism.com playground preset.`);
  l.push(`// The flex row hands the composer stage its height; the composer floats`);
  l.push(`// over the transcript inside it.`);
  l.push(``);
  l.push(`export default function Page() {`);
  l.push(`  return (`);
  let ind = `    `;
  for (const [name, props] of providers) {
    l.push(`${ind}<${name}${props}>`);
    ind += `  `;
  }
  l.push(`${ind}<main className="mx-auto flex h-dvh w-full max-w-2xl p-4">`);
  l.push(`${ind}  <ChatComposer />`);
  l.push(`${ind}</main>`);
  for (const [name] of [...providers].reverse()) {
    ind = ind.slice(2);
    l.push(`${ind}</${name}>`);
  }
  l.push(`  );`);
  l.push(`}`);
  return l.join("\n") + "\n";
}

export function generateInputMessagePresetFiles(
  p: InputMessagePreset
): PresetFile[] {
  return [
    {
      path: "components/chat-composer.tsx",
      type: "registry:component",
      target: "components/chat-composer.tsx",
      content: composerFile(p),
    },
    {
      path: "app/chat/page.tsx",
      type: "registry:page",
      target: "app/chat/page.tsx",
      content: pageFile(p),
    },
  ];
}

/** Registry dependencies the generated files need, as plain names — the
 *  route flavors them with the same helpers postbuild uses. */
export function inputMessagePresetRegistryDeps(
  p: InputMessagePreset
): string[] {
  const queueOn = p.status !== "off";
  const filesOn = p.leftSlot || p.attachments;
  const deps = new Set<string>(["utils", "input-message", "shape-context"]);
  if (filesOn) deps.add("file-thumbnail");
  if (p.leftSlot || p.rightSlot) {
    deps.add("icon-context");
    deps.add("button");
  }
  if (p.leftSlot) deps.add("tooltip");
  if (queueOn) {
    deps.add("queued-stack");
    deps.add("springs");
  }
  if (p.size === "compact") deps.add("size-context");
  return [...deps];
}

/** npm dependencies beyond what registryDependencies pull transitively. */
export function inputMessagePresetNpmDeps(p: InputMessagePreset): string[] {
  const deps = new Set<string>(["lucide-react"]);
  if (p.status !== "off") deps.add("motion");
  return [...deps];
}

export const INPUT_MESSAGE_PRESET_GENERATOR: PresetGenerator = {
  title: "InputMessage (playground preset)",
  description:
    "A chat composer generated from a fluidfunctionalism.com playground configuration — the exact variant you built, installable.",
  files: (p) => generateInputMessagePresetFiles(p as unknown as InputMessagePreset),
  registryDeps: (p) =>
    inputMessagePresetRegistryDeps(p as unknown as InputMessagePreset),
  npmDeps: (p) => inputMessagePresetNpmDeps(p as unknown as InputMessagePreset),
};
