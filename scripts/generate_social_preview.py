#!/usr/bin/env python3
"""Generate a raster social-preview image for Open Graph and Twitter Cards.

Production activation: initial PNG publication for the bilingual Market Intelligence release.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "gnk-asg-social-card.png"
W, H = 1200, 630

def font(size: int, bold: bool = False):
    choices = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    ]
    for path in choices:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def main() -> None:
    image = Image.new("RGB", (W, H), "#061326")
    draw = ImageDraw.Draw(image, "RGBA")
    for y in range(H):
        ratio = y / H
        draw.line((0, y, W, y), fill=(6 + int(4 * ratio), 19 + int(14 * ratio), 38 + int(31 * ratio), 255))
    for radius, alpha in ((290, 24), (220, 33), (145, 42)):
        draw.ellipse((930 - radius, 100 - radius, 930 + radius, 100 + radius), fill=(42, 126, 205, alpha))
    gold = "#d4af37"
    pale_gold = "#f4d77e"
    white = "#ffffff"
    muted = "#b8c9db"
    draw.rounded_rectangle((72, 62, 164, 154), radius=16, fill="#07162d", outline=gold, width=2)
    draw.text((92, 91), "ASG", font=font(27, True), fill=pale_gold)
    draw.text((72, 228), "GNK ASG d.o.o.", font=font(18, True), fill=gold, spacing=3)
    draw.text((72, 290), "Corporate Technology", font=font(51, True), fill=white)
    draw.text((72, 352), "& Finance Portal", font=font(51, True), fill=white)
    draw.text((74, 432), "Technology  •  Artificial Intelligence  •  Finance  •  Governance", font=font(20), fill=muted)
    draw.line((74, 487, 590, 487), fill=gold, width=2)
    draw.text((74, 515), "Zagreb, Croatia  |  Market Intelligence & 3D Network", font=font(17), fill="#9bb2c9")
    points = [(810, 152), (1027, 200), (1111, 315), (914, 380), (778, 291)]
    for a, b in zip(points, points[1:] + points[:1]):
        draw.line((*a, *b), fill=(118, 199, 255, 70), width=2)
    for x, y in points:
        draw.ellipse((x - 6, y - 6, x + 6, y + 6), fill=(118, 199, 255, 170))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    image.save(OUT, format="PNG", optimize=True)
    print(f"Generated {OUT.relative_to(ROOT)} ({W}x{H}).")

if __name__ == "__main__":
    main()
