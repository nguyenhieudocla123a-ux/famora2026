// Builds self-contained HTML for Figma's html_to_figma importer:
//  - styles.css inlined, animations frozen at their end state
//  - every <use href="#id"> expanded into the symbol's own geometry
//  - the hồi văn pattern fill replaced by plain paths
//  - scripts and page chrome (back link, replay button, sprite) removed
// Usage: node design-system/tools/build-figma.mjs <input.html> <output.html>
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [input, output] = process.argv.slice(2);
if (!input || !output) {
  throw new Error('usage: build-figma.mjs <input.html> <output.html>');
}

const css = readFileSync(join(root, 'styles.css'), 'utf8');
const iconsHtml = readFileSync(join(root, 'icons.html'), 'utf8');

const symbols = new Map();
for (const m of iconsHtml.matchAll(/<symbol id="([^"]+)" viewBox="([^"]+)">([\s\S]*?)<\/symbol>/g)) {
  symbols.set(m[1], { viewBox: m[2], inner: m[3] });
}

const fretUnit = (x) =>
  `<path d="M${x} 9H${x + 5}V1H${x + 17}V7H${x + 9}V4H${x + 13}M${x + 17} 9H${x + 24}" fill="none" stroke="currentColor" stroke-width="1.4"/>`;
const fret = `<svg class="fret" viewBox="0 0 480 10" preserveAspectRatio="xMinYMid slice">${Array.from(
  { length: 20 },
  (_, i) => fretUnit(i * 24),
).join('')}</svg>`;

let html = readFileSync(input, 'utf8');
html = html.replace(/<!--SPRITE:START-->[\s\S]*?<!--SPRITE:END-->/, '');
html = html.replace(/<script[\s\S]*?<\/script>/g, '');
html = html.replace(/<div class="topright">[\s\S]*?<\/div>/, '');
html = html.replace(/<a class="backlink"[\s\S]*?<\/a>/, '');
html = html.replace(/<nav class="side">[\s\S]*?<\/nav>/, '');
html = html.replace(/<button class="btn btn-tonal btn-sm replay"[\s\S]*?<\/button>/, '');
html = html.replace(/<div id="topctl">[\s\S]*?<\/div>\s*<aside id="inspector">[\s\S]*?<\/aside>/, '');
html = html.replace(/<button class="sec-prompt"[^>]*>[^<]*<\/button>/g, '');
html = html.replace(
  '<link rel="stylesheet" href="styles.css">',
  `<style>${css}\n*,*::before,*::after{animation:none!important;transition:none!important}.petals{display:none}</style>`,
);
html = html.replace(/<svg class="fret"><rect[^>]*?(?:\/>|><\/rect>)<\/svg>/g, fret);
html = html.replace(/<svg([^>]*)><use href="#([^"]+)"(?:\/>|><\/use>)<\/svg>/g, (whole, attrs, id) => {
  const s = symbols.get(id);
  if (!s) {
    throw new Error(`Unknown symbol #${id}`);
  }
  return `<svg${attrs} viewBox="${s.viewBox}">${s.inner}</svg>`;
});
// the live WebGL drum cannot be captured: swap each slot for a still render (figma/drum.png)
const drumPng = join(root, 'figma', 'drum.png');
if (existsSync(drumPng)) {
  const src = `data:image/png;base64,${readFileSync(drumPng).toString('base64')}`;
  html = html.replace(/(<div class="drum3d[^"]*"[^>]*>)[\s\S]*?<canvas[^>]*><\/canvas><\/div>/g, `$1<img src="${src}" alt="" style="width:100%;height:100%;object-fit:contain"></div>`);
}
if (html.includes('<use href=')) {
  throw new Error('Some <use> references were not expanded');
}

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, html);
console.log(`wrote ${output} (${Math.round(html.length / 1024)} KB, ${symbols.size} symbols known)`);
