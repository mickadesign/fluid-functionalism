"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { CarouselDots } from "@/registry/default/carousel-dots";
import { slideVariants, useSlideDirection } from "@/lib/docs/slide-direction";
import { useShape } from "@/registry/default/lib/shape-context";
import { cn } from "@/registry/default/lib/utils";

const SLIDES = ["Inbox", "Drafts", "Sent", "Archive"];

const staticCode = `import { CarouselDots } from "./components";

const [slide, setSlide] = useState(0);

<CarouselDots count={4} value={slide} onValueChange={setSlide} />`;

const autoplayCode = `import { CarouselDots } from "./components";

const [slide, setSlide] = useState(0);
const [hovering, setHovering] = useState(false);

<div onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
  <Slide index={slide} />
</div>
<CarouselDots
  count={4}
  value={slide}
  onValueChange={setSlide}
  autoplay={{ duration: 3000, paused: hovering }}
/>`;

const props: PropDef[] = [
  { name: "count", type: "number", description: "How many dots to show." },
  { name: "value", type: "number", description: "Index of the current dot." },
  { name: "onValueChange", type: "(index: number) => void", description: "Called with a clicked dot's index, and with the next index each time autoplay finishes a slide." },
  { name: "autoplay", type: "boolean | { duration?, paused?, loop? }", description: "The current pill fills over duration (default 3000ms), then the next slide comes in. paused holds the fill; loop (default true) wraps to the first slide. Omit for a static, solid pill." },
  { name: "progress", type: "number | MotionValue<number>", description: "Drive the fill yourself, 0 to 1, when something else owns the clock. Takes precedence over autoplay." },
  { name: "getLabel", type: "(index: number) => string", default: '"Go to slide N"', description: "Accessible name for each dot." },
];

/** The slide both demos page through: a label that slides sideways. */
function Slide({ index, direction }: { index: number; direction: number }) {
  const shape = useShape();
  return (
    <div
      className={cn(
        "relative grid size-40 place-items-center overflow-hidden border border-border/60 bg-background",
        shape.container
      )}
    >
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.span
          key={index}
          className="col-start-1 row-start-1 text-body text-foreground"
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {SLIDES[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function StaticDemo() {
  const { slide, direction, onValueChange, markByHand } = useSlideDirection();
  return (
    <div className="flex flex-col items-center gap-3">
      <Slide index={slide} direction={direction} />
      <div {...markByHand}>
        <CarouselDots
          count={SLIDES.length}
          value={slide}
          onValueChange={onValueChange}
          getLabel={(i) => `Show ${SLIDES[i]}`}
        />
      </div>
    </div>
  );
}

function AutoplayDemo() {
  const { slide, direction, onValueChange, markByHand } = useSlideDirection();
  const [hovering, setHovering] = useState(false);
  return (
    <div className="flex flex-col items-center gap-3">
      <div onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
        <Slide index={slide} direction={direction} />
      </div>
      <div {...markByHand}>
        <CarouselDots
          count={SLIDES.length}
          value={slide}
          onValueChange={onValueChange}
          autoplay={{ duration: 3000, paused: hovering }}
          getLabel={(i) => `Show ${SLIDES[i]}`}
        />
      </div>
    </div>
  );
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="mx-1 rounded bg-[light-dark(#EBEBED,#2C2C2C)] px-1 py-0.5 text-caption text-foreground">
      {children}
    </code>
  );
}

export default function CarouselDotsDoc() {
  return (
    <DocPage
      title="CarouselDots"
      slug="carousel-dots"
      description="Dots for a carousel, static or on autoplay."
    >
      <DocSection title="Static">
        <p className="text-body leading-relaxed text-muted-foreground">
          Hover a dot to see its click area, then click it. The highlight glides
          from dot to dot.
        </p>
        <ComponentPreview code={staticCode}>
          <StaticDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Autoplay">
        <p className="text-body leading-relaxed text-muted-foreground">
          Add <Code>autoplay</Code> and the pill fills, then the next slide comes
          in. Hover the slide to pause. Reduced motion turns the timer off.
        </p>
        <ComponentPreview code={autoplayCode}>
          <AutoplayDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <PropsTable props={props} />
      </DocSection>
    </DocPage>
  );
}
