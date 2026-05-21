(function () {
  "use strict";

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function init() {
    var carousel = document.querySelector(".hero-tech-carousel");
    if (!carousel) return;

    var track = carousel.querySelector(".hero-tech-carousel__track");
    if (!track) return;

    if (prefersReducedMotion()) {
      carousel.classList.add("hero-tech-carousel--static");
      return;
    }

    var items = track.querySelectorAll(".hero-tech-carousel__item");
    if (items.length < 2) return;

    var half = items.length / 2;
    var width = 0;
    for (var i = 0; i < half; i += 1) {
      width += items[i].getBoundingClientRect().width;
    }
    if (!width) return;

    var gap = parseFloat(getComputedStyle(track).gap) || 0;
    width += gap * (half - 1);
    track.style.setProperty("--carousel-shift", "-" + width + "px");
    carousel.classList.add("hero-tech-carousel--ready");
  }

  var resizeTimer;

  function onResize() {
    var carousel = document.querySelector(".hero-tech-carousel");
    if (!carousel || carousel.classList.contains("hero-tech-carousel--static")) return;
    carousel.classList.remove("hero-tech-carousel--ready");
    init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(onResize, 150);
  });
})();
