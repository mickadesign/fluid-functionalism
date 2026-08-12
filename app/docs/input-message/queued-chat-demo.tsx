"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  InputMessage,
  type QueuedMessage,
} from "@/registry/default/input-message";
import { ChatMessage } from "@/registry/default/chat-message";
import { ThinkingIndicator } from "@/registry/default/thinking-indicator";
import { Button } from "@/registry/radix/button";
import { Dropdown } from "@/components/flavored/dropdown";
import { MenuItem } from "@/registry/default/menu-item";
import { Tooltip } from "@/registry/radix/tooltip";
import { useIcon } from "@/lib/icon-context";
import { spring } from "@/registry/default/lib/springs";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import {
  QueuedStack,
  collapsedStackHeight,
  useQueueCardHeight,
} from "@/lib/docs/playgrounds/queued-stack";

const MODELS = ["Sonnet 5", "Sonnet 4.6", "Sonnet 4.5", "Haiku 4"] as const;

type Turn = {
  from: "user" | "assistant";
  text: string;
  thinking?: boolean;
  // Attachments carried through from the composer / dispatched queue item, so
  // the sent bubble shows them inline.
  files?: File[];
  // Set on user turns dispatched from the queue, so the front stack card and
  // the sent bubble share a layoutId and morph.
  id?: string;
};

/**
 * Self-contained "queued messages" demo: a streaming reply with a pausable
 * stepper, a Sonner-style queued stack (collapse/expand, drag-reorder,
 * double-click edit, attachment thumbnails), and the queued→sent morph. It
 * loads already paused so the feature reads at a glance.
 *
 * `rich` adds the composer chrome from the hero example — an attach dropdown
 * and a model picker — and enables real attachments so users can queue with
 * files of their own.
 */
