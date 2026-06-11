"use client";

import type { ComponentProps, ReactNode } from "react";
import { useBase } from "@/lib/base-context";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { useFlavorComponents } from "@/lib/docs/use-flavor";

const basicCodeRadix = `import {
  Button, Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogFooter, DialogTitle,
  DialogDescription, DialogClose,
} from "./components";

<Dialog>
  <DialogTrigger asChild>
    <Button variant="tertiary">Open dialog</Button>
  </DialogTrigger>
  <DialogContent size="sm">
    <DialogHeader>
      <DialogTitle>Create teamspace</DialogTitle>
      <DialogDescription>
        Add a new teamspace to organize your projects.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="ghost">Cancel</Button>
      </DialogClose>
      <Button>Create</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`;

const basicCodeBase = `import {
  Button, Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogFooter, DialogTitle,
  DialogDescription, DialogClose,
} from "./components";

<Dialog>
  <DialogTrigger render={<Button variant="tertiary">Open dialog</Button>} />
  <DialogContent size="sm">
    <DialogHeader>
      <DialogTitle>Create teamspace</DialogTitle>
      <DialogDescription>
        Add a new teamspace to organize your projects.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose render={<Button variant="ghost">Cancel</Button>} />
      <Button>Create</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`;

const largeCodeRadix = `<Dialog>
  <DialogTrigger asChild>
    <Button variant="ghost">Open large dialog</Button>
  </DialogTrigger>
  <DialogContent size="lg">
    <DialogHeader>
      <DialogTitle>Confirm action</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="ghost">Cancel</Button>
      </DialogClose>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`;

const largeCodeBase = `<Dialog>
  <DialogTrigger render={<Button variant="ghost">Open large dialog</Button>} />
  <DialogContent size="lg">
    <DialogHeader>
      <DialogTitle>Confirm action</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose render={<Button variant="ghost">Cancel</Button>} />
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`;

const dialogContentProps: PropDef[] = [
  { name: "size", type: '"sm" | "lg"', default: '"sm"', description: "Width of the dialog." },
  { name: "children", type: "ReactNode", description: "Content inside the dialog." },
];

type ButtonVariant = ComponentProps<
  ReturnType<typeof useFlavorComponents>["Button"]
>["variant"];

function FlavorDialogTrigger({
  isBase,
  DialogTrigger,
  Button,
  variant,
  children,
}: {
  isBase: boolean;
  DialogTrigger: ReturnType<typeof useFlavorComponents>["DialogTrigger"];
  Button: ReturnType<typeof useFlavorComponents>["Button"];
  variant?: ButtonVariant;
  children: ReactNode;
}) {
  if (isBase) {
    return (
      <DialogTrigger render={<Button variant={variant}>{children}</Button>} />
    );
  }
  return (
    <DialogTrigger asChild>
      <Button variant={variant}>{children}</Button>
    </DialogTrigger>
  );
}

function FlavorDialogClose({
  isBase,
  DialogClose,
  Button,
  variant,
  children,
}: {
  isBase: boolean;
  DialogClose: ReturnType<typeof useFlavorComponents>["DialogClose"];
  Button: ReturnType<typeof useFlavorComponents>["Button"];
  variant?: ButtonVariant;
  children: ReactNode;
}) {
  if (isBase) {
    return (
      <DialogClose render={<Button variant={variant}>{children}</Button>} />
    );
  }
  return (
    <DialogClose asChild>
      <Button variant={variant}>{children}</Button>
    </DialogClose>
  );
}

export default function DialogDoc() {
  const { base } = useBase();
  const isBase = base === "base";
  const {
    Button,
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
    DialogClose,
  } = useFlavorComponents();

  return (
    <DocPage
      title="Dialog"
      slug="dialog"
      description="Modal dialog with smooth enter/exit animations and overlay."
    >
      <DocSection title="Small Dialog">
        <ComponentPreview code={isBase ? basicCodeBase : basicCodeRadix}>
          <Dialog>
            <FlavorDialogTrigger
              isBase={isBase}
              DialogTrigger={DialogTrigger}
              Button={Button}
              variant="tertiary"
            >
              Open small dialog
            </FlavorDialogTrigger>
            <DialogContent size="sm">
              <DialogHeader>
                <DialogTitle>Create teamspace</DialogTitle>
                <DialogDescription>
                  Add a new teamspace to organize your projects and collaborate with your team.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <FlavorDialogClose
                  isBase={isBase}
                  DialogClose={DialogClose}
                  Button={Button}
                  variant="ghost"
                >
                  Cancel
                </FlavorDialogClose>
                <Button>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Large Dialog">
        <ComponentPreview code={isBase ? largeCodeBase : largeCodeRadix}>
          <Dialog>
            <FlavorDialogTrigger
              isBase={isBase}
              DialogTrigger={DialogTrigger}
              Button={Button}
              variant="ghost"
            >
              Open large dialog
            </FlavorDialogTrigger>
            <DialogContent size="lg">
              <DialogHeader>
                <DialogTitle>Confirm action</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. Are you sure you want to continue?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <FlavorDialogClose
                  isBase={isBase}
                  DialogClose={DialogClose}
                  Button={Button}
                  variant="ghost"
                >
                  Cancel
                </FlavorDialogClose>
                <Button>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference — DialogContent">
        <PropsTable props={dialogContentProps} />
      </DocSection>
    </DocPage>
  );
}
