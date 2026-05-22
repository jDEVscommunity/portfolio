from flask import Blueprint, render_template

from helpers import carregar_json

bp = Blueprint("main", __name__)


@bp.route("/")
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


@bp.route("/equipe")
def equipe():
    membros = carregar_json("equipe.json")
    return render_template("equipe.html", equipe=membros)
