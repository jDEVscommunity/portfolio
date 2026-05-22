"""
jDEVs Portfolio — entry point Flask.
Rotas em blueprints em routes/; dados via helpers e JSON em /data.
"""

import logging
from datetime import datetime

from flask import Flask, jsonify, render_template, request

from config import Config
from helpers import carregar_json
from extensions import mail
from routes.contato import bp as contato_bp
from routes.main import bp as main_bp
from routes.projetos import bp as projetos_bp
from routes.sistema import bp as sistema_bp

app = Flask(__name__)
app.config.from_object(Config)

mail.init_app(app)

logger = logging.getLogger(__name__)

if not app.debug and app.config["DEBUG"]:
    logger.warning("DEBUG está True em produção.")
if not app.debug and app.config["SECRET_KEY"] == "dev-only-change-in-production":
    raise RuntimeError("SECRET_KEY insegura detectada em produção.")

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
        "active_route": (request.endpoint or "") if request else "",
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


@app.errorhandler(404)
def pagina_nao_encontrada(_error):
    return render_template("404.html"), 404


@app.route("/health")
def health():
    checks = {}

    for arquivo in ["projetos.json", "equipe.json", "landing_tecnologias.json"]:
        try:
            dados = carregar_json(arquivo)
            checks[arquivo] = "ok" if dados else "vazio"
        except Exception as e:
            checks[arquivo] = f"erro: {e}"

    status = "ok" if all(v == "ok" for v in checks.values()) else "degraded"
    http_status = 200 if status == "ok" else 503

    return jsonify({"status": status, "checks": checks}), http_status


app.register_blueprint(main_bp)
app.register_blueprint(projetos_bp)
app.register_blueprint(contato_bp)
app.register_blueprint(sistema_bp)


if __name__ == "__main__":
    app.run(debug=app.config["DEBUG"])
