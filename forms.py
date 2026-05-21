from flask_wtf import FlaskForm
from wtforms import EmailField, StringField, TextAreaField
from wtforms.validators import DataRequired, Email, Length


class ContatoForm(FlaskForm):
    """Formulário de contato com validação server-side."""

    nome = StringField(
        "Nome",
        validators=[DataRequired(message="Informe seu nome."), Length(max=120)],
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
        validators=[DataRequired(message="Informe o assunto."), Length(max=200)],
    )
    mensagem = TextAreaField(
        "Mensagem",
        validators=[
            DataRequired(message="Escreva sua mensagem."),
            Length(min=10, max=5000, message="Mínimo de 10 caracteres."),
        ],
    )
