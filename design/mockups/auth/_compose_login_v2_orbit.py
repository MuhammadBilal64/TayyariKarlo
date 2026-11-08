"""Composite approved Orbit Gap mark onto login-v2 layout. Design-only; not app code."""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[3]
BASE = ROOT / "design/mockups/auth/login-v2.jpg"
OUT = ROOT / "design/mockups/auth/login-v2-orbit.jpg"
PREVIEW = ROOT / "design/mockups/auth/_orbit-preview.png"

SIGNAL = (27, 95, 86, 255)  # #1B5F56
SOFT = (27, 95, 86, 70)
INK = (15, 23, 42, 255)


def render_orbit(size: int, color=SIGNAL) -> Image.Image:
    """Match apps/web/public/brand/orbit-gap.svg geometry (viewBox 0..64)."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    s = size / 64.0
    cx, cy = 32 * s, 32 * s
    r = 22 * s
    sw = max(2, int(round(8 * s)))

    circ = 2 * math.pi * 22
    gap_deg = (25.7 / circ) * 360.0
    gap_center = 315.0  # upper-right diamond bearing (PIL CW from east)
    half = gap_deg / 2.0
    arc_start = gap_center + half
    arc_end = gap_center - half + 360.0

    bbox = [cx - r, cy - r, cx + r, cy + r]
    for i in range(3):
        inflate = i * 0.35
        bb = [bbox[0] - inflate, bbox[1] - inflate, bbox[2] + inflate, bbox[3] + inflate]
        draw.arc(bb, start=arc_start, end=arc_end, fill=color, width=sw)

    dcx, dcy = 50 * s, 14 * s
    half_side = (8.5 * s) / 2.0
    d = half_side * math.sqrt(2)
    diamond = [
        (dcx, dcy - d),
        (dcx + d, dcy),
        (dcx, dcy + d),
        (dcx - d, dcy),
    ]
    draw.polygon(diamond, fill=color)
    return img


def cover_ellipse(dst: Image.Image, cx: int, cy: int, rx: int, ry: int, color) -> None:
    mask = Image.new("L", dst.size, 0)
    ImageDraw.Draw(mask).ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=255)
    patch = Image.new("RGBA", dst.size, color)
    dst.paste(patch, (0, 0), mask)


def paste_center(dst: Image.Image, src: Image.Image, cx: float, cy: float) -> None:
    x = int(cx - src.width / 2)
    y = int(cy - src.height / 2)
    dst.alpha_composite(src, (x, y))


def main() -> None:
    base = Image.open(BASE).convert("RGBA")
    out = base.copy()

    # Sample steel background near left panel (avoid mark)
    bg_color = base.getpixel((60, 200))

    # Cover only the old decorative orbit (keep headline + features)
    cover_ellipse(out, cx=265, cy=165, rx=170, ry=130, color=bg_color)

    # Soft glow + approved Orbit Gap — sits above the headline
    glow = render_orbit(230, color=SOFT).filter(ImageFilter.GaussianBlur(22))
    paste_center(out, glow, 255, 155)
    paste_center(out, render_orbit(190, color=SIGNAL), 255, 155)

    # Replace header hexagon only (leave wordmark pixels)
    header_box = (48, 38, 48 + 42, 38 + 42)
    ImageDraw.Draw(out).rectangle(header_box, fill=bg_color)
    small = render_orbit(34, color=SIGNAL)
    out.alpha_composite(small, (52, 42))

    out.convert("RGB").save(OUT, quality=93)
    render_orbit(256).save(PREVIEW)
    print(f"saved {OUT}")


if __name__ == "__main__":
    main()
