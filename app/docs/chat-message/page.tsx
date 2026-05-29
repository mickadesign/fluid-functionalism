"use client";

import { useEffect, useState } from "react";
import { ChatMessage } from "@/registry/default/chat-message";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { useIcon } from "@/registry/default/lib/icon-context";
import { useShape } from "@/registry/default/lib/shape-context";
import { cn } from "@/registry/default/lib/utils";

// Icon-only action buttons for the hover-revealed meta row. Assistant replies
// get copy + regenerate; user messages get copy + edit.
function MessageActions({
  from,
  text,
}: {
  from: "user" | "assistant";
  text: string;
}) {
  const shape = useShape();
  const CopyIcon = useIcon("copy");
  const SecondIcon = useIcon(from === "user" ? "pencil" : "rotate-ccw");
  const btn = cn(
    "inline-flex size-6 items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-hover transition-colors duration-100 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#6B97FF]",
    shape.button
  );
  return (
    <>
      <button
        type="button"
        aria-label="Copy message"
        className={btn}
        onClick={() => navigator.clipboard?.writeText(text)}
      >
        <CopyIcon size={13} strokeWidth={1.5} />
      </button>
      <button
        type="button"
        aria-label={from === "user" ? "Edit message" : "Regenerate response"}
        className={btn}
      >
        <SecondIcon size={13} strokeWidth={1.5} />
      </button>
    </>
  );
}

const conversationCode = `import { ChatMessage } from "./components";
import { Copy, RotateCcw } from "lucide-react";

// Timestamp + icon buttons are revealed on hover; their height is always
// reserved, so the gap between bubbles never shifts.
const actions = (
  <>
    <button aria-label="Copy"><Copy size={13} strokeWidth={1.5} /></button>
    <button aria-label="Regenerate"><RotateCcw size={13} strokeWidth={1.5} /></button>
  </>
);

<div className="flex flex-col gap-2">
  <ChatMessage from="user" time="Wednesday 6:06 PM" actions={actions}>
    What does "good design" actually mean? Everyone says it, no one defines it.
  </ChatMessage>
  <ChatMessage from="assistant" time="Wednesday 6:06 PM" actions={actions}>
    Good design is mostly invisible — you only notice it when it's missing. It's less about how something looks and more about how effortlessly it lets you do what you came to do.
  </ChatMessage>
  <ChatMessage from="user" time="Wednesday 6:07 PM" actions={actions}>
    So function over form?
  </ChatMessage>
  <ChatMessage from="assistant" time="Wednesday 6:07 PM" actions={actions}>
    Not quite. Form is part of function — something that feels good to use is, in a real sense, working better. The split between the two is mostly a myth.
  </ChatMessage>
  <ChatMessage from="user" time="Wednesday 6:08 PM" actions={actions}>
    That reframes it completely.
  </ChatMessage>
</div>`;

const rolesCode = `import { ChatMessage } from "./components";

<div className="flex flex-col gap-2">
  <ChatMessage from="user">Right-aligned accent bubble.</ChatMessage>
  <ChatMessage from="assistant">Left-aligned, no background.</ChatMessage>
</div>`;

const attachmentsCode = `import { ChatMessage } from "./components";

// \`files\` is a standard File[] — e.g. straight from InputMessage's onSend.
<ChatMessage from="user" files={files}>
  Can you use this as my new avatar?
</ChatMessage>`;

const chatMessageProps: PropDef[] = [
  { name: "from", type: '"user" | "assistant"', description: "Who sent the message. `user` renders a right-aligned accent bubble; `assistant` renders left-aligned plain text with no background. Also sets the entrance transform-origin." },
  { name: "children", type: "ReactNode", description: "Message body. For the user it renders inside the bubble; for the assistant it renders as plain text. When omitted (attachment-only message) the body is dropped and only the thumbnails show." },
  { name: "time", type: "ReactNode", description: "Timestamp shown in the meta row that is revealed on hover (or focus). Caller pre-formats it, e.g. \"Wednesday 6:08 PM\"." },
  { name: "actions", type: "ReactNode", description: "Icon-only action buttons (copy, edit, regenerate, …) shown next to the timestamp in the hover-revealed meta row. The row's height is always reserved, so revealing it never shifts the layout." },
  { name: "files", type: "File[]", description: "Optional attachments rendered as square thumbnails above the bubble. Images use object-cover; PDFs render their first page via pdfjs." },
  { name: "thumbnailSize", type: "number", default: "64", description: "Side length (in pixels) of each attachment thumbnail." },
  { name: "className", type: "string", description: "Merged onto the outer motion wrapper. Useful for tweaking max-width or spacing." },
];

