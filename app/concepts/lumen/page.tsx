"use client";

import { useState, useCallback } from "react";
import { useIcon } from "@/lib/icon-context";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { surfaceClasses } from "@/lib/surface-classes";
import { cn } from "@/lib/utils";
import { ConceptFrame } from "@/app/concepts/_components/concept-frame";
import { Button } from "@/registry/radix/button";
import { Badge } from "@/registry/default/badge";
import { ChatMessage } from "@/registry/default/chat-message";
import { InputMessage } from "@/registry/default/input-message";
import {
  TabsSubtle,
  TabsSubtleItem,
  TabsSubtlePanel,
} from "@/components/flavored/tabs-subtle";
import {
  ThinkingSteps,
  ThinkingStepsHeader,
  ThinkingStepsContent,
  ThinkingStep,
  ThinkingStepSources,
  ThinkingStepSource,
  ThinkingStepImage,
} from "@/registry/default/thinking-steps";
import type { BadgeColor } from "@/registry/default/badge";

// ── Fixtures ──────────────────────────────────────────────────────────────

interface Source {
  n: number;
  title: string;
  site: string;
  color: BadgeColor;
}

const SOURCES: Source[] = [
  { n: 1, title: "Epictetus — The Enchiridion", site: "classics.mit.edu", color: "amber" },
  { n: 2, title: "Marcus Aurelius and the dichotomy of control", site: "dailystoic.com", color: "blue" },
  { n: 3, title: "Stoicism: internal vs external goods", site: "plato.stanford.edu", color: "violet" },
  { n: 4, title: "What is 'up to us'? A reading of Stoic agency", site: "aeon.co", color: "teal" },
];

// Inline SVG gradient swatches — reliable offline placeholders for the Images
// tab, rendered through the library's ThinkingStepImage.
function swatch(a: string, b: string) {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="150"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="240" height="150" fill="url(#g)"/></svg>`
  )}`;
}

const IMAGES = [
  { src: swatch("#fbbf24", "#b45309"), caption: "Bust of Marcus Aurelius" },
  { src: swatch("#60a5fa", "#1e3a8a"), caption: "The Painted Porch, Athens" },
  { src: swatch("#a78bfa", "#5b21b6"), caption: "Epictetus, engraving" },
  { src: swatch("#2dd4bf", "#0f766e"), caption: "Seneca's letters, folio" },
];

// ── Citation chip ───────────────────────────────────────────────────────────

function Cite({ n }: { n: number }) {
  return (
    <Badge
      color="gray"
      size="sm"
      className="mx-0.5 -translate-y-px px-1.5 align-middle tabular-nums"
    >
      {n}
    </Badge>
  );
}

// ── Answer body ─────────────────────────────────────────────────────────────

function Answer() {
  return (
    <ChatMessage from="assistant" className="max-w-full">
      <div className="flex flex-col gap-3 text-[14px] leading-relaxed text-foreground">
        <p>
          The Stoics drew a sharp line between what is{" "}
          <span style={{ fontVariationSettings: fontWeights.semibold }}>
            &ldquo;up to us&rdquo;
          </span>{" "}
          and what is not. Our judgments, desires, and chosen actions are within
          our power; everything else — health, reputation, wealth, the behaviour
          of others — is not
          <Cite n={1} />
          <Cite n={3} />.
        </p>
        <p>
          Epictetus opens the <em>Enchiridion</em> with exactly this
          &ldquo;dichotomy of control.&rdquo; Tranquility, he argues, comes from
          investing effort only in the former and meeting the latter with
          equanimity
          <Cite n={1} />. Marcus Aurelius turns the same idea
          inward as a daily practice: you have power over your mind, not over
          outside events
          <Cite n={2} />.
        </p>
        <p>
          Later readings refine the picture — some goods are &ldquo;preferred&rdquo;
          without being truly good — but the core move is constant: locate the
          will, and let the rest go
          <Cite n={4} />.
        </p>
      </div>
    </ChatMessage>
  );
}

// ── Sources panel ───────────────────────────────────────────────────────────

