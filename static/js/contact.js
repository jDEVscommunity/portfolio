const STEP_TITLES = {
  1: "Sobre o projeto",
  2: "Seus dados",
  3: "Briefing",
};

const MENSAGEM_MAX = 2000;

export function initContact() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  let etapa = 1;
  const total = 3;

  const paineis = () => form.querySelectorAll(".step-panel");
  const progress = form.querySelector(".step-progress-bar");
  const counter = form.querySelector("#step-current");
  const stepTitle = form.querySelector("#step-title");
  const ariaBar = form.querySelector("[role=progressbar]");
  const btnPrev = form.querySelector("#btn-prev");
  const btnNext = form.querySelector("#btn-next");
  const btnSub = form.querySelector("#btn-submit");
  const feedback = form.querySelector(".form-feedback");
  const recap = form.querySelector("#contact-recap");
  const recapTipo = form.querySelector("#recap-tipo");
  const recapEstagio = form.querySelector("#recap-estagio");
  const mensagem = form.querySelector("#mensagem");
  const mensagemCount = form.querySelector("#mensagem-count");

  if (
    !progress ||
    !counter ||
    !ariaBar ||
    !btnPrev ||
    !btnNext ||
    !btnSub ||
    !feedback
  ) {
    return;
  }

  function selecionarOpcao(btn) {
    const grupo = btn.dataset.field;
    form.querySelectorAll(`[data-field="${grupo}"]`).forEach((b) => {
      b.classList.remove("ativo");
      b.setAttribute("aria-pressed", "false");
    });
    btn.classList.add("ativo");
    btn.setAttribute("aria-pressed", "true");
    const hidden = form.querySelector(`#${grupo}`);
    if (hidden) hidden.value = btn.dataset.val ?? "";
    feedback.hidden = true;
  }

  form.querySelectorAll(".opcao").forEach((btn) => {
    btn.addEventListener("click", () => selecionarOpcao(btn));
    btn.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      selecionarOpcao(btn);
    });
  });

  function atualizarRecap() {
    if (!recap || !recapTipo || !recapEstagio) return;
    const tipo = form.querySelector("#tipo_projeto")?.value ?? "";
    const est = form.querySelector("#estagio")?.value ?? "";
    recapTipo.textContent = tipo || "—";
    recapEstagio.textContent = est || "—";
    recap.hidden = !(tipo || est);
  }

  function atualizarContador() {
    if (!mensagem || !mensagemCount) return;
    const len = mensagem.value.length;
    mensagemCount.textContent = `${len} / ${MENSAGEM_MAX}`;
    mensagemCount.classList.toggle("is-near-limit", len > MENSAGEM_MAX * 0.9);
  }

  if (mensagem) {
    mensagem.addEventListener("input", atualizarContador);
    atualizarContador();
  }

  function irPara(nova) {
    paineis().forEach((p) => {
      const ativo = parseInt(p.dataset.panel, 10) === nova;
      p.hidden = !ativo;
      if (ativo) p.scrollTop = 0;
    });
    etapa = nova;
    counter.textContent = String(nova);
    const titulo = STEP_TITLES[nova] ?? "";
    if (stepTitle) stepTitle.textContent = titulo;
    ariaBar.setAttribute("aria-valuenow", String(nova));
    ariaBar.setAttribute(
      "aria-label",
      titulo ? `Etapa ${nova} de ${total}: ${titulo}` : `Etapa ${nova} de ${total}`
    );
    progress.style.width = `${Math.round((nova / total) * 100)}%`;

    btnPrev.hidden = nova === 1;
    btnNext.hidden = nova === total;
    btnSub.hidden = nova !== total;

    if (nova === 3) atualizarRecap();

    feedback.hidden = true;

    const firstInput = form.querySelector(
      `[data-panel="${nova}"] input:not([type=hidden]):not([type=checkbox]), [data-panel="${nova}"] textarea, [data-panel="${nova}"] .opcao`
    );
    firstInput?.focus({ preventScroll: true });
  }

  function mostrarFeedback(msg, tipo) {
    feedback.textContent = msg;
    feedback.dataset.tipo = tipo;
    feedback.hidden = false;
    feedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function validarEtapa(n) {
    if (n === 1) {
      const tipo = form.querySelector("#tipo_projeto")?.value;
      const est = form.querySelector("#estagio")?.value;
      if (!tipo || !est) {
        mostrarFeedback("Selecione o tipo e o estágio do projeto.", "error");
        return false;
      }
    }
    if (n === 2) {
      const nome = form.querySelector("#nome")?.value.trim() ?? "";
      const email = form.querySelector("#email")?.value.trim() ?? "";
      if (!nome) {
        mostrarFeedback("Informe seu nome.", "error");
        form.querySelector("#nome")?.focus();
        return false;
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        mostrarFeedback("Informe um e-mail válido.", "error");
        form.querySelector("#email")?.focus();
        return false;
      }
    }
    if (n === 3) {
      const msg = form.querySelector("#mensagem")?.value.trim() ?? "";
      const lgpd = form.querySelector("#lgpd");
      if (msg.length < 10) {
        mostrarFeedback("Descreva o projeto com pelo menos 10 caracteres.", "error");
        form.querySelector("#mensagem")?.focus();
        return false;
      }
      if (lgpd && !lgpd.checked) {
        mostrarFeedback("Aceite o uso dos dados para continuar.", "error");
        lgpd.focus();
        return false;
      }
    }
    feedback.hidden = true;
    return true;
  }

  function comporAssunto() {
    const assunto = form.querySelector("#assunto");
    const tipo = form.querySelector("#tipo_projeto")?.value ?? "";
    const est = form.querySelector("#estagio")?.value ?? "";
    if (!assunto || !tipo || !est) return;

    const prefix = `${tipo} · ${est}`;
    const atual = assunto.value.trim();
    assunto.value = atual ? `${prefix} — ${atual}` : prefix;
  }

  function limparSelecoes() {
    form.querySelectorAll(".opcao.ativo").forEach((b) => {
      b.classList.remove("ativo");
      b.setAttribute("aria-pressed", "false");
    });
    const tipo = form.querySelector("#tipo_projeto");
    const est = form.querySelector("#estagio");
    if (tipo) tipo.value = "";
    if (est) est.value = "";
    atualizarRecap();
  }

  btnNext.addEventListener("click", () => {
    if (validarEtapa(etapa)) irPara(etapa + 1);
  });

  btnPrev.addEventListener("click", () => irPara(etapa - 1));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validarEtapa(3)) return;

    comporAssunto();

    const labelOriginal = btnSub.textContent;
    btnSub.textContent = "Enviando…";
    btnSub.disabled = true;

    try {
      const res = await fetch("/contato", {
        method: "POST",
        body: new FormData(form),
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        mostrarFeedback(
          "Mensagem enviada! Retornaremos em até 1 dia útil.",
          "success"
        );
        form.reset();
        limparSelecoes();
        atualizarContador();
        irPara(1);
      } else {
        mostrarFeedback(data.message || "Erro ao enviar. Tente novamente.", "error");
      }
    } catch {
      mostrarFeedback("Falha de conexão. Tente novamente.", "error");
    } finally {
      btnSub.textContent = labelOriginal;
      btnSub.disabled = false;
    }
  });

  irPara(1);
}
