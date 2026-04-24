import { generateFaviconSet } from '/Users/micka/Documents/GitHub/Metadata images/src/favicon.js';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const config = {
  title: 'Fluid Functionalism',
  faviconLetter: 'FF',
  faviconTransparent: true,
  faviconLetterSize: 50,
  faviconBorderRadius: 19,
  colors: {
    background: '#FAFAFA',
    foreground: '#171717',
    accent: '#424242',
  },
  outputDir: 'public/metadata',
  faviconDarkBg: '#000000',
  faviconDarkAccent: '#b3b3b3',
};

await generateFaviconSet(config, process.cwd());

// Overwrite SVG with a transparent-bg, light/dark adaptive lettermark
// (the upstream generator always renders an opaque <rect> background)
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <style>
    text { fill: #424242; }
    @media (prefers-color-scheme: dark) {
      text { fill: #b3b3b3; }
    }
  </style>
  <text x="16" y="22" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700">FF</text>
</svg>`;

await writeFile(join(process.cwd(), 'public/metadata/favicon.svg'), svg);
console.log('Favicons regenerated with transparent bg + dual-mode colors.');
