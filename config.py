import os
from dotenv import load_dotenv

load_dotenv()

_DEV_SECRET_KEY = "dev-only-change-in-production"


def _resolve_secret_key() -> str:
    key = (os.getenv("SECRET_KEY") or "").strip()
    if key:
        return key
    debug = os.getenv("FLASK_DEBUG", "False").lower() in ("true", "1", "yes")
    if debug:
        return _DEV_SECRET_KEY
    raise RuntimeError(
        "SECRET_KEY não definida. Copie .env.example para .env ou configure na Vercel."
    )


class Config:
    """Configurações da aplicação Flask."""

    SECRET_KEY = _resolve_secret_key()
    DEBUG = os.getenv("FLASK_DEBUG", "False").lower() in ("true", "1", "yes")

    # Flask-Mail
    MAIL_SERVER = os.getenv("MAIL_SERVER", "localhost")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "True").lower() in ("true", "1", "yes")
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER", "jdevscommunity@protonmail.com")

    # WTF
    WTF_CSRF_ENABLED = True

    # Content-Security-Policy
    # False = Content-Security-Policy-Report-Only (não bloqueia; use para validar no DevTools).
    # True  = Content-Security-Policy (bloqueia violações). Antes de ativar em produção,
    #         ajuste script-src (há script inline no base.html) ou use nonces.
    CSP_ENFORCE = os.getenv("CSP_ENFORCE", "False").lower() in ("true", "1", "yes")
    CSP_REPORT_URI = os.getenv("CSP_REPORT_URI", "/csp-report")
