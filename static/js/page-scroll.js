(function () {
  "use strict";

  if (!document.body.classList.contains("app--inner-page")) return;

  var scrollRoot = document.querySelector(".page-container");
  if (!scrollRoot) return;

  var rules = [
    { sel: ".page-hero", token: "soft" },
    { sel: ".page-intro--equipe", token: "soft" },
    { sel: ".page-intro--contato", token: "default" },
    { sel: ".page-intro", token: "default" },
    { sel: ".page-section--alt", token: "alt" },
    { sel: ".page-section", token: "default" },
    { sel: ".site-footer", token: "default" },
  ];

  var vars = {
    soft: "var(--page-bg-soft)",
    alt: "var(--page-bg-alt)",
    default: "var(--bg)",
  };

  var zones = [];

  rules.forEach(function (rule) {
    document.querySelectorAll(rule.sel).forEach(function (el) {
      if (el.hasAttribute("data-page-bg")) return;
      el.setAttribute("data-page-bg", rule.token);
      zones.push({ el: el, token: rule.token });
    });
  });

  if (!zones.length) return;

  var current = "";

  function applyBg(token) {
    if (!token || token === current) return;
    current = token;
    scrollRoot.style.setProperty(
      "--page-scroll-bg",
      vars[token] || vars.default
    );
  }

  applyBg("default");

  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !("IntersectionObserver" in window)
  ) {
    return;
  }

  var ratios = new Map();

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        ratios.set(entry.target, entry.intersectionRatio);
      });

      var bestToken = "default";
      var bestRatio = 0;

      zones.forEach(function (zone) {
        var ratio = ratios.get(zone.el) || 0;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestToken = zone.token;
        }
      });

      applyBg(bestToken);
    },
    {
      root: scrollRoot,
      threshold: [0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.5, 0.6, 0.7, 0.85, 1],
    }
  );

  zones.forEach(function (zone) {
    observer.observe(zone.el);
  });
})();
