"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { FileThumbnail } from "@/registry/default/file-thumbnail";
import { Tooltip } from "@/registry/radix/tooltip";
import { type QueuedMessage } from "@/registry/default/input-message";
import { useIcon } from "@/lib/icon-context";
import { useShape } from "@/registry/default/lib/shape-context";
import { useSizeVariant } from "@/lib/size-context";
import { spring } from "@/registry/default/lib/springs";

// ---------------------------------------------------------------------------
// Sonner-style queued-message stack, shared by the InputMessage docs demos
// (QueuedChatDemo and the playground). Collapsed cards fan out on hover (tap
// on touch), drag reorders while expanded, a gutter arrow surfaces the total
// count once cards overflow the visible peeks, × removes and ✎/double-click
// edits a card back into the composer.
// ---------------------------------------------------------------------------

// Card height per ladder step — the compact step drops the card with it.
export const QUEUE_CARD_H = 44;
export const QUEUE_CARD_H_COMPACT = 38;
const STACK_PEEK = 12;
const STACK_SCALE = 0.05;
const STACK_GAP = 8;
const STACK_MAX_PEEK = 2;

/** The stack's card height at the current site-wide size step. */
export function useQueueCardHeight() {
  return useSizeVariant() === "compact" ? QUEUE_CARD_H_COMPACT : QUEUE_CARD_H;
}

/** Height of the collapsed pile — consumers reserve transcript padding with it. */
export function collapsedStackHeight(count: number, cardH: number) {
  return cardH + Math.min(Math.max(count - 1, 0), STACK_MAX_PEEK) * STACK_PEEK;
}

interface QueuedStackProps {
  queue: QueuedMessage[];
  /** Fired with the reordered queue while dragging a card between slots. */
  onQueueChange: (queue: QueuedMessage[]) => void;
  /** Pull a card back into the composer (✎ button / double-click). */
  onEdit: (item: QueuedMessage) => void;
  /** Remove a card (× button). */
  onRemove: (item: QueuedMessage) => void;
  /** Distance from the container's bottom edge (usually composer height + 8). */
  bottom: number;
  /** Optional shared-layout id per card so a dispatching card can morph into
   *  its sent bubble. Only applied to text-only cards while no drag is in
   *  progress — layout projection fights the drag transform otherwise. */
  morphLayoutId?: (item: QueuedMessage) => string;
}

export function QueuedStack({
  queue,
  onQueueChange,
  onEdit,
  onRemove,
  bottom,
  morphLayoutId,
}: QueuedStackProps) {
  const shape = useShape();
  const compactStep = useSizeVariant() === "compact";
  const cardH = useQueueCardHeight();
  const XIcon = useIcon("x");
  const PencilIcon = useIcon("pencil");
  const ChevronDownIcon = useIcon("chevron-down");
  const CornerDownRightIcon = useIcon("corner-down-right");

  // ── Stack geometry.
  const stackCount = queue.length;
  const collapsedStackH = collapsedStackHeight(stackCount, cardH);
  const expandedStackH =
    stackCount * cardH + Math.max(stackCount - 1, 0) * STACK_GAP;
  // Collapsed, only the front card + STACK_MAX_PEEK peeks are visible; anything
  // deeper is hidden. Surface that overflow as a count on the gutter arrow.
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
  const queueRef = useRef(queue);
  queueRef.current = queue;

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
  const slotY = (i: number) => -i * (cardH + STACK_GAP);

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
      const q = queueRef.current;
      const slot = Math.max(
        0,
        Math.min(q.length - 1, Math.floor(fromBottom / (cardH + STACK_GAP)))
      );
      const cur = q.findIndex((x) => x.id === pointerDownId);
      if (cur !== -1 && cur !== slot) {
        const moved = q[cur];
        const next = [...q];
        next.splice(cur, 1);
        next.splice(slot, 0, moved);
        onQueueChange(next);
      }
      const minY = -(queueRef.current.length - 1) * (cardH + STACK_GAP);
      setDragY(
        Math.max(minY, Math.min(0, e.clientY - rect.bottom + cardH / 2))
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
  }, [pointerDownId, cardH, onQueueChange]);

  return (
    <AnimatePresence>
      {stackCount > 0 && (
        <motion.div
          ref={stackRef}
          className="absolute inset-x-0 z-10"
          style={{ bottom }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            height: stackExpanded ? expandedStackH : collapsedStackH,
          }}
          exit={{ opacity: 0 }}
          transition={{ ...spring.moderate, bounce: 0 }}
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
                  className={`absolute bottom-0 left-0 flex items-center justify-center text-muted-foreground outline-none hover:text-foreground focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] ${shape.button}`}
                  style={{ height: cardH, width: 40 }}
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
                  style={{ height: cardH, width: 40 }}
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
                        transition={spring.fast}
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
                      morphLayoutId &&
                      pointerDownId === null &&
                      item.files.length === 0
                        ? morphLayoutId(item)
                        : undefined
                    }
                    onDoubleClick={() => onEdit(item)}
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
                    transition={isDragging ? { duration: 0 } : spring.moderate}
                    style={{
                      height: cardH,
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
                    className={`group/qm absolute bottom-0 left-10 right-10 flex select-none items-center bg-[color-mix(in_oklab,var(--accent),var(--background)_68%)] ${
                      compactStep
                        ? `gap-1.5 ${item.files.length > 0 ? "pl-1.5" : "pl-3"} pr-1`
                        : `gap-2 ${item.files.length > 0 ? "pl-2" : "pl-3.5"} pr-1.5`
                    } text-subtitle text-muted-foreground shadow-surface-3 active:cursor-grabbing ${shape.bg}`}
                  >
                    {item.files.length > 0 && (
                      <div className="pointer-events-none flex shrink-0 items-center gap-1">
                        {item.files.slice(0, 3).map((f, fi) => (
                          <FileThumbnail
                            key={`${f.name}-${f.size}-${fi}`}
                            file={f}
                            size={compactStep ? 24 : 28}
                            className="rounded-md"
                          />
                        ))}
                        {item.files.length > 3 && (
                          <span className={`flex ${compactStep ? "h-6 w-6" : "h-7 w-7"} items-center justify-center rounded-md bg-background/40 text-[11px] font-medium tabular-nums text-foreground/80`}>
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
                            onEdit(item);
                          }}
                          aria-label={`Edit queued message: ${item.text}`}
                          className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center ${shape.button} text-muted-foreground outline-none hover:bg-hover hover:text-foreground focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]`}
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
                            onRemove(item);
                          }}
                          aria-label={`Remove queued message: ${item.text}`}
                          className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center ${shape.button} text-muted-foreground outline-none hover:bg-hover hover:text-foreground focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]`}
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
  );
}
