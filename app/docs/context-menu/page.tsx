"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Copy, Link, Mail, Share, Pencil, Trash2 } from "lucide-react";
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "@/registry/default/context-menu";
import {
  DropdownSeparator,
  DropdownSub,
  DropdownSubContent,
  DropdownSubTrigger,
} from "@/components/flavored/dropdown";
import { MenuItem } from "@/registry/default/menu-item";
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

<ContextMenu>
  <ContextMenuTrigger
    // Only the rows open the menu; the gaps keep the browser's.
    filter={(target) => !!target.closest("[data-file]")}
    onContextMenu={(e) => {
      const row = (e.target as Element).closest<HTMLElement>("[data-file]");
      setFile(row?.dataset.file ?? null);
    }}
  >
    {FILES.map((name) => (
      <div key={name} data-file={name} tabIndex={0}>{name}</div>
    ))}
  </ContextMenuTrigger>
  <ContextMenuContent className="w-48">
    <MenuItem index={0} icon={Pencil} label={\`Rename \${file}\`} onSelect={rename} />
    <MenuItem index={1} icon={Copy} label="Duplicate" onSelect={duplicate} />
    <MenuItem index={2} icon={Trash2} label="Delete" onSelect={remove} />
  </ContextMenuContent>
</ContextMenu>`;

const FILES = ["Q3 report.pdf", "Roadmap.fig", "Notes.md"];

function BasicDemo() {
  const [last, setLast] = useState<string | null>(null);
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <ContextMenu>
        <ContextMenuTrigger className="grid h-40 select-none place-items-center rounded-lg border border-dashed border-border text-site-body text-muted-foreground">
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
      <p className="h-5 text-site-caption text-muted-foreground" aria-live="polite">
        {last ? `Chose ${last}` : " "}
      </p>
    </div>
  );
}

function FilterDemo() {
  const [file, setFile] = useState<string | null>(null);
  const [last, setLast] = useState<string | null>(null);
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <ContextMenu>
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
              tabIndex={0}
              className="select-none rounded-md px-2 py-1.5 text-site-body outline-none hover:bg-hover focus-visible:bg-hover"
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
      description="The Dropdown, opened where you right-click: the same items, submenus and keys, in both flavors."
    >
      <DocSection title="Usage">
        <p className="text-site-body text-muted-foreground">
          A right-click opens the menu at the pointer. Its items are the Dropdown&apos;s: MenuItem,
          submenus, labels, separators and search all work as they do there.
        </p>
        <ComponentPreview code={basicCode}>
          <BasicDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Pick what opens it">
        <p className="text-site-body text-muted-foreground">
          <code>filter</code> chooses which elements open the menu; everything else keeps the
          browser&apos;s. Record what was clicked in <code>onContextMenu</code> to build the items
          for it. Text fields always keep the browser&apos;s menu, for paste and spelling.
        </p>
        <ComponentPreview code={filterCode}>
          <FilterDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Keyboard">
        <p className="text-site-body text-muted-foreground">
          Shift + F10, or the Menu key, opens the menu under the focused element. Arrows move
          through the items, Enter runs one, Esc closes the menu and focus returns where it was.
        </p>
      </DocSection>

      <DocSection title="API Reference">
        <PropsTable groups={apiReference} />
      </DocSection>
    </DocPage>
  );
}
