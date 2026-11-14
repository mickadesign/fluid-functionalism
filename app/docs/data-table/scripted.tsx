"use client";

import { useEffect, useRef, useState, type FocusEvent, type RefObject, type SyntheticEvent } from "react";
import { createPortal } from "react-dom";
import { animate } from "motion/react";
import { FakeCursor, type Cursor } from "@/app/docs/skill/hero-shared";

// The scripted cursor for this page's demos, as the skill page plays its
// examples: usePlayback / useLoop / useScriptCursor from hero-shared, drawn
// here over the page rather than inside the demo. A drag lifts its ghost
// into a layer above the page (portalled to body), and a cursor inside the
// preview's own stacking context would pass under it.

/** How long a glide takes (hero-shared's GLIDE_MS), for steps timed here. */
export const GLIDE = 500;

/** The cursor, in a box laid exactly over `rootRef` in the page's own
 *  coordinates: it scrolls with the page, and is placed again when the
 *  page's layout changes. */
export function CursorLayer({
  rootRef,
  cursor,
  playing,
}: {
  rootRef: RefObject<HTMLElement | null>;
  cursor: Cursor;
  /** The script's cursor steps aside while a visitor's own is in the demo. */
  playing: boolean;
}) {
  const [at, setAt] = useState<{ left: number; top: number } | null>(null);
  // An effect, not a layout effect: this renders inside the root, and a
  // child's layout effects run before its parent's ref is attached.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const place = () => {
      const r = root.getBoundingClientRect();
      const next = { left: r.left + window.scrollX, top: r.top + window.scrollY };
      setAt((old) => (old && old.left === next.left && old.top === next.top ? old : next));
    };
    place();
    // Anything above the demo changing height moves it down the page.
    const observer = new ResizeObserver(place);
    observer.observe(document.body);
    observer.observe(root);
    window.addEventListener("resize", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [rootRef]);
  if (!at) return null;
  return createPortal(
    <div
      aria-hidden
      className="pointer-events-none absolute z-[calc(var(--z-popover,60)+1)] size-0 transition-opacity duration-150"
      style={{ ...at, opacity: playing ? 1 : 0 }}
    >
      {/* A real pointer's size: these demos are components at full size,
          not the skill page's small frames. */}
      <FakeCursor x={cursor.x} y={cursor.y} scale={cursor.scale} opacity={cursor.opacity} size={24} />
    </div>,
    document.body
  );
}

/** The steps of one scripted drag: glide to `from` and rest on it, press,
 *  carry to `to` (off its center by `offset`, which picks the side it
 *  drops on), let go, then hold `holdMs` on the result. */
export function dragSteps(
  cursor: Cursor,
  from: string,
  to: string,
  offset: { x?: number; y?: number },
  holdMs: number
) {
  return [
    { ms: GLIDE + 450, run: () => cursor.goto(from) },
    { ms: 250, run: () => cursor.press() },
    { ms: GLIDE + 350, run: () => cursor.goto(to, 0, offset) },
    { ms: holdMs, run: () => cursor.release() },
  ];
}

type Step = { ms: number; run: () => void };

/** For a script that has to move focus (a cell's editor and a menu only
 *  exist focused). It takes focus only when nobody holds it (`free`: focus
 *  on the page itself), marks its own focus so playback doesn't read it as
 *  a visitor's keyboard (`bind`, in place of usePlayback's), and hands
 *  focus back to the page when it is done (`giveBack`). */
export function useScriptFocus<B extends { onFocus: (e: FocusEvent) => void; onPointerDown: (e: SyntheticEvent) => void }>(
  rootRef: RefObject<HTMLElement | null>,
  bind: B
) {
  const scripting = useRef(false);
  return {
    bind: {
      ...bind,
      onFocus: (e: FocusEvent) => {
        if (!scripting.current) bind.onFocus(e);
      },
      // A cell woken by script presses its own editor in turn: a press
      // made by code, which is not a visitor's either.
      onPointerDown: (e: SyntheticEvent) => {
        if (!scripting.current || e.nativeEvent.isTrusted) bind.onPointerDown(e);
      },
    },
    /** Whether the script holds focus now. */
    scripting,
    /** Claims focus for the script; false when a visitor has it. */
    take() {
      const active = document.activeElement;
      // Focus a mouse click left on something in this demo is nobody's:
      // the pointer has gone (or the script wouldn't be playing).
      const stale = !!active && !!rootRef.current?.contains(active) && !active.matches(":focus-visible");
      if (active && active !== document.body && !stale) return false;
      scripting.current = true;
      return true;
    },
    giveBack() {
      if (!scripting.current) return;
      const active = document.activeElement;
      // Only what the script focused: inside the demo, or a menu it opened.
      if (active instanceof HTMLElement && (rootRef.current?.contains(active) || active.closest("[role=menu]"))) active.blur();
      scripting.current = false;
    },
  };
}

/** Sets a field's text as typing does: through the native setter, then
 *  the input event React listens for. */
export function setFieldValue(field: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(field, value);
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

/** The steps that retype a field from `from` to `to`, a key at a time:
 *  back to what the two share, then forward. Each step sets the whole
 *  text, so a pass picked up midway still ends on `to`. The last step
 *  holds `holdMs` on the result. */
export function retypeSteps(
  field: () => HTMLInputElement | HTMLTextAreaElement | null | undefined,
  from: string,
  to: string,
  holdMs: number
): Step[] {
  let shared = 0;
  while (shared < from.length && shared < to.length && from[shared] === to[shared]) shared++;
  const texts: Array<{ text: string; ms: number }> = [];
  for (let n = from.length - 1; n >= shared; n--) texts.push({ text: from.slice(0, n), ms: 45 });
  for (let n = shared + 1; n <= to.length; n++) texts.push({ text: to.slice(0, n), ms: 80 });
  return texts.map(({ text, ms }, i) => ({
    ms: i === texts.length - 1 ? holdMs : ms,
    run: () => {
      const el = field();
      if (el) setFieldValue(el, text);
    },
  }));
}

/** A scripted drag for what listens to the mouse rather than the pointer
 *  (a column's resize edge): press `target`, and the cursor's own
 *  mousemoves carry it until `mouseUp`. */
export function mouseDown(cursor: Cursor, target: Element | null | undefined) {
  if (!target) return false;
  const at = cursor.tip();
  animate(cursor.scale, 0.8, { duration: 0.1 });
  target.dispatchEvent(
    new MouseEvent("mousedown", { bubbles: true, cancelable: true, button: 0, buttons: 1, clientX: at.x, clientY: at.y })
  );
  return true;
}

export function mouseUp(cursor: Cursor) {
  const at = cursor.tip();
  animate(cursor.scale, 1, { duration: 0.1 });
  document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, button: 0, clientX: at.x, clientY: at.y }));
}

/** Keeps a demo as tall as it has ever been, so one that grows and
 *  shrinks as it plays (a row opening, text wrapping onto more lines)
 *  doesn't move the page under whoever is reading below it. */
export function useHoldHeight(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    // Its own height only ever grows: the min-height set here holds it.
    let tallest = 0;
    const observer = new ResizeObserver(() => {
      const h = Math.ceil(box.getBoundingClientRect().height);
      if (h <= tallest) return;
      tallest = h;
      box.style.minHeight = `${h}px`;
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, [ref]);
}
