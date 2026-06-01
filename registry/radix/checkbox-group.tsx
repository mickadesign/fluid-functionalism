"use client";

import {
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  createContext,
  useContext,
  forwardRef,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import { useProximityHover } from "@/hooks/use-proximity-hover";
import { useShape } from "@/lib/shape-context";

// Run the layout effect on the client (where it must fire before paint, so a
// merge/split shows on the first frame) and a no-op-safe useEffect on the server.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Edge spring for the selected-bg merge/split: moderate, no bounce so converging
// edges meet exactly instead of overshooting. On a merge the inner corners trail
// by `cornerDelay`, staying rounded until the halves meet.
const mergeSpring = { type: "spring" as const, duration: 0.16, bounce: 0 };
const cornerDelay = 0.07;
// A boundary resolves after its motion finishes (merge → swap to one block;
// split → drop), driven by a duration timer rather than onAnimationComplete —
// framer skips that callback when an animation's target equals its current value
// (which spam-toggling produces), which would otherwise strand a half. The
// buffer biases late, by which point the halves have met/parted, so it's unseen.
const convergeMs = (mergeSpring.duration + cornerDelay) * 1000 + 80;
const splitMs = mergeSpring.duration * 1000 + 80;

// A selected-background block for one render. A run is normally one block; mid
// merge/split it is drawn as two abutting halves with sharp inner corners.
type Rect = { top: number; left: number; width: number; height: number };
interface SelBlock extends Rect {
  key: string;
  radii: [number, number, number, number]; // tl, tr, br, bl
  instant: boolean; // skip the spring (the zero-shift swap, the split snap-in)
  exitInstant: boolean; // drop without the fade (absorbed half at the swap)
  delayCorners: boolean; // trail the corner straightening (merge converge)
  cornerDelay?: number; // optional per-block delay override
  opacity?: number; // override the hover-derived opacity (commit ghost = 0)
  // State a fresh block animates *from* on mount, so it springs into place
  // instead of snapping when continuity is lost (fast toggling) or the block is
  // inherently new (a split's lower half). Continuous blocks ignore it.
  enterFrom?: { top: number; height: number; radii: [number, number, number, number] };
}

type Run = { start: number; end: number; id: number };

// One in-flight merge or split; geometry is recomputed from the live runs each
// render so rapid toggles redirect instead of freezing.
interface Boundary {
  tid: number;
  kind: "merge" | "split";
  survivorId: number; // persisting run (merged run / split's upper run)
  otherId: number; // merge: absorbed run; split: new lower run
  gapIndex: number; // bridging/deselected row — where the halves meet
  phase: "converge" | "commit" | "splitIn" | "diverge";
}

// Two runs within `outer`, ordered, separated by exactly one row (a single-row
// bridge — the only shape a click can merge or split).
function bridgePair(outer: Run, runs: Run[]) {
  const inside = runs
    .filter((r) => r.start >= outer.start && r.end <= outer.end)
    .sort((a, b) => a.start - b.start);
  if (inside.length !== 2) return null;
  const [up, lo] = inside;
  return lo.start === up.end + 2 ? { up, lo, gap: up.end + 1 } : null;
}

interface CheckboxGroupContextValue {
  registerItem: (index: number, element: HTMLElement | null) => void;
  activeIndex: number | null;
}

const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(
  null
);

function useCheckboxGroup() {
  const ctx = useContext(CheckboxGroupContext);
  if (!ctx)
    throw new Error("useCheckboxGroup must be used within a CheckboxGroup");
  return ctx;
}

interface CheckboxGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  checkedIndices: Set<number>;
}

