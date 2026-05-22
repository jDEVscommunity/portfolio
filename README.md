# jDEVs Portfolio

Site institucional da **jDEVs** — portfólio de projetos, equipe e contato. Construído com **Flask**, templates **Jinja2** e conteúdo em JSON.

## Funcionalidades

- Landing page com entregas, tecnologias e avaliações
- Listagem e detalhe de projetos (filtro por categoria)
- Página da equipe
- Formulário de contato com validação (Flask-WTF) e envio por e-mail (Flask-Mail)
- Tema claro/escuro persistido no navegador

## Stack

| Camada        | Tecnologia                          |
|---------------|-------------------------------------|
| Backend       | Python 3, Flask 3                   |
| Templates     | Jinja2                              |
| Dados         | JSON em `/data`                     |
| Frontend      | CSS e JavaScript vanilla            |
| Deploy        | [Vercel](https://vercel.com) (Python) |

## Estrutura do projeto

```
portfolio/
├── app.py              # Entry point Flask (blueprints, hooks, /health)
├── config.py           # Configuração (env vars)
├── extensions.py       # Extensões Flask (Mail)
├── forms.py            # Formulário de contato
├── helpers.py          # carregar_json, sitemap, etc.
├── routes/             # Blueprints por domínio
│   ├── main.py         # /, /equipe
│   ├── projetos.py     # /projetos
│   ├── contato.py      # /contato
│   └── sistema.py      # robots, sitemap, favicon, CSP report
├── data/               # JSON (projetos, equipe, landing)
├── static/             # CSS, JS, imagens
├── templates/          # HTML Jinja2
├── requirements.txt
└── vercel.json         # Roteamento estático + Flask na Vercel
```

## Desenvolvimento local

### Pré-requisitos

- Python 3.11+
- pip

### Instalação

**Demo (produção):** https://portfolio-five-liard-58.vercel.app/

```bash
git clone https://github.com/jDEVscommunity/portfolio.git
cd portfolio
python -m venv .venv

# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1

# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edite .env com SECRET_KEY e credenciais SMTP, se for testar o contato
```

### Executar

```bash
python app.py
```

Abra [http://127.0.0.1:5000](http://127.0.0.1:5000).

## Variáveis de ambiente

| Variável              | Obrigatória (prod) | Descrição                          |
|-----------------------|--------------------|------------------------------------|
| `SECRET_KEY`          | Sim                | Chave secreta do Flask / CSRF      |
| `FLASK_DEBUG`         | Não                | `True` apenas em desenvolvimento   |
| `MAIL_SERVER`         | Para contato       | Host SMTP                          |
| `MAIL_PORT`           | Para contato       | Porta SMTP (ex.: 587)              |
| `MAIL_USE_TLS`        | Para contato       | `True` / `False`                   |
| `MAIL_USERNAME`       | Para contato       | Usuário SMTP                       |
| `MAIL_PASSWORD`       | Para contato       | Senha ou app password              |
| `MAIL_DEFAULT_SENDER` | Para contato       | Remetente dos e-mails do formulário |

Na Vercel, configure em **Project → Settings → Environment Variables**.

> O formulário de contato depende de SMTP válido. Sem essas variáveis, as páginas públicas funcionam, mas o envio de e-mail falhará.

## Publicar no GitHub (`portfolio`)

Com o [GitHub CLI](https://cli.github.com/) autenticado (`gh auth login`):

```bash
gh repo create portfolio --public --source=. --remote=origin --push
```

Ou crie o repositório **portfolio** em [github.com/new](https://github.com/new) e depois:

```bash
git remote add origin https://github.com/jDEVscommunity/portfolio.git
git push -u origin main
```

## Deploy na Vercel

### Opção A — GitHub (recomendado)

1. Faça push deste repositório para `github.com/jDEVscommunity/portfolio`.
2. Em [vercel.com/new](https://vercel.com/new), importe o repositório **portfolio**.
3. A Vercel detecta Flask via `app.py` e `requirements.txt`.
4. Adicione as variáveis de ambiente de produção.
5. Deploy automático a cada push na branch principal.

### Opção B — CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

O arquivo `vercel.json` envia `/static/*` pelo CDN da Vercel e demais rotas para a função Python (`app.py`).

## Editar conteúdo

Altere os arquivos em `data/`:

- `projetos.json` — projetos e slugs (`/projetos/<slug>`)
- `equipe.json` — membros da equipe
- `landing_*.json` — seções da home

Não é necessário alterar Python para mudar textos, links ou listagens.

## Licença

Projeto de portfólio da jDEVs. Uso conforme acordado pela equipe.
