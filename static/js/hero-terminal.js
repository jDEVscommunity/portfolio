(function () {
  var root = document.getElementById("hero-terminal");
  var source = document.getElementById("hero-terminal-source");
  if (!root || !source) return;

  var codeEl = document.getElementById("hero-terminal-code");
  var codeWrap = document.getElementById("hero-terminal-code-wrap");
  var stageEl = document.getElementById("hero-terminal-stage");
  var filenameEl = document.getElementById("hero-terminal-filename");
  var variantsWrap = document.getElementById("hero-terminal-variants");
  var variantLabel = document.getElementById("hero-terminal-variant-label");
  var variantBtns = document.getElementById("hero-terminal-variant-btns");
  var langBtns = root.querySelectorAll(".hero-terminal__lang");
  var toolbarEl = root.querySelector(".hero-terminal__toolbar");
  var bodyEl = root.querySelector(".hero-terminal__body");

  var ANIMATION_CODE = "<animation play> </animation>";
  var AUTO_PLAY_DELAY = 200;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var STEP_DELAY = reducedMotion ? 80 : 420;

  var VARIANTS = {
    ts: {
      label: "Estilo",
      options: [
        { id: "conv", label: "Convencional", filename: "hero.ts" },
        { id: "react", label: "React", filename: "Hero.tsx" },
      ],
    },
    python: {
      label: "Estilo",
      options: [
        { id: "conv", label: "Convencional", filename: "hero.py" },
        { id: "flask", label: "Flask", filename: "hero.py" },
      ],
    },
    php: {
      label: "Estilo",
      options: [
        { id: "conv", label: "Convencional", filename: "hero.php" },
        { id: "laravel", label: "Laravel", filename: "hero.php" },
      ],
    },
  };

  var FILENAMES = {
    html: "index.html",
    js: "hero.js",
  };

  var state = { view: "animation", lang: "html", variant: "conv" };
  var heroContent = collectContent();
  var playing = false;
  var playTimer = null;
  var stepTimers = [];
  var layoutRaf = null;
  var peakToolbarH = 0;
  var lastToolbarH = 0;
  var lastBodyH = 0;
  var mobileMq = window.matchMedia("(max-width: 768px)");

  if (root.parentNode) {
    var oldTrack = root.parentNode.querySelector(".hero-terminal__scroll-track");
    if (oldTrack) oldTrack.remove();
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function q(str) {
    return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  }

  function collectContent() {
    var inner = source.querySelector(".hero__inner--primary");
    if (!inner) return null;

    var titleEl = inner.querySelector(".hero__title");
    var titleLines = [];
    inner.querySelectorAll(".hero__title-line").forEach(function (line) {
      titleLines.push(line.textContent.trim());
    });
    var titleEmphasis =
      titleEl && titleEl.dataset.titleEmphasis ? titleEl.dataset.titleEmphasis : "";

    var highlights = [];
    inner.querySelectorAll(".hero__highlight").forEach(function (item) {
      var value = item.querySelector(".hero__highlight-value");
      var label = item.querySelector(".hero__highlight-label");
      highlights.push({
        value: value ? value.textContent.trim() : "",
        label: label ? label.textContent.trim() : "",
      });
    });

    var eyebrow = inner.querySelector(".hero__eyebrow");
    var lead = inner.querySelector(".hero__lead");

    return {
      eyebrow: eyebrow ? eyebrow.textContent.trim() : "",
      titleLines: titleLines,
      titleEmphasis: titleEmphasis,
      lead: lead ? lead.textContent.trim() : "",
      highlights: highlights,
    };
  }

  function buildHtml(c) {
    var title = c.titleLines.join("\n");
    var stats = c.highlights
      .map(function (h) {
        return "    <li><strong>" + h.value + "</strong> " + h.label + "</li>";
      })
      .join("\n");

    return (
      "<main class=\"hero\">\n" +
      "  <p class=\"eyebrow\">" + c.eyebrow + "</p>\n" +
      "  <h1>" + title + "</h1>\n" +
      "  <p class=\"lead\">" + c.lead + "</p>\n" +
      "  <ul class=\"stats\">\n" +
      stats +
      "\n  </ul>\n" +
      "</main>"
    );
  }

  function buildJs(c) {
    var title = c.titleLines.map(function (l) {
      return "'" + q(l) + "'";
    });
    var stats = c.highlights
      .map(function (h) {
        return "    { value: '" + q(h.value) + "', label: '" + q(h.label) + "' }";
      })
      .join(",\n");

    return (
      "const hero = {\n" +
      "  eyebrow: '" + q(c.eyebrow) + "',\n" +
      "  title: [\n    " + title.join(",\n    ") + "\n  ],\n" +
      "  lead: '" + q(c.lead) + "',\n" +
      "  stats: [\n" + stats + "\n  ],\n" +
      "};"
    );
  }

  function buildTs(c, variant) {
    if (variant === "react") {
      var title = c.titleLines
        .map(function (l) {
          return "      <span>{'" + q(l) + "'}</span>";
        })
        .join("\n");
      var stats = c.highlights
        .map(function (h) {
          return (
            "        <li>\n" +
            "          <strong>{'" + q(h.value) + "'}</strong> " + h.label + "\n" +
            "        </li>"
          );
        })
        .join("\n");

      return (
        "export function Hero() {\n" +
        "  return (\n" +
        "    <main className=\"hero\">\n" +
        "      <p className=\"eyebrow\">" + c.eyebrow + "</p>\n" +
        "      <h1>\n" + title + "\n" +
        "      </h1>\n" +
        "      <p className=\"lead\">" + c.lead + "</p>\n" +
        "      <ul className=\"stats\">\n" + stats + "\n" +
        "      </ul>\n" +
        "    </main>\n" +
        "  );\n" +
        "}"
      );
    }

    var title = c.titleLines.map(function (l) {
      return "    '" + q(l) + "'";
    });
    var stats = c.highlights
      .map(function (h) {
        return "    { value: '" + q(h.value) + "', label: '" + q(h.label) + "' }";
      })
      .join(",\n");

    return (
      "const hero = {\n" +
      "  eyebrow: '" + q(c.eyebrow) + "' as const,\n" +
      "  title: [\n" + title.join(",\n") + "\n  ],\n" +
      "  lead: '" + q(c.lead) + "',\n" +
      "  stats: [\n" + stats + "\n  ],\n" +
      "} satisfies Record<string, unknown>;"
    );
  }

  function buildPython(c, variant) {
    if (variant === "flask") {
      return (
        "from flask import Flask\n\n" +
        "app = Flask(__name__)\n\n" +
        "HERO = {\n" +
        "    \"eyebrow\": \"" + c.eyebrow.replace(/"/g, '\\"') + "\",\n" +
        "    \"title\": " + JSON.stringify(c.titleLines) + ",\n" +
        "    \"lead\": \"" + c.lead.replace(/"/g, '\\"') + "\",\n" +
        "}\n\n" +
        "@app.route(\"/\")\n" +
        "def hero():\n" +
        "    return render_template(\"hero.html\", **HERO)"
      );
    }

    var title = c.titleLines.map(function (l) {
      return '        "' + l.replace(/"/g, '\\"') + '"';
    });
    var stats = c.highlights
      .map(function (h) {
        return (
          '        {"value": "' +
          h.value.replace(/"/g, '\\"') +
          '", "label": "' +
          h.label.replace(/"/g, '\\"') +
          '"}'
        );
      })
      .join(",\n");

    return (
      "hero = {\n" +
      '    "eyebrow": "' + c.eyebrow.replace(/"/g, '\\"') + '",\n' +
      '    "title": [\n' + title.join(",\n") + "\n    ],\n" +
      '    "lead": "' + c.lead.replace(/"/g, '\\"') + '",\n' +
      '    "stats": [\n' + stats + "\n    ],\n" +
      "}"
    );
  }

  function buildPhp(c, variant) {
    if (variant === "laravel") {
      return (
        "<?php\n\n" +
        "return [\n" +
        "    'eyebrow' => '" + q(c.eyebrow) + "',\n" +
        "    'title' => " +
        "[" +
        c.titleLines.map(function (l) {
          return "'" + q(l) + "'";
        }).join(", ") +
        "],\n" +
        "    'lead' => '" + q(c.lead) + "',\n" +
        "    'stats' => [\n" +
        c.highlights
          .map(function (h) {
            return "        ['value' => '" + q(h.value) + "', 'label' => '" + q(h.label) + "']";
          })
          .join(",\n") +
        "\n    ],\n" +
        "];"
      );
    }

    var title = c.titleLines.map(function (l) {
      return "        '" + q(l) + "'";
    });
    var stats = c.highlights
      .map(function (h) {
        return "        ['value' => '" + q(h.value) + "', 'label' => '" + q(h.label) + "']";
      })
      .join(",\n");

    return (
      "<?php\n\n" +
      "$hero = [\n" +
      "    'eyebrow' => '" + q(c.eyebrow) + "',\n" +
      "    'title' => [\n" + title.join(",\n") + "\n    ],\n" +
      "    'lead' => '" + q(c.lead) + "',\n" +
      "    'stats' => [\n" + stats + "\n    ],\n" +
      "];"
    );
  }

  function getSnippet(lang, variant) {
    if (!heroContent) return { code: "", filename: "", language: "" };

    var entry = VARIANTS[lang];
    var filename = FILENAMES[lang] || "hero.txt";
    var language = lang;

    if (entry) {
      var opt = entry.options.find(function (o) {
        return o.id === variant;
      });
      if (opt) filename = opt.filename;
    }

    if (lang === "html") {
      return { code: buildHtml(heroContent), filename: filename, language: "html" };
    }
    if (lang === "js") {
      return { code: buildJs(heroContent), filename: filename, language: "javascript" };
    }
    if (lang === "ts") {
      return { code: buildTs(heroContent, variant), filename: filename, language: "typescript" };
    }
    if (lang === "python") {
      return { code: buildPython(heroContent, variant), filename: filename, language: "python" };
    }
    if (lang === "php") {
      return { code: buildPhp(heroContent, variant), filename: filename, language: "php" };
    }

    return { code: "", filename: filename, language: language };
  }

  function highlight(code, language) {
    var raw = escapeHtml(code);

    if (language === "html") {
      return raw
        .replace(
          /(&lt;\/?)([\w-]+)([^&]*?)(&gt;)/g,
          '$1<span class="tok-tag">$2</span>$3$4'
        )
        .replace(/(class|className)=("[^"]*")/g, '$1=<span class="tok-str">$2</span>')
        .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="tok-cmt">$1</span>');
    }

    if (language === "javascript" || language === "typescript") {
      return raw
        .replace(/(\/\/.*$)/gm, '<span class="tok-cmt">$1</span>')
        .replace(/('[^']*'|`[^`]*`)/g, '<span class="tok-str">$1</span>')
        .replace(
          /(&lt;\/?)([\w]+)([^&]*?)(&gt;)/g,
          '$1<span class="tok-tag">$2</span>$3$4'
        )
        .replace(
          /\b(const|let|var|function|return|export|as|satisfies|Record|unknown)\b/g,
          '<span class="tok-kw">$1</span>'
        );
    }

    if (language === "python") {
      return raw
        .replace(/(#.*$)/gm, '<span class="tok-cmt">$1</span>')
        .replace(/("[^"]*"|'[^']*')/g, '<span class="tok-str">$1</span>')
        .replace(
          /\b(from|import|def|return|Flask|app|route|render_template)\b/g,
          '<span class="tok-kw">$1</span>'
        );
    }

    if (language === "php") {
      return raw
        .replace(/(\/\/.*$)/gm, '<span class="tok-cmt">$1</span>')
        .replace(/('[^']*'|"[^"]*")/g, '<span class="tok-str">$1</span>')
        .replace(/\b(php|use|function|return|echo)\b/g, '<span class="tok-kw">$1</span>')
        .replace(/(&lt;\?php)/g, '<span class="tok-kw">$1</span>');
    }

    return raw;
  }

  function renderAnimationCode() {
    var raw = escapeHtml(ANIMATION_CODE);
    codeEl.className = "language-markup";
    codeEl.innerHTML = raw.replace(
      /(&lt;)(animation)(\s+)(play)(&gt;)(\s*)(&lt;\/)(animation)(&gt;)/,
      '$1<span class="tok-tag">$2</span>$3' +
        '<button type="button" class="tok-attr" id="hero-terminal-play" aria-label="Executar animação">$4</button>$5$6' +
        '$7<span class="tok-tag">$8</span>$9'
    );
    filenameEl.textContent = "hero.animation";

    var playBtn = document.getElementById("hero-terminal-play");
    if (playBtn) {
      playBtn.addEventListener("click", onPlayClick);
    }
  }

  function onPlayClick(e) {
    e.preventDefault();
    e.stopPropagation();
    startAnimation();
  }

  function renderSnippet() {
    var snippet = getSnippet(state.lang, state.variant);
    codeEl.className = "language-" + snippet.language;
    codeEl.innerHTML = highlight(snippet.code, snippet.language);
    filenameEl.textContent = snippet.filename;
  }

  function renderCode() {
    if (state.view === "animation") {
      renderAnimationCode();
    } else {
      renderSnippet();
    }
    scheduleLayoutSync();
  }

  function renderVariants(lang) {
    variantBtns.innerHTML = "";
    var entry = VARIANTS[lang];

    if (!entry || state.view === "animation") {
      variantsWrap.hidden = true;
      return;
    }

    variantsWrap.hidden = false;
    variantLabel.textContent = entry.label;

    entry.options.forEach(function (opt) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hero-terminal__variant";
      btn.textContent = opt.label;
      btn.dataset.variant = opt.id;
      if (opt.id === state.variant) {
        btn.classList.add("is-active");
        btn.setAttribute("aria-pressed", "true");
      } else {
        btn.setAttribute("aria-pressed", "false");
      }
      btn.addEventListener("click", function () {
        state.variant = opt.id;
        lastBodyH = 0;
        renderVariants(lang);
        renderCode();
      });
      variantBtns.appendChild(btn);
    });
    scheduleLayoutSync();
  }

  function isMobileLayout() {
    return mobileMq.matches;
  }

  function minBodyHeightPx() {
    if (window.matchMedia("(max-width: 480px)").matches) return 320;
    if (mobileMq.matches) return 352;
    var raw = getComputedStyle(root).getPropertyValue("--hero-terminal-body-height").trim();
    if (raw.endsWith("rem")) return parseFloat(raw, 10) * 16;
    if (raw.endsWith("px")) return parseFloat(raw, 10);
    return 320;
  }

  function measureToolbarNatural() {
    if (!toolbarEl) return 0;
    var prevHeight = toolbarEl.style.height;
    var prevMax = toolbarEl.style.maxHeight;
    toolbarEl.style.height = "auto";
    toolbarEl.style.maxHeight = "none";
    var h = Math.ceil(toolbarEl.getBoundingClientRect().height);
    toolbarEl.style.height = prevHeight;
    toolbarEl.style.maxHeight = prevMax;
    return h;
  }

  function primePeakToolbar() {
    if (!isMobileLayout() || !variantsWrap) return;

    var wasHidden = variantsWrap.hidden;
    var savedHtml = variantBtns.innerHTML;
    var entry = VARIANTS.php;

    variantsWrap.hidden = false;
    variantLabel.textContent = entry.label;
    variantBtns.innerHTML = "";
    entry.options.forEach(function (opt) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hero-terminal__variant";
      btn.textContent = opt.label;
      variantBtns.appendChild(btn);
    });

    peakToolbarH = measureToolbarNatural();
    lastToolbarH = 0;
    lastBodyH = 0;
    variantBtns.innerHTML = savedHtml;
    variantsWrap.hidden = wasHidden;
  }

  function syncToolbarHeight() {
    if (!toolbarEl) return;

    var h = measureToolbarNatural();
    if (isMobileLayout()) {
      peakToolbarH = Math.max(peakToolbarH, h);
      h = peakToolbarH;
    }
    if (h === lastToolbarH) return;
    lastToolbarH = h;
    root.style.setProperty("--hero-terminal-toolbar-h", h + "px");
  }

  function syncBodyHeight() {
    if (!bodyEl) return;

    var prevMin = bodyEl.style.minHeight;
    bodyEl.style.minHeight = "0";
    var natural = Math.ceil(bodyEl.scrollHeight);
    bodyEl.style.minHeight = prevMin;

    var h = Math.max(minBodyHeightPx(), natural);
    if (h === lastBodyH) return;
    lastBodyH = h;
    root.style.setProperty("--hero-terminal-body-height", h + "px");
  }

  function syncTerminalLayout() {
    layoutRaf = null;
    syncToolbarHeight();
    syncBodyHeight();
  }

  function scheduleLayoutSync() {
    if (layoutRaf) cancelAnimationFrame(layoutRaf);
    layoutRaf = requestAnimationFrame(function () {
      layoutRaf = requestAnimationFrame(syncTerminalLayout);
    });
  }

  function showAnimView(options) {
    if (!heroContent) return;

    var replay = !options || options.replay !== false;

    clearTimers();
    playing = false;
    codeWrap.hidden = true;
    stageEl.hidden = false;
    filenameEl.textContent = "hero.animation";

    var steps = buildStage(heroContent);
    steps.forEach(function (step) {
      step.classList.remove("is-visible");
    });

    if (replay) {
      playing = true;
      setPhase("play");
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          revealSteps(steps, 0);
        });
      });
    } else {
      steps.forEach(function (step) {
        step.classList.add("is-visible");
      });
      var highlights = stageEl.querySelector(".hero__highlights");
      if (highlights && window.HeroCountUp) {
        window.HeroCountUp.animateWithin(highlights, { force: true });
      }
      setPhase("done");
    }
    scheduleLayoutSync();
  }

  function showLangView() {
    if (!heroContent) return;

    setPhase("lang");
    codeWrap.hidden = false;
    stageEl.hidden = false;
    renderCode();

    var steps = buildStage(heroContent);
    steps.forEach(function (step) {
      step.classList.add("is-visible");
    });

    var highlights = stageEl.querySelector(".hero__highlights");
    if (highlights && window.HeroCountUp) {
      window.HeroCountUp.animateWithin(highlights, { force: true });
    }
    scheduleLayoutSync();
  }

  function setActiveTab(btn) {
    langBtns.forEach(function (b) {
      var active = b === btn;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function selectAnimationTab(btn) {
    state.view = "animation";
    setActiveTab(btn);
    variantsWrap.hidden = true;
    showAnimView({ replay: true });
  }

  function selectLangTab(btn) {
    clearTimers();
    playing = false;
    lastBodyH = 0;
    state.view = "snippet";
    state.lang = btn.dataset.lang;

    var entry = VARIANTS[state.lang];
    if (entry) {
      var has = entry.options.some(function (o) {
        return o.id === state.variant;
      });
      if (!has) state.variant = entry.options[0].id;
    }

    setActiveTab(btn);
    renderVariants(state.lang);
    showLangView();
  }

  function clearTimers() {
    if (playTimer) {
      clearTimeout(playTimer);
      playTimer = null;
    }
    stepTimers.forEach(clearTimeout);
    stepTimers = [];
  }

  function setPhase(phase) {
    root.classList.remove(
      "is-phase-code",
      "is-phase-play",
      "is-phase-done",
      "is-phase-lang",
      "is-phase-anim"
    );
    root.classList.add("is-phase-" + phase);
    scheduleLayoutSync();
  }

  function eyebrowLengthClass(text) {
    var len = String(text || "").trim().length;
    if (len > 30) return "hero__eyebrow--long";
    if (len > 18) return "hero__eyebrow--medium";
    return "hero__eyebrow--short";
  }

  function buildStage(content) {
    stageEl.innerHTML = "";
    stageEl.className = "hero-terminal__stage hero__inner hero__inner--secondary";

    if (content.eyebrow) {
      var eyebrow = document.createElement("p");
      eyebrow.className =
        "hero__eyebrow hero__eyebrow--decorated " +
        eyebrowLengthClass(content.eyebrow) +
        " hero-terminal__step";
      eyebrow.textContent = content.eyebrow;
      stageEl.appendChild(eyebrow);
    }

    if (content.titleLines.length) {
      var title = document.createElement("h1");
      title.className = "hero__title hero-terminal__step";
      if (content.titleEmphasis) {
        title.dataset.titleEmphasis = content.titleEmphasis;
      }
      content.titleLines.forEach(function (line, index) {
        var span = document.createElement("span");
        span.className = "hero__title-line";
        var isLast = index === content.titleLines.length - 1;
        var emphasis = content.titleEmphasis || "";
        var emphIndex = emphasis ? line.indexOf(emphasis) : -1;
        if (emphIndex !== -1) {
          span.appendChild(document.createTextNode(line.slice(0, emphIndex)));
          var emph = document.createElement("span");
          emph.className = "hero__title-emphasis";
          emph.textContent = emphasis;
          span.appendChild(emph);
          var rest = line.slice(emphIndex + emphasis.length);
          if (isLast && rest.slice(-1) === ".") {
            span.appendChild(document.createTextNode(rest.slice(0, -1)));
            var mark = document.createElement("span");
            mark.className = "hero__title-mark";
            mark.textContent = ".";
            span.appendChild(mark);
          } else {
            span.appendChild(document.createTextNode(rest));
          }
        } else if (isLast && line.slice(-1) === ".") {
          span.appendChild(document.createTextNode(line.slice(0, -1)));
          var mark = document.createElement("span");
          mark.className = "hero__title-mark";
          mark.textContent = ".";
          span.appendChild(mark);
        } else {
          span.textContent = line;
        }
        title.appendChild(span);
      });
      stageEl.appendChild(title);
    }

    if (content.lead) {
      var lead = document.createElement("p");
      lead.className = "hero__lead hero-terminal__step";
      lead.textContent = content.lead;
      stageEl.appendChild(lead);
    }

    if (content.highlights.length) {
      var list = document.createElement("ul");
      list.className = "hero__highlights hero-terminal__step";
      list.setAttribute("aria-label", "Diferenciais");
      content.highlights.forEach(function (item) {
        var li = document.createElement("li");
        li.className = "hero__highlight";
        var value = document.createElement("span");
        value.className = "hero__highlight-value";
        value.setAttribute("data-count-to", item.value);
        value.textContent = item.value;
        var label = document.createElement("span");
        label.className = "hero__highlight-label";
        label.textContent = item.label;
        li.appendChild(value);
        li.appendChild(label);
        list.appendChild(li);
      });
      stageEl.appendChild(list);
    }

    return stageEl.querySelectorAll(".hero-terminal__step");
  }

  function revealSteps(steps, index) {
    if (index >= steps.length) {
      setPhase("done");
      playing = false;
      scheduleLayoutSync();
      return;
    }

    steps[index].classList.add("is-visible");
    if (window.HeroCountUp && steps[index].querySelector(".hero__highlight-value")) {
      window.HeroCountUp.animateWithin(steps[index], { force: true });
    }
    var timer = setTimeout(function () {
      revealSteps(steps, index + 1);
    }, STEP_DELAY);
    stepTimers.push(timer);
  }

  function scheduleAutoPlay() {
    playTimer = setTimeout(function () {
      showAnimView({ replay: true });
    }, AUTO_PLAY_DELAY);
  }

  langBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (btn.dataset.view === "animation") {
        selectAnimationTab(btn);
      } else {
        selectLangTab(btn);
      }
    });
  });

  state.view = "animation";
  setPhase("anim");
  codeWrap.hidden = true;
  stageEl.hidden = true;
  filenameEl.textContent = "hero.animation";
  primePeakToolbar();
  scheduleLayoutSync();
  scheduleAutoPlay();

  if (typeof ResizeObserver !== "undefined" && toolbarEl) {
    var layoutObserver = new ResizeObserver(function () {
      scheduleLayoutSync();
    });
    layoutObserver.observe(toolbarEl);
    if (bodyEl) layoutObserver.observe(bodyEl);
  }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (isMobileLayout() && peakToolbarH === 0) primePeakToolbar();
      scheduleLayoutSync();
    }, 120);
  });

  if (mobileMq.addEventListener) {
    mobileMq.addEventListener("change", function () {
      peakToolbarH = 0;
      primePeakToolbar();
      scheduleLayoutSync();
    });
  }

  root.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && state.view === "animation") {
      showAnimView({ replay: true });
    }
  });
})();
