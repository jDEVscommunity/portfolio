(function () {
  "use strict";

  var wrap = document.querySelector(".page-hero__decor-wrap");
  if (!wrap) return;

  var reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  var NORMAL_RATE = 1;
  var SLOW_RATE = 0.35;
  var RATE_LERP_MS = 1400;
  var spinAnimations = [];
  var targetRate = NORMAL_RATE;
  var currentRate = NORMAL_RATE;
  var rateRafId = 0;
  var lastRateTick = 0;

  function createSpinAnimation(element, durationMs, direction) {
    if (!element || typeof element.animate !== "function") return null;

    return element.animate(
      [
        { transform: "rotate(0deg)" },
        { transform: "rotate(" + (direction > 0 ? 360 : -360) + "deg)" },
      ],
      {
        duration: durationMs,
        iterations: Infinity,
        easing: "linear",
      }
    );
  }

  function initOrbitSpin() {
    if (reducedMotion) return;

    var orbit = wrap.querySelector(".page-hero__decor-orbit");
    var rings = wrap.querySelectorAll(".page-hero__decor-ring");
    var iconInners = wrap.querySelectorAll(".page-hero__decor-orbit-icon-inner");

    if (orbit) spinAnimations.push(createSpinAnimation(orbit, 40000, 1));

    iconInners.forEach(function (icon) {
      spinAnimations.push(createSpinAnimation(icon, 40000, -1));
    });

    rings.forEach(function (ring) {
      var inner = ring.classList.contains("page-hero__decor-ring--inner");
      spinAnimations.push(
        createSpinAnimation(ring, inner ? 32000 : 48000, inner ? -1 : 1)
      );
    });

    spinAnimations = spinAnimations.filter(Boolean);
    if (!spinAnimations.length) return;

    wrap.classList.add("is-orbit-js");
    lastRateTick = performance.now();
    rateRafId = requestAnimationFrame(tickSpinRate);
  }

  function tickSpinRate(now) {
    if (!lastRateTick) lastRateTick = now;
    var dt = Math.min(64, now - lastRateTick);
    lastRateTick = now;
    var alpha = 1 - Math.exp(-dt / (RATE_LERP_MS / 4));
    currentRate += (targetRate - currentRate) * alpha;

    spinAnimations.forEach(function (anim) {
      anim.playbackRate = currentRate;
    });

    rateRafId = requestAnimationFrame(tickSpinRate);
  }

  function setOrbitSlow(slow) {
    targetRate = slow ? SLOW_RATE : NORMAL_RATE;
  }

  initOrbitSpin();

  var briefing = document.getElementById("page-hero-tech-briefing");
  if (!briefing) return;

  var content = briefing.querySelector(".page-hero__decor-briefing-content");
  var nameEl = briefing.querySelector(".page-hero__decor-briefing-name");
  var textEl = briefing.querySelector(".page-hero__decor-briefing-text");
  var triggers = wrap.querySelectorAll(".page-hero__decor-orbit-trigger");
  if (!triggers.length || !content || !nameEl || !textEl) return;

  var defaultTitle =
    briefing.getAttribute("data-default-title") || "Conhecimentos";
  var defaultText =
    briefing.getAttribute("data-default-text") || textEl.textContent.trim();
  var activeTrigger = null;
  var swapTimer = 0;

  function applyCopy(title, text) {
    nameEl.textContent = title;
    textEl.textContent = text;
  }

  function playEnter() {
    content.classList.remove("is-exiting");
    content.classList.add("is-entering");

    content.addEventListener("animationend", function onEnd(event) {
      if (event.target !== textEl) return;
      content.removeEventListener("animationend", onEnd);
      content.classList.remove("is-entering");
    });
  }

  function swapBriefing(title, text, animate) {
    window.clearTimeout(swapTimer);

    if (!animate || reducedMotion) {
      applyCopy(title, text);
      content.classList.remove("is-exiting", "is-entering");
      return;
    }

    content.classList.remove("is-entering");
    content.classList.add("is-exiting");

    swapTimer = window.setTimeout(function () {
      applyCopy(title, text);
      content.classList.remove("is-exiting");
      playEnter();
    }, 280);
  }

  function show(trigger) {
    if (!trigger) return;

    var name = trigger.getAttribute("data-tech-name") || defaultTitle;
    var text = trigger.getAttribute("data-tech-briefing") || "";
    if (!text) return;

    var changed =
      activeTrigger !== trigger ||
      nameEl.textContent !== name ||
      textEl.textContent !== text;

    activeTrigger = trigger;
    setOrbitSlow(true);
    briefing.classList.add("is-active");
    briefing.setAttribute("aria-live", "polite");

    triggers.forEach(function (btn) {
      btn.classList.toggle("is-active", btn === trigger);
    });

    swapBriefing(name, text, changed);
  }

  function clear() {
    window.clearTimeout(swapTimer);
    activeTrigger = null;
    setOrbitSlow(false);
    briefing.classList.remove("is-active");
    briefing.removeAttribute("aria-live");

    triggers.forEach(function (btn) {
      btn.classList.remove("is-active");
    });

    var changed =
      nameEl.textContent !== defaultTitle ||
      textEl.textContent !== defaultText;

    swapBriefing(defaultTitle, defaultText, changed);
  }

  function isInsideWrap(node) {
    return node && wrap.contains(node);
  }

  triggers.forEach(function (trigger) {
    trigger.addEventListener("mouseenter", function () {
      show(trigger);
    });

    trigger.addEventListener("focus", function () {
      show(trigger);
    });

    trigger.addEventListener("click", function () {
      if (activeTrigger === trigger && briefing.classList.contains("is-active")) {
        clear();
        return;
      }
      show(trigger);
    });
  });

  wrap.addEventListener("mouseleave", function (event) {
    if (isInsideWrap(event.relatedTarget)) return;
    clear();
  });

  wrap.addEventListener("focusout", function (event) {
    if (isInsideWrap(event.relatedTarget)) return;
    clear();
  });
})();
