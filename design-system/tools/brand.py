"""Famora brand assets, generated from one definition.

Mark: a roof and walls in terracotta sheltering a sunshine-yellow heart ("mái ấm").
Wordmark: "Famora" in Playfair Display SemiBold, converted to outlines (no font needed to view it).

Outputs
  design-system/brand/famora-mark.svg         the mark alone (48x48 grid)
  design-system/brand/famora-logo.svg         mark + wordmark, horizontal
  design-system/brand/famora-logo-stacked.svg mark above wordmark
  design-system/brand/famora-icon-1024.png    app-store style icon preview
  mobile/android/app/src/main/res/mipmap-*/ic_launcher(.png|_round.png)
  mobile/src/shared/ui/brand/paths.ts          the same geometry for react-native-svg

Usage: python design-system/tools/brand.py
"""
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
BRAND = ROOT / "design-system" / "brand"
FONT = ROOT / "mobile" / "src" / "assets" / "fonts" / "PlayfairDisplay_600SemiBold.ttf"

TERRACOTTA = "#B5452B"
SUNSHINE = "#F2A541"
CHOCOLATE = "#3B2622"
CREAM = "#FFF8F1"

# ---- mark geometry on a 48x48 grid -------------------------------------------------------
ROOF = [(6, 22), (24, 7), (42, 22)]
WALLS = [(12, 21), (12, 38), (15, 41), (33, 41), (36, 38), (36, 21)]
STROKE = 4.5
HEART = "M24 36.5C16.6 31.6 14.4 27.6 16.9 24.6C19 22.1 22.4 22.8 24 25.4C25.6 22.8 29 22.1 31.1 24.6C33.6 27.6 31.4 31.6 24 36.5Z"


def mark_svg_elements():
    roof = "M" + " L".join(f"{x} {y}" for x, y in ROOF)
    walls = "M12 21V38a3 3 0 0 0 3 3H33a3 3 0 0 0 3-3V21"
    return roof, walls


def wordmark_path(height=30.0):
    """Outline 'Famora' and return (svg path d, width) scaled to the given cap-ish height."""
    font = TTFont(str(FONT))
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    upm = font["head"].unitsPerEm
    scale = height / (upm * 0.72)  # ~cap height
    pen = SVGPathPen(gs)
    x = 0.0
    for ch in "Famora":
        glyph = gs[cmap[ord(ch)]]
        # flip y (font units are y-up) and place on a baseline at y = height
        glyph.draw(TransformPen(pen, (scale, 0, 0, -scale, x * scale, height)))
        x += glyph.width
    bp = BoundsPen(gs)
    return pen.getCommands(), x * scale


def write_svgs():
    BRAND.mkdir(parents=True, exist_ok=True)
    roof, walls = mark_svg_elements()
    mark = (
        f'<path d="{roof}" fill="none" stroke="{TERRACOTTA}" stroke-width="{STROKE}" stroke-linecap="round" stroke-linejoin="round"/>'
        f'<path d="{walls}" fill="none" stroke="{TERRACOTTA}" stroke-width="{STROKE}" stroke-linecap="round" stroke-linejoin="round"/>'
        f'<path d="{HEART}" fill="{SUNSHINE}"/>'
    )
    (BRAND / "famora-mark.svg").write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="96" height="96"><title>Famora</title>{mark}</svg>\n', encoding="utf8"
    )
    word, w = wordmark_path(30)
    (BRAND / "famora-logo.svg").write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {58 + w:.1f} 48" height="96"><title>Famora</title>'
        f'<g>{mark}</g><path transform="translate(56 6)" d="{word}" fill="{CHOCOLATE}"/></svg>\n',
        encoding="utf8",
    )
    word2, w2 = wordmark_path(22)
    width = max(48, w2) + 8
    (BRAND / "famora-logo-stacked.svg").write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:.1f} 84" height="168"><title>Famora</title>'
        f'<g transform="translate({(width - 48) / 2:.1f} 0)">{mark}</g>'
        f'<path transform="translate({(width - w2) / 2:.1f} 54)" d="{word2}" fill="{CHOCOLATE}"/></svg>\n',
        encoding="utf8",
    )
    return word, w


def cubic(p0, p1, p2, p3, n=24):
    out = []
    for i in range(n + 1):
        t = i / n
        mt = 1 - t
        out.append(
            (
                mt**3 * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t**3 * p3[0],
                mt**3 * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t**3 * p3[1],
            )
        )
    return out


def heart_polygon():
    p = [(24, 36.5)]
    p += cubic((24, 36.5), (16.6, 31.6), (14.4, 27.6), (16.9, 24.6))[1:]
    p += cubic((16.9, 24.6), (19, 22.1), (22.4, 22.8), (24, 25.4))[1:]
    p += cubic((24, 25.4), (25.6, 22.8), (29, 22.1), (31.1, 24.6))[1:]
    p += cubic((31.1, 24.6), (33.6, 27.6), (31.4, 31.6), (24, 36.5))[1:]
    return p


def draw_icon(size, round_shape):
    """Supersampled raster icon: cream tile, mark centred at ~62% of the tile."""
    ss = 4
    big = size * ss
    im = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if round_shape:
        d.ellipse([0, 0, big - 1, big - 1], fill=CREAM)
    else:
        d.rounded_rectangle([0, 0, big - 1, big - 1], radius=int(big * 0.22), fill=CREAM)
    k = big * 0.62 / 48
    ox = (big - 48 * k) / 2
    oy = (big - 48 * k) / 2 + big * 0.01
    tf = lambda pts: [(ox + x * k, oy + y * k) for x, y in pts]
    w = int(STROKE * k)
    for line in (ROOF, [(12, 21), (12, 41), (36, 41), (36, 21)]):
        pts = tf(line)
        d.line(pts, fill=TERRACOTTA, width=w, joint="curve")
        for x, y in (pts[0], pts[-1]):
            d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=TERRACOTTA)
    d.polygon(tf(heart_polygon()), fill=SUNSHINE)
    return im.resize((size, size), Image.LANCZOS)


def write_icons():
    sizes = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
    res = ROOT / "mobile" / "android" / "app" / "src" / "main" / "res"
    for density, px in sizes.items():
        folder = res / f"mipmap-{density}"
        folder.mkdir(parents=True, exist_ok=True)
        draw_icon(px, False).save(folder / "ic_launcher.png")
        draw_icon(px, True).save(folder / "ic_launcher_round.png")
    draw_icon(1024, False).save(BRAND / "famora-icon-1024.png")


def write_rn_paths(word, width):
    roof, walls = mark_svg_elements()
    out = ROOT / "mobile" / "src" / "shared" / "ui" / "brand" / "paths.ts"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(
        "// Generated by design-system/tools/brand.py — do not edit by hand.\n"
        f"export const MARK_ROOF = '{roof}';\n"
        f"export const MARK_WALLS = 'M12 21V38a3 3 0 0 0 3 3H33a3 3 0 0 0 3-3V21';\n"
        f"export const MARK_HEART = '{HEART}';\n"
        f"export const MARK_STROKE = {STROKE};\n"
        "/** 'Famora' in Playfair Display SemiBold, outlined; 30 units tall on its baseline. */\n"
        f"export const WORDMARK = '{word}';\n"
        f"export const WORDMARK_WIDTH = {width:.2f};\n"
        "export const WORDMARK_HEIGHT = 38;\n",
        encoding="utf8",
    )


if __name__ == "__main__":
    word, width = write_svgs()
    write_icons()
    write_rn_paths(word, width)
    print("brand assets written; wordmark width", round(width, 1))
