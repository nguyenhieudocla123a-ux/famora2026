// Copies the icon/motif sprite from icons.html into index.html and concept.html so every page
// is self-contained under file://. Edit icons only in icons.html, then run:
//   node design-system/tools/inject-sprite.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const START = '<!--SPRITE:START-->';
const END = '<!--SPRITE:END-->';

const icons = readFileSync(join(root, 'icons.html'), 'utf8');
const sprite = icons.slice(icons.indexOf(START), icons.indexOf(END) + END.length);
if (!sprite.startsWith(START)) {
  throw new Error('Sprite markers not found in icons.html');
}

for (const page of ['index.html', 'concept.html']) {
  const file = join(root, page);
  let html = readFileSync(file, 'utf8');
  if (html.includes(START)) {
    html = html.slice(0, html.indexOf(START)) + sprite + html.slice(html.indexOf(END) + END.length);
  } else if (html.includes('<!--SPRITE-->')) {
    html = html.replace('<!--SPRITE-->', sprite);
  } else {
    throw new Error(`No sprite placeholder in ${page}`);
  }
  writeFileSync(file, html);
  console.log(`sprite injected into ${page}`);
}
