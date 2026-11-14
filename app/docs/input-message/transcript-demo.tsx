"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
} from "@/registry/default/message-scroller";
import { ChatMessage } from "@/registry/default/chat-message";
import { InputMessage } from "@/registry/default/input-message";
import { ThinkingIndicator } from "@/registry/default/thinking-indicator";
type Turn = { id: string; from: "user" | "assistant"; text: string };

const HISTORY: Turn[] = [
  { id: "h1", from: "user", text: "Why do chat apps scroll so badly?" },
  {
    id: "h2",
    from: "assistant",
    text: "Mostly because the page has two jobs that pull against each other. It has to keep up with text that is still arriving, and it has to stay still while you read.",
  },
  { id: "h3", from: "user", text: "What does a good one do?" },
  {
    id: "h4",
    from: "assistant",
    text: "It follows the reply only while you are at the bottom. The moment you scroll up it lets go, and it gives you one button to come back.",
  },
];

const REPLY =
  "Your message moves to the top of the view, with a sliver of the last reply above it so you keep your place. The answer then grows underneath without pushing anything. Once it is longer than the view, the page starts following it, and it keeps following until you scroll away. Scroll up now and the text keeps arriving, but the view stays where you put it. The button brings you back to the latest line.";

export const transcriptCode = `import {
  MessageScroller, MessageScrollerContent,
  MessageScrollerItem, MessageScrollerButton,
} from "./components";

// Give the scroller a height: it fills it.
<MessageScroller className="h-96" viewportClassName="p-4">
  <MessageScrollerContent className="gap-2">
    <AnimatePresence initial={false}>
      {messages.map((m) => (
        // anchor: a user turn glides to the top, the reply grows under it.
        <MessageScrollerItem key={m.id} anchor={m.from === "user"}>
          <ChatMessage from={m.from}>{m.text}</ChatMessage>
        </MessageScrollerItem>
      ))}
    </AnimatePresence>
  </MessageScrollerContent>
  <MessageScrollerButton />
</MessageScroller>`;

export const aiSdkCode = `"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import {
  getToolName,
  isToolUIPart,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";

// sendMessage takes a FileList, the composer hands back File[].
function toFileList(files: File[]) {
  const transfer = new DataTransfer();
  files.forEach((file) => transfer.items.add(file));
  return transfer.files;
}

export function Chat() {
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const { messages, status, sendMessage, stop, addToolApprovalResponse } = useChat({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });

  return (
    <div className="flex h-dvh flex-col">
      <MessageScroller className="flex-1" viewportClassName="p-4">
        <MessageScrollerContent className="gap-2">
          {messages.map((message) => {
            const from = message.role === "user" ? "user" : "assistant";
            return (
              <MessageScrollerItem key={message.id} anchor={from === "user"}>
                {message.parts.map((part, i) => {
                  if (part.type === "text")
                    return <ChatMessage key={i} from={from}>{part.text}</ChatMessage>;
                  // A file part is already { url, mediaType }.
                  if (part.type === "file")
                    return <ChatMessage key={i} from={from} files={[part]} />;
                  if (part.type === "reasoning")
                    return (
                      <ThinkingSteps key={i} running={part.state === "streaming"}>
                        <ThinkingStepsHeader>
                          {part.state === "streaming" ? "Thinking" : "Thought"}
                        </ThinkingStepsHeader>
                        <ThinkingStepsContent>{part.text}</ThinkingStepsContent>
                      </ThinkingSteps>
                    );
                  if (isToolUIPart(part) && part.state === "approval-requested") {
                    const { id } = part.approval;
                    return (
                      <Confirmation
                        key={i}
                        title={\`Run \${getToolName(part)}?\`}
                        onApprove={() => addToolApprovalResponse({ id, approved: true })}
                        onDeny={() => addToolApprovalResponse({ id, approved: false })}
                      />
                    );
                  }
                  return null;
                })}
              </MessageScrollerItem>
            );
          })}
          {status === "submitted" && <ThinkingIndicator />}
        </MessageScrollerContent>
        <MessageScrollerButton />
      </MessageScroller>
      <InputMessage
        value={draft}
        onValueChange={setDraft}
        files={files}
        onFilesChange={setFiles}
        status={status}
        onStop={stop}
        onSend={(text, sent) => {
          sendMessage({ text, files: toFileList(sent) });
          setDraft("");
          setFiles([]);
        }}
      />
    </div>
  );
}`;

/** A transcript with a scripted reply: every send streams the same answer
 *  word by word, so the follow and anchor behaviors can be tried by hand. */
export function TranscriptDemo() {
  const [turns, setTurns] = useState<Turn[]>(HISTORY);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<"idle" | "submitted" | "streaming">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const clear = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };
  useEffect(() => clear, []);

  const send = (text: string) => {
    if (!text) return;
    clear();
    const n = ++idRef.current;
    const replyId = `a${n}`;
    setTurns((prev) => [...prev, { id: `u${n}`, from: "user", text }]);
    setDraft("");
    setStatus("submitted");
    const words = REPLY.split(" ");
    let shown = 0;
    const tick = () => {
      shown += 1;
      const partial = words.slice(0, shown).join(" ");
      setStatus("streaming");
      setTurns((prev) => {
        const rest = prev.filter((t) => t.id !== replyId);
        return [...rest, { id: replyId, from: "assistant", text: partial }];
      });
      if (shown < words.length) {
        timerRef.current = setTimeout(tick, 45);
      } else {
        timerRef.current = null;
        setStatus("idle");
      }
    };
    timerRef.current = setTimeout(tick, 600);
  };

  return (
    <div className="flex h-[440px] w-full max-w-[520px] flex-col gap-3">
      <MessageScroller className="flex-1" viewportClassName="px-1 py-2">
        <MessageScrollerContent className="gap-2">
          <AnimatePresence initial={false}>
            {turns.map((turn) => (
              <MessageScrollerItem key={turn.id} anchor={turn.from === "user"}>
                <ChatMessage from={turn.from}>{turn.text}</ChatMessage>
              </MessageScrollerItem>
            ))}
          </AnimatePresence>
          {status === "submitted" && <ThinkingIndicator />}
        </MessageScrollerContent>
        <MessageScrollerButton />
      </MessageScroller>
      <InputMessage
        value={draft}
        onValueChange={setDraft}
        onSend={send}
        status={status}
        onStop={() => {
          clear();
          setStatus("idle");
        }}
        placeholderSuggestion="How does the scrolling work?"
      />
    </div>
  );
}

