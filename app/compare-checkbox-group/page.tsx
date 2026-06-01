"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { fontWeights } from "@/lib/font-weight";

// New version — the live working-tree component with the merge/split animation.
import {
  CheckboxGroup as NewCheckboxGroupRadix,
  CheckboxItem as NewCheckboxItemRadix,
} from "@/registry/radix/checkbox-group";
import {
  CheckboxGroup as NewCheckboxGroupBase,
  CheckboxItem as NewCheckboxItemBase,
} from "@/registry/base/checkbox-group";

// Old version — a local copy of the pre-animation component (git HEAD).
import {
  CheckboxGroup as OldCheckboxGroupRadix,
  CheckboxItem as OldCheckboxItemRadix,
} from "./checkbox-group-old-radix";
import {
  CheckboxGroup as OldCheckboxGroupBase,
  CheckboxItem as OldCheckboxItemBase,
} from "./checkbox-group-old-base";
import { useBase } from "@/lib/base-context";

const items = ["Apples", "Bananas", "Cherries", "Dates", "Elderberries", "Figs", "Grapes"];

function toggle(set: Set<number>, setSet: (s: Set<number>) => void) {
  return (i: number) => {
    const next = new Set(set);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSet(next);
  };
}

function Column({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div
          className="text-xs uppercase tracking-wide text-muted-foreground"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          {label}
        </div>
        <div className="text-xs text-muted-foreground/70 mt-0.5">{hint}</div>
      </div>
      <div className="rounded-xl bg-muted p-6">{children}</div>
    </div>
  );
}

export default function CompareCheckboxGroupPage() {
  const [oldChecked, setOldChecked] = useState<Set<number>>(new Set([0, 2]));
  const [newChecked, setNewChecked] = useState<Set<number>>(new Set([0, 2]));

  const toggleOld = toggle(oldChecked, setOldChecked);
  const toggleNew = toggle(newChecked, setNewChecked);

  const { base } = useBase();
  const NewCheckboxGroup = base === "base" ? NewCheckboxGroupBase : NewCheckboxGroupRadix;
  const NewCheckboxItem = base === "base" ? NewCheckboxItemBase : NewCheckboxItemRadix;
  const OldCheckboxGroup = base === "base" ? OldCheckboxGroupBase : OldCheckboxGroupRadix;
  const OldCheckboxItem = base === "base" ? OldCheckboxItemBase : OldCheckboxItemRadix;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <main className="flex-1 px-12 py-20">
        <header className="mb-12 max-w-2xl">
          <h1
            className="text-3xl tracking-tight"
            style={{ fontVariationSettings: fontWeights.bold }}
          >
            Checkbox Group — merge animation
          </h1>
          <p className="text-sm text-muted-foreground mt-3">
            The old component spring-grew the surviving block over the whole
            union. The new one glides the inner edges to the bridging row and
            swaps with no visible motion — and plays the inverse on a split. Use
            the Radius toggle in the panel to test both corner shapes.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-12 max-w-3xl">
          <Column label="Before" hint="git HEAD (no merge animation)">
            <OldCheckboxGroup checkedIndices={oldChecked}>
              {items.map((label, i) => (
                <OldCheckboxItem
                  key={label}
                  index={i}
                  label={label}
                  checked={oldChecked.has(i)}
                  onToggle={() => toggleOld(i)}
                />
              ))}
            </OldCheckboxGroup>
          </Column>

          <Column label="After" hint="working tree (merge / split animation)">
            <NewCheckboxGroup checkedIndices={newChecked}>
              {items.map((label, i) => (
                <NewCheckboxItem
                  key={label}
                  index={i}
                  label={label}
                  checked={newChecked.has(i)}
                  onToggle={() => toggleNew(i)}
                />
              ))}
            </NewCheckboxGroup>
          </Column>
        </div>
      </main>
    </div>
  );
}