export default function ChatMessageDoc() {
  // A real File so the attachments demo renders an actual thumbnail. Fetched
  // from the public profile image at mount and wrapped as a File.
  const [sampleFiles, setSampleFiles] = useState<File[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch("/micka.png")
      .then((res) => res.blob())
      .then((blob) => {
        if (cancelled) return;
        setSampleFiles([
          new File([blob], "micka.png", { type: blob.type || "image/png" }),
        ]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DocPage
      title="ChatMessage"
      slug="chat-message"
      description="A single chat transcript entry with baked-in entrance and layout motion. Right-aligned accent bubble for the user, left-aligned plain text for the assistant, with optional file attachments and a hover-revealed meta row."
    >
      <DocSection title="Conversation">
        <ComponentPreview code={conversationCode} minHeightClass="min-h-[220px]">
          <div className="w-full max-w-xl flex flex-col gap-2">
            <ChatMessage
              from="user"
              time="Wednesday 6:06 PM"
              actions={
                <MessageActions
                  from="user"
                  text={`What does "good design" actually mean? Everyone says it, no one defines it.`}
                />
              }
            >
              What does &ldquo;good design&rdquo; actually mean? Everyone says
              it, no one defines it.
            </ChatMessage>
            <ChatMessage
              from="assistant"
              time="Wednesday 6:06 PM"
              actions={
                <MessageActions
                  from="assistant"
                  text="Good design is mostly invisible — you only notice it when it's missing. It's less about how something looks and more about how effortlessly it lets you do what you came to do."
                />
              }
            >
              Good design is mostly invisible — you only notice it when it&apos;s
              missing. It&apos;s less about how something looks and more about
              how effortlessly it lets you do what you came to do.
            </ChatMessage>
            <ChatMessage
              from="user"
              time="Wednesday 6:07 PM"
              actions={<MessageActions from="user" text="So function over form?" />}
            >
              So function over form?
            </ChatMessage>
            <ChatMessage
              from="assistant"
              time="Wednesday 6:07 PM"
              actions={
                <MessageActions
                  from="assistant"
                  text="Not quite. Form is part of function — something that feels good to use is, in a real sense, working better. The split between the two is mostly a myth."
                />
              }
            >
              Not quite. Form is part of function — something that feels good to
              use is, in a real sense, working better. The split between the two
              is mostly a myth.
            </ChatMessage>
            <ChatMessage
              from="user"
              time="Wednesday 6:08 PM"
              actions={
                <MessageActions from="user" text="That reframes it completely." />
              }
            >
              That reframes it completely.
            </ChatMessage>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Roles">
        <ComponentPreview code={rolesCode} minHeightClass="min-h-[160px]">
          <div className="w-full max-w-xl flex flex-col gap-2">
            <ChatMessage from="user">Right-aligned accent bubble.</ChatMessage>
            <ChatMessage from="assistant">Left-aligned, no background.</ChatMessage>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Attachments">
        <ComponentPreview code={attachmentsCode} minHeightClass="min-h-[200px]">
          <div className="w-full max-w-xl flex flex-col gap-2">
            <ChatMessage from="user" files={sampleFiles}>
              Can you use this as my new avatar?
            </ChatMessage>
            <ChatMessage from="assistant">
              Looks great — it&apos;ll crop cleanly into the circle.
            </ChatMessage>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <PropsTable props={chatMessageProps} />
      </DocSection>
    </DocPage>
  );
}
