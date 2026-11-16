"use client";

import { useState } from "react";
import { Confirmation, type ConfirmationState } from "@/registry/default/confirmation";
import { Button } from "@/components/ui/button";

export const confirmationCode = `import { Confirmation } from "./components";

const [state, setState] = useState<"requested" | "approved" | "denied">("requested");

<Confirmation
  title="Run pnpm build?"
  description="Builds the app into .next. Takes about a minute."
  state={state}
  onApprove={() => setState("approved")}
  onDeny={() => setState("denied")}
/>`;

export const confirmationAiSdkCode = `import { useChat } from "@ai-sdk/react";
import {
  getToolName,
  isToolUIPart,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";

const { messages, addToolApprovalResponse } = useChat({
  // Continue the chat once every approval has an answer.
  sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
});

// Inside the loop over message.parts. Any tool part that asked: the banner
// stays once answered and shows the answer.
if (isToolUIPart(part) && part.approval) {
  const { id, approved } = part.approval;
  return (
    <Confirmation
      title={\`Run \${getToolName(part)}?\`}
      state={approved == null ? "requested" : approved ? "approved" : "denied"}
      onApprove={() => addToolApprovalResponse({ id, approved: true })}
      onDeny={() => addToolApprovalResponse({ id, approved: false })}
    />
  );
}`;

export function ConfirmationDemo() {
  const [state, setState] = useState<ConfirmationState>("requested");
  return (
    <div className="flex w-full max-w-[480px] flex-col items-start gap-3">
      <Confirmation
        title="Run pnpm build?"
        description="Builds the app into .next. Takes about a minute."
        state={state}
        onApprove={() => setState("approved")}
        onDeny={() => setState("denied")}
      />
      {/* Reserved from the start, so the answer never moves the page. */}
      <Button
        variant="ghost"
        size="compact"
        onClick={() => setState("requested")}
        className={state === "requested" ? "invisible" : undefined}
      >
        Ask again
      </Button>
    </div>
  );
}

