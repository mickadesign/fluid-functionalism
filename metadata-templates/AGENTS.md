# OG image layouts — agent contract

This directory (`metadata-templates/` at your project root) holds custom
templates for the 1200×630 OG images rendered by the `metadata-gen` tool.
Drop a file here and it's auto-discovered next time the preview server starts.

The tool ships three built-in layouts (A, B, C). Files in this directory
**add** new letters and can **override** built-in ones by using the same
letter (e.g. a local `layout-a.js` replaces the packaged one).

## The contract

One file per layout. Filename: `layout-<letter>.js` where `<letter>` is one
lowercase a–z character (e.g. `layout-d.js`). Pick the next letter not already
used — existing letters are listed in the "Generate a new layout" card in the
preview UI.

Each file exports a single function (named or default):

```js
export function layoutX(config) {
  return { /* Satori JSX object */ };
}
```

The function is pure — same `config` in, same JSX out. No I/O, no randomness.

The rendered canvas is **1200×630**. Fill the full width and height.

## Config shape

| Key                   | Type         | Default  | Notes                                              |
| --------------------- | ------------ | -------- | -------------------------------------------------- |
| `headline`            | string       | —        | Main text. Always present.                         |
| `tagline`             | string       | `''`     | Optional sub-text. Render only if truthy.          |
| `colors.background`   | string       | —        | Page background.                                   |
| `colors.foreground`   | string       | —        | Headline / primary text.                           |
| `colors.accent`       | string       | —        | Secondary (borders, highlights, panels).           |
| `colors.tagline`      | string\|null | `null`   | If set, overrides tagline color (full opacity).    |
| `logoBase64`          | string\|null | `null`   | Data URI. Render only if truthy.                   |
| `headingSize`         | number       | 56–72px  | Your choice. Bold weight assumed (fontWeight 700). |
| `taglineSize`         | number       | 22–28px  | Your choice.                                       |
| `align`               | string       | your choice | `'left'` \| `'center'` \| `'right'`.            |
| `logoSize`            | number       | 80       | Square, in px. Honor if logo is rendered.          |
| `logoGap`             | number       | 32       | Space (px) between logo and headline.              |
| `logoPosition`        | string       | `'top'`  | `'top'` \| `'left'`.                               |

## Satori constraints — read this before writing CSS

Templates are rendered by [Satori](https://github.com/vercel/satori), which
supports only a subset of CSS. Do **not** use:

- CSS grid — flexbox only. Every container needs `display: 'flex'`.
- `transform`, `filter`, `backdrop-filter`, `clipPath`, `mask`.
- `box-shadow` with spread radius (simple offset+blur is OK).
- Pseudo-elements (`::before`, `::after`).
- CSS custom properties (`--foo`).
- Any font other than `'Inter'` at weight 400 or 700.
- `<img>` without a base64 data URI source.

Safe to use: flex (row/column, wrap, align, justify), padding, margin,
`position: 'absolute'` + `top/right/bottom/left`, `backgroundImage` with
`linear-gradient(...)`, `borderRadius`, `border`, `opacity`, `letterSpacing`,
`lineHeight`, `textAlign`.

If you need an effect Satori can't do, emit inline SVG and set it as
`backgroundImage: 'url("data:image/svg+xml;base64,…")'` on a wrapping div.

## Registration

**None.** Drop the file in this directory (`metadata-templates/`). The
`metadata-gen` renderer auto-discovers every `layout-*.js` at startup and
assigns letters from the filename. No imports to add, no maps to edit.

The preview UI picks up the new letter on the next server restart
(`npx metadata-gen`).

## Scaffold

Copy this into a new `layout-<letter>.js` and modify the style:

```js
export function layoutD(config) {
  const {
    headline,
    tagline,
    colors,
    logoBase64,
    headingSize = 64,
    taglineSize = 26,
  } = config;

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: colors.background,
        padding: '60px 80px',
        fontFamily: 'Inter',
      },
      children: [
        logoBase64 && {
          type: 'img',
          props: {
            src: logoBase64,
            width: 96,
            height: 96,
            style: { marginBottom: '32px' },
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: headingSize,
              fontWeight: 700,
              color: colors.foreground,
              textAlign: 'center',
              lineHeight: 1.1,
            },
            children: headline,
          },
        },
        tagline && {
          type: 'div',
          props: {
            style: {
              fontSize: taglineSize,
              color: colors.tagline || colors.foreground,
              opacity: colors.tagline ? 1 : 0.7,
              marginTop: '20px',
              textAlign: 'center',
              lineHeight: 1.4,
            },
            children: tagline,
          },
        },
      ].filter(Boolean),
    },
  };
}
```

## Gotchas

- `generateCopyVariants` in `src/copy.js` returns 3 headline/tagline pairs.
  The 4th layout reuses variant 0, the 5th reuses variant 1, etc. If you want
  distinct copy for a new slot, extend that array too.
- Filename must match `^layout-[a-z]\.js$` exactly. Other files are ignored.
- Each file must export exactly one function. The first exported function is
  used.
