"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useIcon } from "@/lib/icon-context";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { surfaceClasses } from "@/lib/surface-classes";
import { cn } from "@/lib/utils";
import { ConceptFrame } from "@/app/concepts/_components/concept-frame";
import { Button } from "@/registry/radix/button";
import { Badge, type BadgeColor } from "@/registry/default/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/registry/default/table";
import {
  TabsSubtle,
  TabsSubtleItem,
  TabsSubtlePanel,
} from "@/components/flavored/tabs-subtle";
import { Dropdown, DropdownLabel } from "@/registry/default/dropdown";
import { MenuItem } from "@/registry/default/menu-item";
import { ChatMessage } from "@/registry/default/chat-message";
import { InputMessage } from "@/registry/default/input-message";
import {
  ThinkingSteps,
  ThinkingStepsHeader,
  ThinkingStepsContent,
  ThinkingStep,
} from "@/registry/default/thinking-steps";

// ── Fixtures ────────────────────────────────────────────────────────────────

interface Initiative {
  name: string;
  owner: string;
  status: { label: string; color: BadgeColor };
  target: string;
}

const INITIATIVES: Initiative[] = [
  { name: "Self-serve onboarding", owner: "Dana", status: { label: "On track", color: "green" }, target: "Aug 15" },
  { name: "Billing v2 migration", owner: "Mara", status: { label: "At risk", color: "amber" }, target: "Sep 1" },
  { name: "Mobile offline mode", owner: "Alex", status: { label: "Planned", color: "gray" }, target: "Sep 20" },
  { name: "SOC 2 Type II", owner: "Sam", status: { label: "On track", color: "green" }, target: "Oct 30" },
];

const COMMENTS = [
  { id: "c1", from: "user" as const, text: "Should Billing v2 block the mobile work, or can they run in parallel?" },
  { id: "c2", from: "assistant" as const, text: "They can run in parallel — the only shared surface is the pricing API, and that's already versioned. I'd only serialize them if Mara's team gets pulled into the SOC 2 evidence collection." },
];

const BLOCK_TYPES = [
  { label: "Text", icon: "pencil" },
  { label: "Heading", icon: "square-library" },
  { label: "To-do list", icon: "check" },
  { label: "Table", icon: "rectangle-horizontal" },
  { label: "AI block", icon: "brain" },
];

// ── Slash / add-block menu ──────────────────────────────────────────────────

function AddBlockMenu() {
  const Plus = useIcon("plus");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const icons = BLOCK_TYPES.map((b) => useIcon(b.icon as Parameters<typeof useIcon>[0]));

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative w-fit">
      <Button
        variant="ghost"
        size="sm"
        leadingIcon={Plus}
        active={open}
        onClick={() => setOpen((o) => !o)}
        className="text-muted-foreground"
      >
        Add block
      </Button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5">
          <Dropdown>
            <DropdownLabel>Basic blocks</DropdownLabel>
            {BLOCK_TYPES.map((b, i) => (
              <MenuItem
                key={b.label}
                index={i}
                icon={icons[i]}
                label={b.label}
                onSelect={() => setOpen(false)}
              />
            ))}
          </Dropdown>
        </div>
      )}
    </div>
  );
}

// ── AI composer block ───────────────────────────────────────────────────────

function AIBlock() {
  const [draft, setDraft] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [blocks, setBlocks] = useState<string[]>([]);
  const Sparkle = useIcon("brain");

  const handleSend = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setDraft("");
    setDrafting(true);
    setTimeout(() => {
      setBlocks((prev) => [
        ...prev,
        `Draft — ${trimmed}: We'll ship in three slices. First, the smallest end-to-end path that proves the data model. Second, the collaborative layer once the schema settles. Third, polish and empty states. Each slice is demoable on its own, so we can cut scope at any boundary without leaving half-built UI.`,
      ]);
      setDrafting(false);
    }, 1700);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {blocks.map((b, i) => (
        <div
          key={i}
          className={cn("flex gap-2.5 rounded-xl p-3.5", surfaceClasses(2, 2))}
        >
          <Sparkle size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
          <p className="text-[14px] leading-relaxed text-foreground">{b}</p>
        </div>
      ))}

      {drafting && (
        <ThinkingSteps defaultOpen className="w-full max-w-full">
          <ThinkingStepsHeader>Drafting with Quill AI</ThinkingStepsHeader>
          <ThinkingStepsContent>
            <ThinkingStep icon="square-library" label="Reading the page context" status="complete" />
            <ThinkingStep icon="brain" label="Outlining the response" status="complete" />
            <ThinkingStep icon="pencil" label="Writing" status="active" isLast />
          </ThinkingStepsContent>
        </ThinkingSteps>
      )}

      <InputMessage
        value={draft}
        onValueChange={setDraft}
        onSend={handleSend}
        placeholder="Ask Quill AI to draft, summarize, or plan…"
        minRows={1}
        maxRows={4}
        leftSlot={
          <span className="flex items-center gap-1.5 pl-1 text-[12px] text-muted-foreground">
            <Sparkle size={14} />
            Quill AI
          </span>
        }
      />
    </div>
  );
}

