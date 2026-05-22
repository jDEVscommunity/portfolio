"""Generate theme-aware favicon assets from squared logo sources."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "static" / "img"
SOURCES = {
    "light": OUT / "favicon-square-light.png",
    "dark": OUT / "favicon-square-dark.png",
}


def write_sizes(theme: str, img: Image.Image) -> None:
    for size in (16, 32, 180):
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        if size == 180:
            name = f"apple-touch-icon-{theme}.png"
        else:
            name = f"favicon-{theme}-{size}.png"
        resized.save(OUT / name, optimize=True)

    icons = [img.resize((s, s), Image.Resampling.LANCZOS) for s in (16, 32)]
    icons[0].save(OUT / f"favicon-{theme}.ico", format="ICO", sizes=[(16, 16), (32, 32)])


def main() -> None:
    for theme, path in SOURCES.items():
        if not path.is_file():
            raise SystemExit(f"Missing source: {path}")
        write_sizes(theme, Image.open(path).convert("RGBA"))


if __name__ == "__main__":
    main()
