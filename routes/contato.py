import logging

from flask import Blueprint, current_app, flash, jsonify, redirect, render_template, request, url_for
from flask_mail import Message

from extensions import mail
from forms import ContatoForm, sanitize_contato_form

bp = Blueprint("contato", __name__)
logger = logging.getLogger(__name__)


def _contato_wants_json():
    return (
        request.accept_mimetypes.best == "application/json"
        or request.headers.get("X-Requested-With") == "XMLHttpRequest"
    )


@bp.route("/contato", methods=["GET", "POST"])
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
            recipients=[current_app.config["MAIL_DEFAULT_SENDER"]],
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
        except Exception as e:
            logger.error(
                "Falha ao enviar e-mail de contato | nome=%s email=%s | erro=%s",
                form.nome.data,
                form.email.data[:3] + "***",  # anonimiza parcialmente
                e,
                exc_info=True,
            )
            if _contato_wants_json():
                return jsonify({"ok": False}), 500
            flash(
                "Não foi possível enviar agora. Tente novamente ou use outro canal.",
                "error",
            )
        return redirect(url_for("contato.contato"))

    if request.method == "POST" and _contato_wants_json():
        return jsonify({"ok": False, "errors": form.errors}), 400

    return render_template("contato.html", form=form)
