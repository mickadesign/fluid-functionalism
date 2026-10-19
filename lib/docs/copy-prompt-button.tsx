"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion, useReducedMotion, type Transition } from "motion/react";
import { Button, type ButtonSize } from "@/registry/radix/button";
import { useIcon, type IconComponentProps } from "@/lib/icon-context";
import { spring } from "@/lib/springs";
import { cn } from "@/lib/utils";

interface CopyPromptButtonProps {
  /** The prompt text written to the clipboard. */
  prompt: string;
  /** Button text. Defaults to "Copy prompt". */
  label?: string;
  /** Button size; omitted, it follows the SizeProvider. */
  size?: ButtonSize;
  className?: string;
  /** Runs after a successful copy, e.g. for analytics. */
  onCopy?: () => void;
  /** @default "primary" */
  variant?: "primary" | "secondary" | "ghost";
}

/** Whether the prompt was just copied — read by the leading icon, which the
 *  Button renders from a component type, so the state can't ride a prop. */
const CopiedContext = createContext(false);

const SHOWN = { opacity: 1, scale: 1, filter: "blur(0px)" };
const HIDDEN = { opacity: 0, scale: 0.6, filter: "blur(4px)" };

/** The button's leading icon: the copy glyph, crossfading to a check while
 *  the prompt was just copied. Both glyphs share one cell the size of the
 *  icon, so the slot the Button lays out never changes. The glyph leaving
 *  fades, blurs to 4px, and scales to 0.6 over the tier's exit token, eased
 *  in; the one arriving does the reverse over the tier's full duration,
 *  eased out, so an appear always outlasts a disappear (0.08s vs 0.06s).
 *  Both are tweens: a spring settles visibly sooner than its nominal
 *  duration, which would invert that order. Reduced motion swaps in place. */
function CopyPromptIcon({ size = 16, strokeWidth, className }: IconComponentProps) {
  const copied = useContext(CopiedContext);
  const CopyIcon = useIcon("copy");
  const CheckIcon = useIcon("check");
  const reduced = useReducedMotion();
  const enter: Transition = reduced
    ? { duration: 0 }
    : { type: "tween", duration: spring.fast.duration, ease: "easeOut" };
  const leave: Transition = reduced
    ? { duration: 0 }
    : { type: "tween", ...spring.fast.exit, ease: "easeIn" };
  return (
    <span className="grid shrink-0" style={{ width: size, height: size }}>
      <motion.span
        className="col-start-1 row-start-1 flex"
        initial={false}
        animate={copied ? HIDDEN : SHOWN}
        transition={copied ? leave : enter}
      >
        <CopyIcon size={size} strokeWidth={strokeWidth} className={className} />
      </motion.span>
      <motion.span
        className="col-start-1 row-start-1 flex"
        initial={false}
        animate={copied ? SHOWN : HIDDEN}
        transition={copied ? enter : leave}
      >
        <CheckIcon size={size} strokeWidth={strokeWidth} className={className} />
      </motion.span>
    </span>
  );
}

/** Primary "Copy prompt" button for the Installation block of every doc
 *  page. Copies a self-contained brief for an AI coding agent (see
 *  `install-prompt.ts`). The label never changes; only the leading icon
 *  turns into a check for 2s, and a visually hidden "Copied" is read out. */
export function CopyPromptButton({
  prompt,
  label = "Copy prompt",
  size,
  className,
  onCopy,
  variant = "primary",
}: CopyPromptButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    let ok = true;
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      // Clipboard API unavailable or denied: fall back to execCommand on an
      // off-screen textarea, same as InputCopy.
      const textarea = document.createElement("textarea");
      textarea.value = prompt;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      // 16px: iOS Safari zooms the page into a focused field set smaller,
      // and select() can focus this one.
      textarea.style.fontSize = "16px";
      document.body.appendChild(textarea);
      textarea.select();
      // iOS Safari's select() only moves the caret to the end; the explicit
      // range is what selects the text there, so the copy isn't empty.
      textarea.setSelectionRange(0, textarea.value.length);
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      document.body.removeChild(textarea);
    }
    if (!ok) return;
    onCopy?.();
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }, [prompt, onCopy]);

  return (
    <CopiedContext.Provider value={copied}>
      <Button
        variant={variant}
        leadingIcon={CopyPromptIcon}
        onClick={handleCopy}
        size={size}
        className={cn("w-fit shrink-0", className)}
        aria-live="polite"
      >
        {label}
        {copied && <span className="sr-only">Copied</span>}
      </Button>
    </CopiedContext.Provider>
  );
}
