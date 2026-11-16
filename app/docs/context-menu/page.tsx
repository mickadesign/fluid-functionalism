"use client";

import { cloneElement, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, RotateCw, Copy, Link, Mail, Share, Pencil, Trash2 } from "lucide-react";
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "@/registry/default/context-menu";
import {
  Dropdown,
  DropdownSeparator,
  DropdownSub,
  DropdownSubContent,
  DropdownSubTrigger,
} from "@/components/flavored/dropdown";
import { DropdownContext, MenuItem, useDropdown, type MenuItemRenderOptions } from "@/registry/default/menu-item";
import { SubmenuChevron } from "@/registry/default/dropdown-sub";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { apiReference } from "@/lib/docs/api/context-menu";

const basicCode = `import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent,
  DropdownSeparator, DropdownSub, DropdownSubTrigger, DropdownSubContent,
  MenuItem,
} from "./components";
import { ArrowLeft, ArrowRight, RotateCw, Share, Link, Mail } from "lucide-react";

<ContextMenu>
  <ContextMenuTrigger className="grid h-40 place-items-center rounded-lg border border-dashed">
    Right-click here
  </ContextMenuTrigger>
  <ContextMenuContent className="w-56">
    <MenuItem index={0} icon={ArrowLeft} label="Back" onSelect={back} />
    <MenuItem index={1} icon={ArrowRight} label="Forward" disabled />
    <MenuItem index={2} icon={RotateCw} label="Reload" onSelect={reload} />
    <DropdownSeparator />
    <DropdownSub>
      <DropdownSubTrigger index={3} icon={Share} label="Share" />
      <DropdownSubContent>
        <MenuItem index={0} icon={Link} label="Copy link" onSelect={copyLink} />
        <MenuItem index={1} icon={Mail} label="Email" onSelect={email} />
      </DropdownSubContent>
    </DropdownSub>
  </ContextMenuContent>
</ContextMenu>`;

const filterCode = `import { ContextMenu, ContextMenuTrigger, ContextMenuContent, MenuItem } from "./components";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

const [file, setFile] = useState<string | null>(null);
const [open, setOpen] = useState(false);

<ContextMenu onOpenChange={setOpen}>
  <ContextMenuTrigger
    // Only the rows open the menu; the gaps keep the browser's.
    filter={(target) => !!target.closest("[data-file]")}
    onContextMenu={(e) => {
      const row = (e.target as Element).closest<HTMLElement>("[data-file]");
      setFile(row?.dataset.file ?? null);
    }}
  >
    {FILES.map((name) => (
      // The row stays lit while its menu is open.
      <div
        key={name}
        data-file={name}
        data-menu-open={open && file === name ? "" : undefined}
        tabIndex={0}
        className="hover:bg-hover data-[menu-open]:bg-hover"
      >
        {name}
      </div>
    ))}
  </ContextMenuTrigger>
  <ContextMenuContent className="w-48">
    <MenuItem index={0} icon={Pencil} label={\`Rename \${file}\`} onSelect={rename} />
    <MenuItem index={1} icon={Copy} label="Duplicate" onSelect={duplicate} />
    <MenuItem index={2} icon={Trash2} label="Delete" onSelect={remove} />
  </ContextMenuContent>
</ContextMenu>`;

const FILES = ["Q3 report.pdf", "Roadmap.fig", "Notes.md"];

/** The Share row as the open menu draws it: a MenuItem with its chevron. */
function ShareRowStill() {
  const parent = useDropdown();
  const ctx = useMemo(
    () => ({
      ...parent,
      renderMenuItem: ({ element, children }: MenuItemRenderOptions) =>
        cloneElement(element, {}, <>{children}<SubmenuChevron lit={false} /></>),
    }),
    [parent]
  );
  return (
    <DropdownContext.Provider value={ctx}>
      <MenuItem index={3} icon={Share} label="Share" />
    </DropdownContext.Provider>
  );
}

