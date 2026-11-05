// The API reference of /docs/field: its PropsTables and the API section of
// /docs/field.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const fieldProps: PropDef[] = [
  { name: "orientation", type: '"vertical" | "horizontal" | "responsive"', default: '"vertical"', description: "Label above the control, beside it, or beside it once the surrounding FieldGroup is wide enough." },
  { name: "data-invalid", type: "boolean", description: "Turns the label red. Put aria-invalid on the control itself too." },
  { name: "aria-label / aria-labelledby", type: "string", description: "Names the field as a group (role=group), for a field with several controls. Without one, no group role is set." },
  { name: "className", type: "string", description: "Extra classes for the wrapper." },
];

export const fieldSetProps: PropDef[] = [
  { name: "className", type: "string", description: "Extra classes for the fieldset. Fields inside stack 20px apart." },
];

export const fieldLegendProps: PropDef[] = [
  { name: "variant", type: '"legend" | "label"', default: '"legend"', description: "legend titles a section; label matches FieldLabel, for a fieldset nested in a group." },
  { name: "className", type: "string", description: "Extra classes for the legend." },
];

export const fieldGroupProps: PropDef[] = [
  { name: "className", type: "string", description: "Extra classes for the group. It is a container (@container/field-group), so responsive fields switch layout on its width." },
];

export const fieldContentProps: PropDef[] = [
  { name: "className", type: "string", description: "Extra classes for the column that holds a label and description beside a control." },
];

export const fieldLabelProps: PropDef[] = [
  { name: "htmlFor", type: "string", description: "The id of the control the label names." },
  { name: "className", type: "string", description: "Extra classes for the label. Wrap a whole Field in it to make a choice card." },
];

export const fieldTitleProps: PropDef[] = [
  { name: "className", type: "string", description: "Extra classes for a title that reads like a label but names no control." },
];

export const fieldDescriptionProps: PropDef[] = [
  { name: "className", type: "string", description: "Extra classes for the helper text." },
];

export const fieldSeparatorProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "Optional text centered on the rule, masked by the page background." },
  { name: "className", type: "string", description: "Extra classes for the separator. Pass the surface's bg on the text when it sits on a card." },
];

export const fieldErrorProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "The message. Wins over errors when both are given." },
  { name: "errors", type: "Array<{ message?: string } | undefined>", description: "Messages from a form library or a Standard Schema validator. Duplicates collapse, several render as a list." },
  { name: "className", type: "string", description: "Extra classes for the message row." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "Field", props: fieldProps },
  { title: "FieldSet", props: fieldSetProps },
  { title: "FieldLegend", props: fieldLegendProps },
  { title: "FieldGroup", props: fieldGroupProps },
  { title: "FieldContent", props: fieldContentProps },
  { title: "FieldLabel", props: fieldLabelProps },
  { title: "FieldTitle", props: fieldTitleProps },
  { title: "FieldDescription", props: fieldDescriptionProps },
  { title: "FieldSeparator", props: fieldSeparatorProps },
  { title: "FieldError", props: fieldErrorProps },
];
