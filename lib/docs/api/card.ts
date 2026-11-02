// The API reference of /docs/card: its PropsTables and the API section
// of /docs/card.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

// ── Props ────────────────────────────────────────────────

export const groupProps: PropDef[] = [
  { name: "orientation", type: '"card" | "inline"', default: '"card"', description: "Per-card layout: stacked (media/header on top) or a horizontal row." },
  { name: "columns", type: "number", default: "1", description: "Grid columns. Greater than 1 enables 2-D fluid hover across rows and columns." },
  { name: "border", type: '"none" | "outlined"', default: '"none"', description: "Borderless (dividers only) or a drawn border." },
  { name: "separated", type: "boolean", default: "false", description: "Split into individually-shaped tiles with a gap instead of one divided block." },
  { name: "fluidHover", type: "boolean", default: "true", description: "Enable the fluid hover highlight." },
  { name: "children", type: "ReactNode", description: "Card children. Each is auto-assigned its fluid hover index." },
];

export const cardProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "Compositional parts: CardImage, CardMedia, CardHeader, CardContent, CardFooter." },
  { name: "onClick", type: "() => void", description: "Makes the whole card a clickable target (stretched button)." },
  { name: "href", type: "string", description: "Makes the whole card a link (stretched anchor)." },
  { name: "external", type: "boolean", default: "false", description: "Opens href in a new tab." },
  { name: "label", type: "string", description: "Accessible name for the stretched link/button when the whole card is clickable." },
  { name: "selected", type: "boolean", default: "false", description: "Persistent selected fill + title emphasis, on top of fluid hover. The group drops the hairline dividers around the selected card so the fill reads clean." },
  { name: "disabled", type: "boolean", default: "false", description: "Dims and disables the card." },
  { name: "dismissible", type: "boolean", default: "false", description: "Shows a dismiss (✕) button, revealed on hover or focus by default." },
  { name: "dismissOnHover", type: "boolean", default: "true", description: "Keeps the dismiss control hidden until the card is hovered or holds focus. Pass false for an always-visible ✕." },
  { name: "onDismiss", type: "() => void", description: "Called when the dismiss button is pressed." },
];

export const partProps: PropDef[] = [
  { name: "CardHeader", type: "part", description: "Title + description grid; pins CardAction to the top-right." },
  { name: "CardTitle", type: "part", description: "Weight-animates normal → semibold when the card is selected (fluid hover previews via the highlight, not the weight)." },
  { name: "CardDescription", type: "part", description: "Muted supporting text." },
  { name: "CardAction", type: "part", description: "Top-right slot in the header (e.g. a menu button); stays clickable above the card overlay." },
  { name: "CardContent", type: "part", description: "Body region below the header." },
  { name: "CardFooter", type: "part", description: "Actions row. Trailing-right in inline cards, but drops below the text (natural order) in an inline card with a CardImage; wraps under the content when stacked." },
  { name: "CardMedia", type: "IconComponent | logo", description: "Leading icon in a tinted 32×32 tile, or a brand logo / [logoA, logoB] tuple. Logos get a subtle inset image outline." },
  { name: "CardImage", type: "{ src }", description: "Full-bleed image — a top banner when stacked, a square leading image when inline. A 1px inset outline preserves pale edges without changing layout. Corners round only inside a framed tile (outlined, or a caller's overflow-hidden wrapper); a borderless card reads as a plain rectangle." },
  { name: "CardFeature", type: "{ icon, title, description }", description: "Icon + title + description row for feature lists." },
];

export const buttonProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "Button label." },
  { name: "onClick", type: "() => void", description: "Click handler." },
  { name: "href", type: "string", description: "Renders the action as a link." },
  { name: "variant", type: '"primary" | "secondary" | "ghost" | "link"', default: '"ghost"', description: "Visual style." },
  { name: "icon", type: "IconComponent", description: "Leading (or trailing) icon." },
  { name: "iconPosition", type: '"start" | "end"', description: "Icon side. Defaults to end for external actions, else start." },
  { name: "external", type: "boolean", default: "false", description: "Appends an outward arrow and opens href in a new tab." },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "Card", props: cardProps },
  { title: "CardGroup", props: groupProps },
  { title: "Parts", props: partProps },
  { title: "CardButton", props: buttonProps },
];
