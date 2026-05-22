(function () {
  "use strict";

  var palavras = ["precisão", "clareza", "entrega", "propósito"];
  var atual = 0;
  var intervalId = null;

  function rotar(el) {
    el.classList.add("saindo");
    setTimeout(function () {
      atual = (atual + 1) % palavras.length;
      el.textContent = palavras[atual];
      el.classList.remove("saindo");
      el.classList.add("entrando");
      setTimeout(function () {
        el.classList.remove("entrando");
      }, 400);
    }, 300);
  }

  function initHeroRotatingWord() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    var el = document.querySelector("#hero-terminal-stage .rotating-word");
    if (!el) return;

    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }

    atual = Math.max(0, palavras.indexOf((el.textContent || "").trim()));
    if (atual < 0) atual = 0;
    el.textContent = palavras[atual];

    intervalId = window.setInterval(function () {
      rotar(el);
    }, 3000);
  }

  window.initHeroRotatingWord = initHeroRotatingWord;
})();
