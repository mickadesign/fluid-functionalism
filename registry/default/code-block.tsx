"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/springs";
import { useIcons } from "@/lib/icon-context";
import { useShape } from "@/lib/shape-context";
import { useSize, typeClass, type SizeVariant } from "@/lib/size-context";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

// ---------------------------------------------------------------------------
// CodeBlock shows code or command output: a header with the language (or a
// title) and a copy button, over a body that scrolls. It is made of the
// library's own parts: the ghost icon Button with its Tooltip, the ScrollArea
// scrollbar with scroll-fade edges, and the icon swap every copy control
// uses. It ships no highlighter. Pass highlighted markup as children (Shiki,
// a markdown renderer's code output) and `code` stays the plain string the
// button copies.
// ---------------------------------------------------------------------------

interface CodeBlockProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** The plain code. Rendered as is when there are no children, and always
   *  what the copy button copies. */
  code: string;
  /** Language label in the header (`tsx`, `bash`). */
  language?: string;
  /** Header text in place of the language: a file name, a command. */
  title?: ReactNode;
  /** Highlighted markup to render in place of the plain code. */
  children?: ReactNode;
  /** Number the lines. Plain code only: highlighted children own their lines. */
  lineNumbers?: boolean;
  /** Wrap long lines instead of scrolling sideways. */
  wrap?: boolean;
  /** Cap the body's height in pixels; taller code scrolls. */
  maxHeight?: number;
  /** Hide the header. The copy button then floats over the top right corner. */
  hideHeader?: boolean;
  /** Called after a successful copy. */
  onCopy?: () => void;
  /** Step on the size ladder. Wins over the surrounding SizeProvider. */
  size?: SizeVariant;
}

/** Copy with the async Clipboard API, falling back to a temporary textarea
 *  when it is unavailable or denied (insecure context, permissions policy). */
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    // 16px: iOS Safari zooms the page into a focused field set smaller.
    textarea.style.fontSize = "16px";
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    document.body.removeChild(textarea);
    return ok;
  }
}

// The icon swap: two glyphs in one cell, crossfading with a touch of blur and
// scale, so the slot never resizes. Both are tweens: the arriving glyph rides
// the fast tier's full duration and the leaving one its exit, so an appear
// always outlasts a disappear.
const SHOWN = { opacity: 1, scale: 1, filter: "blur(0px)" };
const HIDDEN = { opacity: 0, scale: 0.6, filter: "blur(4px)" };
const ENTER = {
  type: "tween" as const,
  duration: spring.fast.duration,
  ease: "easeOut" as const,
};
const LEAVE = {
  type: "tween" as const,
  ...spring.fast.exit,
  ease: "easeIn" as const,
};

function CopyButton({
  code,
  onCopy,
  className,
}: {
  code: string;
  onCopy?: () => void;
  className?: string;
}) {
  const CopyIcon = useIcons().copy;
  // Whether the result shows. What it shows is `result`, written only by a
  // copy, so a failed copy stays a red x all the way through its fade out.
  const [shown, setShown] = useState(false);
  const [result, setResult] = useState<"copied" | "error">("copied");
  // Keys the result glyph, so copying again replays the draw.
  const [count, setCount] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  const handleCopy = useCallback(async () => {
    const ok = await copyText(code);
    setResult(ok ? "copied" : "error");
    setShown(true);
    setCount((c) => c + 1);
    if (ok) onCopy?.();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShown(false), 2000);
  }, [code, onCopy]);

  const idle = !shown;
  const failed = result === "error";
  const outcome = failed ? "Copy failed" : "Copied";

  return (
    <>
    <Tooltip content={idle ? "Copy" : outcome}>
      <Button
        type="button"
        variant="ghost"
        size="icon-compact"
        // The name stays "Copy": the result is announced from the live region.
        aria-label="Copy code"
        onClick={handleCopy}
        className={cn("group/copy size-6 shrink-0", className)}
      >
        <span className="grid size-3.5 place-items-center">
          <motion.span
            className="col-start-1 row-start-1 flex [&_svg]:transition-[stroke-width] [&_svg]:duration-80 group-hover/copy:[&_svg]:stroke-[2]"
            initial={false}
            animate={idle ? SHOWN : HIDDEN}
            transition={idle ? ENTER : LEAVE}
          >
            <CopyIcon size={14} strokeWidth={1.5} />
          </motion.span>
          <motion.span
            className={cn(
              "col-start-1 row-start-1 flex",
              failed && "text-destructive"
            )}
            initial={false}
            animate={idle ? HIDDEN : SHOWN}
            transition={idle ? LEAVE : ENTER}
          >
            <svg
              width={14}
              height={14}
              viewBox="2 4 20 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {/* The check (or the x of a failed copy) draws itself. */}
              <motion.path
                key={`${result}-${count}`}
                d={failed ? "M9 9L15 15M15 9L9 15" : "M6 12L10 16L18 8"}
                initial={{ pathLength: 0 }}
                animate={{
                  pathLength: 1,
                  transition: { duration: 0.08, ease: "easeOut" },
                }}
              />
            </svg>
          </motion.span>
        </span>
      </Button>
    </Tooltip>
    {/* Beside the button, not inside it: a button's content is its name,
        and a live region nested there can go unannounced. */}
    <span className="sr-only" role="status" aria-live="polite">
      {idle ? "" : outcome}
    </span>
    </>
  );
}

