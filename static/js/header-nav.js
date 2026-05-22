(function () {
  const header = document.getElementById("site-header");
  const btn = document.getElementById("site-header-menu-btn");
  const nav = document.getElementById("site-nav");
  const overlay = document.getElementById("site-header-overlay");
  const label = btn && btn.querySelector(".site-header__menu-label");
  const scrollRoot = document.querySelector(".page-container");

  if (!header || !btn || !nav) return;

  const openText = "Abrir menu";
  const closeText = "Fechar menu";

  function setOpen(open) {
    header.classList.toggle("is-nav-open", open);
    btn.setAttribute("aria-expanded", String(open));
    if (label) label.textContent = open ? closeText : openText;
    if (overlay) overlay.hidden = !open;
    document.documentElement.classList.toggle("nav-open", open);
    if (scrollRoot) scrollRoot.style.overflow = open ? "hidden" : "";
  }

  btn.addEventListener("click", function () {
    setOpen(!header.classList.contains("is-nav-open"));
  });

  if (overlay) {
    overlay.addEventListener("click", function () {
      setOpen(false);
    });
  }

  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      setOpen(false);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setOpen(false);
  });

  var desktop = window.matchMedia("(min-width: 769px)");
  function onBreakpoint(e) {
    if (e.matches) setOpen(false);
  }
  if (typeof desktop.addEventListener === "function") {
    desktop.addEventListener("change", onBreakpoint);
  } else if (typeof desktop.addListener === "function") {
    desktop.addListener(onBreakpoint);
  }
})();
