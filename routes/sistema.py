import json
import logging

from flask import Blueprint, current_app, jsonify, make_response, render_template_string, request, send_from_directory, url_for

from helpers import ROBOTS_TXT, SITEMAP_XML, sitemap_entries

bp = Blueprint("sistema", __name__)
logger = logging.getLogger(__name__)


@bp.route("/csp-report", methods=["POST"])
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


@bp.route("/favicon.ico")
def favicon():
    return send_from_directory(
        current_app.root_path,
        "favicon.ico",
        mimetype="image/vnd.microsoft.icon",
    )


@bp.route("/robots.txt")
def robots_txt():
    body = render_template_string(
        ROBOTS_TXT,
        sitemap_url=url_for("sistema.sitemap_xml", _external=True),
    )
    return make_response(body, 200, {"Content-Type": "text/plain; charset=utf-8"})


@bp.route("/sitemap.xml")
def sitemap_xml():
    body = render_template_string(SITEMAP_XML, entries=sitemap_entries())
    return make_response(body, 200, {"Content-Type": "application/xml; charset=utf-8"})
