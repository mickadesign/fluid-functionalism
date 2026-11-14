"use client";

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import {
  animate,
  AnimatePresence,
  motion,
  useReducedMotion,
  type AnimationPlaybackControls,
} from "motion/react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/springs";
import { useIcons } from "@/lib/icon-context";
import { useSize } from "@/lib/size-context";

// SSR-safe layout effect (client components still server-render in Next).
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** How close to the end (px) still counts as "at the end". */
const END_THRESHOLD = 24;

/** Keys that scroll a focused region: the ones that interrupt a glide. */
const SCROLL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
]);

const maxTop = (el: HTMLElement) => el.scrollHeight - el.clientHeight;

interface MessageScrollerContextValue {
  /** Whether the transcript is scrolled to its end. */
  atEnd: boolean;
  /** Glide to the end and follow new output again. */
  scrollToEnd: () => void;
  /** A turn-start row mounted (`present`) or left. */
  registerAnchor: (el: HTMLElement, present: boolean) => void;
  contentRef: (el: HTMLDivElement | null) => void;
}

const MessageScrollerContext = createContext<MessageScrollerContextValue | null>(
  null
);

function useScrollerContext(part: string) {
  const ctx = useContext(MessageScrollerContext);
  if (!ctx) throw new Error(`${part} must be used inside <MessageScroller>`);
  return ctx;
}

/** Read the scroller from anywhere inside it: `atEnd` and `scrollToEnd()`. */
function useMessageScroller() {
  const { atEnd, scrollToEnd } = useScrollerContext("useMessageScroller");
  return { atEnd, scrollToEnd };
}

// ─── MessageScroller ──────────────────────────────────────────────────────
// The scroll position of a chat transcript, and nothing else: it holds no
// messages and no chat state.
//
//  - Follow: while the reader is at the end, the view stays there as a reply
//    streams in. Scrolling away by hand lets go; the button (or sending a
//    message) picks it back up.
//  - Anchor: a row marked `anchor` (a user turn) glides to the top of the view
//    when it arrives, and the reply grows under it without moving it. A spacer
//    under the content makes that position reachable while the reply is still
//    short; it shrinks as the reply grows, and once it reaches 0 plain
//    following takes over.
interface MessageScrollerProps extends HTMLAttributes<HTMLDivElement> {
  /** Keep the end in view while content grows and the reader is at the end.
   *  Defaults to true. */
  autoScroll?: boolean;
  /** Pixels of the previous message left visible above an anchored row. */
  peek?: number;
  /** Classes for the scrolling element (padding, `scroll-fade`). */
  viewportClassName?: string;
  /** Accessible name of the scrolling region. */
  label?: string;
  children: ReactNode;
}

