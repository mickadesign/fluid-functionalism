# Tone of voice

How the site talks. Applies to any copy a visitor reads.


## Rules

1. **One line per intro.** A fragment is fine. The demo does the rest.
   > Eight bg/shadow pairs.
2. **Count first.** Lead with the number when there is one.
   > 3 layout options: sidebar, floating, inset.
3. **User benefit, not feature.** Say what the user benefit from and why it works, not what
   the prop is called.

4. **Instruct the hand.** Demos get imperative verbs: drag, click, press,
   type. Name the key or knob.
   > Drag to resize, click to collapse, or press `[`.
5. **Present tense, active voice, second person.** Nothing "can be" or
   "allows you to".
6. **No em dashes, anywhere.** Commas, colons, and full stops. The one
   exception is prose that spells out a range or a pairing inside code.
7. **Plain words.** No "seamless", "powerful", "robust", "beautiful". If a
   thing is good, say what it does.
8. **Numbers stay numeric.** `24px`, `3 actions`, `8 levels`, `sm`. Never
   spell them out in copy.
10. **Inline code for anything the reader types.** Props, classes, keys,
    values: `checkedIndices`, `size="xl"`, `[`.

## Not this

| Avoid | Write |
|---|---|
| A powerful, flexible sidebar that allows you to… | A sidebar built from composable parts. |
| The `separated` prop can be used to add gaps between cards. | `separated` puts a gap between cards. |
| Sidebar — floating variant — elevated | Floating: the sidebar sits one surface up. |
| Twenty-four pixel icon buttons | 24px icon buttons |


## Changelog variant

`/changelog` reports a change, not a thing. Every rule above still holds,
except where these 5 bend it.

1. **New state first, old state second.** Present tense for what ships;
   `instead of` or `no longer` for what it replaces. Never "now", "has
   been", or "we".
   > A dismissible card hides its ✕ until hover.
2. **The new name is the subject.** Renames stay active.
   > `fluidHover` replaces `proximityHover` on `CardGroup`.
3. **Instruct the hand only to migrate.** A Breaking entry ends with what to
   pass or write to keep the old behavior. New and Updated entries describe;
   the doc page instructs.
   > Pass `size="compact"` to keep the dense design.
4. **The diff carries the code.** 3 inline code spans per sentence at most.
   Name the prop the reader acts on, and leave the rest to the diff or the
   doc page.
5. **Short entries.** 25 words per sentence, 2 sentences per entry. The
   second sentence is for a second change or the way back.

| Avoid | Write |
|---|---|
| `proximityHover` is renamed `fluidHover`. | `fluidHover` replaces `proximityHover` on `CardGroup`. |
| Direct `buttonVariants` calls take `default`, `compact`, `icon` and `icon-compact` in place of `sm`, `md`, `lg`, `icon-sm` and `icon-lg`. | `buttonVariants` takes the size ladder's names. |
| Dropdowns now close on scroll. | An open Dropdown closes when the page scrolls. |
