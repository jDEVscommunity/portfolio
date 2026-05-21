(function () {
  var tipIdCounter = 0;

  var INTERACTIVE_SELECTOR = [
    "a[href]:not([href=''])",
    "button:not([disabled])",
    'input[type="submit"]:not([disabled])',
    'input[type="button"]:not([disabled])',
    '[role="tab"]',
    '[role="button"]:not([aria-disabled="true"])',
  ].join(",");

  function stripNativeTitles(root) {
    root.querySelectorAll(".tooltip-host [title]").forEach(function (el) {
      el.removeAttribute("title");
    });
  }

  function getVisibleLabel(el) {
    var navLabel = el.querySelector(".site-header__nav-label");
    if (navLabel) return navLabel.textContent.replace(/\s+/g, " ").trim();

    var clone = el.cloneNode(true);
    clone.querySelectorAll("[aria-hidden='true']").forEach(function (node) {
      node.remove();
    });
    return clone.textContent.replace(/\s+/g, " ").trim();
  }

  function getTooltipText(el) {
    if (el.dataset.tooltip === "off") return null;

    var explicit = el.dataset.tooltip;
    if (explicit) return explicit.trim();

    var nativeTitle = el.getAttribute("title");
    if (nativeTitle) return nativeTitle.trim();

    if (el.classList.contains("project-card__link")) {
      var card = el.closest(".project-card");
      var cardTitle = card && card.querySelector(".project-card__title");
      if (cardTitle) return "Ver case: " + cardTitle.textContent.replace(/\s+/g, " ").trim();
    }

    if (
      el.classList.contains("site-header__logo") ||
      el.classList.contains("site-footer__logo")
    ) {
      return "Ir para o início";
    }

    var aria = el.getAttribute("aria-label");
    var visible = getVisibleLabel(el);
    var href = el.getAttribute("href");

    if (el.tagName === "A" && href) {
      if (href.indexOf("mailto:") === 0) {
        var email = href.slice(7);
        return visible || "Enviar e-mail para " + email;
      }
      if (href.indexOf("tel:") === 0) {
        return visible || "Ligar para " + href.slice(4);
      }
      if (el.target === "_blank" || (el.rel && el.rel.indexOf("noopener") !== -1)) {
        return visible ? "Abrir " + visible + " (nova aba)" : "Abrir link externo (nova aba)";
      }
      if (href.charAt(0) === "#") {
        return visible || "Ir para a seção " + href.slice(1);
      }
      if (aria && aria !== visible) return aria;
      if (visible) return visible;
      return "Abrir link";
    }

    if (aria) return aria;
    if (visible) return visible;
    return null;
  }

  function isNestedInteractive(el) {
    var parent = el.parentElement;
    while (parent) {
      if (parent !== el && parent.matches(INTERACTIVE_SELECTOR)) return true;
      parent = parent.parentElement;
    }
    return false;
  }

  function shouldEnhance(el) {
    if (!el.matches(INTERACTIVE_SELECTOR)) return false;
    if (el.closest(".site-header")) return false;
    if (el.closest(".tooltip-host")) return false;
    if (el.classList.contains("no-tooltip") || el.dataset.tooltip === "off") return false;
    if (el.getAttribute("aria-hidden") === "true") return false;
    if (isNestedInteractive(el)) return false;
    return Boolean(getTooltipText(el));
  }

  function hostModifiers(el, host) {
    if (el.classList.contains("project-card__link")) {
      host.classList.add("tooltip-host--stretch");
    }
  }

  function wrapWithTooltip(el, text) {
    var position = el.dataset.tooltipPosition || "top";
    var host = document.createElement("span");
    host.className = "tooltip-host tooltip-host--" + position;
    hostModifiers(el, host);

    var tip = document.createElement("span");
    tip.className = "tooltip";
    tip.textContent = text;

    if (!el.getAttribute("aria-labelledby")) {
      tip.id = "jdevs-tip-" + ++tipIdCounter;
      el.setAttribute("aria-labelledby", tip.id);
    }

    var parent = el.parentNode;
    if (!parent) return;

    parent.insertBefore(host, el);
    host.appendChild(el);
    host.appendChild(tip);
    el.removeAttribute("title");
  }

  function tryEnhanceElement(el) {
    if (!shouldEnhance(el)) return;
    var text = getTooltipText(el);
    if (text) wrapWithTooltip(el, text);
  }

  function enhanceTooltips(root) {
    var scope = root && root.nodeType === 1 ? root : document;

    if (scope.matches && scope.matches(INTERACTIVE_SELECTOR)) {
      tryEnhanceElement(scope);
    }

    if (scope.querySelectorAll) {
      scope.querySelectorAll(INTERACTIVE_SELECTOR).forEach(tryEnhanceElement);
    }

    stripNativeTitles(scope === document ? document : scope);
  }

  function observeDynamicTooltips() {
    if (!window.MutationObserver) return;

    var pending = false;

    function scheduleEnhance(node) {
      if (!node || node.nodeType !== 1) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        enhanceTooltips(node);
      });
    }

    new MutationObserver(function (mutations) {
      if (pending) return;
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(scheduleEnhance);
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  document.addEventListener("DOMContentLoaded", function () {
    enhanceTooltips(document);
    observeDynamicTooltips();
  });

  window.jdevsTooltip = {
    stripNativeTitles: stripNativeTitles,
    enhance: enhanceTooltips,
    getTooltipText: getTooltipText,
  };
})();
