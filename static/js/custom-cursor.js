(function () {
  var cursor = document.getElementById("custom-cursor");
  if (!cursor) return;

  document.querySelectorAll(".case-card").forEach(function (card) {
    card.addEventListener("mouseenter", function () {
      cursor.classList.add("ativo");
    });
    card.addEventListener("mouseleave", function () {
      cursor.classList.remove("ativo");
    });
    card.addEventListener("mousemove", function (e) {
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
    });
  });
})();