export function QueuedChatDemo({
  code,
  rich = false,
  minHeightClass = "h-[440px]",
  placeholder = "Send while I’m responding to queue a message…",
  placeholderSuggestion,
}: {
  code: string;
  rich?: boolean;
  minHeightClass?: string;
  placeholder?: string;
  /** Tab-fillable ghost placeholder forwarded to the composer. */
  placeholderSuggestion?: string;
}) {
  const cardH = useQueueCardHeight();
  const ResetIcon = useIcon("rotate-ccw");
  const PlayIcon = useIcon("play");
  const PauseIcon = useIcon("pause");
  const PlusIcon = useIcon("plus");
  const ChevronDownIcon = useIcon("chevron-down");
  const ImageIcon = useIcon("image");
  const FileTextIcon = useIcon("square-library");

  const [value, setValue] = useState("");
  const [composerFiles, setComposerFiles] = useState<File[]>([]);
  const [queue, setQueue] = useState<QueuedMessage[]>([]);
  const [chatStatus, setChatStatus] = useState<"idle" | "streaming">("idle");
  const [chat, setChat] = useState<Turn[]>([]);
  // The id of the message currently playing its queued→sent morph. The morph
  // props (layout/layoutId) are applied ONLY to this one, ONLY for the brief
  // transition — then cleared. Otherwise every transcript reflow (a new message
  // appearing below) would re-fire the layout animation and visibly shift the
  // text inside the settled bubble.
  const [morphingId, setMorphingId] = useState<string | null>(null);
  const morphTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (morphTimerRef.current) clearTimeout(morphTimerRef.current);
    },
    []
  );

  // ── Pausable stepper: drives the in-flight reply (think → stream word-by-
  // word). One reply animates at a time, so a single controller is enough. The
  // playback button pauses/resumes it; the cascade pauses with it, since status
  // only reaches "idle" once a reply finishes streaming.
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
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

  const respond = (text: string, files: File[] = [], queuedId?: string) => {
    const reply = `Replying to “${text}”. Here's a fuller answer that streams in a word at a time so you can watch the queue release the next message.`;
    setChat((c) => [
      ...c,
      { from: "user", text, files, id: queuedId },
      { from: "assistant", text: "", thinking: true },
    ]);
    setChatStatus("streaming");

    // A dispatched (from-queue) text message morphs from its stack card; flag it
    // so the transcript applies the morph props, then release them once the
    // shared-layout transition has settled so later reflows stay static.
    if (queuedId && files.length === 0) {
      setMorphingId(queuedId);
      if (morphTimerRef.current) clearTimeout(morphTimerRef.current);
      morphTimerRef.current = setTimeout(() => setMorphingId(null), 450);
    }

    const patchAssistant = (
      fn: (m: { text: string; thinking?: boolean }) => {
        text: string;
        thinking?: boolean;
      }
    ) =>
      setChat((c) => {
        const next = [...c];
        for (let k = next.length - 1; k >= 0; k--) {
          if (next[k].from === "assistant") {
            next[k] = { from: "assistant", ...fn(next[k]) };
            break;
          }
        }
        return next;
      });

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

  useEffect(() => () => clearStep(), []);

  // Attachments for the seeded demo, cached so Reset can rebuild the exact
  // initial state without re-fetching.
  const demoFilesRef = useRef<File[]>([]);

  // Seed (or re-seed) the initial state: a reply paused mid-think with a few
  // messages queued — the first carrying the cached attachments — so the
  // feature reads at a glance and the front card nudges the user to press ▶.
  const loadInitialDemo = () => {
    pausedRef.current = true;
    setPaused(true);
    respond("Help me polish the dashboard design");
    const [img, pdf] = demoFilesRef.current;
    setQueue([
      // A message with attachments, a short one, and a longer one.
      {
        id: crypto.randomUUID(),
        text: "Match these mockups",
        files: img && pdf ? [img, pdf] : [],
      },
      { id: crypto.randomUUID(), text: "Tighten the spacing", files: [] },
      {
        id: crypto.randomUUID(),
        text: "Audit the color contrast across the dashboard and suggest accessible token values",
        files: [],
      },
    ]);
  };

  // Auto-demo on mount: fetch the attachments, cache them, then seed the state.
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
        demoFilesRef.current = [img, pdf];
        loadInitialDemo();
      })
      // Still seed the textual demo even if the assets fail to load.
      .catch(() => {
        if (!cancelled) loadInitialDemo();
      });
    return () => {
      cancelled = true;
    };
    // Run once on mount.
  }, []);

  // ── Layout plumbing: float the composer over the transcript, reserve scroll
  // padding under it (+ the collapsed stack), and keep the transcript pinned.
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

  // Reset returns the preview to its *initial* seeded state (paused mid-reply
  // with the messages queued), not an empty composer.
  const resetDemo = () => {
    clearStep();
    setValue("");
    setComposerFiles([]);
    setChat([]);
    setQueue([]);
    setChatStatus("idle");
    loadInitialDemo();
  };

  const editQueuedMsg = (item: QueuedMessage) => {
    setValue(item.text);
    setComposerFiles(item.files);
    setQueue((q) => q.filter((x) => x.id !== item.id));
    requestAnimationFrame(() => {
      const el = inputRef.current?.querySelector("textarea");
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  };
  const removeQueuedMsg = (item: QueuedMessage) =>
    setQueue((q) => q.filter((x) => x.id !== item.id));

  // ── Stack geometry: the shared QueuedStack owns interaction; the demo only
  // needs the collapsed pile height to reserve transcript padding.
  const stackCount = queue.length;
  const collapsedStackH = collapsedStackHeight(stackCount, cardH);

  // ── Composer chrome for the rich (hero) variant: attach dropdown + model
  // picker, with click-outside to close.
  const [model, setModel] = useState<(typeof MODELS)[number]>("Sonnet 5");
  const [attachOpen, setAttachOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const attachRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!rich) return;
    const handler = (e: MouseEvent) => {
      if (attachRef.current && !attachRef.current.contains(e.target as Node))
        setAttachOpen(false);
      if (modelRef.current && !modelRef.current.contains(e.target as Node))
        setModelOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [rich]);

  const playbackButton =
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
        : chat.length > 0 || queue.length > 0
          ? {
              icon: <ResetIcon size={16} strokeWidth={1.5} />,
              tooltip: "Reset",
              onClick: resetDemo,
            }
          : undefined;

  return (
    <ComponentPreview
      code={code}
      minHeightClass={minHeightClass}
      align="bottom"
      padding="compact"
      playbackButton={playbackButton}
    >
      <div className="relative w-full self-stretch">
        <div
          ref={scrollRef}
          className="absolute inset-0 overflow-y-auto scrollbar-hide"
        >
          <div
            className="flex min-h-full flex-col justify-start gap-2"
            style={{
              paddingBottom: inputH + 8 + (stackCount > 0 ? collapsedStackH + 8 : 0),
            }}
          >
            {chat.map((m, i) =>
              m.thinking ? (
                <ChatMessage key={i} from="assistant">
                  <ThinkingIndicator showIcon={false} className="px-0 py-0" />
                </ChatMessage>
              ) : m.id && m.id === morphingId ? (
                // Text-only dispatch, mid-morph → shared-layout morph from the
                // front card (text scale-corrected so it doesn't stretch). The
                // morph props are dropped once `morphingId` clears, so a settled
                // bubble no longer re-animates its layout when the transcript
                // reflows underneath it.
                <ChatMessage
                  key={i}
                  from={m.from}
                  layoutId={`qm-${m.id}`}
                  layout
                  initial={false}
                  transition={spring.moderate}
                >
                  <motion.span layout className="inline-block align-top">
                    {m.text}
                  </motion.span>
                </ChatMessage>
              ) : (
                // Settled messages, idle/assistant turns, or a dispatch that
                // carries attachments. Attachment cards skip the box-scale morph
                // (it squishes the thumbnails + text since the card lays them out
                // inline and the bubble stacks them) and fade in cleanly.
                <ChatMessage key={i} from={m.from} files={m.files}>
                  {m.text}
                </ChatMessage>
              )
            )}
          </div>
        </div>

        {/* Queued messages — Sonner-style stack overlaying just above the
            composer (front card = next to dispatch). Shared with the
            playground; see queued-stack.tsx. */}
        <QueuedStack
          queue={queue}
          onQueueChange={setQueue}
          onEdit={editQueuedMsg}
          onRemove={removeQueuedMsg}
          bottom={inputH + 8}
          morphLayoutId={(item) => `qm-${item.id}`}
        />

        <InputMessage
          ref={inputRef}
          className="absolute inset-x-0 bottom-0"
          value={value}
          onValueChange={setValue}
          status={chatStatus}
          queue={queue}
          onQueueChange={setQueue}
          showQueue={false}
          history={chat.filter((m) => m.from === "user").map((m) => m.text)}
          files={rich ? composerFiles : undefined}
          onFilesChange={rich ? setComposerFiles : undefined}
          onSend={(text, files, meta) => {
            if (text) respond(text, files, meta?.queuedId);
            // Only clear the composer for an actual user submit. A queued
            // dispatch (meta.queuedId) carries its own text/files and must
            // leave any in-progress draft the user is typing untouched.
            if (!meta?.queuedId) {
              setValue("");
              setComposerFiles([]);
            }
          }}
          onStop={() => {
            clearStep();
            pausedRef.current = false;
            setPaused(false);
            setChat((c) => {
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
          placeholder={placeholder}
          placeholderSuggestion={placeholderSuggestion}
          leftSlot={
            rich
              ? ({ openFilePicker }) => (
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
                          transition={spring.fast}
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
                )
              : undefined
          }
          rightSlot={
            rich ? (
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
                      transition={spring.fast}
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
            ) : undefined
          }
        />
      </div>
    </ComponentPreview>
  );
}
