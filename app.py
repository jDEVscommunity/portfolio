"""
jDEVs Portfolio — entry point Flask.
Rotas renderizam templates Jinja2; dados vêm de JSONs em /data.
"""

import json
import logging
from datetime import datetime
from pathlib import Path

from flask import (
    Flask,
    abort,
    flash,
    jsonify,
    make_response,
    redirect,
    render_template,
    render_template_string,
    request,
    send_from_directory,
    url_for,
)
from flask_mail import Mail, Message

from config import Config
from forms import ContatoForm, sanitize_contato_form

app = Flask(__name__)
app.config.from_object(Config)

mail = Mail(app)

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent / "data"

# Diretivas alinhadas ao que o site carrega hoje (fonts Google, static local, data: em CSS).
# script-src 'self' reporta o bloco inline de tema em base.html até migrar para nonce/arquivo.
_CSP_DIRECTIVES = (
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "font-src 'self' fonts.gstatic.com",
    "img-src 'self' data:",
    "script-src 'self'",
    "frame-ancestors 'none'",
)


def _build_csp_header() -> str:
    parts = list(_CSP_DIRECTIVES)
    report_uri = app.config.get("CSP_REPORT_URI")
    if report_uri:
        parts.append(f"report-uri {report_uri}")
    return "; ".join(parts)


@app.context_processor
def inject_globals():
    base = request.url_root.rstrip("/") if request else ""
    return {
        "current_year": datetime.now().year,
        "site_base_url": base,
    }


@app.after_request
def set_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=()"
    csp = _build_csp_header()
    if app.config.get("CSP_ENFORCE"):
        response.headers["Content-Security-Policy"] = csp
    else:
        response.headers["Content-Security-Policy-Report-Only"] = csp
    return response


@app.route("/csp-report", methods=["POST"])
def csp_report():
    """Recebe violações enviadas pelo navegador (report-uri / report-to)."""
    payload = request.get_json(silent=True)
    if payload is None and request.data:
        try:
            payload = json.loads(request.data)
        except json.JSONDecodeError:
            payload = {"raw": request.data.decode("utf-8", errors="replace")}
    logger.warning("CSP violation: %s", payload)
    return "", 204


@app.route("/favicon.ico")
def favicon():
    return send_from_directory(app.root_path, "favicon.ico", mimetype="image/vnd.microsoft.icon")


def carregar_json(arquivo: str) -> list | dict:
    """Carrega um arquivo JSON da pasta data/."""
    caminho = DATA_DIR / arquivo
    with open(caminho, encoding="utf-8") as f:
        return json.load(f)


def _data_lastmod(arquivo: str = "projetos.json") -> str:
    """Data ISO (YYYY-MM-DD) para lastmod do sitemap, a partir do mtime do JSON."""
    caminho = DATA_DIR / arquivo
    mtime = datetime.fromtimestamp(caminho.stat().st_mtime)
    return mtime.strftime("%Y-%m-%d")


_ROBOTS_TXT = """User-agent: *
Allow: /

Disallow: /static/

Sitemap: {{ sitemap_url }}
"""

