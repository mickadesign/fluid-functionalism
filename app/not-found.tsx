"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/registry/radix/button";
import { spring } from "@/lib/springs";

/* ANIMATION STORYBOARD
 * Rest         zero sits a little below the fours; no entrance or idle loop.
 * Hover/focus  zero springs into alignment with the surrounding digits.
 * Leave/blur   zero settles back into its displaced position.
 * Reduced      keep the displaced composition still.
 */
const ZERO = {
  displacedY: "0.12em",
  alignedY: "0em",
  spring: spring.slow,
};

export default function NotFound() {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState(0);

  return (
    <section
      data-not-found
      aria-labelledby="not-found-title"
      className="flex min-h-svh w-full items-center justify-center px-6 pt-20 pb-32 sm:pb-40"
    >
      <motion.div
        className="flex flex-col items-center text-center"
        initial={false}
        animate={!reduceMotion && stage >= 1 ? "aligned" : "rest"}
        whileHover={reduceMotion ? undefined : "aligned"}
        onFocusCapture={() => setStage(1)}
        onBlurCapture={() => setStage(0)}
      >
        <div
          aria-hidden="true"
          className="mb-12 flex select-none gap-[0.04em] text-[clamp(7rem,18vw,12rem)] leading-none font-light tracking-[-0.04em] text-foreground"
        >
          <span>4</span>
          <motion.span
            className="inline-block"
            variants={{
              rest: { y: ZERO.displacedY },
              aligned: { y: ZERO.alignedY },
            }}
            transition={ZERO.spring}
          >
            0
          </motion.span>
          <span>4</span>
        </div>
        <h1 id="not-found-title" className="text-xl font-medium tracking-tight">
          <span className="sr-only">404. </span>A little out of place.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn’t find this page.
        </p>
        <Button asChild variant="tertiary" trailingIcon={ArrowUpRight} className="mt-7">
          <Link href="/">Back to showcase</Link>
        </Button>
      </motion.div>
    </section>
  );
}
