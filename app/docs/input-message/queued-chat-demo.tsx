"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
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
import { useShape } from "@/registry/default/lib/shape-context";
import { springs } from "@/registry/default/lib/springs";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";

// Sonner-style queued stack tuning (see the doc section for the rationale).
const CARD_H = 44;
const STACK_PEEK = 12;
const STACK_SCALE = 0.05;
const STACK_GAP = 8;
const STACK_MAX_PEEK = 2;

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
}: {
  code: string;
  rich?: boolean;
  minHeightClass?: string;
  placeholder?: string;
}) {
  const shape = useShape();
  const ResetIcon = useIcon("rotate-ccw");
  const PlayIcon = useIcon("play");
  const PauseIcon = useIcon("pause");
  const XIcon = useIcon("x");
  const PencilIcon = useIcon("pencil");
  const CornerDownRightIcon = useIcon("corner-down-right");
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

  // ── Stack geometry.
  const stackCount = queue.length;
  const collapsedStackH =
    CARD_H + Math.min(Math.max(stackCount - 1, 0), STACK_MAX_PEEK) * STACK_PEEK;
  const expandedStackH =
    stackCount * CARD_H + Math.max(stackCount - 1, 0) * STACK_GAP;
  // Collapsed, only the front card + STACK_MAX_PEEK peeks are visible; anything
  // deeper is hidden. Surface that overflow as a "+N" on the gutter arrow.
  const hiddenCount = Math.max(0, stackCount - (STACK_MAX_PEEK + 1));

  // ── Drag-to-reorder the (expanded) stack. The dragged card follows the
  // pointer; the rest snap to slots; on release it snaps too. Window listeners
  // so release works anywhere.
  const stackRef = useRef<HTMLDivElement>(null);
  const [stackHovered, setStackHovered] = useState(false);
  const [pointerDownId, setPointerDownId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragY, setDragY] = useState(0);
  const dragStartYRef = useRef(0);
  const queueLenRef = useRef(queue.length);
  queueLenRef.current = queue.length;

  // Touch devices have no hover, so the stack can't fan out on pointer-over.
  // Track `(hover: none)` to drive a tap-to-expand affordance instead: tapping
  // a collapsed card expands the stack and pins it open until the collapse
  // button is tapped.
  const [isTouch, setIsTouch] = useState(false);
  const [tapExpanded, setTapExpanded] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: none)");
    const update = () => setIsTouch(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  // Collapse the (touch) stack whenever it empties, so a fresh fill starts
  // collapsed rather than re-opening from the previous pinned state.
  useEffect(() => {
    if (queue.length === 0) setTapExpanded(false);
  }, [queue.length]);

  const stackExpanded =
    stackHovered ||
    pointerDownId !== null ||
    draggingId !== null ||
    tapExpanded;
  const slotY = (i: number) => -i * (CARD_H + STACK_GAP);

  // ── Enqueue feedback: once the collapsed stack hits its peek cap, a new
  // message lands out of sight with no visible change. Recoil the whole stack
  // (a quick spring settle) on every growth so each enqueue is felt. Skip while
  // expanded (the card is already visible) and on the first fill (0 → N), where
  // the stack appearing is its own feedback.
  const stackBump = useAnimationControls();
  const prevStackCountRef = useRef(stackCount);
  useEffect(() => {
    const prev = prevStackCountRef.current;
    prevStackCountRef.current = stackCount;
    if (stackCount > prev && prev > 0 && !stackExpanded) {
      stackBump.set({ y: -7 });
      stackBump.start({
        y: 0,
        transition: { type: "spring", duration: 0.42, bounce: 0.5 },
      });
    }
    // Only react to the count changing.
  }, [stackCount]);

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
                  transition={springs.moderate}
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
            composer (front card = next to dispatch). */}
        <AnimatePresence>
          {stackCount > 0 && (
            <motion.div
              ref={stackRef}
              className="absolute inset-x-0 z-10"
              style={{ bottom: inputH + 8 }}
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
              {/* Recoils as a whole on enqueue (see stackBump) so a message
                  landing behind the peek cap is still felt by the user. */}
              <motion.div animate={stackBump} className="absolute inset-0">
              {isTouch && stackExpanded ? (
                // Touch: the stack stays pinned open, so it needs an explicit way
                // back. The collapse button takes the gutter slot the arrow + count
                // occupied while collapsed.
                <Tooltip content="Collapse" side="left">
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTapExpanded(false);
                    }}
                    aria-label="Collapse queued messages"
                    className={`absolute bottom-0 left-0 flex items-center justify-center text-muted-foreground outline-none hover:text-foreground focus-visible:ring-1 focus-visible:ring-[#6B97FF] ${shape.button}`}
                    style={{ height: CARD_H, width: 40 }}
                  >
                    <ChevronDownIcon size={18} strokeWidth={2} />
                  </button>
                </Tooltip>
              ) : (
                <Tooltip
                  content={`${stackCount} queued message${stackCount === 1 ? "" : "s"}`}
                  side="left"
                >
                  <div
                    className="absolute bottom-0 left-0 flex items-center justify-end gap-1 pr-1 text-muted-foreground"
                    style={{ height: CARD_H, width: 40 }}
                  >
                    {/* Total queued count, to the LEFT of the arrow — surfaced once
                        the stack overflows its visible peeks, and kept visible on
                        hover too. justify-end pins the arrow so the number fades in
                        beside it without nudging it. */}
                    <AnimatePresence>
                      {hiddenCount > 0 && (
                        <motion.span
                          key="count"
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={springs.fast}
                          className="pointer-events-none text-[10px] font-semibold leading-none tabular-nums text-muted-foreground"
                        >
                          {stackCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <CornerDownRightIcon size={16} strokeWidth={2} />
                  </div>
                </Tooltip>
              )}
              <AnimatePresence initial={false}>
                {queue.map((item, i) => {
                  const peek = Math.min(i, STACK_MAX_PEEK);
                  const isDragging = draggingId === item.id;
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
                      // Share a layoutId with the sent bubble to morph — but only
                      // for text-only messages. With attachments the layouts
                      // differ too much (inline vs stacked), so it dispatches
                      // without a morph target and fades instead.
                      //
                      // Drop the layoutId while ANY drag is in progress: a card
                      // is positioned with an animated `y`, and framer's layout
                      // projection (driven by layoutId) fights that transform
                      // every frame — which made dragging a card into slot 0
                      // (place 1) fail to settle. The morph only needs the
                      // layoutId at dispatch (unmount), never mid-drag.
                      layoutId={
                        pointerDownId !== null || item.files.length > 0
                          ? undefined
                          : `qm-${item.id}`
                      }
                      onDoubleClick={() => editQueuedMsg(item)}
                      onClick={() => {
                        // Touch tap-to-expand: a collapsed pile fans out on tap
                        // (there's no hover to fan it out). No-op once expanded so
                        // it doesn't swallow drags or button taps.
                        if (isTouch && !stackExpanded) setTapExpanded(true);
                      }}
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
                      transition={isDragging ? { duration: 0 } : springs.moderate}
                      style={{
                        height: CARD_H,
                        transformOrigin: "bottom center",
                        zIndex: isDragging ? 200 : 100 - i,
                        cursor: stackExpanded ? "grab" : "default",
                        // Once expanded the card is draggable: claim the vertical
                        // gesture so a touch-drag reorders instead of scrolling
                        // the transcript underneath.
                        touchAction: stackExpanded ? "none" : undefined,
                      }}
                      // Equal left/right gutters (the left holds the queue icon)
                      // so the cards sit centered above the composer.
                      // With attachments, use 8px side padding to match the ~8px
                      // above/below the 28px thumbnail in the 44px card (square
                      // inset); otherwise the roomier 14px for text-only cards.
                      className={`group/qm absolute bottom-0 left-10 right-10 flex select-none items-center gap-2 bg-[color-mix(in_oklab,var(--accent),var(--background)_68%)] ${item.files.length > 0 ? "pl-2" : "pl-3.5"} pr-1.5 text-[14px] text-muted-foreground shadow-surface-3 active:cursor-grabbing ${shape.bg}`}
                    >
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
                      {/* Edit (same as double-click) then remove. On hover-capable
                          devices the group is hidden until the card is hovered — so
                          it's out of layout by default and the text gets the full
                          width. On touch (no hover) it's always shown. */}
                      <div
                        className={`shrink-0 items-center gap-1 ${
                          isTouch ? "flex" : "hidden group-hover/qm:flex"
                        }`}
                      >
                        <Tooltip content="Edit" side="top">
                          <button
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              editQueuedMsg(item);
                            }}
                            aria-label={`Edit queued message: ${item.text}`}
                            className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center ${shape.button} text-muted-foreground outline-none hover:bg-hover hover:text-foreground focus-visible:ring-1 focus-visible:ring-[#6B97FF]`}
                          >
                            <PencilIcon size={14} strokeWidth={2} />
                          </button>
                        </Tooltip>
                        <Tooltip content="Remove" side="top">
                          <button
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeQueuedMsg(item);
                            }}
                            aria-label={`Remove queued message: ${item.text}`}
                            className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center ${shape.button} text-muted-foreground outline-none hover:bg-hover hover:text-foreground focus-visible:ring-1 focus-visible:ring-[#6B97FF]`}
                          >
                            <XIcon size={14} strokeWidth={2.5} />
                          </button>
                        </Tooltip>
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
            ) : undefined
          }
        />
      </div>
    </ComponentPreview>
  );
}
