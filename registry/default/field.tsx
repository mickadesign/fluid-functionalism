"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  type FieldsetHTMLAttributes,
  type HTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { fontWeights } from "@/lib/font-weight";
import { useIcons } from "@/lib/icon-context";
import { useShape } from "@/lib/shape-context";
import { useSize } from "@/lib/size-context";

// ---------------------------------------------------------------------------
// Field composes a label, a control, helper text and a validation message
// into one accessible block. It owns layout and type only: the control is
// any Input, Textarea, Select, Switch, Checkbox or Slider placed inside.
//
//   <Field data-invalid>
//     <FieldLabel htmlFor="email">Email</FieldLabel>
//     <Input id="email" aria-invalid />
//     <FieldError>Enter a valid email address.</FieldError>
//   </Field>
//
// Labels and messages sit flush with the control's edge. `data-invalid` on
// Field turns its label red; the control carries its own `aria-invalid`.
// Field links its FieldDescription and FieldError to the control through
// aria-describedby, so a screen reader reads them on focus.
// ---------------------------------------------------------------------------

const FieldSet = forwardRef<HTMLFieldSetElement, FieldsetHTMLAttributes<HTMLFieldSetElement>>(
  ({ className, ...props }, ref) => (
    <fieldset
      ref={ref}
      data-slot="field-set"
      // 12px between the legend block and the fields, the same step as
      // between fields.
      className={cn("m-0 flex min-w-0 flex-col gap-3 border-0 p-0", className)}
      {...props}
    />
  )
);
FieldSet.displayName = "FieldSet";

interface FieldLegendProps extends HTMLAttributes<HTMLLegendElement> {
  /** `legend` titles a section; `label` matches FieldLabel, for a fieldset
   *  nested inside a field group. */
  variant?: "legend" | "label";
}

const FieldLegend = forwardRef<HTMLLegendElement, FieldLegendProps>(
  ({ className, variant = "legend", style, ...props }, ref) => {
    const sizeClasses = useSize();
    return (
      <legend
        ref={ref}
        data-slot="field-legend"
        data-variant={variant}
        className={cn(
          "mb-1 p-0",
          variant === "legend"
            ? cn(sizeClasses.type.subtitle, "text-foreground")
            : cn(sizeClasses.type.body, "text-muted-foreground"),
          className
        )}
        style={{
          fontVariationSettings: variant === "legend" ? fontWeights.semibold : fontWeights.normal,
          ...style,
        }}
        {...props}
      />
    );
  }
);
FieldLegend.displayName = "FieldLegend";

const FieldGroup = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="field-group"
      // The container query lets `orientation="responsive"` fields switch
      // to a row once the group is wide enough, whatever the viewport.
      // 12px between fields, InputGroup's step: three times the 4px inside a
      // field, so each label reads with its own control.
      className={cn("@container/field-group flex w-full flex-col gap-3", className)}
      {...props}
    />
  )
);
FieldGroup.displayName = "FieldGroup";

type FieldOrientation = "vertical" | "horizontal" | "responsive";

// Stacked, label, control, description and error sit 4px apart at both
// steps, like InputField. Side by side, a control and its label take the
// ladder's control-to-label gap (8px, 4px compact), added in Field.
const orientationClasses: Record<FieldOrientation, string> = {
  vertical: "flex-col gap-1",
  // A control beside its label. With a FieldContent (label + description)
  // the control aligns to the first line instead of the block's center, so
  // a checkbox drops 2px to sit centered on that line (16px box on a 20px
  // line, 14 on 18 compact).
  horizontal:
    "flex-row items-center has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[data-slot=checkbox]]:mt-0.5",
  // In a row the control drops its full width (an Input is w-full on its
  // own) so the label column keeps the room; stacked, everything spans.
  responsive:
    "flex-col gap-1 @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[data-slot=checkbox]]:mt-0.5",
};

// The control Field describes: a library control first, then any native one.
// A hidden form mirror (aria-hidden) is never the control.
const LIBRARY_CONTROL = "[data-slot=input], [data-slot=textarea], [data-slot=checkbox], [role=combobox]";
const NATIVE_CONTROL = "input:not([type=hidden]):not([aria-hidden=true]), textarea, select";

/** Points the field's control at its own descriptions and errors, keeping
 *  any ids the caller passed. Nested fields are skipped: each describes only
 *  what sits directly in it. */