const CheckboxGroup = forwardRef<HTMLDivElement, CheckboxGroupProps>(
  ({ children, checkedIndices, className, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const groupIdCounter = useRef(0);
    const prevGroupMap = useRef(new Map<number, number>());

    const {
      activeIndex,
      setActiveIndex,
      itemRects,
      sessionRef,
      handlers,
      registerItem,
      measureItems,
    } = useProximityHover(containerRef);

    useEffect(() => {
      measureItems();
    }, [measureItems, children]);

    // Group contiguous checked indices into runs with stable IDs
    const runs: { start: number; end: number }[] = [];
    const sortedChecked = [...checkedIndices].sort((a, b) => a - b);
    for (const idx of sortedChecked) {
      const last = runs[runs.length - 1];
      if (last && idx === last.end + 1) {
        last.end = idx;
      } else {
        runs.push({ start: idx, end: idx });
      }
    }

    // Assign stable IDs: reuse previous ID if any member overlaps
    const usedIds = new Set<number>();
    const newGroupMap = new Map<number, number>();
    const checkedGroups = runs.map((run) => {
      let stableId: number | null = null;
      for (let i = run.start; i <= run.end; i++) {
        const prevId = prevGroupMap.current.get(i);
        if (prevId !== undefined && !usedIds.has(prevId)) {
          stableId = prevId;
          break;
        }
      }
      const id = stableId ?? ++groupIdCounter.current;
      usedIds.add(id);
      for (let i = run.start; i <= run.end; i++) {
        newGroupMap.set(i, id);
      }
      return { ...run, id };
    });
    prevGroupMap.current = newGroupMap;

    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    const activeRect = activeIndex !== null ? itemRects[activeIndex] : null;
    const focusRect = focusedIndex !== null ? itemRects[focusedIndex] : null;
    const isHoveringOther =
      activeIndex !== null && !checkedIndices.has(activeIndex);
    const shape = useShape();
    const R = shape.mergedRadius;

    // ── Merge / split boundary animation ─────────────────────────────
    // When one unselected row bridges two selected runs, their inner edges glide
    // to the bridging row's midpoint (facing corners straightening to sharp),
    // then swap to one block with no visible motion — instead of the surviving
    // block spring-growing over the whole union. Deselecting a middle row plays
    // the inverse: snap into two abutting halves, then glide apart.
    const [boundaries, setBoundaries] = useState<Boundary[]>([]);
    const prevRunsRef = useRef<Run[]>([]);
    const tidRef = useRef(0);
    const timersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>());
    const runsSig = checkedGroups
      .map((g) => `${g.id}:${g.start}-${g.end}`)
      .join("|");

    // Detect merges/splits before paint (so the first frame already shows the
    // halves) and drop any boundary the latest selection invalidated (e.g. the
    // bridge row was toggled again mid-flight).
    useIsoLayoutEffect(() => {
      const prev = prevRunsRef.current;
      const cur = checkedGroups;
      const found: Boundary[] = [];
      for (const c of cur) {
        const p = bridgePair(c, prev); // two prev runs collapsed into one
        if (p && (c.id === p.up.id || c.id === p.lo.id))
          found.push({
            tid: ++tidRef.current,
            kind: "merge",
            survivorId: c.id,
            otherId: c.id === p.up.id ? p.lo.id : p.up.id,
            gapIndex: p.gap,
            phase: "converge",
          });
      }
      for (const p of prev) {
        const c = bridgePair(p, cur); // one prev run split into two
        if (c)
          found.push({
            tid: ++tidRef.current,
            kind: "split",
            survivorId: c.up.id,
            otherId: c.lo.id,
            gapIndex: c.gap,
            phase: "splitIn",
          });
      }
      prevRunsRef.current = cur.map((r) => ({ ...r }));
      // Resolve each new boundary after its motion window (merge → swap to one
      // block; split → drop), so an interrupted animation can't strand a half.
      for (const b of found) {
        timersRef.current.set(
          b.tid,
          setTimeout(() => {
            timersRef.current.delete(b.tid);
            setBoundaries((bs) =>
              bs.some((x) => x.tid === b.tid)
                ? bs.flatMap((x) =>
                    x.tid !== b.tid
                      ? [x]
                      : x.kind === "merge"
                      ? [{ ...x, phase: "commit" as const }]
                      : []
                  )
                : bs
            );
          }, b.kind === "merge" ? convergeMs : splitMs)
        );
      }
      setBoundaries((active) => [
        ...active.filter((b) =>
          b.kind === "merge"
            ? cur.some(
                (c) =>
                  c.id === b.survivorId &&
                  b.gapIndex > c.start &&
                  b.gapIndex < c.end
              )
            : cur.some((c) => c.id === b.survivorId && c.end === b.gapIndex - 1) &&
              cur.some((c) => c.id === b.otherId && c.start === b.gapIndex + 1)
        ),
        ...found,
      ]);
    }, [runsSig]);

    // Clear any pending timers on unmount.
    useEffect(() => {
      const timers = timersRef.current;
      return () => timers.forEach(clearTimeout);
    }, []);

    // Follow-up render: a fresh split holds its abutting frame once then
    // diverges; a committed merge is dropped.
    useEffect(() => {
      if (!boundaries.some((b) => b.phase === "splitIn" || b.phase === "commit"))
        return;
      setBoundaries((bs) =>
        bs.flatMap((b) =>
          b.phase === "commit"
            ? []
            : [{ ...b, phase: b.phase === "splitIn" ? "diverge" : b.phase }]
        )
      );
    }, [boundaries]);

    // Build the blocks to paint: one per run, overridden into abutting halves
    // for any run in an in-flight boundary.
    const rectOf = (start: number, end: number): Rect | null => {
      const s = itemRects[start];
      const e = itemRects[end];
      if (!s || !e) return null;
      return {
        top: s.top,
        left: Math.min(s.left, e.left),
        width: Math.max(s.width, e.width),
        height: e.top + e.height - s.top,
      };
    };
    const blocks: SelBlock[] = [];
    for (const run of checkedGroups) {
      const r = rectOf(run.start, run.end);
      if (r)
        blocks.push({
          key: `sel-${run.id}`,
          ...r,
          radii: [R, R, R, R],
          instant: false,
          exitInstant: false,
          delayCorners: false,
        });
    }
    const byId = new Map(blocks.map((b) => [b.key, b]));
    for (const b of boundaries) {
      const gap = itemRects[b.gapIndex];
      const sv = byId.get(`sel-${b.survivorId}`);
      if (!gap || !sv) continue;
      const midY = gap.top + gap.height / 2;
      if (b.kind === "merge") {
        if (b.phase === "commit") {
          // Zero-shift swap: survivor jumps to the full union (already covered by
          // its top half + the absorbed bottom half). The absorbed half is held
          // one render at opacity 0 so removing it next render can't flash a
          // one-frame overlap with the now-full survivor.
          sv.instant = true;
          blocks.push({
            key: `sel-${b.otherId}`,
            top: midY,
            left: sv.left,
            width: sv.width,
            height: sv.top + sv.height - midY,
            radii: [0, 0, R, R],
            instant: true,
            exitInstant: true,
            delayCorners: false,
            opacity: 0,
          });
          continue;
        }
        // converge: survivor → top half, absorbed run → bottom-half ghost, inner
        // corners straightening to sharp.
        // Slightly trail lower merges while keeping a baseline and small cap.
        const mergeCornerDelay = Math.min(
          cornerDelay + 0.03,
          Math.max(cornerDelay, cornerDelay + (midY / Math.max(gap.height, 1)) * 0.002)
        );
        const bottom = sv.top + sv.height;
        sv.height = midY - sv.top;
        sv.radii = [R, R, 0, 0];
        sv.delayCorners = true;
        sv.cornerDelay = mergeCornerDelay;
        blocks.push({
          key: `sel-${b.otherId}`,
          top: midY,
          left: sv.left,
          width: sv.width,
          height: bottom - midY,
          radii: [0, 0, R, R],
          // Mount at full corners so a fresh ghost still animates the
          // straightening with the same delay as the survivor.
          enterFrom: { top: midY, height: bottom - midY, radii: [R, R, R, R] },
          instant: false,
          exitInstant: true,
          delayCorners: true,
          cornerDelay: mergeCornerDelay,
        });
      } else if (b.phase === "splitIn") {
        const lo = byId.get(`sel-${b.otherId}`);
        if (!lo) continue;
        // Pin both halves at the seam (identical to the single block); the
        // diverge render then springs them to their real rects.
        const bottom = lo.top + lo.height;
        sv.height = midY - sv.top;
        sv.radii = [R, R, 0, 0];
        sv.instant = true;
        lo.top = midY;
        lo.height = bottom - midY;
        lo.radii = [0, 0, R, R];
        lo.instant = true;
        lo.enterFrom = { top: midY, height: bottom - midY, radii: [0, 0, R, R] };
      }
      // diverge: nothing to override — the steady blocks spring to their real
      // rects from the seam; the timer drops the boundary.
    }

    // Split safety net, pinned synchronously. The split boundary above is created
    // in a layout effect that runs *after* this render, so on the very frame a
    // split first appears its fresh lower half would mount at its final rect and
    // snap. Detecting the split here (previous runs vs current) and pinning both
    // halves at the seam guarantees the lower mounts on the seam regardless of
    // render/paint timing (the cause of the rapid-toggle snap).
    for (const p of prevRunsRef.current) {
      const c = bridgePair(p, checkedGroups);
      const gap = c && itemRects[c.gap];
      if (!c || !gap) continue;
      const midY = gap.top + gap.height / 2;
      const up = byId.get(`sel-${c.up.id}`);
      const lo = byId.get(`sel-${c.lo.id}`);
      if (!up || !lo) continue;
      const bottom = lo.top + lo.height;
      up.height = midY - up.top;
      up.radii = [R, R, 0, 0];
      up.instant = true;
      lo.top = midY;
      lo.height = bottom - midY;
      lo.radii = [0, 0, R, R];
      lo.instant = true;
      lo.enterFrom = { top: midY, height: bottom - midY, radii: [0, 0, R, R] };
    }

    return (
      <CheckboxGroupContext.Provider value={{ registerItem, activeIndex }}>
        <div
          ref={(node) => {
            (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }}
          onMouseEnter={handlers.onMouseEnter}
          onMouseMove={handlers.onMouseMove}
          onMouseLeave={handlers.onMouseLeave}
          onFocus={(e) => {
            const indexAttr = (e.target as HTMLElement)
              .closest("[data-proximity-index]")
              ?.getAttribute("data-proximity-index");
            if (indexAttr != null) {
              const idx = Number(indexAttr);
              setActiveIndex(idx);
              setFocusedIndex(
                (e.target as HTMLElement).matches(":focus-visible") ? idx : null
              );
            }
          }}
          onBlur={(e) => {
            // Don't clear hover when focus moves to another item within the group
            if (containerRef.current?.contains(e.relatedTarget as Node)) return;
            setFocusedIndex(null);
            setActiveIndex(null);
          }}
          onKeyDown={(e) => {
            const items = Array.from(
              containerRef.current?.querySelectorAll('[role="checkbox"]') ?? []
            ) as HTMLElement[];
            const currentIdx = items.indexOf(e.target as HTMLElement);
            if (currentIdx === -1) return;

            if (["ArrowDown", "ArrowUp"].includes(e.key)) {
              e.preventDefault();
              const next = e.key === "ArrowDown"
                ? (currentIdx + 1) % items.length
                : (currentIdx - 1 + items.length) % items.length;
              items[next].focus();
            } else if (e.key === "Home") {
              e.preventDefault();
              items[0]?.focus();
            } else if (e.key === "End") {
              e.preventDefault();
              items[items.length - 1]?.focus();
            }
          }}
          role="group"
          className={cn(
            "relative flex flex-col w-72 max-w-full select-none",
            className
          )}
          {...props}
        >
          {/* Selected backgrounds (merged for contiguous checked items).
              A run is normally one block; mid merge/split it is drawn as two
              abutting halves — see the boundary animation logic above. */}
          <AnimatePresence>
            {blocks.map((b) => {
              const corner = b.delayCorners
                ? { ...mergeSpring, delay: b.cornerDelay ?? cornerDelay }
                : mergeSpring;
              const opacity = b.opacity ?? (isHoveringOther ? 0.8 : 1);
              return (
                <motion.div
                  key={b.key}
                  className="absolute bg-active pointer-events-none"
                  initial={
                    b.enterFrom
                      ? {
                          opacity,
                          top: b.enterFrom.top,
                          left: b.left,
                          width: b.width,
                          height: b.enterFrom.height,
                          borderTopLeftRadius: b.enterFrom.radii[0],
                          borderTopRightRadius: b.enterFrom.radii[1],
                          borderBottomRightRadius: b.enterFrom.radii[2],
                          borderBottomLeftRadius: b.enterFrom.radii[3],
                        }
                      : false
                  }
                  animate={{
                    top: b.top,
                    left: b.left,
                    width: b.width,
                    height: b.height,
                    borderTopLeftRadius: b.radii[0],
                    borderTopRightRadius: b.radii[1],
                    borderBottomRightRadius: b.radii[2],
                    borderBottomLeftRadius: b.radii[3],
                    opacity,
                  }}
                  exit={{ opacity: 0, transition: { duration: b.exitInstant ? 0 : 0.12 } }}
                  transition={
                    b.instant
                      ? { duration: 0 }
                      : {
                          ...mergeSpring,
                          borderTopLeftRadius: corner,
                          borderTopRightRadius: corner,
                          borderBottomRightRadius: corner,
                          borderBottomLeftRadius: corner,
                          opacity: { duration: 0.08 },
                        }
                  }
                />
              );
            })}
          </AnimatePresence>

          {/* Hover background */}
          <AnimatePresence>
            {activeRect && (
              <motion.div
                key={sessionRef.current}
                className={`absolute ${shape.bg} bg-hover pointer-events-none`}
                initial={{
                  opacity: 0,
                  top: activeRect.top,
                  left: activeRect.left,
                  width: activeRect.width,
                  height: activeRect.height,
                }}
                animate={{
                  opacity: 1,
                  top: activeRect.top,
                  left: activeRect.left,
                  width: activeRect.width,
                  height: activeRect.height,
                }}
                exit={{ opacity: 0, transition: { duration: 0.06 } }}
                transition={{
                  ...springs.fast,
                  opacity: { duration: 0.08 },
                }}
              />
            )}
          </AnimatePresence>

          {/* Focus ring */}
          <AnimatePresence>
            {focusRect && (
              <motion.div
                className={`absolute ${shape.focusRing} pointer-events-none z-20 border border-[#6B97FF]`}
                initial={false}
                animate={{
                  left: focusRect.left - 2,
                  top: focusRect.top - 2,
                  width: focusRect.width + 4,
                  height: focusRect.height + 4,
                }}
                exit={{ opacity: 0, transition: { duration: 0.06 } }}
                transition={{
                  ...springs.fast,
                  opacity: { duration: 0.08 },
                }}
              />
            )}
          </AnimatePresence>

          {children}
        </div>
      </CheckboxGroupContext.Provider>
    );
  }
);

CheckboxGroup.displayName = "CheckboxGroup";

interface CheckboxItemProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  index: number;
  checked: boolean;
  onToggle: () => void;
}