// ── Document body ───────────────────────────────────────────────────────────

function DocumentBody() {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-[15px] leading-relaxed text-muted-foreground">
        The single source of truth for what we&rsquo;re building this quarter, why,
        and who owns each bet. Edit freely — every block here is a Fluid
        Functionalism component.
      </p>

      {/* Callout */}
      <div className={cn("flex gap-3 rounded-xl p-4", surfaceClasses(2, 2))}>
        <span className="text-[18px] leading-none">💡</span>
        <p className="text-[14px] leading-relaxed text-foreground">
          Decisions are final once they land in the Initiatives table. Use
          comments for anything still in debate.
        </p>
      </div>

      <h2
        className="pt-2 text-[18px] text-foreground"
        style={{ fontVariationSettings: fontWeights.bold }}
      >
        Goals
      </h2>
      <ul className="flex flex-col gap-2 pl-1">
        {[
          "Cut time-to-first-value to under 5 minutes",
          "Move 60% of new accounts onto self-serve billing",
          "Close SOC 2 Type II without slipping the roadmap",
        ].map((g) => (
          <li key={g} className="flex items-start gap-2 text-[14px] text-foreground">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
            {g}
          </li>
        ))}
      </ul>

      <AddBlockMenu />

      <h2
        className="pt-2 text-[18px] text-foreground"
        style={{ fontVariationSettings: fontWeights.bold }}
      >
        Initiatives
      </h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Initiative</TableHead>
            <TableHead className="w-[110px]">Owner</TableHead>
            <TableHead className="w-[130px]">Status</TableHead>
            <TableHead className="w-[110px]">Target</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {INITIATIVES.map((it, i) => (
            <TableRow key={it.name} index={i}>
              <TableCell className="text-foreground">{it.name}</TableCell>
              <TableCell className="text-muted-foreground">{it.owner}</TableCell>
              <TableCell>
                <Badge variant="dot" size="sm" color={it.status.color}>
                  {it.status.label}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground tabular-nums">
                {it.target}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <h2
        className="pt-2 text-[18px] text-foreground"
        style={{ fontVariationSettings: fontWeights.bold }}
      >
        Draft with AI
      </h2>
      <AIBlock />
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function QuillPage() {
  const Doc = useIcon("pencil");
  const Comment = useIcon("message-circle");
  const Activity = useIcon("clock");

  const [tab, setTab] = useState(0);

  return (
    <ConceptFrame>
      <div className="h-screen w-full overflow-y-auto">
        <div className="mx-auto max-w-[760px] px-8 py-12">
          <div className="mb-2 text-[40px]">🗓️</div>
          <h1
            className="text-[34px] leading-tight text-foreground"
            style={{ fontVariationSettings: fontWeights.bold }}
          >
            Q3 Planning
          </h1>
          <div className="mb-6 mt-2 flex items-center gap-2 text-[12px] text-muted-foreground">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[9px] text-white">
              DK
            </span>
            Dana Kim · edited just now
          </div>

          <TabsSubtle idPrefix="quill" selectedIndex={tab} onSelect={setTab}>
            <TabsSubtleItem index={0} icon={Doc} label="Document" />
            <TabsSubtleItem index={1} icon={Comment} label="Comments" />
            <TabsSubtleItem index={2} icon={Activity} label="Activity" />
          </TabsSubtle>

          <div className="mt-6">
            <TabsSubtlePanel index={0} selectedIndex={tab} idPrefix="quill">
              <DocumentBody />
            </TabsSubtlePanel>

            <TabsSubtlePanel index={1} selectedIndex={tab} idPrefix="quill">
              <div className="flex flex-col gap-4">
                {COMMENTS.map((c) => (
                  <ChatMessage key={c.id} from={c.from} className="max-w-full">
                    {c.text}
                  </ChatMessage>
                ))}
              </div>
            </TabsSubtlePanel>

            <TabsSubtlePanel index={2} selectedIndex={tab} idPrefix="quill">
              <ul className="flex flex-col gap-3 text-[13px] text-muted-foreground">
                <li>Dana added the Initiatives table · 2h ago</li>
                <li>Mara changed Billing v2 to “At risk” · 5h ago</li>
                <li>Sam created this page · yesterday</li>
              </ul>
            </TabsSubtlePanel>
          </div>
        </div>
      </div>
    </ConceptFrame>
  );
}
