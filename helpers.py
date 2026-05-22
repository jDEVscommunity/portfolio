"""Helpers de dados e utilitários compartilhados (fora das rotas)."""

import json
from datetime import datetime
from pathlib import Path

from flask import current_app, url_for

DATA_DIR = Path(__file__).parent / "data"

ROBOTS_TXT = """User-agent: *
Allow: /

Disallow: /static/

Sitemap: {{ sitemap_url }}
"""

SITEMAP_XML = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{%- for entry in entries %}
  <url>
    <loc>{{ entry.loc }}</loc>
    <lastmod>{{ entry.lastmod }}</lastmod>
    <changefreq>{{ entry.changefreq }}</changefreq>
    <priority>{{ entry.priority }}</priority>
  </url>
{%- endfor %}
</urlset>
"""


def carregar_json(arquivo: str) -> list | dict:
    """Carrega um arquivo JSON da pasta data/."""
    caminho = DATA_DIR / arquivo
    with open(caminho, encoding="utf-8") as f:
        return json.load(f)


def buscar_projeto(slug: str) -> dict | None:
    """Retorna um projeto pelo slug ou None."""
    projetos = carregar_json("projetos.json")
    return next((p for p in projetos if p.get("slug") == slug), None)


def data_lastmod(arquivo: str = "projetos.json") -> str:
    """Data ISO (YYYY-MM-DD) para lastmod do sitemap, a partir do mtime do JSON."""
    caminho = DATA_DIR / arquivo
    mtime = datetime.fromtimestamp(caminho.stat().st_mtime)
    return mtime.strftime("%Y-%m-%d")


def tecnologias_com_logo() -> list[dict]:
    """Tecnologias da landing que possuem SVG em static/img/tech/."""
    tech_dir = Path(current_app.root_path) / "static" / "img" / "tech"
    todas = carregar_json("landing_tecnologias.json")
    return [
        t
        for t in todas
        if (tech_dir / f"{t.get('slug', '')}.svg").is_file()
    ]


def sitemap_entries() -> list[dict]:
    lastmod = data_lastmod()
    static_pages = (
        ("main.index", {}, "weekly", "1.0"),
        ("projetos.projetos", {}, "weekly", "0.9"),
        ("main.equipe", {}, "monthly", "0.8"),
        ("contato.contato", {}, "monthly", "0.8"),
    )
    entries = [
        {
            "loc": url_for(endpoint, _external=True, **values),
            "lastmod": lastmod,
            "changefreq": changefreq,
            "priority": priority,
        }
        for endpoint, values, changefreq, priority in static_pages
    ]
    for projeto in carregar_json("projetos.json"):
        slug = projeto.get("slug")
        if not slug:
            continue
        entries.append(
            {
                "loc": url_for("projetos.projeto_detalhe", slug=slug, _external=True),
                "lastmod": lastmod,
                "changefreq": "monthly",
                "priority": "0.7",
            }
        )
    return entries
