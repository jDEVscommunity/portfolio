import re

import bleach
from flask_wtf import FlaskForm
from wtforms import EmailField, StringField, TextAreaField
from wtforms.validators import DataRequired, Email, Length, Optional

CONTATO_LIMITS = {"nome": 100, "assunto": 200, "mensagem": 2000}
EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


def _clean_text(value: str | None) -> str:
    return bleach.clean(value or "", tags=[], strip=True).strip()


def sanitize_contato_form(form: "ContatoForm") -> str | None:
    """
    Remove HTML dos campos de texto, valida e-mail e limites de tamanho.
    Retorna mensagem de erro ou None se os dados estão aceitáveis.
    """
    form.nome.data = _clean_text(form.nome.data)
    form.email.data = _clean_text(form.email.data)
    form.assunto.data = _clean_text(form.assunto.data)
    form.mensagem.data = _clean_text(form.mensagem.data)

    if not form.nome.data:
        return "Informe seu nome."
    if len(form.nome.data) > CONTATO_LIMITS["nome"]:
        return "O nome deve ter no máximo 100 caracteres."

    if not form.email.data:
        return "Informe seu e-mail."
    if not EMAIL_RE.match(form.email.data):
        return "Informe um e-mail válido."

    if len(form.assunto.data) > CONTATO_LIMITS["assunto"]:
        return "O assunto deve ter no máximo 200 caracteres."

    if not form.mensagem.data:
        return "Escreva sua mensagem."
    if len(form.mensagem.data) > CONTATO_LIMITS["mensagem"]:
        return "A mensagem deve ter no máximo 2000 caracteres."

    return None


class ContatoForm(FlaskForm):
    """Formulário de contato com validação server-side."""

    nome = StringField(
        "Nome",
        validators=[DataRequired(message="Informe seu nome."), Length(max=100)],
    )
    email = EmailField(
        "E-mail",
        validators=[
            DataRequired(message="Informe seu e-mail."),
            Email(message="E-mail inválido."),
            Length(max=120),
        ],
    )
    assunto = StringField(
        "Assunto",
        validators=[Optional(), Length(max=200)],
    )
    mensagem = TextAreaField(
        "Mensagem",
        validators=[
            DataRequired(message="Escreva sua mensagem."),
            Length(min=10, max=2000, message="Mínimo de 10 caracteres."),
        ],
    )
