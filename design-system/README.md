# FamilyHub Design System — "Đỏ son sơn mài" (lacquer red)

**Proposition.** Like a family altar: a black-lacquer band with gold leaf and a turning bronze drum,
and a tear-off calendar sheet in đỏ son on dó paper, so the lunar days that matter are seen first.

- Reference guideline: **Material** token model + **MUI** component catalogue (React Native targets both platforms).
- Đỏ son `#9B1B1E` leads every action. Black lacquer `#1F110D → #2E1712` is the one expressive band per screen and marks solemn days (ngày giỗ). Gold leaf `#B8862B` / `#E0B552` draws lines and rings, never small text on paper.
- Reading face **Be Vietnam Pro** (full Vietnamese diacritics), display face **Playfair Display** for h1–h3, the tear-off day and proverbs.
- Signature pieces: tờ lịch bóc (tear-off sheet), live 3D trống đồng (`drum3d.js`, three.js), hồi văn fret, synthesized sounds (trống, mõ, chuông; off by default).
- Every text/background pair is WCAG-checked by formula (body ≥ 4.5:1). Motion rests under "Reduce motion".

## Files

| File | What |
|---|---|
| `styles.css` | Tokens (`:root`) + every component class. Single source of styles. |
| `index.html` | Living style guide: foundations, all components, Dev Mode inspector, Copy as prompt. |
| `concept.html` | Two concept screens (Trang chủ with the tear-off sheet + Lịch tháng) built only from the components. |
| `icons.html` | Icon sprite (Lucide-style) + Vietnamese motifs: mây lành, trống đồng, hoa sen, hoa mai, hồi văn. |
| `drum3d.js` + `vendor/three/` | Procedural 3D bronze drum (three.js r187, MIT). Needs http, not file://. |
| `sounds/` + `tools/synth_sounds.py` | Synthesized UI sounds (trống, mõ, chuông). Re-run the script to regenerate. |
| `tools/build-figma.mjs` | Builds Figma-importable HTML (inlined CSS, expanded icons, frozen motion). |
| `tools/inject-sprite.mjs` | Copies the sprite from `icons.html` into the other pages. |

Serve this folder and open it: `python -m http.server 5500`, then http://localhost:5500/ (the 3D drum needs http; everything else also works from file://).

## Extending

- **Add a token:** add the CSS variable to the right group in `:root`; reference it by name. Check
  any new text/background pair with the WCAG formula (body ≥ 4.5:1, borders/icons ≥ 3:1).
- **Add a component:** a class block in `styles.css` using tokens only, a `<section id="key">` in
  `index.html`, and a `SPECS.key` entry (Dev Mode + Copy as prompt pick it up automatically).
- **Add an icon:** a `<symbol id="i-…">` in `icons.html` in the same rounded outline style, then run
  `node tools/inject-sprite.mjs`. Never use emoji for UI.
- **Dark theme:** add a `:root[data-theme="dark"]` block overriding color tokens only.

## Mapping to React Native

`styles.css` tokens → `mobile/src/shared/theme/*.ts`; each component → one file in
`mobile/src/shared/ui/` (paths are listed in each `SPECS` entry). Motion uses Reanimated 4
(`useReducedMotion`), swipe gestures use Gesture Handler, gradients and motifs use `react-native-svg`.
