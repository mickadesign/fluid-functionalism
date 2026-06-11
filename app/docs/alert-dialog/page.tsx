"use client";

import { Button } from "@/registry/radix/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/registry/radix/alert-dialog";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";

const basicCode = `import {
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

const largeCode = `<AlertDialog>
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

const alertDialogContentProps: PropDef[] = [
  { name: "size", type: '"sm" | "lg"', default: '"sm"', description: "Width of the alert dialog." },
  { name: "children", type: "ReactNode", description: "Content inside the alert dialog." },
];

export default function AlertDialogDoc() {
  return (
    <DocPage
      title="AlertDialog"
      slug="alert-dialog"
      description="Modal alert dialog that interrupts the user with important content and expects a response."
    >
      <DocSection title="Small Alert Dialog">
        <ComponentPreview code={basicCode}>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account from our servers.
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
          </AlertDialog>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Large Alert Dialog">
        <ComponentPreview code={largeCode}>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost">Submit data</Button>
            </AlertDialogTrigger>
            <AlertDialogContent size="lg">
              <AlertDialogHeader>
                <AlertDialogTitle>Submit data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. Are you sure you want to continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button variant="ghost">Cancel</Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button>Submit</Button>
                </AlertDialogAction>
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
