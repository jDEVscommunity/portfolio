(function () {
  const STORAGE_KEY = "jdevs-theme";

  function getStoredTheme() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") return stored;
    } catch (_) {}
    return null;
  }

  function getPreferredTheme() {
    return getStoredTheme() ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }

  function applyFavicon(theme) {
    const fav = window.__jdevsFavicon;
    if (fav) {
      const set = fav[theme] || fav.light;
      document.querySelectorAll("link[data-favicon]").forEach((link) => {
        const size = link.getAttribute("sizes");
        if (size === "32x32") link.href = set["32"];
        else if (size === "16x16") link.href = set["16"];
        else if (size === "180x180") link.href = set["180"];
      });
    }
    const colors = window.__jdevsThemeColor;
    const metaTheme = document.getElementById("meta-theme-color");
    if (colors && metaTheme) {
      metaTheme.setAttribute("content", colors[theme] || colors.light);
    }
  }

  window.jdevsApplyFavicon = applyFavicon;

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    applyFavicon(theme);
    const label = theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro";
    const btn = document.getElementById("theme-toggle");
    const tip = document.getElementById("theme-toggle-tooltip");
    if (btn) btn.removeAttribute("title");
    if (tip) tip.textContent = label;
  }

  function setTheme(theme) {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (_) {}
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    setTheme(current === "dark" ? "light" : "dark");
  }

  window.jdevsTheme = { getPreferredTheme, applyTheme, setTheme, toggleTheme };

  document.addEventListener("DOMContentLoaded", function () {
    applyTheme(getPreferredTheme());
    const btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.removeAttribute("title");
      btn.addEventListener("click", toggleTheme);
    }
  });

  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
    if (!getStoredTheme()) setTheme(e.matches ? "dark" : "light");
  });
})();