const CheckboxItem = forwardRef<HTMLDivElement, CheckboxItemProps>(
  ({ label, index, checked, onToggle, className, ...props }, ref) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const hasMounted = useRef(false);
    const { registerItem, activeIndex } = useCheckboxGroup();

    useEffect(() => {
      registerItem(index, internalRef.current);
      return () => registerItem(index, null);
    }, [index, registerItem]);

    useEffect(() => {
      hasMounted.current = true;
    }, []);

    const isActive = activeIndex === index;
    const skipAnimation = !hasMounted.current;
    const shape = useShape();

    return (
      <div
        ref={(node) => {
          (internalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        data-proximity-index={index}
        tabIndex={0}
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onToggle();
          }
        }}
        className={cn(
          `relative z-10 flex items-center gap-2.5 ${shape.item} px-3 py-1.5 cursor-pointer outline-none`,
          className
        )}
        {...props}
      >
        {/* Checkbox — Radix primitive for accessibility */}
        <CheckboxPrimitive.Root
          checked={checked}
          onCheckedChange={() => onToggle()}
          tabIndex={-1}
          aria-hidden
          className="relative w-[15px] h-[15px] shrink-0 appearance-none bg-transparent p-0 border-0 outline-none cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Border */}
          <div
            className={cn(
              "absolute inset-0 rounded-[5px] border-solid transition-all duration-80",
              checked
                ? "border-[1.5px] border-transparent"
                : isActive
                ? "border-[1.5px] border-neutral-400 dark:border-neutral-500"
                : "border-[1.5px] border-border"
            )}
          />
          {/* Check mark */}
          <AnimatePresence>
            {checked && (
              <CheckboxPrimitive.Indicator forceMount asChild>
                <motion.svg
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-foreground"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 1 }}
                >
                  <motion.path
                    d="M6 12L10 16L18 8"
                    initial={{
                      pathLength: skipAnimation ? 1 : 0,
                    }}
                    animate={{
                      pathLength: 1,
                      transition: {
                        duration: 0.08,
                        ease: "easeOut",
                      },
                    }}
                    exit={{
                      pathLength: 0,
                      transition: {
                        duration: 0.04,
                        ease: "easeIn",
                      },
                    }}
                  />
                </motion.svg>
              </CheckboxPrimitive.Indicator>
            )}
          </AnimatePresence>
        </CheckboxPrimitive.Root>

        {/* Label */}
        <span className="inline-grid text-[13px]">
          <span
            className="col-start-1 row-start-1 invisible"
            style={{ fontVariationSettings: fontWeights.semibold }}
            aria-hidden="true"
          >
            {label}
          </span>
          <span
            className={cn(
              "col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80",
              checked || isActive
                ? "text-foreground"
                : "text-muted-foreground"
            )}
            style={{
              fontVariationSettings: checked
                ? fontWeights.semibold
                : fontWeights.normal,
            }}
          >
            {label}
          </span>
        </span>
      </div>
    );
  }
);

CheckboxItem.displayName = "CheckboxItem";

export { CheckboxGroup, CheckboxItem };
export default CheckboxGroup;
