"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import { useShape } from "@/lib/shape-context";
import { useIcon } from "@/lib/icon-context";
import { useProximityHover } from "@/hooks/use-proximity-hover";
import { useMergeSplitBlocks, SelectionBackgrounds } from "@/hooks/use-merge-split";
import { Button } from "@/components/ui/button";

export interface AskUserOption {
  id?: string;
  title: string;
  description?: string;
}

export interface AskUserQuestion {
  id?: string;
  title: string;
  options: AskUserOption[];
  multiSelect?: boolean;
  allowOther?: boolean;
  otherPlaceholder?: string;
  skippable?: boolean;
  nextLabel?: string;
  /** Visual layout for each option row.
   *  - "inline" (default): title and description on one line.
   *  - "stacked": title above, description below — useful when descriptions
   *    are long enough to wrap. */
  layout?: "inline" | "stacked";
  /** Which side of the row the numbered chip sits on.
   *  - "right" (default): chip on the right; the single-select submit
   *    arrow overlays it on hover/focus.
   *  - "left": chip on the left, before the body. The submit arrow
   *    still appears on the right edge of the row, so the action
   *    affordance stays where the eye expects it.
   *  Works with every other option (single/multi-select, allowOther,
   *  inline/stacked layout). */
  chipPosition?: "left" | "right";
}

export interface AskUserAnswer {
  questionId: string;
  selectedIds: string[];
  otherText?: string;
  skipped?: boolean;
}

export interface AskUserQuestionsProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  questions: AskUserQuestion[];
  currentIndex?: number;
  defaultCurrentIndex?: number;
  onCurrentIndexChange?: (index: number) => void;
  answers?: Record<string, AskUserAnswer>;
  defaultAnswers?: Record<string, AskUserAnswer>;
  onAnswersChange?: (answers: Record<string, AskUserAnswer>) => void;
  onComplete?: (answers: Record<string, AskUserAnswer>) => void;
  onSkip?: (questionId: string, currentIndex: number) => void;
  skipLabel?: string;
}

function questionKey(q: AskUserQuestion, i: number) {
  return q.id ?? `q-${i}`;
}

function optionKey(o: AskUserOption, i: number) {
  return o.id ?? `o-${i}`;
}

/** Focus without scrolling the document — demos often sit mid-page. */
function focusNoScroll(el: HTMLElement | null | undefined) {
  el?.focus({ preventScroll: true });
}