_SITEMAP_XML = """<?xml version="1.0" encoding="UTF-8"?>
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


def _sitemap_entries() -> list[dict]:
    lastmod = _data_lastmod()
    static_pages = (
        ("index", {}, "weekly", "1.0"),
        ("projetos", {}, "weekly", "0.9"),
        ("equipe", {}, "monthly", "0.8"),
        ("contato", {}, "monthly", "0.8"),
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
                "loc": url_for("projeto_detalhe", slug=slug, _external=True),
                "lastmod": lastmod,
                "changefreq": "monthly",
                "priority": "0.7",
            }
        )
    return entries


@app.route("/robots.txt")
def robots_txt():
    body = render_template_string(
        _ROBOTS_TXT,
        sitemap_url=url_for("sitemap_xml", _external=True),
    )
    return make_response(body, 200, {"Content-Type": "text/plain; charset=utf-8"})


@app.route("/sitemap.xml")
def sitemap_xml():
    body = render_template_string(_SITEMAP_XML, entries=_sitemap_entries())
    return make_response(body, 200, {"Content-Type": "application/xml; charset=utf-8"})


@app.errorhandler(404)
def pagina_nao_encontrada(_error):
    return render_template("404.html"), 404


def buscar_projeto(slug: str) -> dict | None:
    """Retorna um projeto pelo slug ou None."""
    projetos = carregar_json("projetos.json")
    return next((p for p in projetos if p.get("slug") == slug), None)


def tecnologias_com_logo() -> list[dict]:
    """Tecnologias da landing que possuem SVG em static/img/tech/."""
    tech_dir = Path(app.root_path) / "static" / "img" / "tech"
    todas = carregar_json("landing_tecnologias.json")
    return [
        t
        for t in todas
        if (tech_dir / f"{t.get('slug', '')}.svg").is_file()
    ]


@app.route("/")
def index():
    entregas = carregar_json("landing_entregas.json")
    tecnologias = carregar_json("landing_tecnologias.json")
    avaliacoes = carregar_json("landing_avaliacoes.json")
    return render_template(
        "index.html",
        entregas=entregas,
        tecnologias=tecnologias,
        avaliacoes=avaliacoes,
    )


@app.route("/projetos")
def projetos():
    lista = carregar_json("projetos.json")
    categorias = sorted({p["categoria"] for p in lista if p.get("categoria")})
    return render_template(
        "projetos.html",
        projetos=lista,
        categorias=categorias,
        tecnologias_orbit=tecnologias_com_logo(),
    )


@app.route("/projetos/<slug>")
def projeto_detalhe(slug):
    projeto = buscar_projeto(slug)
    if not projeto:
        abort(404)
    todos = carregar_json("projetos.json")
    relacionados = [p for p in todos if p.get("slug") != slug][:3]
    return render_template(
        "projeto_detalhe.html",
        projeto=projeto,
        relacionados=relacionados,
    )


@app.route("/equipe")
def equipe():
    membros = carregar_json("equipe.json")
    return render_template("equipe.html", equipe=membros)


def _contato_wants_json():
    return (
        request.accept_mimetypes.best == "application/json"
        or request.headers.get("X-Requested-With") == "XMLHttpRequest"
    )


@app.route("/contato", methods=["GET", "POST"])
def contato():
    form = ContatoForm()
    if request.method == "POST":
        sanitization_error = sanitize_contato_form(form)
        if sanitization_error:
            if _contato_wants_json():
                return jsonify({"ok": False, "message": sanitization_error}), 400
            flash(sanitization_error, "error")
            return render_template("contato.html", form=form), 400

    if form.validate_on_submit():
        assunto = (form.assunto.data or "").strip() or "Contato pelo site"
        msg = Message(
            subject=f"[jDEVs] {assunto}",
            recipients=[app.config["MAIL_DEFAULT_SENDER"]],
            reply_to=form.email.data,
            body=(
                f"Nome: {form.nome.data}\n"
                f"E-mail: {form.email.data}\n\n"
                f"{form.mensagem.data}"
            ),
        )
        try:
            mail.send(msg)
            if _contato_wants_json():
                return jsonify({"ok": True}), 200
            flash("Mensagem enviada com sucesso! Retornaremos em breve.", "success")
        except Exception:
            if _contato_wants_json():
                return jsonify({"ok": False}), 500
            flash(
                "Não foi possível enviar agora. Tente novamente ou use outro canal.",
                "error",
            )
        return redirect(url_for("contato"))

    if request.method == "POST" and _contato_wants_json():
        return jsonify({"ok": False, "errors": form.errors}), 400

    return render_template("contato.html", form=form)


if __name__ == "__main__":
    app.run(debug=app.config["DEBUG"])
