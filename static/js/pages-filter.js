(function () {
  "use strict";

  var grid = document.getElementById("project-grid");
  if (!grid) return;

  var buttons = document.querySelectorAll(".project-filters__btn");
  var cards = grid.querySelectorAll(".project-card");

  function setActive(btn) {
    buttons.forEach(function (b) {
      b.classList.toggle("project-filters__btn--active", b === btn);
      b.setAttribute("aria-pressed", b === btn ? "true" : "false");
    });
  }

  function filter(category) {
    cards.forEach(function (card) {
      var match =
        category === "all" || card.getAttribute("data-category") === category;
      card.classList.toggle("is-hidden", !match);
      card.hidden = !match;
    });
  }

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setActive(btn);
      filter(btn.getAttribute("data-filter") || "all");
    });
  });
})();