const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>(
  (
    {
      code,
      language,
      title,
      children,
      lineNumbers = false,
      wrap = false,
      maxHeight,
      hideHeader = false,
      onCopy,
      size,
      className,
      ...props
    },
    ref
  ) => {
    const shape = useShape();
    const compact = useSize(size).variant === "compact";
    const lines = code.replace(/\n$/, "").split("\n");
    const heading = title ?? language;

    return (
      <div
        ref={ref}
        className={cn(
          // The markdown code block of the typeset sheet (`.typeset pre`), so
          // a fenced block in a reply and a CodeBlock beside it are one
          // design: a 7% tint of the text color and no border. The tint is
          // see-through, so it holds on the page and inside a dialog alike.
          "relative w-full min-w-0 overflow-hidden bg-[color-mix(in_oklab,currentColor_7%,transparent)] text-foreground",
          shape.bg,
          className
        )}
        {...props}
      >
        {hideHeader ? (
          <CopyButton
            code={code}
            onCopy={onCopy}
            className="absolute right-1.5 top-1.5 z-10"
          />
        ) : (
          <div
            className={cn(
              // No divider: the header sits on the same tint as the code,
              // and the body's top padding closes up under it.
              "flex items-center justify-between gap-2 pr-1.5",
              typeClass("caption", compact ? "compact" : "default"),
              "pl-[1em]",
              compact ? "h-8" : "h-9"
            )}
          >
            <span
              className="min-w-0 truncate text-muted-foreground"
            >
              {heading}
            </span>
            <CopyButton code={code} onCopy={onCopy} />
          </div>
        )}
        {/* The library scrollbar, with scroll-fade on the edge that has more:
            down when the height is capped, sideways otherwise. The viewport
            takes keyboard focus, so the code can be scrolled without a
            pointer. */}
        <ScrollArea
          orientation="both"
          style={
            maxHeight
              ? ({ "--code-max-height": `${maxHeight}px` } as CSSProperties)
              : undefined
          }
          viewportClassName={cn(
            maxHeight ? "max-h-(--code-max-height) scroll-fade" : "scroll-fade-x"
          )}
        >
          <div
            className={cn(
              "w-max min-w-full font-mono",
              // The typeset pre's own type and padding: the caption role,
              // 0.75em above and below, 1em at the sides.
              "px-[1em] py-[0.75em]",
              !hideHeader && "pt-0",
              // Without a header the copy button floats here: keep the first
              // lines clear of it.
              hideHeader && "pr-10",
              wrap && "w-full",
              typeClass("caption", compact ? "compact" : "default"),
              // Whatever pre sits inside, ours or a highlighter's, takes the
              // body's face, drops its own box, and follows `wrap`.
              "[&_pre]:m-0 [&_pre]:bg-transparent! [&_pre]:p-0 [&_pre]:[font:inherit]",
              wrap
                ? "[&_pre]:whitespace-pre-wrap [&_pre]:break-words"
                : "[&_pre]:whitespace-pre"
            )}
          >
            {children ?? (
              <pre>
                <code>
                  {lineNumbers
                    ? lines.map((line, i) => (
                        <span key={i} className="flex">
                          <span
                            aria-hidden="true"
                            // As wide as the last line's number, so 3 and 4
                            // digit numbers stay in their column.
                            style={{ width: `${String(lines.length).length}ch` }}
                            className="mr-4 shrink-0 select-none text-right tabular-nums text-muted-foreground"
                          >
                            {i + 1}
                          </span>
                          <span className="min-w-0 flex-1">{line || "\n"}</span>
                        </span>
                      ))
                    : code}
                </code>
              </pre>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }
);
CodeBlock.displayName = "CodeBlock";

export { CodeBlock };
export type { CodeBlockProps };
export default CodeBlock;
