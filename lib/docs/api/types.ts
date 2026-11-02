/** One row of a doc page's API reference. Plain strings, so the same data
 *  renders as a PropsTable on the page and as a Markdown table in
 *  /docs/<slug>.md (see lib/docs/markdown.ts). */
export interface PropDef {
  name: string;
  type: string;
  default?: string;
  description: string;
}

/** One table of a page's API reference, titled as on the page. */
export interface ApiTable {
  title: string;
  props: PropDef[];
}
