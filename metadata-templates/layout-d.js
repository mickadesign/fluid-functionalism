import { readFileSync } from 'node:fs';

// Layout D shows the OG image built in code at /og (exported by
// `npm run og`), so the preview's social mockups show the real card.
// Preview only: save the image with `npm run og`, not from metadata-gen,
// which would re-render it at 1x.
const png = readFileSync(new URL('../public/metadata/og.png', import.meta.url));
const src = `data:image/png;base64,${png.toString('base64')}`;

export function layoutD() {
  return {
    type: 'div',
    props: {
      style: { display: 'flex', width: '100%', height: '100%' },
      children: [{ type: 'img', props: { src, width: 1200, height: 630 } }],
    },
  };
}
