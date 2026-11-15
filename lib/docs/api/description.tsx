/** A description's `code` spans as inline code (the same text the .md
 *  pages render as Markdown), the rest as plain text. */
export function Description({ text }: { text: string }) {
  return text.split(/(`[^`]+`)/).map((part, i) =>
    part.length > 2 && part.startsWith("`") && part.endsWith("`") ? (
      <code key={i} className="font-mono text-site-caption text-foreground">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    )
  );
}

