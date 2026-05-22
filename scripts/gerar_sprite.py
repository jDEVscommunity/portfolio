"""Gera sprite SVG inline a partir de static/img/tech/*.svg."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TECH_DIR = ROOT / "static" / "img" / "tech"
OUTPUT = ROOT / "templates" / "partials" / "tech_sprite.html"

SVG_TAG_RE = re.compile(r"<svg\b([^>]*)>(.*)</svg>\s*$", re.IGNORECASE | re.DOTALL)
VIEWBOX_RE = re.compile(r"""viewBox=["']([^"']+)["']""", re.IGNORECASE)
STRIP_RE = re.compile(
    r"<title>.*?</title>|<desc>.*?</desc>",
    re.IGNORECASE | re.DOTALL,
)


def parse_svg(path: Path) -> tuple[str, str]:
    text = path.read_text(encoding="utf-8").strip()
    match = SVG_TAG_RE.search(text)
    if not match:
        raise ValueError(f"SVG inválido (sem tag <svg>): {path}")

    attrs, inner = match.group(1), match.group(2)
    viewbox_match = VIEWBOX_RE.search(attrs)
    viewbox = viewbox_match.group(1) if viewbox_match else "0 0 24 24"
    inner = STRIP_RE.sub("", inner).strip()
    return viewbox, inner


def main() -> None:
    if not TECH_DIR.is_dir():
        raise SystemExit(f"Diretório não encontrado: {TECH_DIR}")

    symbols: list[str] = []
    for path in sorted(TECH_DIR.glob("*.svg")):
        viewbox, inner = parse_svg(path)
        slug = path.stem
        symbols.append(f'  <symbol id="tech-{slug}" viewBox="{viewbox}">{inner}</symbol>')

    linhas = [
        "{# Gerado por scripts/gerar_sprite.py — não editar à mão #}",
        '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" '
        'style="position:absolute;width:0;height:0;overflow:hidden">',
        *symbols,
        "</svg>",
    ]

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text("\n".join(linhas) + "\n", encoding="utf-8")
    print(f"Sprite gerado com {len(symbols)} simbolos -> {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