function linkDescriptions(root: HTMLElement) {
  const own = (el: Element) => el.closest("[data-slot=field]") === root;
  const find = (selector: string) =>
    Array.from(root.querySelectorAll<HTMLElement>(selector)).find(own);
  const control = find(LIBRARY_CONTROL) ?? find(NATIVE_CONTROL);
  if (!control) return;
  const ids = Array.from(
    root.querySelectorAll<HTMLElement>("[data-slot=field-description], [data-slot=field-error]")
  )
    .filter(own)
    .map((el) => el.id)
    .filter(Boolean);
  const linked = (control.dataset.fieldDescribedby ?? "").split(" ");
  const theirs = (control.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .filter((id) => id && !linked.includes(id));
  const next = [...theirs, ...ids].join(" ");
  if (next) control.setAttribute("aria-describedby", next);
  else control.removeAttribute("aria-describedby");
  control.dataset.fieldDescribedby = ids.join(" ");
}

interface FieldProps extends HTMLAttributes<HTMLDivElement> {
  /** Stack the label above the control, put them side by side, or switch
   *  to side by side once the surrounding FieldGroup is wide enough. */
  orientation?: FieldOrientation;
}

const Field = forwardRef<HTMLDivElement, FieldProps>(
  ({ className, orientation = "vertical", ...props }, ref) => {
    const sizeClasses = useSize();
    const rootRef = useRef<HTMLDivElement | null>(null);

    // After every render: a message that mounts or unmounts re-renders the
    // Field that holds it, so the link stays current.
    useEffect(() => {
      if (rootRef.current) linkDescriptions(rootRef.current);
    });

    // A group is only announced when it has a name; an unnamed group around
    // one label and one control would just add "group" to every field.
    const named = props["aria-label"] || props["aria-labelledby"];

    return (
      <div
        ref={(node) => {
          rootRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        role={named ? "group" : undefined}
        data-slot="field"
        data-orientation={orientation}
        className={cn(
          "group/field flex w-full",
          orientationClasses[orientation],
          orientation === "horizontal" && sizeClasses.gap,
          // Side by side once the group is wide enough: the same ladder gap.
          orientation === "responsive" &&
            (sizeClasses.variant === "compact" ? "@md/field-group:gap-1" : "@md/field-group:gap-2"),
          className
        )}
        {...props}
      />
    );
  }
);
Field.displayName = "Field";

const FieldContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="field-content"
      className={cn("flex min-w-0 flex-1 flex-col gap-1", className)}
      {...props}
    />
  )
);
FieldContent.displayName = "FieldContent";

const FieldLabel = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, style, ...props }, ref) => {
    const sizeClasses = useSize();
    const shape = useShape();
    return (
      <label
        ref={ref}
        data-slot="field-label"
        className={cn(
          "w-fit",
          sizeClasses.type.body,
          // Muted above a control; full contrast beside one, where it reads
          // as the control's own text (a switch, a checkbox).
          "text-muted-foreground group-data-[orientation=horizontal]/field:text-foreground",
          "group-data-[invalid=true]/field:text-destructive",
          // Choice card: a whole Field wrapped in the label becomes one
          // bordered, hoverable target. Block, since an inline label would
          // break its border around the Field inside.
          "has-[>[data-slot=field]]:block has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:border has-[>[data-slot=field]]:border-border",
          // The card takes the shape's container radius and the ladder's
          // control padding (12px, 10px compact) on every side.
          {
            pill: "has-[>[data-slot=field]]:rounded-3xl",
            rounded: "has-[>[data-slot=field]]:rounded-xl",
            sharp: "has-[>[data-slot=field]]:rounded-[1px]",
          }[shape.variant],
          sizeClasses.variant === "compact" ? "has-[>[data-slot=field]]:p-2.5" : "has-[>[data-slot=field]]:p-3",
          "has-[>[data-slot=field]]:transition-[background-color,border-color] has-[>[data-slot=field]]:duration-80 has-[>[data-slot=field]]:hover:bg-hover",
          // Hovering anywhere on the card, padding included, lights the box
          // the same way hovering its row does. A disabled box stays put and an
          // invalid one keeps its red border.
          "has-[>[data-slot=field]]:hover:[&_[data-slot=checkbox]:not([data-disabled]):not(:disabled):not([aria-invalid=true])]:border-foreground/40",
          "has-[[data-state=checked]]:border-foreground/40 has-[[data-checked]]:border-foreground/40",
          // Keyboard focus on the control inside rings the whole card, and
          // the control's own ring steps aside.
          "has-[>[data-slot=field]]:has-focus-visible:ring-1 has-[>[data-slot=field]]:has-focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
          "has-[>[data-slot=field]]:[&_[data-slot=checkbox]:focus-visible]:ring-0",
          className
        )}
        style={{ fontVariationSettings: fontWeights.normal, ...style }}
        {...props}
      />
    );
  }
);
FieldLabel.displayName = "FieldLabel";