function BasicDemo() {
  const [last, setLast] = useState<string | null>(null);
  // The page opens on the menu as a right-click shows it, a still drawn
  // with the same parts. The pointer arriving puts it away, so the real
  // one is a right-click away.
  const [still, setStill] = useState(true);
  return (
    <div className="flex w-full max-w-sm flex-col gap-2 pb-10" onPointerEnter={() => setStill(false)}>
      <div className="relative">
        <ContextMenu>
          <ContextMenuTrigger
            onFocus={() => setStill(false)}
            className="grid h-40 select-none place-items-center rounded-lg border border-dashed border-border text-site-body text-muted-foreground"
          >
            Right-click here
          </ContextMenuTrigger>
          <ContextMenuContent className="w-56">
            <MenuItem index={0} icon={ArrowLeft} label="Back" onSelect={() => setLast("Back")} />
            <MenuItem index={1} icon={ArrowRight} label="Forward" disabled />
            <MenuItem index={2} icon={RotateCw} label="Reload" onSelect={() => setLast("Reload")} />
            <DropdownSeparator />
            <DropdownSub>
              <DropdownSubTrigger index={3} icon={Share} label="Share" />
              <DropdownSubContent>
                <MenuItem index={0} icon={Link} label="Copy link" onSelect={() => setLast("Copy link")} />
                <MenuItem index={1} icon={Mail} label="Email" onSelect={() => setLast("Email")} />
              </DropdownSubContent>
            </DropdownSub>
          </ContextMenuContent>
        </ContextMenu>
        <AnimatePresence>
          {still && (
            <motion.div
              aria-hidden
              inert
              className="pointer-events-none absolute left-1/2 top-24 z-10 w-56"
              initial={false}
              exit={{ opacity: 0, transition: { duration: 0.1, ease: "easeOut" } }}
            >
              <Dropdown>
                <MenuItem index={0} icon={ArrowLeft} label="Back" />
                <MenuItem index={1} icon={ArrowRight} label="Forward" disabled />
                <MenuItem index={2} icon={RotateCw} label="Reload" />
                <DropdownSeparator />
                <ShareRowStill />
              </Dropdown>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p className="h-5 text-site-caption text-muted-foreground" aria-live="polite">
        {last ? `Chose ${last}` : " "}
      </p>
    </div>
  );
}

function FilterDemo() {
  const [file, setFile] = useState<string | null>(null);
  const [last, setLast] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <ContextMenu onOpenChange={setOpen}>
        <ContextMenuTrigger
          className="flex flex-col gap-1 rounded-lg border border-border p-1"
          filter={(target) => !!target.closest("[data-file]")}
          onContextMenu={(e) => {
            const row = (e.target as Element).closest<HTMLElement>("[data-file]");
            setFile(row?.dataset.file ?? null);
          }}
          onKeyDown={(e) => {
            const row = (e.target as Element).closest<HTMLElement>("[data-file]");
            if (row) setFile(row.dataset.file ?? null);
          }}
        >
          {FILES.map((name) => (
            <div
              key={name}
              data-file={name}
              data-menu-open={open && file === name ? "" : undefined}
              tabIndex={0}
              className="select-none rounded-md px-2 py-1.5 text-site-body outline-none hover:bg-hover focus-visible:bg-hover data-[menu-open]:bg-hover"
            >
              {name}
            </div>
          ))}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <MenuItem index={0} icon={Pencil} label="Rename" onSelect={() => setLast(`Rename ${file}`)} />
          <MenuItem index={1} icon={Copy} label="Duplicate" onSelect={() => setLast(`Duplicate ${file}`)} />
          <MenuItem index={2} icon={Trash2} label="Delete" onSelect={() => setLast(`Delete ${file}`)} />
        </ContextMenuContent>
      </ContextMenu>
      <p className="h-5 text-site-caption text-muted-foreground" aria-live="polite">
        {last ?? " "}
      </p>
    </div>
  );
}

export default function ContextMenuDoc() {
  return (
    <DocPage
      title="ContextMenu"
      slug="context-menu"
      description="The Dropdown, opened where you right-click."
    >
      <DocSection title="Usage">
        <p className="text-site-body text-muted-foreground">
          Right-click to open it at the pointer. Items, submenus and search work as in the Dropdown.
        </p>
        <ComponentPreview code={basicCode}>
          <BasicDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Pick what opens it">
        <p className="text-site-body text-muted-foreground">
          <code>filter</code> picks what opens the menu; the rest, and text fields, keep the
          browser&apos;s. Keep the right-clicked row lit with <code>data-open</code>.
        </p>
        <ComponentPreview code={filterCode}>
          <FilterDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Keyboard">
        <p className="text-site-body text-muted-foreground">
          Shift + F10 or the Menu key opens it on the focused element. Esc closes it and returns
          focus.
        </p>
      </DocSection>

      <DocSection title="API Reference">
        <PropsTable groups={apiReference} />
      </DocSection>
    </DocPage>
  );
}
