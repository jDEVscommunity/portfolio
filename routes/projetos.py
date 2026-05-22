from flask import Blueprint, abort, render_template

from helpers import buscar_projeto, carregar_json, tecnologias_com_logo

bp = Blueprint("projetos", __name__)


@bp.route("/projetos")
def projetos():
    lista = carregar_json("projetos.json")
    categorias = sorted({p["categoria"] for p in lista if p.get("categoria")})
    return render_template(
        "projetos.html",
        projetos=lista,
        categorias=categorias,
        tecnologias_orbit=tecnologias_com_logo(),
    )


@bp.route("/projetos/<slug>")
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