const FieldTitle = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...props }, ref) => {
    const sizeClasses = useSize();
    return (
      <div
        ref={ref}
        data-slot="field-title"
        className={cn(sizeClasses.type.body, "text-foreground", className)}
        style={{ fontVariationSettings: fontWeights.normal, ...style }}
        {...props}
      />
    );
  }
);
FieldTitle.displayName = "FieldTitle";

const FieldDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, style, id, ...props }, ref) => {
    const sizeClasses = useSize();
    // An id is what Field links into the control's aria-describedby.
    const autoId = useId();
    return (
      <p
        ref={ref}
        id={id ?? autoId}
        data-slot="field-description"
        className={cn(sizeClasses.type.caption, "text-pretty text-muted-foreground", className)}
        style={{ fontVariationSettings: fontWeights.normal, ...style }}
        {...props}
      />
    );
  }
);
FieldDescription.displayName = "FieldDescription";

const FieldSeparator = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const sizeClasses = useSize();
    return (
      <div
        ref={ref}
        data-slot="field-separator"
        data-content={children ? true : undefined}
        className={cn("relative flex h-5 items-center", className)}
        {...props}
      >
        <div aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-border" />
        {children && (
          // The label masks the rule with the page background; pass a
          // className with the surface's own bg when it sits on a card.
          <span
            className={cn("relative mx-auto bg-background px-2 text-muted-foreground", sizeClasses.type.caption)}
            style={{ fontVariationSettings: fontWeights.normal }}
          >
            {children}
          </span>
        )}
      </div>
    );
  }
);
FieldSeparator.displayName = "FieldSeparator";

interface FieldErrorProps extends HTMLAttributes<HTMLDivElement> {
  /** Messages from a form library or a Standard Schema validator (Zod,
   *  Valibot, ArkType). Duplicates collapse; several render as a list.
   *  Children win when both are given. */
  errors?: Array<{ message?: string } | undefined>;
  children?: ReactNode;
}

const FieldError = forwardRef<HTMLDivElement, FieldErrorProps>(
  ({ className, errors, children, style, id, ...props }, ref) => {
    const sizeClasses = useSize();
    const AlertIcon = useIcons()["circle-alert"];
    const autoId = useId();
    const compact = sizeClasses.variant === "compact";

    const messages = useMemo(
      () => [...new Set((errors ?? []).map((e) => e?.message).filter((m): m is string => !!m))],
      [errors]
    );

    // `{cond && "msg"}` hands over false; only real content stands in for
    // the errors array.
    const hasChildren = children != null && children !== false && children !== "";
    const content = hasChildren
      ? children
      : (messages.length > 1 ? (
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {messages.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      ) : (
        messages[0]
      ));

    if (!content) return null;

    return (
      <div
        ref={ref}
        id={id ?? autoId}
        role="alert"
        data-slot="field-error"
        className={cn(
          "flex items-start text-destructive",
          sizeClasses.gap,
          sizeClasses.type.caption,
          className
        )}
        style={{ fontVariationSettings: fontWeights.normal, ...style }}
        {...props}
      >
        {/* 14px glyph on a 16px line (12 on 14 compact): 1px down centers it
            on the first line, so a wrapped or listed message stays aligned. */}
        <AlertIcon size={compact ? 12 : 14} strokeWidth={1.75} className="mt-px shrink-0" aria-hidden />
        <div className="min-w-0">{content}</div>
      </div>
    );
  }
);
FieldError.displayName = "FieldError";

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
};
export type { FieldProps, FieldOrientation, FieldLegendProps, FieldErrorProps };
