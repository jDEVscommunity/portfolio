(function () {
  "use strict";

  var DEFAULT_DURATION = 1400;
  var SELECTOR =
    "[data-count-up], .hero__highlight-value, .project-detail__stat-value";

  var scrollRoot = document.querySelector(".page-container");
  var intersectionObserver = null;
  var observed = new WeakSet();
  var initialized = false;

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function parseNumber(str) {
    return parseFloat(String(str).replace(",", "."));
  }

  function parseCountValue(raw) {
    var str = String(raw).trim();
    var range = str.match(/^(\D*)(\d+(?:[.,]\d+)?)\s*([–-])\s*(\d+(?:[.,]\d+)?)(\D*)$/u);
    if (range) {
      return {
        type: "range",
        prefix: range[1] || "",
        separator: range[3],
        values: [parseNumber(range[2]), parseNumber(range[4])],
        suffix: range[5] || "",
      };
    }

    var single = str.match(/^(\D*)(\d+(?:[.,]\d+)?)(\D*)$/u);
    if (!single) return null;

    return {
      type: "single",
      prefix: single[1] || "",
      values: [parseNumber(single[2])],
      suffix: single[3] || "",
    };
  }

  function isAnimatable(el) {
    if (!el || el.hasAttribute("data-count-skip")) return false;
    if (el.closest("#hero-terminal-source")) return false;
    var target = (el.getAttribute("data-count-to") || el.textContent || "").trim();
    return !!parseCountValue(target);
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function formatPart(value, template) {
    if (String(template).includes(",")) {
      return Math.round(value)
        .toString()
        .replace(".", ",");
    }
    if (Number.isInteger(template)) return String(Math.round(value));
    return String(Math.round(value * 10) / 10);
  }

  function renderProgress(parsed, progress) {
    if (parsed.type === "range") {
      var low = parsed.values[0] * progress;
      var high = parsed.values[1] * progress;
      return (
        parsed.prefix +
        formatPart(low, parsed.values[0]) +
        parsed.separator +
        formatPart(high, parsed.values[1]) +
        parsed.suffix
      );
    }

    var value = parsed.values[0] * progress;
    return parsed.prefix + formatPart(value, parsed.values[0]) + parsed.suffix;
  }

  function prepareElement(el) {
    if (!el.getAttribute("data-count-to")) {
      el.setAttribute("data-count-to", el.textContent.trim());
    }
  }

  function animateCountUp(el, options) {
    if (!el) return;

    var force = options && options.force;
    if (el.hasAttribute("data-count-animated") && !force) return;

    var target = (el.getAttribute("data-count-to") || el.textContent || "").trim();
    if (!target) return;

    var parsed = parseCountValue(target);
    if (!parsed) return;

    el.setAttribute("data-count-to", target);

    if (prefersReducedMotion()) {
      el.textContent = target;
      el.setAttribute("data-count-animated", "");
      return;
    }

    var duration =
      (options && options.duration) ||
      Number(el.getAttribute("data-count-duration")) ||
      DEFAULT_DURATION;
    var start = performance.now();
    var runId = (el._countUpRunId || 0) + 1;
    el._countUpRunId = runId;

    el.textContent = renderProgress(parsed, 0);

    function frame(now) {
      if (el._countUpRunId !== runId) return;

      var t = Math.min(1, (now - start) / duration);
      el.textContent = renderProgress(parsed, easeOutCubic(t));

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = target;
        el.setAttribute("data-count-animated", "");
      }
    }

    requestAnimationFrame(frame);
  }

  function animateWithin(root, options) {
    if (!root) return;

    root.querySelectorAll(SELECTOR).forEach(function (el) {
      if (!isAnimatable(el)) return;
      prepareElement(el);
      if (options && options.force) {
        el.removeAttribute("data-count-animated");
      }
      animateCountUp(el, options);
    });
  }

  function bindElement(el) {
    if (!el || observed.has(el) || !isAnimatable(el)) return;
    if (el.closest(".hero-terminal__stage")) return;

    var revealHost = el.closest(".hero-reveal");
    if (revealHost && !revealHost.classList.contains("is-visible")) return;

    prepareElement(el);
    observed.add(el);

    if (!intersectionObserver) {
      animateCountUp(el);
      return;
    }

    intersectionObserver.observe(el);
  }

  function observe(root) {
    var scope = root || document;
    scope.querySelectorAll(SELECTOR).forEach(bindElement);
  }

  function initObserver() {
    if (prefersReducedMotion()) {
      observe(document);
      document.querySelectorAll(SELECTOR).forEach(function (el) {
        if (!isAnimatable(el)) return;
        prepareElement(el);
        el.textContent = el.getAttribute("data-count-to") || el.textContent;
        el.setAttribute("data-count-animated", "");
      });
      return;
    }

    if (!("IntersectionObserver" in window)) {
      observe(document);
      animateWithin(document);
      return;
    }

    intersectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          intersectionObserver.unobserve(entry.target);
          animateCountUp(entry.target);
        });
      },
      {
        root: scrollRoot,
        threshold: 0.35,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    observe(document);
  }

  function init() {
    if (initialized) return;
    initialized = true;
    initObserver();
  }

  window.HeroCountUp = {
    animate: animateCountUp,
    animateWithin: animateWithin,
    observe: observe,
    init: init,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
