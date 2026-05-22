(function () {
  "use strict";

  var form = document.getElementById("contact-form");
  if (!form) return;

  var submitBtn = form.querySelector(".contact-form__submit");
  var feedback = document.getElementById("contact-form-feedback");
  if (!submitBtn || !feedback) return;

  var defaultLabel = submitBtn.textContent.trim();
  var resetTimer = null;

  var MSG_SUCCESS = "Mensagem enviada com sucesso!";
  var MSG_ERROR = "Erro ao enviar. Tente novamente.";

  function hideFeedback() {
    feedback.hidden = true;
    feedback.textContent = "";
    feedback.className = "contact-form__feedback";
  }

  function showFeedback(type, message) {
    feedback.textContent = message;
    feedback.className = "contact-form__feedback contact-form__feedback--" + type;
    feedback.hidden = false;
  }

  function resetForm() {
    clearTimeout(resetTimer);
    resetTimer = null;
    form.reset();
    submitBtn.disabled = false;
    submitBtn.textContent = defaultLabel;
    hideFeedback();
  }

  function scheduleReset() {
    clearTimeout(resetTimer);
    resetTimer = setTimeout(resetForm, 4000);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearTimeout(resetTimer);

    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";
    hideFeedback();

    fetch(form.getAttribute("action") || window.location.pathname, {
      method: "POST",
      body: new FormData(form),
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    })
      .then(function (res) {
        return res
          .json()
          .catch(function () {
            return {};
          })
          .then(function (data) {
            if (res.ok) {
              showFeedback("success", MSG_SUCCESS);
            } else {
              showFeedback("error", data.message || MSG_ERROR);
            }
            submitBtn.disabled = false;
            submitBtn.textContent = defaultLabel;
            scheduleReset();
          });
      })
      .catch(function () {
        showFeedback("error", MSG_ERROR);
        submitBtn.disabled = false;
        submitBtn.textContent = defaultLabel;
        scheduleReset();
      });
  });
})();