const MessageScroller = forwardRef<HTMLDivElement, MessageScrollerProps>(
  (
    {
      autoScroll = true,
      peek = 16,
      viewportClassName,
      label = "Conversation",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const reduceMotion = useReducedMotion() ?? false;
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const contentElRef = useRef<HTMLDivElement | null>(null);
    const spacerRef = useRef<HTMLDivElement | null>(null);
    const anchorRef = useRef<HTMLElement | null>(null);
    // True while the view follows the end. Scrolling away by hand clears it.
    const followRef = useRef(true);
    // The last scrollTop this component wrote, to tell its own scroll events
    // from the reader's.
    const writtenTopRef = useRef(-1);
    const glideRef = useRef<AnimationPlaybackControls | null>(null);
    // Rows that mount with the scroller are history: no glide, no spacer.
    const readyRef = useRef(false);
    const [atEnd, setAtEnd] = useState(true);

    const latest = useRef({ autoScroll, peek, reduceMotion });
    useIsoLayoutEffect(() => {
      latest.current = { autoScroll, peek, reduceMotion };
    });

    const writeTop = useCallback((top: number) => {
      const el = viewportRef.current;
      if (!el) return;
      el.scrollTop = top;
      // Read back: the browser clamps and rounds.
      writtenTopRef.current = el.scrollTop;
    }, []);

    const syncAtEnd = useCallback(() => {
      const el = viewportRef.current;
      if (!el) return;
      const next = maxTop(el) - el.scrollTop <= END_THRESHOLD;
      setAtEnd((prev) => (prev === next ? prev : next));
    }, []);

    /** Size the spacer so the anchored row can sit `peek` px under the top
     *  edge when the view is scrolled to its end. Offsets, never rects: they
     *  ignore a scaled ancestor. */
    const sizeSpacer = useCallback(() => {
      const viewport = viewportRef.current;
      const content = contentElRef.current;
      const spacer = spacerRef.current;
      if (!viewport || !content || !spacer) return;
      const anchor = anchorRef.current;
      let height = 0;
      if (anchor && content.contains(anchor)) {
        let anchorTop = 0;
        let node: HTMLElement | null = anchor;
        while (node && node !== viewport) {
          anchorTop += node.offsetTop;
          node = node.offsetParent as HTMLElement | null;
        }
        // Everything under the content's last row that scrolls with it: the
        // viewport's own bottom padding.
        const paddingBottom =
          parseFloat(getComputedStyle(viewport).paddingBottom) || 0;
        const contentEnd =
          content.offsetTop + content.offsetHeight + paddingBottom;
        height = Math.max(
          0,
          anchorTop - latest.current.peek + viewport.clientHeight - contentEnd
        );
      }
      spacer.style.height = `${height}px`;
    }, []);

    const stopGlide = useCallback(() => {
      glideRef.current?.stop();
      glideRef.current = null;
    }, []);

    /** Glide to the end. The target is read every frame, so a reply that
     *  grows mid-flight is still caught. */
    const glideToEnd = useCallback(() => {
      const el = viewportRef.current;
      if (!el) return;
      stopGlide();
      followRef.current = true;
      if (latest.current.reduceMotion) {
        writeTop(maxTop(el));
        syncAtEnd();
        return;
      }
      const start = el.scrollTop;
      glideRef.current = animate(0, 1, {
        ...spring.slow,
        bounce: 0,
        onUpdate: (progress) => {
          writeTop(start + (maxTop(el) - start) * progress);
        },
        onComplete: () => {
          glideRef.current = null;
          writeTop(maxTop(el));
          syncAtEnd();
        },
      });
    }, [stopGlide, syncAtEnd, writeTop]);

    const registerAnchor = useCallback(
      (el: HTMLElement, present: boolean) => {
        if (!present) {
          // The anchored row left: drop it, and the spacer with it.
          if (anchorRef.current === el) {
            anchorRef.current = null;
            const spacer = spacerRef.current;
            if (spacer) spacer.style.height = "0px";
          }
          return;
        }
        if (!readyRef.current) return;
        anchorRef.current = el;
        sizeSpacer();
        glideToEnd();
      },
      [glideToEnd, sizeSpacer]
    );

    // Content or viewport changed size: re-fit the spacer, then keep the end
    // in view if the reader is following.
    const onResize = useCallback(() => {
      const el = viewportRef.current;
      if (!el) return;
      sizeSpacer();
      if (
        latest.current.autoScroll &&
        followRef.current &&
        !glideRef.current
      ) {
        writeTop(maxTop(el));
      }
      syncAtEnd();
    }, [sizeSpacer, syncAtEnd, writeTop]);

    // The effect below owns the observer: it builds it, watches the viewport
    // and whatever content is mounted, and disconnects it. The content's ref
    // only hands a later (re)mounted content to the live observer. One owner,
    // so an effect that re-runs without its refs re-running (Strict Mode on
    // React 18) still ends up watching the content.
    const observerRef = useRef<ResizeObserver | null>(null);
    const contentRef = useCallback((el: HTMLDivElement | null) => {
      const previous = contentElRef.current;
      contentElRef.current = el;
      const observer = observerRef.current;
      if (!observer) return;
      if (previous && previous !== el) observer.unobserve(previous);
      if (el) observer.observe(el);
    }, []);

    // Open at the end, before the first paint.
    useIsoLayoutEffect(() => {
      const el = viewportRef.current;
      if (typeof ResizeObserver !== "undefined") {
        const observer = new ResizeObserver(onResize);
        if (el) observer.observe(el);
        if (contentElRef.current) observer.observe(contentElRef.current);
        observerRef.current = observer;
      }
      if (el) writeTop(maxTop(el));
      readyRef.current = true;
      return () => {
        readyRef.current = false;
        stopGlide();
        observerRef.current?.disconnect();
        observerRef.current = null;
      };
    }, [onResize, stopGlide, writeTop]);

    /** The reader takes over mid-glide: stop where it is, and re-read from
     *  the real position whether the view still follows. Without this the
     *  follow stayed on, and the next streamed chunk jumped to the end. */
    const interrupt = useCallback(() => {
      if (!glideRef.current) return;
      stopGlide();
      const el = viewportRef.current;
      if (el) {
        followRef.current = maxTop(el) - el.scrollTop <= END_THRESHOLD;
      }
      syncAtEnd();
    }, [stopGlide, syncAtEnd]);

    const onScroll = () => {
      const el = viewportRef.current;
      if (!el) return;
      // Our own write: nothing to learn from it.
      if (Math.abs(el.scrollTop - writtenTopRef.current) < 1) return;
      followRef.current = maxTop(el) - el.scrollTop <= END_THRESHOLD;
      syncAtEnd();
    };

    const value = useMemo(
      () => ({ atEnd, scrollToEnd: glideToEnd, registerAnchor, contentRef }),
      [atEnd, glideToEnd, registerAnchor, contentRef]
    );

    return (
      <MessageScrollerContext.Provider value={value}>
        <div
          ref={ref}
          className={cn("relative flex min-h-0 flex-col", className)}
          {...props}
        >
          {/* layoutScroll: rows with layout motion measure against this
              scroller, so scrolling never reads as a position change. */}
          <motion.div
            ref={viewportRef}
            layoutScroll
            role="region"
            aria-label={label}
            tabIndex={0}
            onScroll={onScroll}
            // The reader takes over: a glide in flight stops where it is.
            onWheel={interrupt}
            onTouchStart={interrupt}
            onPointerDown={interrupt}
            // Only keys that scroll: a modifier or Tab leaves the glide alone.
            onKeyDown={(event) => {
              if (SCROLL_KEYS.has(event.key)) interrupt();
            }}
            className={cn(
              "relative min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none [overflow-anchor:none]",
              // Focusable, so it shows where focus is. Inset: the frame clips.
              "focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
              viewportClassName
            )}
          >
            {children}
            <div ref={spacerRef} aria-hidden="true" className="shrink-0" />
          </motion.div>
        </div>
      </MessageScrollerContext.Provider>
    );
  }
);
MessageScroller.displayName = "MessageScroller";

// ─── MessageScrollerContent ───────────────────────────────────────────────

interface MessageScrollerContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** The column of rows. It is a `role="log"`, a polite live region: pass
 *  `aria-busy` while a reply streams, so a screen reader reads the reply
 *  once it is complete and not chunk by chunk. */
function MessageScrollerContent({
  className,
  children,
  ...props
}: MessageScrollerContentProps) {
  const { contentRef } = useScrollerContext("MessageScrollerContent");
  return (
    <div
      ref={contentRef}
      role="log"
      className={cn("flex flex-col", className)}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── MessageScrollerItem ──────────────────────────────────────────────────

interface MessageScrollerItemProps extends HTMLAttributes<HTMLDivElement> {
  /** Marks the start of a turn (a user message). When the row arrives it
   *  glides to the top of the view and the reply grows under it. */
  anchor?: boolean;
  children: ReactNode;
}

function MessageScrollerItem({
  anchor = false,
  className,
  children,
  ...props
}: MessageScrollerItemProps) {
  const { registerAnchor } = useScrollerContext("MessageScrollerItem");
  const rowRef = useRef<HTMLDivElement | null>(null);

  useIsoLayoutEffect(() => {
    const row = rowRef.current;
    if (!anchor || !row) return;
    registerAnchor(row, true);
    return () => registerAnchor(row, false);
  }, [anchor, registerAnchor]);

  return (
    <div ref={rowRef} className={cn("flex flex-col", className)} {...props}>
      {children}
    </div>
  );
}

// ─── MessageScrollerButton ────────────────────────────────────────────────

interface MessageScrollerButtonProps
  extends Omit<HTMLAttributes<HTMLButtonElement>, "children"> {
  /** Accessible name. */
  label?: string;
}

/** Back to the end. Mounted only while there is somewhere to go. */
function MessageScrollerButton({
  label = "Scroll to latest",
  className,
  onClick,
  ...props
}: MessageScrollerButtonProps) {
  const { atEnd, scrollToEnd } = useScrollerContext("MessageScrollerButton");
  const ArrowDown = useIcons()["arrow-down"];
  const compact = useSize().variant === "compact";

  return (
    <AnimatePresence initial={false}>
      {!atEnd && (
        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center"
          initial={{ opacity: 0, scale: 0.9, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{
            opacity: 0,
            scale: 0.9,
            y: 4,
            transition: spring.moderate.exit,
          }}
          transition={spring.moderate}
        >
          <button
            type="button"
            aria-label={label}
            onClick={(event) => {
              onClick?.(event);
              if (!event.defaultPrevented) scrollToEnd();
            }}
            className={cn(
              "pointer-events-auto grid cursor-pointer place-items-center rounded-full border border-border bg-background text-muted-foreground shadow-sm outline-none",
              "transition-[color,background-color,scale] duration-80 hover:bg-hover hover:text-foreground active:scale-[0.96]",
              "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
              compact ? "size-7" : "size-9",
              className
            )}
            {...props}
          >
            <ArrowDown size={compact ? 14 : 16} strokeWidth={1.5} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
  useMessageScroller,
};
export type {
  MessageScrollerProps,
  MessageScrollerContentProps,
  MessageScrollerItemProps,
  MessageScrollerButtonProps,
};
