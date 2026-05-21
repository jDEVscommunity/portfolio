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

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
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
