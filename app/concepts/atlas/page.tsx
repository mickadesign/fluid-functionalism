"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useIcon } from "@/lib/icon-context";
import { ConceptFrame } from "@/app/concepts/_components/concept-frame";
import { Button } from "@/registry/radix/button";
import { ChatMessage } from "@/registry/default/chat-message";
import { InputMessage } from "@/registry/default/input-message";
import type { QueuedMessage } from "@/registry/default/input-message";
import { ThinkingIndicator } from "@/registry/default/thinking-indicator";

// ── Fixtures ────────────────────────────────────────────────────────────────

interface Msg {
  id: string;
  from: "user" | "assistant";
  text: string;
  files?: File[];
}

const SEED: Msg[] = [
  {
    id: "u1",
    from: "user",
    text: "Can you turn this architecture sketch into a short build plan?",
  },
  {
    id: "a1",
    from: "assistant",
    text: "Of course. Your sketch shows three layers — an edge gateway, a stateless API tier, and a managed Postgres. A pragmatic build order:\n\n1. Stand up Postgres + migrations first; it's the slowest to change.\n2. Build the API tier against it with health checks before any auth.\n3. Put the gateway last so you're not debugging routing and business logic at once.\n\nWant me to expand any layer into tickets?",
  },
  {
    id: "u2",
    from: "user",
    text: "Yes — break the API tier into tickets, smallest shippable first.",
  },
];

// Build a tiny in-memory image File so the attachment thumbnail has something
// real to preview. Constructed client-side only (File isn't reliably present
// during SSR).
function makeDemoFile(): File {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="220"><rect width="320" height="220" fill="#0f172a"/><g fill="none" stroke="#38bdf8" stroke-width="2"><rect x="40" y="30" width="240" height="40" rx="6"/><rect x="40" y="100" width="240" height="40" rx="6"/><rect x="40" y="170" width="240" height="30" rx="6"/></g><g fill="#e2e8f0" font-family="sans-serif" font-size="14"><text x="56" y="55">Edge gateway</text><text x="56" y="125">API tier</text><text x="56" y="190">Postgres</text></g></svg>`;
  return new File([new Blob([svg], { type: "image/svg+xml" })], "architecture.svg", {
    type: "image/svg+xml",
  });
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function AtlasPage() {
  const Paperclip = useIcon("image");
  const Copy = useIcon("copy");
  const Regenerate = useIcon("rotate-ccw");

  const [messages, setMessages] = useState<Msg[]>(SEED);
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [responding, setResponding] = useState(false);
  const [status, setStatus] = useState<"idle" | "streaming">("idle");
  const [queue, setQueue] = useState<QueuedMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Attach a real demo file to the opening message, client-side only.
  useEffect(() => {
    const f = makeDemoFile();
    setMessages((prev) =>
      prev.map((m) => (m.id === "u1" ? { ...m, files: [f] } : m))
    );
  }, []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, []);

  const reply = useCallback(
    (userText: string) => {
      setResponding(true);
      setStatus("streaming");
      scrollToBottom();
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `a${Date.now()}`,
            from: "assistant",
            text: `Here's a first cut for "${userText.slice(0, 40)}${
              userText.length > 40 ? "…" : ""
            }":\n\n• Ticket 1 — define the request/response contract\n• Ticket 2 — health + readiness endpoints\n• Ticket 3 — the first real handler, no auth yet\n\nEach is independently shippable. Want estimates?`,
          },
        ]);
        setResponding(false);
        setStatus("idle");
        scrollToBottom();
      }, 1800);
    },
    [scrollToBottom]
  );

  const handleSend = useCallback(
    (value: string, sent: File[]) => {
      const trimmed = value.trim();
      if (!trimmed && sent.length === 0) return;
      setMessages((prev) => [
        ...prev,
        {
          id: `u${Date.now()}`,
          from: "user",
          text: trimmed,
          files: sent.length ? sent : undefined,
        },
      ]);
      setDraft("");
      setFiles([]);
      reply(trimmed || "the attached file");
    },
    [reply]
  );

  return (
    <ConceptFrame>
      <div className="flex h-screen w-full flex-col">
        {/* Transcript */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto flex max-w-[720px] flex-col gap-5 px-6 py-12">
            {messages.map((m) => (
                <ChatMessage
                  key={m.id}
                  from={m.from}
                  files={m.files}
                  time={m.from === "user" ? "Just now" : undefined}
                  actions={
                    m.from === "assistant" ? (
                      <AssistantActions copy={Copy} regen={Regenerate} />
                    ) : undefined
                  }
                >
                  {m.text}
                </ChatMessage>
              ))}
              {responding && (
                <ChatMessage from="assistant" className="max-w-full">
                  <ThinkingIndicator className="!px-0" />
                </ChatMessage>
              )}
            </div>
          </div>

          {/* Composer */}
          <div className="px-6 pb-5 pt-1">
            <div className="mx-auto max-w-[720px]">
              <InputMessage
                value={draft}
                onValueChange={setDraft}
                onSend={handleSend}
                placeholder="Message Atlas…"
                files={files}
                onFilesChange={setFiles}
                status={status}
                onStop={() => {
                  setResponding(false);
                  setStatus("idle");
                }}
                queue={queue}
                onQueueChange={setQueue}
                minRows={1}
                maxRows={6}
                leftSlot={({ openFilePicker }) => (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openFilePicker()}
                    aria-label="Attach file"
                  >
                    <Paperclip />
                  </Button>
                )}
              />
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Atlas can make mistakes. This is a concept screen.
              </p>
            </div>
          </div>
        </div>
    </ConceptFrame>
  );
}

function AssistantActions({
  copy: Copy,
  regen: Regen,
}: {
  copy: ReturnType<typeof useIcon>;
  regen: ReturnType<typeof useIcon>;
}): ReactNode {
  return (
    <>
      <Button variant="ghost" size="icon-sm" aria-label="Copy">
        <Copy />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="Regenerate">
        <Regen />
      </Button>
    </>
  );
}
