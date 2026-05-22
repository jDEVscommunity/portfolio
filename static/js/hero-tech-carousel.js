(function () {
  "use strict";

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function applyCloneAccessibility(clone) {
    clone.setAttribute("aria-hidden", "true");
    clone.classList.add("hero-tech-carousel__item--clone");
    clone.removeAttribute("role");

    clone.querySelectorAll("[role='img']").forEach(function (svg) {
      svg.removeAttribute("role");
      svg.setAttribute("aria-hidden", "true");
    });

    clone.querySelectorAll(".hero-tech-carousel__label").forEach(function (label) {
      label.setAttribute("aria-hidden", "true");
    });
  }

  function getOriginalItems(track) {
    return track.querySelectorAll(
      ".hero-tech-carousel__item:not(.hero-tech-carousel__item--clone)"
    );
  }

  function duplicateTrackItems(track) {
    var originals = getOriginalItems(track);
    if (originals.length < 2) return originals.length;

    originals.forEach(function (item) {
      var clone = item.cloneNode(true);
      applyCloneAccessibility(clone);
      track.appendChild(clone);
    });

    return originals.length;
  }

  function measureOriginalWidth(track, originalCount) {
    var originals = getOriginalItems(track);
    var width = 0;

    for (var i = 0; i < originalCount; i += 1) {
      width += originals[i].getBoundingClientRect().width;
    }

    if (!width) return 0;

    var gap = parseFloat(getComputedStyle(track).gap) || 0;
    return width + gap * (originalCount - 1);
  }

  function initCarousel(carousel) {
    var track = carousel.querySelector(".hero-tech-carousel__track");
    if (!track) return;

    track.querySelectorAll(".hero-tech-carousel__item--clone").forEach(function (clone) {
      clone.remove();
    });

    if (prefersReducedMotion()) {
      carousel.classList.remove("hero-tech-carousel--ready");
      carousel.classList.add("hero-tech-carousel--static");
      return;
    }

    carousel.classList.remove("hero-tech-carousel--static");

    var originalCount = duplicateTrackItems(track);
    if (originalCount < 2) return;

    var width = measureOriginalWidth(track, originalCount);
    if (!width) return;

    track.style.setProperty("--carousel-shift", "-" + width + "px");
    carousel.classList.add("hero-tech-carousel--ready");
  }

  function initAll() {
    document.querySelectorAll(".hero-tech-carousel").forEach(initCarousel);
  }

  var resizeTimer;

  function onResize() {
    document.querySelectorAll(".hero-tech-carousel").forEach(function (carousel) {
      if (carousel.classList.contains("hero-tech-carousel--static")) return;
      carousel.classList.remove("hero-tech-carousel--ready");
    });
    initAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }

  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(onResize, 150);
  });
})();
