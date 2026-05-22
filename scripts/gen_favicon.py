"""Generate favicon, PWA, OG, and theme icon assets from logo sources."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "static" / "img"
SQUARE_SOURCES = {
    "light": OUT / "favicon-square-light.png",
    "dark": OUT / "favicon-square-dark.png",
}
LOGO_FOR_OG = OUT / "logo-dark.png"
OG_SIZE = (1200, 630)
SAFE_MARGIN = 0.10
THEME_COLORS = {"light": "#ffffff", "dark": "#000000"}


def fit_square(source: Image.Image, size: int, background: tuple[int, ...] | None = None) -> Image.Image:
    """Scale source into a square canvas with safe margins."""
    src = source.convert("RGBA")
    margin = max(1, round(size * SAFE_MARGIN))
    inner = size - 2 * margin
    fitted = src.resize((inner, inner), Image.Resampling.LANCZOS)
    if background is None:
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    else:
        canvas = Image.new("RGBA", (size, size), background)
    canvas.paste(fitted, (margin, margin), fitted)
    return canvas


def write_favicon_sizes(theme: str, source: Image.Image) -> None:
    sizes = {
        16: "favicon-16x16.png" if theme == "light" else "favicon-dark-16.png",
        32: "favicon-32x32.png" if theme == "light" else "favicon-dark-32.png",
        180: "apple-touch-icon.png" if theme == "light" else "apple-touch-icon-dark.png",
    }
    bg = None if theme == "light" else (0, 0, 0, 255)
    icons_ico: list[Image.Image] = []
    for px, name in sizes.items():
        img = fit_square(source, px, background=bg)
        img.save(OUT / name, optimize=True)
        if px in (16, 32):
            icons_ico.append(img)

    ico_name = "favicon.ico" if theme == "light" else "favicon-dark.ico"
    icons_ico[0].save(OUT / ico_name, format="ICO", sizes=[(16, 16), (32, 32)])
    if theme == "light":
        icons_ico[0].save(ROOT / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32)])


def write_og_image() -> None:
    logo_path = LOGO_FOR_OG
    if not logo_path.is_file():
        raise SystemExit(f"Missing logo for OG image: {logo_path}")

    logo = Image.open(logo_path).convert("RGBA")
    canvas = Image.new("RGB", OG_SIZE, (255, 255, 255))
    margin_x = int(OG_SIZE[0] * SAFE_MARGIN)
    margin_y = int(OG_SIZE[1] * SAFE_MARGIN)
    max_w = OG_SIZE[0] - 2 * margin_x
    max_h = OG_SIZE[1] - 2 * margin_y
    scale = min(max_w / logo.width, max_h / logo.height)
    new_size = (max(1, int(logo.width * scale)), max(1, int(logo.height * scale)))
    resized = logo.resize(new_size, Image.Resampling.LANCZOS)
    x = (OG_SIZE[0] - new_size[0]) // 2
    y = (OG_SIZE[1] - new_size[1]) // 2
    canvas.paste(resized, (x, y), resized)
    canvas.save(OUT / "og-image.png", optimize=True)


def write_webmanifest() -> None:
    manifest = """{
  "name": "jDEVs",
  "short_name": "jDEVs",
  "icons": [
    {
      "src": "/static/img/favicon-32x32.png",
      "sizes": "32x32",
      "type": "image/png"
    },
    {
      "src": "/static/img/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png",
      "purpose": "any"
    }
  ],
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "display": "standalone"
}
"""
    (OUT / "site.webmanifest").write_text(manifest, encoding="utf-8")


def main() -> None:
    for theme, path in SQUARE_SOURCES.items():
        if not path.is_file():
            raise SystemExit(f"Missing source: {path}")
        write_favicon_sizes(theme, Image.open(path))

    write_og_image()
    write_webmanifest()
    print("Generated favicons, og-image.png, site.webmanifest, and root favicon.ico")


if __name__ == "__main__":
    main()
