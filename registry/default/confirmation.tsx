"use client";

import { forwardRef, useId, type ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/springs";
import { useSize, typeClass, type SizeVariant } from "@/lib/size-context";
import { useIcons, type IconName } from "@/lib/icon-context";
import {
  Banner,
  BannerAction,
  BannerActions,
  BannerDescription,
  BannerTitle,
  type BannerProps,
} from "@/registry/default/banner";

// ---------------------------------------------------------------------------
// Confirmation asks for a yes or a no before something runs: an agent's tool
// call, a command, a send. It is a Banner: the neutral low-contrast fill, the
// Banner's grid, and its actions, so a question in a transcript reads like
// every other message the app raises. Once answered, the buttons give way to
// the answer in the same slot, and the row keeps its height.
// ---------------------------------------------------------------------------

type ConfirmationState = "requested" | "approved" | "denied";

// Every other Banner prop passes through: `status`, `contrast`, `className`.
interface ConfirmationProps
  extends Omit<BannerProps, "title" | "icon" | "children" | "role"> {
  /** The question, phrased so Approve and Deny answer it: "Run pnpm build?". */
  title: ReactNode;
  /** What approving does, or why it is being asked. */
  description?: ReactNode;
  /** Icon naming the action, in place of the Banner's info icon. */
  icon?: IconName;
  /** `requested` shows the buttons; `approved` and `denied` show the answer. */
  state?: ConfirmationState;
  onApprove?: () => void;
  onDeny?: () => void;
  approveLabel?: string;
  denyLabel?: string;
  /** Text shown in place of the buttons once approved. */
  approvedLabel?: string;
  /** Text shown in place of the buttons once denied. */
  deniedLabel?: string;
  /** Step on the size ladder. Wins over the surrounding SizeProvider. */
  size?: SizeVariant;
}

const Confirmation = forwardRef<HTMLDivElement, ConfirmationProps>(
  (
    {
      title,
      description,
      icon,
      state = "requested",
      onApprove,
      onDeny,
      approveLabel = "Approve",
      denyLabel = "Deny",
      approvedLabel = "Approved",
      deniedLabel = "Denied",
      size,
      ...props
    },
    ref
  ) => {
    const compact = useSize(size).variant === "compact";
    const icons = useIcons();
    const Check = icons.check;
    const X = icons.x;
    const titleId = useId();
    const descriptionId = useId();

    return (
      <Banner
        ref={ref}
        // A question to answer, not a status to announce: the answer below is
        // the part that is announced.
        role="group"
        aria-labelledby={titleId}
        aria-describedby={description != null ? descriptionId : undefined}
        icon={icon ? icons[icon] : undefined}
        size={size}
        {...props}
      >
        <BannerTitle id={titleId}>{title}</BannerTitle>
        {description != null && (
          <BannerDescription id={descriptionId}>{description}</BannerDescription>
        )}
        <BannerActions>
          {state === "requested" ? (
            <>
              {/* Primary first in the markup, for tab order; the Banner
                  places each by variant. */}
              <BannerAction variant="primary" onClick={onApprove}>
                {approveLabel}
              </BannerAction>
              <BannerAction variant="ghost" onClick={onDeny}>
                {denyLabel}
              </BannerAction>
            </>
          ) : (
            // As tall as the buttons it replaces (28px), so the banner does
            // not change height when the answer lands.
            <motion.span
              key={state}
              role="status"
              className={cn(
                "flex h-7 items-center gap-1.5 text-foreground",
                typeClass("body", compact ? "compact" : "default")
              )}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={spring.fast}
            >
              {state === "approved" ? (
                <Check size={14} strokeWidth={1.5} />
              ) : (
                <X size={14} strokeWidth={1.5} />
              )}
              {state === "approved" ? approvedLabel : deniedLabel}
            </motion.span>
          )}
        </BannerActions>
      </Banner>
    );
  }
);
Confirmation.displayName = "Confirmation";

export { Confirmation };
export type { ConfirmationProps, ConfirmationState };
export default Confirmation;
