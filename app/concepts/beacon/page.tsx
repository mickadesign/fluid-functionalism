"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
} from "@/registry/default/tabs-subtle";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/registry/default/select";
import { InputGroup, InputField } from "@/registry/default/input-group";
import { Dropdown, DropdownLabel, DropdownSeparator } from "@/registry/default/dropdown";
import { MenuItem } from "@/registry/default/menu-item";
import { Switch } from "@/registry/radix/switch";
import { ThinkingIndicator } from "@/registry/default/thinking-indicator";
import { AskUserQuestions } from "@/registry/default/ask-user-questions";

// ── Fixtures ────────────────────────────────────────────────────────────────

type StatusKey = "todo" | "progress" | "review" | "done";
type PriorityKey = "urgent" | "high" | "medium" | "low" | "none";

interface Issue {
  key: string;
  title: string;
  status: StatusKey;
  priority: PriorityKey;
  assignee: string;
}

const STATUS: Record<StatusKey, { label: string; color: BadgeColor }> = {
  todo: { label: "Todo", color: "gray" },
  progress: { label: "In Progress", color: "amber" },
  review: { label: "In Review", color: "violet" },
  done: { label: "Done", color: "green" },
};

const PRIORITY: Record<PriorityKey, { label: string; color: BadgeColor }> = {
  urgent: { label: "Urgent", color: "red" },
  high: { label: "High", color: "orange" },
  medium: { label: "Medium", color: "yellow" },
  low: { label: "Low", color: "blue" },
  none: { label: "None", color: "gray" },
};

const ACTIVE: Issue[] = [
  { key: "ENG-128", title: "Auth token refresh fails for ~4% of sessions", status: "progress", priority: "urgent", assignee: "DK" },
  { key: "ENG-131", title: "Flaky CI on the e2e shard", status: "todo", priority: "high", assignee: "MR" },
  { key: "ENG-124", title: "Virtualize the issues table for >1k rows", status: "review", priority: "medium", assignee: "AJ" },
  { key: "ENG-140", title: "Dark-mode contrast on status pills", status: "todo", priority: "low", assignee: "SL" },
  { key: "ENG-118", title: "Command palette: fuzzy match on labels", status: "progress", priority: "medium", assignee: "DK" },
  { key: "ENG-142", title: "Webhook retries should be idempotent", status: "todo", priority: "high", assignee: "MR" },
  { key: "ENG-109", title: "Migrate avatars to signed URLs", status: "review", priority: "low", assignee: "AJ" },
  { key: "ENG-145", title: "Rate-limit the public search endpoint", status: "progress", priority: "high", assignee: "DK" },
  { key: "ENG-133", title: "Empty states for the board columns", status: "todo", priority: "low", assignee: "SL" },
  { key: "ENG-126", title: "Persist column widths across sessions", status: "review", priority: "medium", assignee: "AJ" },
  { key: "ENG-147", title: "Audit log for permission changes", status: "todo", priority: "urgent", assignee: "MR" },
  { key: "ENG-121", title: "Debounce the live filter input", status: "progress", priority: "low", assignee: "SL" },
  { key: "ENG-138", title: "Keyboard shortcut to assign issues", status: "todo", priority: "medium", assignee: "DK" },
  { key: "ENG-156", title: "Surface SLA breaches in the inbox", status: "review", priority: "high", assignee: "AJ" },
];

const BACKLOG: Issue[] = [
  { key: "ENG-150", title: "Offline draft sync for the composer", status: "todo", priority: "medium", assignee: "SL" },
  { key: "ENG-151", title: "Per-team notification digests", status: "todo", priority: "low", assignee: "MR" },
  { key: "ENG-152", title: "Docs polish for the public API", status: "todo", priority: "none", assignee: "AJ" },
  { key: "ENG-153", title: "Investigate p99 latency on search", status: "todo", priority: "high", assignee: "DK" },
  { key: "ENG-154", title: "Keyboard-only triage flow", status: "todo", priority: "medium", assignee: "SL" },
];

const ASSIGNEE_COLOR: Record<string, string> = {
  DK: "bg-blue-500",
  MR: "bg-violet-500",
  AJ: "bg-emerald-500",
  SL: "bg-rose-500",
};

