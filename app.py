"""
jDEVs Portfolio — entry point Flask.
Rotas renderizam templates Jinja2; dados vêm de JSONs em /data.
"""

import json
from datetime import datetime
from pathlib import Path

from flask import Flask, flash, redirect, render_template, request, url_for
from flask_mail import Mail, Message

from config import Config
from forms import ContatoForm

app = Flask(__name__)
app.config.from_object(Config)

mail = Mail(app)

DATA_DIR = Path(__file__).parent / "data"


@app.context_processor
def inject_globals():
    return {"current_year": datetime.now().year}


def carregar_json(arquivo: str) -> list | dict:
    """Carrega um arquivo JSON da pasta data/."""
    caminho = DATA_DIR / arquivo
    with open(caminho, encoding="utf-8") as f:
        return json.load(f)


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
        return render_template("404.html"), 404
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


@app.route("/contato", methods=["GET", "POST"])
def contato():
    form = ContatoForm()
    if form.validate_on_submit():
        msg = Message(
            subject=f"[jDEVs] {form.assunto.data}",
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
            flash("Mensagem enviada com sucesso! Retornaremos em breve.", "success")
        except Exception:
            flash(
                "Não foi possível enviar agora. Tente novamente ou use outro canal.",
                "error",
            )
        return redirect(url_for("contato"))

    return render_template("contato.html", form=form)


if __name__ == "__main__":
    app.run(debug=app.config["DEBUG"])
