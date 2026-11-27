"""Generates FamilyHub's material textures procedurally (seamless tiles, no stock imagery).

  do-paper.jpg  - giấy dó: ivory mulberry paper with mottling and long bark fibres
  lacquer.jpg   - sơn then: black-brown lacquer with a red undertone, polish grain and gold-leaf flecks (ngày giỗ)
  lacquer-warm.jpg - warm red-brown lacquer, the default band for ordinary and festive days

Writes to mobile/src/assets/textures/ and design-system/textures/.
Usage: python design-system/tools/textures.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
OUTS = [ROOT / "mobile" / "src" / "assets" / "textures", ROOT / "design-system" / "textures"]
N = 512
rng = np.random.default_rng(26)


def periodic_noise(scale):
    """Seamless noise: white noise low-pass filtered in frequency space (wraps at the edges)."""
    white = rng.standard_normal((N, N))
    fy = np.fft.fftfreq(N)[:, None]
    fx = np.fft.fftfreq(N)[None, :]
    radius = np.sqrt(fx * fx + fy * fy)
    filt = np.exp(-((radius * scale) ** 2))
    out = np.real(np.fft.ifft2(np.fft.fft2(white) * filt))
    return out / (np.abs(out).max() + 1e-9)


def wrap_line(draw, pts, fill, width):
    """Draw a polyline at the 9 tiled offsets so strokes crossing an edge continue on the other side."""
    for ox in (-N, 0, N):
        for oy in (-N, 0, N):
            draw.line([(x + ox, y + oy) for x, y in pts], fill=fill, width=width)


def do_paper():
    base = np.array([247, 240, 227], dtype=float)
    mott = periodic_noise(18) * 7 + periodic_noise(60) * 3
    grain = rng.standard_normal((N, N)) * 1.6
    img = base[None, None, :] + (mott + grain)[:, :, None] * np.array([1.0, 0.95, 0.85])
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), "RGB").convert("RGBA")

    fibres = Image.new("RGBA", (N, N), (0, 0, 0, 0))
    d = ImageDraw.Draw(fibres)
    for _ in range(520):
        x, y = rng.uniform(0, N, 2)
        ang = rng.uniform(0, np.pi)
        length = rng.uniform(18, 90)
        bend = rng.uniform(-0.6, 0.6)
        pts = []
        for t in np.linspace(0, 1, 8):
            a = ang + bend * t
            pts.append((x + np.cos(a) * length * t, y + np.sin(a) * length * t))
        light = rng.random() < 0.45
        col = (255, 252, 244, int(rng.uniform(40, 80))) if light else (160, 138, 104, int(rng.uniform(18, 40)))
        wrap_line(d, pts, col, 1)
    for _ in range(40):  # bark inclusions
        x, y = rng.uniform(0, N, 2)
        r = rng.uniform(0.6, 1.6)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(120, 96, 66, int(rng.uniform(60, 120))))
    fibres = fibres.filter(ImageFilter.GaussianBlur(0.35))
    return Image.alpha_composite(im, fibres).convert("RGB")


def lacquer(base=(30, 16, 12), warmth=(16, 4, 2)):
    base = np.array(base, dtype=float)
    depth = periodic_noise(10)
    warm = np.clip(periodic_noise(24), 0, None)  # red-brown pools where the top coat is thinner
    img = base[None, None, :] + depth[:, :, None] * np.array([5, 3, 2]) + warm[:, :, None] * np.array(warmth)
    img += rng.standard_normal((N, N, 1)) * 0.9  # polish grain
    # faint horizontal sanding streaks (sơn mài is polished by hand)
    streak = periodic_noise(4)[:, :1] * np.ones((1, N))
    img += (np.abs(streak) ** 3)[:, :, None] * np.array([6, 4, 3])
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), "RGB").convert("RGBA")

    leaf = Image.new("RGBA", (N, N), (0, 0, 0, 0))
    d = ImageDraw.Draw(leaf)
    for i in range(70):
        cx, cy = rng.uniform(0, N, 2)
        big = i < 8
        r = rng.uniform(3, 7) if big else rng.uniform(0.6, 2.2)
        k = rng.integers(4, 7)
        angles = np.sort(rng.uniform(0, 2 * np.pi, k))
        pts = [(cx + np.cos(a) * r * rng.uniform(0.5, 1.1), cy + np.sin(a) * r * rng.uniform(0.5, 1.1)) for a in angles]
        g = rng.uniform(0.75, 1.0)
        col = (int(214 * g), int(170 * g), int(84 * g), int(rng.uniform(70, 150) if big else rng.uniform(90, 200)))
        for ox in (-N, 0, N):
            for oy in (-N, 0, N):
                d.polygon([(x + ox, y + oy) for x, y in pts], fill=col)
    leaf = leaf.filter(ImageFilter.GaussianBlur(0.4))
    return Image.alpha_composite(im, leaf).convert("RGB")


if __name__ == "__main__":
    paper, lac = do_paper(), lacquer()
    # warm son-then lacquer: the default band (festive days); the black one is kept for ngày giỗ
    warm = lacquer(base=(88, 22, 16), warmth=(34, 6, 2))
    for out in OUTS:
        out.mkdir(parents=True, exist_ok=True)
        paper.save(out / "do-paper.jpg", quality=90)
        lac.save(out / "lacquer.jpg", quality=92)
        warm.save(out / "lacquer-warm.jpg", quality=92)
        print(f"wrote {out.relative_to(ROOT)}/do-paper.jpg, lacquer.jpg, lacquer-warm.jpg")