function SourcesPanel() {
  return (
    <div className="flex flex-col gap-2">
      {SOURCES.map((s) => (
        <a
          key={s.n}
          href="#answer"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3.5 py-3 transition-shadow duration-100 hover:shadow-surface-4",
            surfaceClasses(2, 2)
          )}
        >
          <Badge color={s.color} size="sm" className="shrink-0 tabular-nums">
            {s.n}
          </Badge>
          <div className="flex min-w-0 flex-col">
            <span
              className="truncate text-[13px] text-foreground"
              style={{ fontVariationSettings: fontWeights.medium }}
            >
              {s.title}
            </span>
            <span className="truncate text-[12px] text-muted-foreground">
              {s.site}
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}

// ── A single answered turn ──────────────────────────────────────────────────

interface Turn {
  id: string;
  question: string;
  thinking: boolean;
}

function TurnView({ turn }: { turn: Turn }) {
  const [tab, setTab] = useState(0);
  const Sparkles = useIcon("brain");
  const Globe = useIcon("globe");
  const ImageIcon = useIcon("image");

  return (
    <article className="flex flex-col gap-4">
      <h2
        id="answer"
        className="text-[24px] leading-tight text-foreground"
        style={{ fontVariationSettings: fontWeights.bold }}
      >
        {turn.question}
      </h2>

      <ThinkingSteps defaultOpen={turn.thinking} className="w-full max-w-full">
        <ThinkingStepsHeader>
          {turn.thinking ? "Searching the web" : "Searched 4 sources"}
        </ThinkingStepsHeader>
        <ThinkingStepsContent>
          <ThinkingStep
            icon="search"
            label="Searching the web"
            description="stoicism dichotomy of control — primary sources"
            status="complete"
          />
          <ThinkingStep
            icon="globe"
            label="Reading sources"
            status="complete"
          >
            <ThinkingStepSources>
              {SOURCES.map((s, i) => (
                <ThinkingStepSource key={s.n} color={s.color} delay={i * 0.05}>
                  {s.site}
                </ThinkingStepSource>
              ))}
            </ThinkingStepSources>
          </ThinkingStep>
          <ThinkingStep
            icon="brain"
            label={turn.thinking ? "Writing the answer" : "Composed the answer"}
            status={turn.thinking ? "active" : "complete"}
            isLast
          >
            {!turn.thinking && (
              <ThinkingStepImage
                src={IMAGES[0].src}
                alt={IMAGES[0].caption}
                caption="Found 4 related images"
                delay={0.1}
              />
            )}
          </ThinkingStep>
        </ThinkingStepsContent>
      </ThinkingSteps>

      {!turn.thinking && (
        <>
          <TabsSubtle idPrefix={`lumen-${turn.id}`} selectedIndex={tab} onSelect={setTab}>
            <TabsSubtleItem index={0} icon={Sparkles} label="Answer" />
            <TabsSubtleItem index={1} icon={Globe} label="Sources" />
            <TabsSubtleItem index={2} icon={ImageIcon} label="Images" />
          </TabsSubtle>

          <TabsSubtlePanel index={0} selectedIndex={tab} idPrefix={`lumen-${turn.id}`}>
            <Answer />
          </TabsSubtlePanel>
          <TabsSubtlePanel index={1} selectedIndex={tab} idPrefix={`lumen-${turn.id}`}>
            <SourcesPanel />
          </TabsSubtlePanel>
          <TabsSubtlePanel index={2} selectedIndex={tab} idPrefix={`lumen-${turn.id}`}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {IMAGES.map((img) => (
                <ThinkingStepImage
                  key={img.caption}
                  src={img.src}
                  alt={img.caption}
                  caption={img.caption}
                  className="!mt-0 [&_img]:max-w-full"
                />
              ))}
            </div>
          </TabsSubtlePanel>
        </>
      )}
    </article>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function LumenPage() {
  const Globe = useIcon("globe");

  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<Turn[]>([
    {
      id: "seed",
      question: "What did the Stoics believe we can and can't control?",
      thinking: false,
    },
  ]);

  const handleSend = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const id = `t${Date.now()}`;
    setTurns((prev) => [...prev, { id, question: trimmed, thinking: true }]);
    setDraft("");
    // Resolve the "thinking" turn into a full answer after a beat.
    setTimeout(() => {
      setTurns((prev) =>
        prev.map((t) => (t.id === id ? { ...t, thinking: false } : t))
      );
    }, 1600);
  }, []);

  return (
    <ConceptFrame>
      <div className="flex h-screen w-full flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex max-w-[760px] flex-col gap-10 px-6 py-12">
            {turns.map((turn) => (
              <TurnView key={turn.id} turn={turn} />
            ))}
          </div>
        </div>

        {/* Ask bar */}
        <div className="px-6 pb-6 pt-2">
          <div className="mx-auto max-w-[760px]">
            <InputMessage
              value={draft}
              onValueChange={setDraft}
              onSend={handleSend}
              placeholder="Ask a follow-up…"
              minRows={1}
              maxRows={5}
              leftSlot={
                <Button variant="ghost" size="sm" leadingIcon={Globe}>
                  Web
                </Button>
              }
            />
          </div>
        </div>
      </div>
    </ConceptFrame>
  );
}