const AskUserQuestions = forwardRef<HTMLDivElement, AskUserQuestionsProps>(
  function AskUserQuestions(
    {
      questions,
      currentIndex: controlledIndex,
      defaultCurrentIndex = 0,
      onCurrentIndexChange,
      answers: controlledAnswers,
      defaultAnswers,
      onAnswersChange,
      onComplete,
      onSkip,
      skipLabel = "Skip",
      className,
      ...rest
    },
    ref
  ) {
    // ── Controlled / uncontrolled state ──────────────────────────
    const [internalIndex, setInternalIndex] = useState(defaultCurrentIndex);
    const isIndexControlled = controlledIndex !== undefined;
    const index = isIndexControlled ? (controlledIndex as number) : internalIndex;
    const setIndex = useCallback(
      (next: number) => {
        if (!isIndexControlled) setInternalIndex(next);
        onCurrentIndexChange?.(next);
      },
      [isIndexControlled, onCurrentIndexChange]
    );

    const [internalAnswers, setInternalAnswers] = useState<
      Record<string, AskUserAnswer>
    >(defaultAnswers ?? {});
    const isAnswersControlled = controlledAnswers !== undefined;
    const answers = isAnswersControlled
      ? (controlledAnswers as Record<string, AskUserAnswer>)
      : internalAnswers;

    const answersRef = useRef(answers);
    useEffect(() => {
      answersRef.current = answers;
    }, [answers]);

    const writeAnswers = useCallback(
      (
        updater: (
          prev: Record<string, AskUserAnswer>
        ) => Record<string, AskUserAnswer>
      ) => {
        const next = updater(answersRef.current);
        answersRef.current = next;
        if (!isAnswersControlled) setInternalAnswers(next);
        onAnswersChange?.(next);
        return next;
      },
      [isAnswersControlled, onAnswersChange]
    );

    const shape = useShape();
    const ArrowLeft = useIcon("arrow-left");
    const ArrowRight = useIcon("arrow-right");

    // The footer ← / → icons hint at the ArrowLeft/ArrowRight keys, which
    // mobile has no equivalent for, so render them desktop-only. (The inline
    // submit arrows on option rows stay — those are tap affordances, not
    // keyboard hints.)
    const ArrowLeftKey = useMemo(
      () =>
        function ArrowLeftKey(p: {
          size?: number;
          strokeWidth?: number;
          className?: string;
        }) {
          return <ArrowLeft {...p} className={cn(p.className, "hidden sm:block")} />;
        },
      [ArrowLeft]
    );
    const ArrowRightKey = useMemo(
      () =>
        function ArrowRightKey(p: {
          size?: number;
          strokeWidth?: number;
          className?: string;
        }) {
          return <ArrowRight {...p} className={cn(p.className, "hidden sm:block")} />;
        },
      [ArrowRight]
    );

    // Detect the platform so the Continue shortcut hint shows the right
    // modifier: ⌘ on macOS, ⌃ (Control) elsewhere. Resolved after mount to
    // avoid a hydration mismatch (the server can't know the platform).
    const [isMac, setIsMac] = useState(false);
    useEffect(() => {
      const nav = navigator as Navigator & {
        userAgentData?: { platform?: string };
      };
      const platform = nav.userAgentData?.platform || nav.platform || "";
      setIsMac(/mac/i.test(platform));
    }, []);

    const reactId = useId();
    const total = questions.length;
    const safeIndex = Math.max(0, Math.min(index, Math.max(0, total - 1)));
    const question = questions[safeIndex];
    const qId = question ? questionKey(question, safeIndex) : "";
    const currentAnswer = answers[qId];

    const isMulti = !!question?.multiSelect;
    const isSkippable = question?.skippable !== false;
    const allowOther = !!question?.allowOther;
    const selectedIds = useMemo(
      () => currentAnswer?.selectedIds ?? [],
      [currentAnswer]
    );
    const otherText = currentAnswer?.otherText ?? "";

    const options = question?.options ?? [];
    const otherIndex = allowOther ? options.length : -1;
    const rowCount = options.length + (allowOther ? 1 : 0);

    // ── Refs & proximity hover ───────────────────────────────────
    const rowsContainerRef = useRef<HTMLDivElement>(null);
    // The Other field is a multi-line textarea — it auto-resizes to fit
    // wrapped content and lets users press Enter for a newline.
    const otherInputRef = useRef<HTMLTextAreaElement>(null);
    // Stable IDs for contiguous-selection runs (see selectedGroups below).
    const groupIdCounterRef = useRef(0);
    const prevGroupMapRef = useRef(new Map<number, number>());
    const {
      activeIndex,
      setActiveIndex,
      itemRects,
      sessionRef,
      handlers,
      registerItem,
      measureItems,
    } = useProximityHover(rowsContainerRef);

    // Remeasure on row count change, question change, shape change
    useEffect(() => {
      measureItems();
    }, [measureItems, qId, rowCount, shape]);

    // ── Other-row textarea auto-resize ──────────────────────────
    // The Other field is a textarea so users can write a multi-line answer.
    // Browsers don't auto-fit textarea height to content, so we set it
    // manually: reset to 0 (so the field can shrink when lines are deleted),
    // then expand to scrollHeight. Remeasure the proximity rows after — the
    // hover, selected and focus indicators absolutely-position against
    // itemRects, so they need fresh rects when the row's height changes.
    //
    // We also track whether the textarea is currently displaying more than
    // one line (either via explicit \n or text that wraps). Only then do
    // we switch the Other row to `topAlign`; in the 1-line state the row
    // stays `items-center` so a single line sits at the row's optical
    // centre, matching the surrounding option rows.
    const [isOtherMultiline, setIsOtherMultiline] = useState(false);
    // Reset the multi-line flag when the question changes so the new
    // question's first paint of an empty Other row doesn't inherit a
    // stale `true` from the previous question's multi-line draft (which
    // would briefly apply `items-start` + the -5px chip nudge on an
    // empty single-line row before the resize effect below corrects it).
    useEffect(() => {
      setIsOtherMultiline(false);
    }, [qId]);
    useEffect(() => {
      const el = otherInputRef.current;
      if (!el) return;
      el.style.height = "0px";
      el.style.height = `${el.scrollHeight}px`;
      // Threshold against the textarea's *measured* line-height, not a
      // hard-coded 22px — so the flag stays correct at high browser
      // font-size / zoom settings where line-height grows past 22 even
      // for a single line. 1.5× line-height is a generous fudge below
      // a true second wrapped line (2× line-height) but well above any
      // single-line rounding artefact.
      const lineHeight =
        parseFloat(window.getComputedStyle(el).lineHeight) || 18;
      setIsOtherMultiline(el.scrollHeight > lineHeight * 1.5);
      measureItems();
    }, [otherText, measureItems, qId]);

    // ── Animated height ──────────────────────────────────────────
    // Track the natural height of the Q/A content and animate the wrapper's
    // REAL height to it. Animating the actual height (not a layout transform)
    // means the card border and the footer below reflow frame-by-frame, so the
    // height morph and the footer move together. A ResizeObserver keeps the
    // target in sync across question swaps, shape changes, and text wrapping.
    const contentMeasureRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState<number | "auto">("auto");
    useEffect(() => {
      const el = contentMeasureRef.current;
      if (!el) return;
      const update = () => setContentHeight(el.offsetHeight);
      update();
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    // Reset transient state when question changes
    useEffect(() => {
      setActiveIndex(null);
      setFocusedIndex(null);
    }, [safeIndex, setActiveIndex]);

    // ── Keyboard focus restoration across question changes ───────
    // The question content remounts on qId, which destroys the focused row and
    // drops focus to <body>. If we navigated *from within* the rows (i.e. the
    // user was driving with the keyboard), refocus the new question's first row
    // so focus-within is kept and arrows keep routing here instead of falling
    // through to page-level navigation.
    const restoreFocusRef = useRef(false);
    const markFocusRestore = useCallback(() => {
      if (rowsContainerRef.current?.contains(document.activeElement)) {
        restoreFocusRef.current = true;
      }
    }, []);
    useEffect(() => {
      if (!restoreFocusRef.current) return;
      restoreFocusRef.current = false;
      const firstRow = rowsContainerRef.current?.querySelector(
        '[data-proximity-index="0"]'
      ) as HTMLElement | null;
      focusNoScroll(firstRow);
    }, [safeIndex]);

    // ── Answer actions ───────────────────────────────────────────
    const goNext = useCallback(
      (snapshot: Record<string, AskUserAnswer>) => {
        if (safeIndex >= total - 1) {
          onComplete?.(snapshot);
        } else {
          markFocusRestore();
          setIndex(safeIndex + 1);
        }
      },
      [safeIndex, total, onComplete, setIndex, markFocusRestore]
    );

    const handleSingleSelect = useCallback(
      (optId: string) => {
        if (!question) return;
        const text = answers[qId]?.otherText;
        const snapshot = writeAnswers((prev) => ({
          ...prev,
          [qId]: {
            questionId: qId,
            selectedIds: [optId],
            otherText: text || undefined,
            skipped: false,
          },
        }));
        goNext(snapshot);
      },
      [question, qId, answers, writeAnswers, goNext]
    );

    const handleMultiToggle = useCallback(
      (optId: string) => {
        if (!question) return;
        writeAnswers((prev) => {
          const existing = prev[qId];
          const set = new Set(existing?.selectedIds ?? []);
          if (set.has(optId)) set.delete(optId);
          else set.add(optId);
          return {
            ...prev,
            [qId]: {
              questionId: qId,
              selectedIds: Array.from(set),
              otherText: existing?.otherText,
              skipped: false,
            },
          };
        });
      },
      [question, qId, writeAnswers]
    );

    const handleOtherChange = useCallback(
      (text: string) => {
        if (!question) return;
        writeAnswers((prev) => ({
          ...prev,
          [qId]: {
            questionId: qId,
            selectedIds: prev[qId]?.selectedIds ?? [],
            otherText: text,
            skipped: false,
          },
        }));
      },
      [question, qId, writeAnswers]
    );

    const handleOtherSubmit = useCallback(() => {
      if (!question) return;
      const text = (answers[qId]?.otherText ?? "").trim();
      if (!text) return;
      const snapshot = writeAnswers((prev) => ({
        ...prev,
        [qId]: {
          questionId: qId,
          selectedIds: prev[qId]?.selectedIds ?? [],
          otherText: text,
          skipped: false,
        },
      }));
      goNext(snapshot);
    }, [question, qId, answers, writeAnswers, goNext]);

    const handleSkip = useCallback(() => {
      if (!question) return;
      const snapshot = writeAnswers((prev) => ({
        ...prev,
        [qId]: {
          questionId: qId,
          selectedIds: prev[qId]?.selectedIds ?? [],
          otherText: prev[qId]?.otherText,
          skipped: true,
        },
      }));
      onSkip?.(qId, safeIndex);
      goNext(snapshot);
    }, [question, qId, writeAnswers, onSkip, safeIndex, goNext]);

    const handleMultiNext = useCallback(() => {
      goNext(answers);
    }, [goNext, answers]);

    const handleBack = useCallback(() => {
      if (safeIndex > 0) {
        markFocusRestore();
        setIndex(safeIndex - 1);
      }
    }, [safeIndex, setIndex, markFocusRestore]);

    // ── Keyboard shortcuts: 1-9 ──────────────────────────────────
    // Handled at the root (like ⌘/⌃+Enter) so only the demo that owns
    // focus receives the key — stacked doc-page previews don't all toggle
    // at once. Click a preview first (focus-within border) to activate it.
    const handleDigitKey = useCallback(
      (e: ReactKeyboardEvent<HTMLDivElement>) => {
        if (!question) return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        const target = e.target as HTMLElement;
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable)
          return;
        const code = e.key;
        if (code < "1" || code > "9") return;
        const idx = parseInt(code, 10) - 1;
        if (idx >= 0 && idx < options.length) {
          e.preventDefault();
          e.stopPropagation();
          const oid = optionKey(options[idx], idx);
          if (isMulti) handleMultiToggle(oid);
          else handleSingleSelect(oid);
        } else if (idx === options.length && allowOther) {
          e.preventDefault();
          e.stopPropagation();
          focusNoScroll(otherInputRef.current);
        }
      },
      [
        question,
        options,
        isMulti,
        allowOther,
        handleSingleSelect,
        handleMultiToggle,
      ]
    );

    // ── Keyboard navigation ──────────────────────────────────────
    // Up/Down move the highlight between rows using the SAME indicator as
    // mouse hover (activeIndex → bg-hover), so keyboard and pointer focus look
    // identical. Left = Back, Right = Skip. We stopPropagation on the arrows we
    // handle so the doc page's ←/→ page-change nav (a window listener) doesn't
    // also fire — important for multi-select, whose container is role="group"
    // (not "radiogroup") and so isn't auto-skipped by that handler.
    const focusRow = (idx: number) => {
      const el = rowsContainerRef.current?.querySelector(
        `[data-proximity-index="${idx}"]`
      ) as HTMLElement | null;
      focusNoScroll(el);
    };

    const moveActive = useCallback(
      (next: number) => {
        setActiveIndex(next);
        // The Other row is a text field — focus the input directly so typing
        // works; everything else focuses the row for Enter/Space selection.
        if (allowOther && next === otherIndex)
          focusNoScroll(otherInputRef.current);
        else focusRow(next);
      },
      [allowOther, otherIndex, setActiveIndex]
    );

    const handleNavKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const isTextInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Inside the Other text field, ←/→ and Home/End move the caret natively.
      // ↑/↓ are dual-purpose in the textarea: when the caret has more lines
      // to move to in that direction (there's a \n before/after it), let the
      // browser handle native caret movement; only steal the keystroke to
      // navigate to an adjacent option row when the caret is already at the
      // first / last line — otherwise the user can't edit a multi-line draft
      // without focus jumping out of the field.
      if (isTextInput && e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      if (
        isTextInput &&
        (e.key === "ArrowUp" || e.key === "ArrowDown") &&
        target.tagName === "TEXTAREA"
      ) {
        // Position-bounds check — works for BOTH explicit `\n` AND visual
        // line wraps. Only steal the key when the caret has nowhere left
        // to go inside the textarea: ArrowUp at the very start, or
        // ArrowDown at the very end. Anywhere else, let the textarea
        // handle native caret movement (line-by-line up/down, including
        // through wrapped lines without `\n`).
        const ta = target as HTMLTextAreaElement;
        if (e.key === "ArrowUp" && ta.selectionStart > 0) return;
        if (e.key === "ArrowDown" && ta.selectionEnd < ta.value.length) return;
      }

      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        if (e.key === "ArrowLeft") {
          if (safeIndex > 0) handleBack();
        } else if (isSkippable && total > 1) {
          handleSkip();
        }
        return;
      }

      if (rowCount === 0) return;
      if (
        e.key === "ArrowDown" ||
        e.key === "ArrowUp" ||
        e.key === "Home" ||
        e.key === "End"
      ) {
        e.preventDefault();
        e.stopPropagation();
        let next: number;
        if (e.key === "Home") next = 0;
        else if (e.key === "End") next = rowCount - 1;
        else {
          // When focus is in the Other field, treat it as the Other row.
          const base = isTextInput ? otherIndex : activeIndex ?? -1;
          next = e.key === "ArrowDown" ? base + 1 : base - 1;
          next = (next + rowCount) % rowCount;
        }
        moveActive(next);
      }
    };

    // Cmd+Enter (macOS) / Ctrl+Enter (Windows/Linux) commits a multi-select
    // question, mirroring the Continue button. Handled at the root so it works
    // wherever focus sits inside the card, and scoped to this instance because
    // the event has to bubble up from a focused descendant (no global listener,
    // so stacked demos don't all fire at once).
    const handleRootKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "Enter") return;
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod || !isMulti) return;
      e.preventDefault(); // keep a focused button/row from also activating
      const hasAnswer = selectedIds.length > 0 || otherText.trim().length > 0;
      if (hasAnswer) handleMultiNext();
    };

    if (!question) {
      return (
        <div
          ref={ref}
          className={cn(
            "w-full max-w-[520px] p-5 bg-card border border-border",
            shape.container,
            className
          )}
          {...rest}
        >
          <p className="text-[13px] text-muted-foreground">No questions.</p>
        </div>
      );
    }

    // ── Layout calculations for hover/focus indicators ───────────
    const activeRect =
      activeIndex !== null ? itemRects[activeIndex] : null;
    // The blue morphing focus ring is intentionally suppressed for the Other
    // field: that row has its own input-field treatment (the "type here" hint
    // when empty, the merged selected bg once it has text), so the ring is
    // redundant there and reads as noise while typing. focusedIndex is still
    // tracked for the hint and submit-arrow visibility — we just don't draw a
    // ring around it.
    const focusRect =
      focusedIndex !== null && !(allowOther && focusedIndex === otherIndex)
        ? itemRects[focusedIndex]
        : null;

    // ── Selected-row grouping (merges contiguous selections) ─────
    // Mirrors the CheckboxGroup pattern: contiguous selected indices
    // collapse into a single rounded background block; stable IDs let
    // framer-motion morph block size/position when neighbours toggle.
    // The Other row gets its own input-field-style indicator (see below) and
    // is intentionally excluded here so it doesn't merge into a contiguous
    // bg-accent block with adjacent selected options.
    // Include the Other row in selectedIndices when it has text. This lets
    // it merge into the same morphing bg block as adjacent selected options
    // (instead of looking like a disconnected input field next to them).
    const selectedIndices = useMemo(() => {
      const set = new Set<number>();
      options.forEach((opt, i) => {
        if (selectedIds.includes(optionKey(opt, i))) set.add(i);
      });
      if (allowOther && otherText.length > 0) set.add(otherIndex);
      return set;
    }, [options, selectedIds, allowOther, otherText, otherIndex]);

    const selectedGroups = useMemo(() => {
      const runs: { start: number; end: number }[] = [];
      const sorted = [...selectedIndices].sort((a, b) => a - b);
      for (const idx of sorted) {
        const last = runs[runs.length - 1];
        if (last && idx === last.end + 1) last.end = idx;
        else runs.push({ start: idx, end: idx });
      }

      // Stable run IDs so a growing/shrinking run animates instead of
      // exit+re-enter when neighbours flip.
      const usedIds = new Set<number>();
      const nextGroupMap = new Map<number, number>();
      const groups = runs.map((run) => {
        let stableId: number | null = null;
        for (let i = run.start; i <= run.end; i++) {
          const prev = prevGroupMapRef.current.get(i);
          if (prev !== undefined && !usedIds.has(prev)) {
            stableId = prev;
            break;
          }
        }
        const id = stableId ?? ++groupIdCounterRef.current;
        usedIds.add(id);
        for (let i = run.start; i <= run.end; i++) nextGroupMap.set(i, id);
        return { ...run, id };
      });
      prevGroupMapRef.current = nextGroupMap;
      return groups;
    }, [selectedIndices]);

    // True when the user is hovering a row that ISN'T part of any selected
    // run — we dim the selected backgrounds slightly to draw attention to
    // the hover target.
    const isHoveringNonSelected =
      activeIndex !== null && !selectedIndices.has(activeIndex);

    // Selected backgrounds, with the merge/split boundary animation when one
    // unselected row bridges or splits two selected runs. Selected backgrounds
    // use shape.bg, so corners animate around its radius.
    const blocks = useMergeSplitBlocks(selectedGroups, itemRects, shape.bgRadius);

    const showBack = total > 1 && safeIndex > 0;
    const showSkip = total > 1 && isSkippable;
    const showFooter = showBack || showSkip || isMulti;

    return (
      <div
        ref={ref}
        className={cn(
          // overflow-hidden crops the footer buttons to the card's rounded
          // bounds, so a button animating out (e.g. Continue on exit) is
          // clipped at the edge instead of visibly flying outside the card.
          "relative w-full max-w-[520px] overflow-hidden bg-card border border-border",
          shape.container,
          className
        )}
        {...rest}
        onKeyDown={(e) => {
          rest.onKeyDown?.(e);
          handleDigitKey(e);
          handleRootKey(e);
        }}
      >
        {/* Header — static top, fixed across questions; only the number
            changes. Lives outside the morphing region so it never shifts. */}
        <div className="flex items-center px-4 sm:px-5 pt-4 sm:pt-5 pb-2 text-[12px] text-muted-foreground">
          <span>
            Question {safeIndex + 1} of {total}
          </span>
        </div>

        {/* Morphing Q/A region — its REAL height animates to the measured
            natural height of the content below, so the card border and the
            footer reflow in lockstep with the spring. overflow-hidden clips
            the instantly-swapped content, revealing it as the height opens.
            Header and footer sit outside, so neither is clipped or yanked. */}
        <motion.div
          animate={{ height: contentHeight }}
          initial={false}
          transition={springs.slow}
          className="overflow-hidden"
        >
          <div
            ref={contentMeasureRef}
            className={cn(
              "px-4 sm:px-5",
              showFooter ? "pb-1" : "pb-2.5 sm:pb-3"
            )}
          >
            <div key={qId} className="flex flex-col gap-2">
            {/* Question title */}
            <h3
              id={`${reactId}-${qId}-title`}
              className="text-[16px] text-foreground leading-snug"
              style={{ fontVariationSettings: fontWeights.semibold }}
            >
              {question.title}
            </h3>

            {/* Options + Other (proximity-tracked container) */}
            <div
              ref={rowsContainerRef}
              role={isMulti ? "group" : "radiogroup"}
              aria-labelledby={`${reactId}-${qId}-title`}
              onMouseEnter={handlers.onMouseEnter}
              onMouseMove={handlers.onMouseMove}
              onMouseLeave={handlers.onMouseLeave}
              onKeyDown={handleNavKey}
              className="relative flex flex-col gap-0.5 -mx-3"
            >
              {/* Other-row input hint — shown only when the Other input is
                  focused and still empty, to signal "type here". As soon as
                  text exists, the row joins selectedIndices and inherits the
                  selected merged bg, so it visually integrates with adjacent
                  selected options instead of looking like a standalone field. */}
              <AnimatePresence>
                {(() => {
                  if (!allowOther) return null;
                  const otherRect = itemRects[otherIndex];
                  const isEmptyFocused =
                    focusedIndex === otherIndex && otherText.length === 0;
                  if (!otherRect || !isEmptyFocused) return null;
                  return (
                    <motion.div
                      key="other-input"
                      aria-hidden
                      className={cn(
                        "absolute pointer-events-none bg-card ring-1 ring-inset ring-border",
                        shape.bg
                      )}
                      initial={{
                        opacity: 0,
                        top: otherRect.top,
                        left: otherRect.left,
                        width: otherRect.width,
                        height: otherRect.height,
                      }}
                      animate={{
                        opacity: 1,
                        top: otherRect.top,
                        left: otherRect.left,
                        width: otherRect.width,
                        height: otherRect.height,
                      }}
                      exit={{ opacity: 0, transition: { duration: 0.08 } }}
                      transition={{
                        ...springs.fast,
                        opacity: { duration: 0.08 },
                      }}
                    />
                  );
                })()}
              </AnimatePresence>

              {/* Single morphing hover indicator (rendered below selected bg
                  so a hovered+selected row still reads as clearly selected) */}
              <AnimatePresence>
                {activeRect && (
                  <motion.div
                    key={`hover-${sessionRef.current}`}
                    aria-hidden
                    className={cn(
                      "absolute pointer-events-none bg-hover",
                      shape.bg
                    )}
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

              {/* Selected-row backgrounds (merged for contiguous selections).
                  A run is normally one block; mid merge/split it is drawn as two
                  abutting halves — see useMergeSplitBlocks. Uses bg-active
                  (overlay-aware) and renders ABOVE the hover indicator so the
                  selected state stays readable when mousing over a row. Corners
                  are driven numerically (around shape.bg's radius) so a single
                  selected row matches its hover. */}
              <SelectionBackgrounds
                blocks={blocks}
                dimmed={isHoveringNonSelected}
              />

              {/* Single morphing focus ring */}
              <AnimatePresence>
                {focusRect && (
                  <motion.div
                    aria-hidden
                    className={cn(
                      "absolute pointer-events-none border border-[#6B97FF] z-20",
                      shape.focusRing
                    )}
                    initial={{
                      opacity: 0,
                      top: focusRect.top - 2,
                      left: focusRect.left - 2,
                      width: focusRect.width + 4,
                      height: focusRect.height + 4,
                    }}
                    animate={{
                      opacity: 1,
                      top: focusRect.top - 2,
                      left: focusRect.left - 2,
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

              {options.map((opt, i) => {
                const oid = optionKey(opt, i);
                const isSelected = selectedIds.includes(oid);
                const isHover = activeIndex === i;
                const showArrow = !isMulti && isHover;
                return (
                  <Row
                    key={oid}
                    index={i}
                    registerItem={registerItem}
                    role={isMulti ? "checkbox" : "radio"}
                    isSelected={isSelected}
                    tabIndex={
                      isMulti
                        ? 0
                        : selectedIds[0] === oid ||
                          (!selectedIds.length && i === 0)
                        ? 0
                        : -1
                    }
                    onFocusVisible={() => setActiveIndex(i)}
                    onBlurAny={() =>
                      setActiveIndex((prev) => (prev === i ? null : prev))
                    }
                    onClick={() =>
                      isMulti ? handleMultiToggle(oid) : handleSingleSelect(oid)
                    }
                    onKeyDown={(e) => {
                      // Let ⌘/Ctrl+Enter fall through to the root handler
                      // (Continue) instead of toggling the focused row.
                      if (
                        (e.key === " " || e.key === "Enter") &&
                        !e.metaKey &&
                        !e.ctrlKey
                      ) {
                        e.preventDefault();
                        if (isMulti) handleMultiToggle(oid);
                        else handleSingleSelect(oid);
                      }
                    }}
                    shape={shape}
                    aria-checked={isSelected}
                    chipContent={i + 1}
                    chipFilled={isSelected}
                    isMulti={isMulti}
                    showArrow={showArrow}
                    bodyLayout={question.layout === "stacked" ? "stacked" : "inline"}
                    // Anchor the chip to the first text line whenever the
                    // body can wrap to multiple lines (stacked layouts
                    // pair a title with a description that often wraps).
                    topAlign={question.layout === "stacked"}
                    chipPosition={question.chipPosition ?? "right"}
                    arrowIcon={
                      <ArrowRight
                        size={14}
                        strokeWidth={2}
                        className="h-3.5 w-3.5"
                      />
                    }
                  >
                    {question.layout === "stacked" ? (
                      <>
                        <span className="inline-grid">
                          <span
                            className="col-start-1 row-start-1 invisible"
                            style={{ fontVariationSettings: fontWeights.semibold }}
                            aria-hidden="true"
                          >
                            {opt.title}
                          </span>
                          <span
                            className="col-start-1 row-start-1 text-foreground transition-[color,font-variation-settings] duration-80"
                            style={{
                              fontVariationSettings: isSelected
                                ? fontWeights.semibold
                                : fontWeights.medium,
                            }}
                          >
                            {opt.title}
                          </span>
                        </span>
                        {opt.description && (
                          <span className="text-[12px] text-muted-foreground leading-snug">
                            {opt.description}
                          </span>
                        )}
                      </>
                    ) : (
                      <span>
                        <span className="inline-grid">
                          <span
                            className="col-start-1 row-start-1 invisible"
                            style={{ fontVariationSettings: fontWeights.semibold }}
                            aria-hidden="true"
                          >
                            {opt.title}
                          </span>
                          <span
                            className="col-start-1 row-start-1 text-foreground transition-[color,font-variation-settings] duration-80"
                            style={{
                              fontVariationSettings: isSelected
                                ? fontWeights.semibold
                                : fontWeights.medium,
                            }}
                          >
                            {opt.title}
                          </span>
                        </span>
                        {opt.description && (
                          <>
                            {" "}
                            <span className="text-muted-foreground">
                              {opt.description}
                            </span>
                          </>
                        )}
                      </span>
                    )}
                  </Row>
                );
              })}

              {allowOther && (
                <Row
                  index={otherIndex}
                  registerItem={registerItem}
                  role={null}
                  isSelected={otherText.length > 0}
                  tabIndex={-1}
                  onFocusVisible={() => setFocusedIndex(otherIndex)}
                  onBlurAny={() =>
                    setFocusedIndex((prev) =>
                      prev === otherIndex ? null : prev
                    )
                  }
                  onClick={() => focusNoScroll(otherInputRef.current)}
                  shape={shape}
                  chipContent={otherIndex + 1}
                  chipFilled={otherText.length > 0}
                  isMulti={isMulti}
                  // Other body is a textarea that may grow past one line;
                  // only switch to top-aligned when it actually wraps, so
                  // the 1-line empty / single-line state stays visually
                  // centred like the surrounding option rows.
                  topAlign={isOtherMultiline}
                  chipPosition={question.chipPosition ?? "right"}
                  ariaLabel={
                    question.otherPlaceholder ?? "Describe in your own words"
                  }
                  showArrow={
                    !isMulti &&
                    (focusedIndex === otherIndex ||
                      activeIndex === otherIndex) &&
                    otherText.trim().length > 0
                  }
                  arrowIcon={
                    <ArrowRight
                      size={14}
                      strokeWidth={2}
                      className="h-3.5 w-3.5"
                    />
                  }
                  onArrowClick={
                    !isMulti && otherText.trim().length > 0
                      ? handleOtherSubmit
                      : undefined
                  }
                >
                  <span className="inline-grid w-full">
                    <textarea
                      ref={otherInputRef}
                      rows={1}
                      value={otherText}
                      placeholder={
                        question.otherPlaceholder ??
                        "Describe in your own words…"
                      }
                      aria-label={
                        question.otherPlaceholder ?? "Describe in your own words"
                      }
                      onChange={(e) => handleOtherChange(e.target.value)}
                      onFocus={() => setFocusedIndex(otherIndex)}
                      onBlur={() =>
                        setFocusedIndex((prev) =>
                          prev === otherIndex ? null : prev
                        )
                      }
                      onKeyDown={(e) => {
                        // Standard chat pattern: plain Enter submits,
                        // Shift+Enter inserts a newline. Works for both
                        // desktop and mobile soft keyboards (where ⌘/⌃
                        // isn't reachable). In multi-select we leave plain
                        // Enter to the textarea (newline) and let the
                        // root handler catch ⌘/⌃+Enter for Continue —
                        // multi-select has its own Continue button as the
                        // primary submit affordance.
                        if (e.key !== "Enter") return;
                        if (e.shiftKey) return; // Shift+Enter = newline
                        if (!isMulti) {
                          e.preventDefault();
                          handleOtherSubmit();
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        // Reset every textarea default that would otherwise
                        // make the field taller/boxier than the single-line
                        // input it replaces — no border, no padding, no
                        // resize handle, no scrollbars (height is JS-driven,
                        // see the auto-resize effect above).
                        "col-start-1 row-start-1 block w-full bg-transparent border-0 p-0 m-0 outline-none resize-none overflow-hidden text-[13px] leading-snug text-foreground placeholder:text-muted-foreground"
                      )}
                      style={{ fontVariationSettings: fontWeights.medium }}
                    />
                  </span>
                </Row>
              )}
            </div>
          </div>
          </div>
        </motion.div>

        {/* Footer — outside the morphing region, so the animating height never
            clips it. Because the height is a real layout value (not a
            transform), the footer reflows frame-by-frame and rides the morph
            in lockstep. */}
        {showFooter && (
          <div className="px-4 sm:px-5 pt-1 pb-2">
            <div className="flex items-center justify-between gap-2 -mx-2 sm:-mx-3">
              {/* Each button is wrapped in a motion.div so it fades + scales
                  when it appears/disappears (e.g. Continue on multi-select).
                  popLayout pops the exiting button out of flow so its
                  neighbours slide to their new spot *at the same time* it fades
                  (not sequentially). The group is `relative` so the popped
                  (absolutely positioned) button stays put instead of flying to
                  the page origin. */}
              <div className="relative flex items-center gap-2">
                <AnimatePresence mode="popLayout" initial={false}>
                  {showBack && (
                    <motion.div
                      key="back"
                      layout="position"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{
                        ...springs.fast,
                        opacity: { duration: 0.1 },
                      }}
                    >
                      {/* Bare ← icon via the Button's icon slot, so it gets the
                          proper tighter icon-side padding. */}
                      <Button
                        variant="ghost"
                        size="sm"
                        leadingIcon={ArrowLeftKey}
                        onClick={handleBack}
                        // Arrow is desktop-only; restore symmetric padding on
                        // mobile where it's hidden, tighten for the icon on ≥sm.
                        className="pl-3 sm:pl-[6px]"
                      >
                        Back
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="relative flex items-center gap-2">
                <AnimatePresence mode="popLayout" initial={false}>
                  {showSkip && (
                    <motion.div
                      key="skip"
                      layout="position"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{
                        ...springs.fast,
                        opacity: { duration: 0.1 },
                      }}
                    >
                      {/* Bare → icon via the Button's icon slot (mirror of Back). */}
                      <Button
                        variant="ghost"
                        size="sm"
                        trailingIcon={ArrowRightKey}
                        onClick={handleSkip}
                        // Arrow is desktop-only; restore symmetric padding on
                        // mobile where it's hidden, tighten for the icon on ≥sm.
                        className="pr-3 sm:pr-[6px]"
                      >
                        {skipLabel}
                      </Button>
                    </motion.div>
                  )}
                  {isMulti && (
                    <motion.div
                      key="continue"
                      layout="position"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{
                        ...springs.fast,
                        opacity: { duration: 0.1 },
                      }}
                    >
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleMultiNext}
                        disabled={
                          selectedIds.length === 0 &&
                          otherText.trim().length === 0
                        }
                        // The shortcut chip acts as a trailing icon, so tighten
                        // the right padding to match the Button's iconRight on
                        // desktop. The chip is hidden on mobile, so restore
                        // symmetric padding there.
                        className="pr-3 sm:pr-[6px]"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {question.nextLabel ??
                            (safeIndex >= total - 1 ? "Finish" : "Continue")}
                          {/* Shortcut hint — replaces the trailing arrow. Sits
                              inside the button so it dims with the disabled
                              state. ⌘↵ on macOS, ⌃↵ elsewhere. Desktop-only:
                              mobile has no physical keyboard to trigger it. */}
                          <span className="hidden sm:contents">
                            <ShortcutChip shape={shape} tone="inverted">
                              {isMac ? "⌘" : "⌃"}
                              {"↵"}
                            </ShortcutChip>
                          </span>
                        </span>
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

AskUserQuestions.displayName = "AskUserQuestions";

// ── Shortcut chip ─────────────────────────────────────────────
// Small keycap showing the keyboard shortcut for an action, so Back (←),
// Skip (→) and Continue (⌘↵ / ⌃↵) all read consistently. `tone="inverted"`
// sits on the dark primary button; the default reads on quiet ghost buttons.
function ShortcutChip({
  children,
  tone = "muted",
  shape,
}: {
  children: React.ReactNode;
  tone?: "muted" | "inverted";
  shape: ReturnType<typeof useShape>;
}) {
  return (
    <kbd
      aria-hidden
      className={cn(
        "inline-flex items-center justify-center gap-0.5 px-1 min-w-[18px] h-[18px] text-[11px] leading-none font-sans tracking-wide",
        tone === "inverted"
          ? "bg-background/15 text-background"
          : "bg-foreground/10 text-muted-foreground",
        shape.bg
      )}
    >
      {children}
    </kbd>
  );
}

// ── Row sub-component ─────────────────────────────────────────

interface RowProps {
  index: number;
  registerItem: (index: number, element: HTMLElement | null) => void;
  role: "radio" | "checkbox" | null;
  isSelected: boolean;
  tabIndex: number;
  onFocusVisible: () => void;
  onBlurAny: () => void;
  onClick: () => void;
  onKeyDown?: (e: ReactKeyboardEvent<HTMLDivElement>) => void;
  shape: ReturnType<typeof useShape>;
  chipContent: React.ReactNode;
  chipFilled: boolean;
  isMulti: boolean;
  ariaLabel?: string;
  "aria-checked"?: boolean;
  showArrow?: boolean;
  arrowIcon?: React.ReactNode;
  onArrowClick?: () => void;
  /** Body content layout. "inline" keeps title + description on one line;
   *  "stacked" puts description below the title with extra vertical padding. */
  bodyLayout?: "inline" | "stacked";
  /** Anchor the chip to the first line of the body instead of vertically
   *  centering it on the row. Use when the body can grow taller than one
   *  line (Other row's textarea, stacked title + description, or any
   *  wrapping content) — otherwise the chip drifts toward the middle of a
   *  tall row and stops reading as a marker for the row's title. */
  topAlign?: boolean;
  /** Mirrors the per-question `chipPosition`. "left" moves the chip to
   *  the leading edge of the row; the trailing arrow slot still sits on
   *  the right. Defaults to "right". */
  chipPosition?: "left" | "right";
  children: React.ReactNode;
}

function Row({
  index,
  registerItem,
  role,
  isSelected,
  tabIndex,
  onFocusVisible,
  onBlurAny,
  onClick,
  onKeyDown,
  shape,
  chipContent,
  chipFilled,
  isMulti,
  ariaLabel,
  showArrow,
  arrowIcon,
  onArrowClick,
  bodyLayout = "inline",
  topAlign = false,
  chipPosition = "right",
  children,
  ...aria
}: RowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerItem(index, rowRef.current);
    return () => registerItem(index, null);
  }, [index, registerItem]);

  // The arrow keeps the same animation regardless of which slot it lands
  // in — pull it out so the chip-on-right (overlay) and chip-on-left
  // (separate right slot) paths can reuse the exact same element.
  const arrowOverlay = (
    <AnimatePresence>
      {showArrow && (
        <motion.span
          aria-hidden={!onArrowClick}
          role={onArrowClick ? "button" : undefined}
          onClick={
            onArrowClick
              ? (e) => {
                  e.stopPropagation();
                  onArrowClick();
                }
              : undefined
          }
          className={cn(
            "absolute inset-0 inline-flex items-center justify-center bg-foreground text-background",
            shape.bg,
            onArrowClick && "cursor-pointer"
          )}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{
            opacity: 0,
            scale: 0.6,
            transition: { duration: 0.06 },
          }}
          transition={{
            ...springs.fast,
            opacity: { duration: 0.08 },
          }}
        >
          {arrowIcon}
        </motion.span>
      )}
    </AnimatePresence>
  );

  // The chip "slot" is a fixed 28×28 cell holding the chip number/circle.
  // When topAlign is on, the slot floats up so the chip's vertical centre
  // lines up with the centre of a `text-[13px] leading-snug` first line
  // (line-height ≈ 18px → centre 9px; chip centre 14px → diff 5px).
  // Stacked rows pair a title with a description, so we add 4px of
  // breathing room back on top (effective shift -1px) — that lands the
  // chip near the title's baseline rather than its optical centre, which
  // reads as "row marker" instead of "title label" when descriptions wrap.
  // The arrow overlay only co-renders here when `chipPosition === "right"`
  // — in chip-on-left mode the arrow has its own right-edge slot so the
  // chip stays visible while the submit affordance lives where users
  // expect it (the trailing end of the row).
  const chipSlot = (
    <span
      className={cn(
        "shrink-0 w-7 h-7 relative inline-flex items-center justify-center",
        topAlign &&
          (bodyLayout === "stacked" ? "-mt-[1px]" : "-mt-[5px]")
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inline-flex items-center justify-center w-5 h-5 text-[11px] transition-[opacity,font-variation-settings] duration-80",
          isMulti && shape.bg,
          isMulti
            ? chipFilled
              ? "bg-foreground text-background"
              : "border border-border text-muted-foreground"
            : chipFilled
            ? "text-foreground"
            : "text-muted-foreground",
          // Only fade the chip when it shares a slot with the arrow — for
          // chip-on-left the arrow has its own slot on the right, so the
          // chip stays in place.
          chipPosition === "right" && showArrow && "opacity-0"
        )}
        style={{
          fontVariationSettings: chipFilled
            ? fontWeights.semibold
            : fontWeights.medium,
        }}
      >
        {chipContent}
      </span>
      {chipPosition === "right" && arrowOverlay}
    </span>
  );

  // Right-edge arrow slot — only used when the chip is on the LEFT and
  // the row can show an arrow (single-select only; in multi-select
  // showArrow is always false and there's nothing to anchor here). Mirrors
  // the chip slot's stacked-vs-inline shift so both end markers stay on
  // the same horizontal line at all times.
  const rightArrowSlot = chipPosition === "left" && !isMulti && (
    <span
      className={cn(
        "shrink-0 w-7 h-7 relative inline-flex items-center justify-center",
        topAlign &&
          (bodyLayout === "stacked" ? "-mt-[1px]" : "-mt-[5px]")
      )}
    >
      {arrowOverlay}
    </span>
  );

  return (
    <div
      ref={rowRef}
      data-proximity-index={index}
      data-state={isSelected ? "checked" : "unchecked"}
      role={role ?? undefined}
      aria-checked={role === "radio" || role === "checkbox" ? !!aria["aria-checked"] : undefined}
      aria-label={ariaLabel}
      tabIndex={tabIndex}
      onFocus={(e) => {
        if ((e.target as HTMLElement).matches(":focus-visible")) {
          onFocusVisible();
        }
      }}
      onBlur={onBlurAny}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={cn(
        "relative z-10 flex cursor-pointer select-none outline-none",
        // Tighter gap when the chip sits on the left — it reads as a
        // leading list marker, so coupling it close to the title looks
        // more intentional than the larger right-side gap (where the
        // chip is a trailing affordance instead).
        chipPosition === "left" ? "gap-2" : "gap-3",
        // items-start when the body may exceed one line (stacked layouts,
        // multi-line textareas) so the chip tracks the first line instead
        // of sliding to the row's vertical centre. When topAlign is OFF,
        // items-center keeps a 1-line row visually centred — that's why
        // the Other row defers topAlign until its textarea actually wraps.
        topAlign ? "items-start" : "items-center",
        bodyLayout === "stacked" ? "min-h-14 py-2" : "min-h-10 py-1.5",
        // Mirror the horizontal padding based on chip side so the row
        // reads visually balanced in both orientations. For chip-on-left
        // + multi-select there's no right slot, so widen the right padding
        // to match the chip-on-right's 12px / 6px asymmetry mirrored.
        chipPosition === "left"
          ? isMulti
            ? "pl-1.5 pr-3"
            : "pl-1.5 pr-1.5"
          : "pl-3 pr-1.5",
        shape.item
      )}
    >
      {/* Selected background is drawn at the container level so contiguous
          selections can merge into a single block (see AskUserQuestions's
          selectedGroups / merged-bg block). Row keeps z-10 to sit above it. */}

      {chipPosition === "left" && chipSlot}

      {/* Body — fills row */}
      <span
        className={cn(
          "min-w-0 flex-1 text-[13px] leading-snug",
          bodyLayout === "stacked"
            ? "flex flex-col gap-0.5"
            : "inline-flex items-center gap-0"
        )}
      >
        {children}
      </span>

      {chipPosition === "right" ? chipSlot : rightArrowSlot}
    </div>
  );
}

export { AskUserQuestions };
export default AskUserQuestions;
