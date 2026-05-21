(function () {
  "use strict";

  var DEFAULT_DURATION = 1400;

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

  function animateCountUp(el, options) {
    if (!el) return;

    var target = (el.getAttribute("data-count-to") || el.textContent || "").trim();
    if (!target) return;

    var parsed = parseCountValue(target);
    if (!parsed) return;

    el.setAttribute("data-count-to", target);

    if (prefersReducedMotion()) {
      el.textContent = target;
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
      }
    }

    requestAnimationFrame(frame);
  }

  function animateWithin(root, options) {
    if (!root) return;

    root.querySelectorAll(".hero__highlight-value").forEach(function (el) {
      if (!el.getAttribute("data-count-to")) {
        el.setAttribute("data-count-to", el.textContent.trim());
      }
      animateCountUp(el, options);
    });
  }

  window.HeroCountUp = {
    animate: animateCountUp,
    animateWithin: animateWithin,
  };
})();