const PRIORITY_FILTER = [
  { value: "all", label: "All priorities" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

// ── Small pieces ────────────────────────────────────────────────────────────

function Avatar({ initials }: { initials: string }) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] text-white ${
        ASSIGNEE_COLOR[initials] ?? "bg-neutral-500"
      }`}
      style={{ fontVariationSettings: fontWeights.semibold }}
    >
      {initials}
    </span>
  );
}

function IssueTable({ rows }: { rows: Issue[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[150px]">Status</TableHead>
          <TableHead className="w-[90px]">ID</TableHead>
          <TableHead>Title</TableHead>
          <TableHead className="w-[110px]">Priority</TableHead>
          <TableHead className="w-[70px] text-center">Owner</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((issue, i) => (
          <TableRow key={issue.key} index={i}>
            <TableCell>
              <Badge variant="dot" size="sm" color={STATUS[issue.status].color}>
                {STATUS[issue.status].label}
              </Badge>
            </TableCell>
            <TableCell className="font-mono text-[12px] text-muted-foreground">
              {issue.key}
            </TableCell>
            <TableCell className="text-foreground">{issue.title}</TableCell>
            <TableCell>
              <Badge size="sm" color={PRIORITY[issue.priority].color}>
                {PRIORITY[issue.priority].label}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex justify-center">
                <Avatar initials={issue.assignee} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Board({ rows }: { rows: Issue[] }) {
  const cols: { key: StatusKey; label: string }[] = [
    { key: "todo", label: "Todo" },
    { key: "progress", label: "In Progress" },
    { key: "review", label: "In Review" },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {cols.map((col) => {
        const items = rows.filter((r) => r.status === col.key);
        return (
          <div key={col.key} className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 px-1">
              <Badge variant="dot" size="sm" color={STATUS[col.key].color}>
                {col.label}
              </Badge>
              <span className="text-[12px] text-muted-foreground tabular-nums">
                {items.length}
              </span>
            </div>
            {items.map((issue) => (
              <div
                key={issue.key}
                className={cn("flex flex-col gap-2 rounded-xl p-3", surfaceClasses(2, 2))}
              >
                <span className="text-[13px] text-foreground">{issue.title}</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {issue.key}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge size="sm" color={PRIORITY[issue.priority].color}>
                      {PRIORITY[issue.priority].label}
                    </Badge>
                    <Avatar initials={issue.assignee} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ── Display popover (Dropdown showcase) ─────────────────────────────────────

function DisplayMenu() {
  const Sliders = useIcon("settings");
  const Chevron = useIcon("chevron-down");
  const [open, setOpen] = useState(false);
  const [ordering, setOrdering] = useState(0);
  const [subIssues, setSubIssues] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const orderings = ["Status", "Priority", "Created"];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <Button
        variant="tertiary"
        size="sm"
        leadingIcon={Sliders}
        trailingIcon={Chevron}
        active={open}
        onClick={() => setOpen((o) => !o)}
      >
        Display
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5">
          <Dropdown checkedIndex={ordering}>
            <DropdownLabel>Ordering</DropdownLabel>
            {orderings.map((o, i) => (
              <MenuItem
                key={o}
                index={i}
                label={o}
                checked={i === ordering}
                onSelect={() => setOrdering(i)}
              />
            ))}
            <DropdownSeparator />
            <div className="px-2 py-1.5">
              <Switch
                label="Show sub-issues"
                checked={subIssues}
                onToggle={() => setSubIssues((s) => !s)}
              />
            </div>
          </Dropdown>
        </div>
      )}
    </div>
  );
}

// ── AI triage panel ─────────────────────────────────────────────────────────

type TriageState = "idle" | "analyzing" | "asking" | "done";

function TriagePanel({
  state,
  onAdvance,
  onClose,
}: {
  state: TriageState;
  onAdvance: (next: TriageState) => void;
  onClose: () => void;
}) {
  const Sparkle = useIcon("brain");
  const Check = useIcon("check");

  if (state === "idle") return null;

  return (
    <div className={cn("flex flex-col gap-3 rounded-2xl p-4", surfaceClasses(2, 2))}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkle size={16} className="text-foreground" />
          <span
            className="text-[14px] text-foreground"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            AI triage
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Dismiss
        </Button>
      </div>

      {state === "analyzing" && (
        <ThinkingIndicator className="!px-0" />
      )}

      {state === "asking" && (
        <AskUserQuestions
          questions={[
            {
              id: "triage",
              title: "3 active issues look mis-prioritized. Apply these?",
              multiSelect: true,
              allowOther: true,
              nextLabel: "Apply changes",
              layout: "stacked",
              options: [
                {
                  id: "bump",
                  title: "Bump ENG-128 to Urgent",
                  description: "Auth refresh is failing for ~4% of sessions",
                },
                {
                  id: "assign",
                  title: "Assign ENG-131 to @dane",
                  description: "He owns the CI pipeline",
                },
                {
                  id: "defer",
                  title: "Move ENG-152 to Backlog",
                  description: "Docs polish has no deadline",
                },
              ],
            },
          ]}
          onComplete={() => onAdvance("done")}
        />
      )}

      {state === "done" && (
        <div className="flex items-center gap-2 text-[13px] text-foreground">
          <Check size={16} className="text-emerald-500" />
          Applied 3 changes · re-ranked the Active view.
        </div>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function BeaconPage() {
  const Search = useIcon("search");
  const Sparkle = useIcon("brain");

  const [view, setView] = useState(0); // 0 Active, 1 Backlog, 2 Board
  const [priority, setPriority] = useState(""); // "" / "all" → no filter
  const [query, setQuery] = useState("");
  const [triage, setTriage] = useState<TriageState>("idle");

  const filterRows = useCallback(
    (rows: Issue[]) =>
      rows.filter(
        (r) =>
          (priority === "all" || priority === "" || r.priority === priority) &&
          (query.trim() === "" ||
            r.title.toLowerCase().includes(query.toLowerCase()) ||
            r.key.toLowerCase().includes(query.toLowerCase()))
      ),
    [priority, query]
  );

  const activeRows = useMemo(() => filterRows(ACTIVE), [filterRows]);
  const backlogRows = useMemo(() => filterRows(BACKLOG), [filterRows]);

  const startTriage = useCallback(() => {
    setTriage("analyzing");
    setTimeout(() => setTriage("asking"), 1500);
  }, []);

  return (
    <ConceptFrame>
      <div className="mx-auto flex h-screen w-full max-w-[960px] flex-col gap-4 px-6 py-12">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsSubtle idPrefix="beacon-view" selectedIndex={view} onSelect={setView}>
            <TabsSubtleItem index={0} label="Active" />
            <TabsSubtleItem index={1} label="Backlog" />
            <TabsSubtleItem index={2} label="Board" />
          </TabsSubtle>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={Sparkle}
              onClick={startTriage}
              disabled={triage !== "idle"}
            >
              Triage with AI
            </Button>
            <DisplayMenu />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3">
          <InputGroup className="w-56">
            <InputField
              index={0}
              label="Search"
              icon={Search}
              placeholder="Title or ID…"
              value={query}
              onChange={setQuery}
            />
          </InputGroup>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger placeholder="Priority" className="min-w-[150px]" />
            <SelectContent>
              {PRIORITY_FILTER.map((p, i) => (
                <SelectItem key={p.value} index={i} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-4">
            {triage !== "idle" && (
              <TriagePanel
                state={triage}
                onAdvance={setTriage}
                onClose={() => setTriage("idle")}
              />
            )}

            <TabsSubtlePanel index={0} selectedIndex={view} idPrefix="beacon-view">
              <IssueTable rows={activeRows} />
            </TabsSubtlePanel>
            <TabsSubtlePanel index={1} selectedIndex={view} idPrefix="beacon-view">
              <IssueTable rows={backlogRows} />
            </TabsSubtlePanel>
            <TabsSubtlePanel index={2} selectedIndex={view} idPrefix="beacon-view">
              <Board rows={ACTIVE} />
            </TabsSubtlePanel>
          </div>
        </div>
      </div>
    </ConceptFrame>
  );
}
