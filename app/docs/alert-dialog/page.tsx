"use client";

import type { ComponentProps, ReactNode } from "react";
import { useBase } from "@/lib/base-context";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { useFlavorComponents } from "@/lib/docs/use-flavor";

const basicCodeRadix = `import {
  Button, AlertDialog, AlertDialogTrigger, AlertDialogContent,
  AlertDialogHeader, AlertDialogFooter, AlertDialogTitle,
  AlertDialogDescription, AlertDialogCancel, AlertDialogAction,
} from "./components";

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="tertiary">Show alert dialog</Button>
  </AlertDialogTrigger>
  <AlertDialogContent size="sm">
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently
        delete your account from our servers.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel asChild>
        <Button variant="ghost">Cancel</Button>
      </AlertDialogCancel>
      <AlertDialogAction asChild>
        <Button>Continue</Button>
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`;

const basicCodeBase = `import {
  Button, AlertDialog, AlertDialogTrigger, AlertDialogContent,
  AlertDialogHeader, AlertDialogFooter, AlertDialogTitle,
  AlertDialogDescription, AlertDialogCancel, AlertDialogAction,
} from "./components";

<AlertDialog>
  <AlertDialogTrigger render={<Button variant="tertiary">Show alert dialog</Button>} />
  <AlertDialogContent size="sm">
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently
        delete your account from our servers.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel render={<Button variant="ghost">Cancel</Button>} />
      <AlertDialogAction render={<Button>Continue</Button>} />
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`;

const largeCodeRadix = `<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="ghost">Delete project</Button>
  </AlertDialogTrigger>
  <AlertDialogContent size="lg">
    <AlertDialogHeader>
      <AlertDialogTitle>Delete project?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete the project and all of its data.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel asChild>
        <Button variant="ghost">Cancel</Button>
      </AlertDialogCancel>
      <AlertDialogAction asChild>
        <Button>Delete</Button>
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`;

const largeCodeBase = `<AlertDialog>
  <AlertDialogTrigger render={<Button variant="ghost">Delete project</Button>} />
  <AlertDialogContent size="lg">
    <AlertDialogHeader>
      <AlertDialogTitle>Delete project?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete the project and all of its data.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel render={<Button variant="ghost">Cancel</Button>} />
      <AlertDialogAction render={<Button>Delete</Button>} />
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`;

const destructiveCodeRadix = `<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete Chat</Button>
  </AlertDialogTrigger>
  <AlertDialogContent size="sm">
    <AlertDialogHeader>
      <AlertDialogTitle>Delete chat?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete this chat conversation. This action
        cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel asChild>
        <Button variant="ghost">Cancel</Button>
      </AlertDialogCancel>
      <AlertDialogAction asChild>
        <Button variant="destructive">Delete</Button>
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`;

const destructiveCodeBase = `<AlertDialog>
  <AlertDialogTrigger render={<Button variant="destructive">Delete Chat</Button>} />
  <AlertDialogContent size="sm">
    <AlertDialogHeader>
      <AlertDialogTitle>Delete chat?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete this chat conversation. This action
        cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel render={<Button variant="ghost">Cancel</Button>} />
      <AlertDialogAction render={<Button variant="destructive">Delete</Button>} />
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`;

const alertDialogContentProps: PropDef[] = [
  { name: "size", type: '"sm" | "lg"', default: '"sm"', description: "Width of the alert dialog." },
  { name: "children", type: "ReactNode", description: "Content inside the alert dialog." },
];

type ButtonVariant = ComponentProps<
  ReturnType<typeof useFlavorComponents>["Button"]
>["variant"];

function FlavorAlertDialogTrigger({
  isBase,
  AlertDialogTrigger,
  Button,
  variant,
  className,
  children,
}: {
  isBase: boolean;
  AlertDialogTrigger: ReturnType<typeof useFlavorComponents>["AlertDialogTrigger"];
  Button: ReturnType<typeof useFlavorComponents>["Button"];
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
}) {
  if (isBase) {
    return (
      <AlertDialogTrigger
        render={
          <Button variant={variant} className={className}>
            {children}
          </Button>
        }
      />
    );
  }
  return (
    <AlertDialogTrigger asChild>
      <Button variant={variant} className={className}>
        {children}
      </Button>
    </AlertDialogTrigger>
  );
}

function FlavorAlertDialogButton({
  isBase,
  Slot,
  Button,
  variant,
  className,
  children,
}: {
  isBase: boolean;
  /** AlertDialogCancel or AlertDialogAction from useFlavorComponents. */
  Slot: ReturnType<typeof useFlavorComponents>["AlertDialogCancel"];
  Button: ReturnType<typeof useFlavorComponents>["Button"];
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
}) {
  if (isBase) {
    return (
      <Slot render={<Button variant={variant} className={className}>{children}</Button>} />
    );
  }
  return (
    <Slot asChild>
      <Button variant={variant} className={className}>
        {children}
      </Button>
    </Slot>
  );
}

export default function AlertDialogDoc() {
  const { base } = useBase();
  const isBase = base === "base";
  const {
    Button,
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogCancel,
    AlertDialogAction,
  } = useFlavorComponents();

  return (
    <DocPage
      title="AlertDialog"
      slug="alert-dialog"
      description="Modal alert dialog that interrupts the user with important content and expects a response."
    >
      <DocSection title="Small Alert Dialog">
        <ComponentPreview code={isBase ? basicCodeBase : basicCodeRadix}>
          <AlertDialog>
            <FlavorAlertDialogTrigger
              isBase={isBase}
              AlertDialogTrigger={AlertDialogTrigger}
              Button={Button}
              variant="destructive"
            >
              Delete account
            </FlavorAlertDialogTrigger>
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <FlavorAlertDialogButton
                  isBase={isBase}
                  Slot={AlertDialogCancel}
                  Button={Button}
                  variant="ghost"
                >
                  Cancel
                </FlavorAlertDialogButton>
                <FlavorAlertDialogButton
                  isBase={isBase}
                  Slot={AlertDialogAction}
                  Button={Button}
                  variant="destructive"
                >
                  Delete
                </FlavorAlertDialogButton>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Large Alert Dialog">
        <ComponentPreview code={isBase ? largeCodeBase : largeCodeRadix}>
          <AlertDialog>
            <FlavorAlertDialogTrigger
              isBase={isBase}
              AlertDialogTrigger={AlertDialogTrigger}
              Button={Button}
              variant="ghost"
            >
              Submit data
            </FlavorAlertDialogTrigger>
            <AlertDialogContent size="lg">
              <AlertDialogHeader>
                <AlertDialogTitle>Submit data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. Are you sure you want to continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <FlavorAlertDialogButton
                  isBase={isBase}
                  Slot={AlertDialogCancel}
                  Button={Button}
                  variant="ghost"
                >
                  Cancel
                </FlavorAlertDialogButton>
                <FlavorAlertDialogButton
                  isBase={isBase}
                  Slot={AlertDialogAction}
                  Button={Button}
                >
                  Submit
                </FlavorAlertDialogButton>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference — AlertDialogContent">
        <PropsTable props={alertDialogContentProps} />
      </DocSection>
    </DocPage>
  );
}
