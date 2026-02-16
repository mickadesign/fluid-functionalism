import {
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../../components";
import { ComponentPreview } from "../ComponentPreview";
import { PropsTable, type PropDef } from "../PropsTable";
import { DocPage, DocSection } from "../DocPage";

const basicCode = `import {
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

const largeCode = `<Dialog>
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

const dialogContentProps: PropDef[] = [
  { name: "size", type: '"sm" | "lg"', default: '"sm"', description: "Width of the dialog." },
  { name: "children", type: "ReactNode", description: "Content inside the dialog." },
];

export function DialogDoc() {
  return (
    <DocPage
      title="Dialog"
      description="Modal dialog with smooth enter/exit animations and overlay."
    >
      <DocSection title="Small Dialog">
        <ComponentPreview code={basicCode}>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="tertiary">Open small dialog</Button>
            </DialogTrigger>
            <DialogContent size="sm">
              <DialogHeader>
                <DialogTitle>Create teamspace</DialogTitle>
                <DialogDescription>
                  Add a new teamspace to organize your projects and collaborate with your team.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <Button>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Large Dialog">
        <ComponentPreview code={largeCode}>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost">Open large dialog</Button>
            </DialogTrigger>
            <DialogContent size="lg">
              <DialogHeader>
                <DialogTitle>Confirm action</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. Are you sure you want to continue?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Cancel</Button>
                </DialogClose>
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
