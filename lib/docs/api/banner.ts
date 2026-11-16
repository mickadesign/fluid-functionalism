// The API reference of /docs/banner: its PropsTables and the API section
// of /docs/banner.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export const bannerProps: PropDef[] = [
  { name: "status", type: '"default" | "info" | "success" | "warning" | "error"', default: '"default"', description: "Sets the color and the icon." },
  { name: "contrast", type: '"low" | "high"', default: '"low"', description: "low colors only the icon. high tints the whole banner." },
  { name: "variant", type: '"inline" | "fixed"', default: '"inline"', description: "fixed spans the full width and sticks to the top." },
  { name: "icon", type: "IconComponent", description: "Replaces the status icon." },
  { name: "dismissible", type: "boolean", default: "false", description: "Shows a ✕ button." },
  { name: "onDismiss", type: "() => void", description: "Called when the ✕ is pressed." },
  { name: "dismissLabel", type: "string", default: '"Dismiss"', description: "Label read by screen readers for the ✕." },
  { name: "open", type: "boolean", description: "Controls visibility. Without it, the ✕ hides the banner." },
  { name: "size", type: '"default" | "compact"', default: "from SizeProvider", description: "Default or compact." },
  { name: "motion", type: "BannerMotionConfig", default: "bannerMotion", description: "Overrides the appear and dismiss values for this banner." },
];

export const partProps: PropDef[] = [
  { name: "BannerTitle", type: "part", description: "The message." },
  { name: "BannerDescription", type: "part", description: "Optional text under the title." },
  { name: "BannerActions", type: "part", description: "Up to 3 BannerAction. Primary sits at the edge, or first under a description." },
];

export const actionProps: PropDef[] = [
  { name: "variant", type: '"primary" | "secondary" | "ghost"', default: '"secondary"', description: "The button style." },
  { name: "href", type: "string", description: "Renders a link instead of a button." },
  { name: "external", type: "boolean", default: "false", description: "Opens the link in a new tab." },
  { name: "onClick", type: "(event) => void", description: "Called on click." },
];

// Confirmation is a Banner that asks a yes or no question; it installs as
// `confirmation` and is documented on this page.
export const confirmationProps: PropDef[] = [
  { name: "title", type: "ReactNode", description: "The question, phrased so Approve and Deny answer it: \"Run pnpm build?\"." },
  { name: "description", type: "ReactNode", description: "What approving does, or why it is being asked." },
  { name: "icon", type: "IconName", default: "the Banner's info icon", description: "Icon naming the action." },
  { name: "state", type: '"requested" | "approved" | "denied"', default: '"requested"', description: "`requested` shows the buttons. `approved` and `denied` show the answer in their place." },
  { name: "onApprove", type: "() => void", description: "Called when Approve is pressed." },
  { name: "onDeny", type: "() => void", description: "Called when Deny is pressed." },
  { name: "approveLabel", type: "string", default: '"Approve"', description: "Label of the primary button." },
  { name: "denyLabel", type: "string", default: '"Deny"', description: "Label of the ghost button." },
  { name: "approvedLabel", type: "string", default: '"Approved"', description: "Text shown once approved." },
  { name: "deniedLabel", type: "string", default: '"Denied"', description: "Text shown once denied." },
  { name: "...props", type: "BannerProps", description: "Everything else goes to the Banner: `status`, `contrast`, `className`." },
  { name: "size", type: '"default" | "compact"', default: "from SizeProvider", description: "Step on the size ladder (see /docs/sizes)." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "Banner", props: bannerProps },
  { title: "Parts", props: partProps },
  { title: "BannerAction", props: actionProps },
  { title: "Confirmation", props: confirmationProps },
];
