(function () {
  "use strict";

  var scrollRoot = document.querySelector(".page-container");

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function reveal(el) {
    el.classList.add("is-visible");
  }

  function setDelay(el, seconds) {
    el.style.setProperty("--reveal-delay", seconds + "s");
  }

  function collectRevealTargets() {
    var items = [];

    function add(node, delay, variant) {
      if (!node) return;
      items.push({ node: node, delay: delay, variant: variant || "default" });
    }

    function addList(nodes, stagger, startDelay, variant) {
      Array.prototype.forEach.call(nodes, function (node, index) {
        add(node, startDelay + index * stagger, variant);
      });
    }

    var primary = document.querySelector(".hero--primary");
    if (primary) {
      var bottom = primary.querySelector(".hero__bottom--primary");
      if (bottom) {
        addList(
          bottom.querySelectorAll(".hero__actions, .hero__footer, .hero__scroll-hint"),
          0.08,
          0
        );
      }
    }

    var secondary = document.querySelector(".hero--secondary");
    if (secondary) {
      var inner = secondary.querySelector(".hero__inner--secondary");
      if (inner) {
        addList(inner.children, 0.09, 0);
      }
      add(secondary.querySelector(".hero__scene"), 0.2, "scene");
    }

    var tertiary = document.querySelector(".hero--tertiary");
    if (tertiary) {
      add(tertiary.querySelector(".hero__tertiary-head"), 0);
      addList(tertiary.querySelectorAll(".hero__card"), 0.07, 0.08, "card");
      add(tertiary.querySelector(".hero__tertiary-foot"), 0.12);
    }

    var quaternary = document.querySelector(".hero--quaternary");
    if (quaternary) {
      add(quaternary.querySelector(".hero__quaternary-head"), 0);
      add(quaternary.querySelector(".hero-tech-carousel"), 0.14, "scene");
    }

    var quinary = document.querySelector(".hero--quinary");
    if (quinary) {
      var quinaryInner = quinary.querySelector(".hero__quinary-inner");
      if (quinaryInner) {
        addList(
          quinaryInner.querySelectorAll(".hero__eyebrow, .hero__title, .hero__lead"),
          0.09,
          0
        );
        add(quinary.querySelector(".hero__quinary-email-link"), 0.28);
        addList(quinary.querySelectorAll(".hero__actions .hero__cta"), 0.09, 0.36);
      }
    }

    var senary = document.querySelector(".hero--senary");
    if (senary) {
      add(senary.querySelector(".hero__senary-head"), 0);
      addList(senary.querySelectorAll(".hero__testimonial"), 0.07, 0.08, "card");
    }

    var footer = document.querySelector(".site-footer");
    if (footer) {
      add(footer.querySelector(".site-footer__hero"), 0);
      addList(footer.querySelectorAll(".site-footer__col"), 0.08, 0.06);
      add(footer.querySelector(".site-footer__bar"), 0.28);
    }

    var pageHero = document.querySelector(".page-hero");
    if (pageHero) {
      addList(
        pageHero.querySelectorAll(
          ".page-hero__copy > .hero__eyebrow, .page-hero__copy > .hero__title, .page-hero__copy > .hero__lead, .hero__highlights, .hero__actions, .hero__footer"
        ),
        0.08,
        0
      );
      add(pageHero.querySelector(".page-hero__stage"), 0.18, "scene");
    }

    var pageIntro = document.querySelector(".page-intro");
    if (pageIntro) {
      addList(
        pageIntro.querySelectorAll(
          ".page-intro__copy .hero__eyebrow, .page-intro__copy .hero__title, .page-intro__copy .hero__lead, .page-intro__email, .page-intro__steps, .page-intro__copy .hero__actions"
        ),
        0.08,
        0
      );
      addList(pageIntro.querySelectorAll(".page-intro__roster-card"), 0.1, 0.12, "card");
    }

    document.querySelectorAll(".page-section").forEach(function (section) {
      add(section.querySelector(".page-section__head"), 0);
      addList(section.querySelectorAll(".project-card, .team-card, .page-value-card, .page-process__step"), 0.07, 0.08, "card");
      addList(section.querySelectorAll(".contact-form-panel, .contact-channel, .contact-faq__item"), 0.06, 0.1, "card");
      add(section.querySelector(".page-cta-band__inner"), 0.12);
      add(section.querySelector(".page-section__foot"), 0.14);
      add(section.querySelector(".project-filters"), 0.06);
      add(section.querySelector(".project-detail-body"), 0.08);
      addList(section.querySelectorAll(".project-detail__stat"), 0.06, 0.12, "card");
    });

    return items;
  }

  function applyRevealClasses(items) {
    items.forEach(function (item) {
      item.node.classList.add("hero-reveal");
      if (item.variant === "card") {
        item.node.classList.add("hero-reveal--card");
      }
      if (item.variant === "scene") {
        item.node.classList.add("hero-reveal--scene");
      }
      setDelay(item.node, item.delay);
    });
  }

  function init() {
    var items = collectRevealTargets();
    if (!items.length) return;

    applyRevealClasses(items);

    var nodes = items.map(function (item) {
      return item.node;
    });

    if (prefersReducedMotion()) {
      nodes.forEach(reveal);
      return;
    }

    if (!("IntersectionObserver" in window)) {
      nodes.forEach(reveal);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          observer.unobserve(entry.target);
        });
      },
      {
        root: scrollRoot,
        threshold: 0.1,
        rootMargin: "0px 0px -5% 0px",
      }
    );

    nodes.forEach(function (node) {
      observer.observe(node);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
