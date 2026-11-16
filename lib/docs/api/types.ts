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
  /** One line on what the group is, shown on its row and under its
   *  heading in the Markdown. */
  description?: string;
  props: PropDef[];
  /** On the page only (the Markdown always lists every group): set on a
   *  page's groups, the reference renders as a DataTable where each group
   *  is a row that opens into its props, and `true` starts it closed. For
   *  a long reference: the parts everyone needs open, the rest a click
   *  away. Unset on all of them, the reference is one plain table. */
  collapsed?: boolean;
}
