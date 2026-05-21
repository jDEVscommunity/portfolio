(function () {
  var container = document.getElementById("hero-floats");
  if (!container) return;

  var frame = container.closest(".hero__frame");
  var scene = frame && frame.querySelector(".hero__scene");
  var inner = frame && frame.querySelector(".hero__inner");
  if (!frame || !scene || !inner) return;

  var CELL_REM = 2;
  var FLOAT_SIZE_REM = 2.25;
  var FILL_RATIO = 0.38;
  var MIN_COUNT = 14;
  var MAX_COUNT = 32;
  var GAP_PX = 3;
  var RESTITUTION = 0.82;
  var MAX_SPEED = 28;
  var MAX_ROT_SPEED = 5;
  var TILT_CHANCE = 0.55;
  var TILT_WOBBLE = 4;

  var allVariants = [
    { src: container.dataset.chipLightLogo, alt: "" },
    { src: container.dataset.chipLightEmpty, alt: "" },
    { src: container.dataset.chipDarkLogo, alt: "" },
    { src: container.dataset.chipDarkEmpty, alt: "" },
  ];

  var particles = [];
  var rafId = 0;
  var lastTime = 0;
  var reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function remPx(rem) {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function shuffle(list) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    return list;
  }

  function pickVariant() {
    return allVariants[Math.floor(Math.random() * allVariants.length)];
  }

  function randomAxisTilt() {
    return {
      rx: rand(-34, 34),
      ry: rand(-34, 34),
      rz: rand(-28, 28),
    };
  }

  function getBounds() {
    return { w: scene.clientWidth, h: scene.clientHeight };
  }

  function getTextRectPx() {
    var sr = scene.getBoundingClientRect();
    var ir = inner.getBoundingClientRect();
    var margin = remPx(FLOAT_SIZE_REM * 0.45);

    return {
      left: ir.left - sr.left - margin,
      top: ir.top - sr.top - margin,
      right: ir.right - sr.left + margin,
      bottom: ir.bottom - sr.top + margin,
    };
  }

  function overlapsTextPx(cx, cy, r, textRect) {
    var closestX = clamp(cx, textRect.left, textRect.right);
    var closestY = clamp(cy, textRect.top, textRect.bottom);
    var dx = cx - closestX;
    var dy = cy - closestY;
    return dx * dx + dy * dy < (r + GAP_PX) * (r + GAP_PX);
  }

  function buildGridSlots(bounds, radius) {
    var cell = remPx(CELL_REM);
    var cols = Math.max(1, Math.floor(bounds.w / cell));
    var rows = Math.max(1, Math.floor(bounds.h / cell));
    var textRect = getTextRectPx();
    var slots = [];

    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        var x = (col + 0.5) * cell;
        var y = (row + 0.5) * cell;
        if (!overlapsTextPx(x, y, radius, textRect)) {
          slots.push({ x: x, y: y });
        }
      }
    }

    return slots;
  }

  function limitSpeed(p) {
    var speed = Math.hypot(p.vx, p.vy);
    if (speed > MAX_SPEED) {
      var scale = MAX_SPEED / speed;
      p.vx *= scale;
      p.vy *= scale;
    }
  }

  function resolvePair(a, b) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var dist = Math.hypot(dx, dy);
    var minDist = a.r + b.r + GAP_PX;

    if (!dist) {
      dx = rand(-1, 1);
      dy = rand(-1, 1);
      dist = Math.hypot(dx, dy) || 1;
    }

    if (dist >= minDist) return;

    var nx = dx / dist;
    var ny = dy / dist;
    var overlap = minDist - dist;
    var half = overlap * 0.5;

    a.x -= nx * half;
    a.y -= ny * half;
    b.x += nx * half;
    b.y += ny * half;

    var dvx = a.vx - b.vx;
    var dvy = a.vy - b.vy;
    var vn = dvx * nx + dvy * ny;

    if (vn < 0) {
      var impulse = (-(1 + RESTITUTION) * vn) / 2;
      a.vx += impulse * nx;
      a.vy += impulse * ny;
      b.vx -= impulse * nx;
      b.vy -= impulse * ny;
    }
  }

  function bounceWalls(p, bounds) {
    var r = p.r + GAP_PX;

    if (p.x - r < 0) {
      p.x = r;
      p.vx = Math.abs(p.vx) * RESTITUTION;
    } else if (p.x + r > bounds.w) {
      p.x = bounds.w - r;
      p.vx = -Math.abs(p.vx) * RESTITUTION;
    }

    if (p.y - r < 0) {
      p.y = r;
      p.vy = Math.abs(p.vy) * RESTITUTION;
    } else if (p.y + r > bounds.h) {
      p.y = bounds.h - r;
      p.vy = -Math.abs(p.vy) * RESTITUTION;
    }
  }

  function bounceText(p, textRect) {
    var r = p.r + GAP_PX;
    var closestX = clamp(p.x, textRect.left, textRect.right);
    var closestY = clamp(p.y, textRect.top, textRect.bottom);
    var dx = p.x - closestX;
    var dy = p.y - closestY;
    var distSq = dx * dx + dy * dy;

    if (distSq >= r * r) return;

    var dist = Math.sqrt(distSq);
    var nx;
    var ny;

    if (dist < 0.001) {
      nx = p.x < (textRect.left + textRect.right) / 2 ? -1 : 1;
      ny = p.y < (textRect.top + textRect.bottom) / 2 ? -1 : 1;
      dist = 1;
    } else {
      nx = dx / dist;
      ny = dy / dist;
    }

    var overlap = r - dist;
    p.x += nx * overlap;
    p.y += ny * overlap;

    var vn = p.vx * nx + p.vy * ny;
    if (vn < 0) {
      p.vx -= (1 + RESTITUTION) * vn * nx;
      p.vy -= (1 + RESTITUTION) * vn * ny;
    }
  }

  function applyTransform(p) {
    p.wrap.style.transform =
      "translate3d(" + p.x + "px," + p.y + "px,0) translate(-50%,-50%)";
    p.body.style.transform =
      "rotateX(" +
      p.rx +
      "deg) rotateY(" +
      p.ry +
      "deg) rotateZ(" +
      p.rz +
      "deg)";
  }

  function settleOverlaps(iterations) {
    var i;
    var j;
    var n = particles.length;

    for (i = 0; i < iterations; i++) {
      for (j = 0; j < n; j++) {
        bounceWalls(particles[j], getBounds());
        bounceText(particles[j], getTextRectPx());
      }
      for (j = 0; j < n; j++) {
        for (var k = j + 1; k < n; k++) {
          resolvePair(particles[j], particles[k]);
        }
      }
    }
  }

  function createParticle(slot, radius) {
    var variant = pickVariant();

    var wrap = document.createElement("div");
    wrap.className = "hero__float";

    var body = document.createElement("div");
    body.className = "hero__float-body";

    var img = document.createElement("img");
    img.className = "hero__float-img";
    img.src = variant.src;
    img.alt = variant.alt;
    img.width = 128;
    img.height = 128;
    img.decoding = "async";
    img.draggable = false;

    body.appendChild(img);
    wrap.appendChild(body);
    container.appendChild(wrap);

    var speed = reducedMotion ? 0 : rand(6, 16);
    var angle = rand(0, Math.PI * 2);
    var tilted = Math.random() < TILT_CHANCE;
    var axis = tilted ? randomAxisTilt() : { rx: 0, ry: 0, rz: 0 };

    if (tilted) {
      body.classList.add("hero__float-body--tilted");
    }

    return {
      wrap: wrap,
      body: body,
      r: radius,
      x: slot.x,
      y: slot.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      tilted: tilted,
      bx: axis.rx,
      by: axis.ry,
      bz: axis.rz,
      rx: axis.rx,
      ry: axis.ry,
      rz: axis.rz,
      vrx: reducedMotion ? 0 : rand(-MAX_ROT_SPEED, MAX_ROT_SPEED),
      vry: reducedMotion ? 0 : rand(-MAX_ROT_SPEED, MAX_ROT_SPEED),
      vrz: reducedMotion ? 0 : rand(-MAX_ROT_SPEED, MAX_ROT_SPEED),
    };
  }

  function updateRotation(p, dt) {
    if (reducedMotion) return;

    p.rx += p.vrx * dt;
    p.ry += p.vry * dt;
    p.rz += p.vrz * dt;

    if (p.tilted) {
      if (p.rx < p.bx - TILT_WOBBLE || p.rx > p.bx + TILT_WOBBLE) p.vrx *= -1;
      if (p.ry < p.by - TILT_WOBBLE || p.ry > p.by + TILT_WOBBLE) p.vry *= -1;
      if (p.rz < p.bz - TILT_WOBBLE || p.rz > p.bz + TILT_WOBBLE) p.vrz *= -1;
      p.rx = clamp(p.rx, p.bx - TILT_WOBBLE, p.bx + TILT_WOBBLE);
      p.ry = clamp(p.ry, p.by - TILT_WOBBLE, p.by + TILT_WOBBLE);
      p.rz = clamp(p.rz, p.bz - TILT_WOBBLE, p.bz + TILT_WOBBLE);
      return;
    }

    if (p.rx > 12 || p.rx < -12) p.vrx *= -1;
    if (p.ry > 14 || p.ry < -14) p.vry *= -1;
    if (p.rz > 8 || p.rz < -8) p.vrz *= -1;
    p.rx = clamp(p.rx, -12, 12);
    p.ry = clamp(p.ry, -14, 14);
    p.rz = clamp(p.rz, -8, 8);
  }

  function tick(now) {
    if (!particles.length) return;

    var dt = Math.min((now - lastTime) / 1000, 0.032);
    lastTime = now;
    var bounds = getBounds();
    var textRect = getTextRectPx();
    var i;
    var j;
    var n = particles.length;
    var p;

    for (i = 0; i < n; i++) {
      p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      updateRotation(p, dt);

      bounceWalls(p, bounds);
      bounceText(p, textRect);
      limitSpeed(p);
    }

    for (var pass = 0; pass < 2; pass++) {
      for (i = 0; i < n; i++) {
        for (j = i + 1; j < n; j++) {
          resolvePair(particles[i], particles[j]);
        }
      }
    }

    for (i = 0; i < n; i++) {
      applyTransform(particles[i]);
    }

    rafId = window.requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  function rebuild() {
    stopLoop();
    container.replaceChildren();
    particles = [];

    var bounds = getBounds();
    var radius = remPx(FLOAT_SIZE_REM) / 2;
    var slots = shuffle(buildGridSlots(bounds, radius));
    var count = Math.max(
      MIN_COUNT,
      Math.min(MAX_COUNT, Math.floor(slots.length * FILL_RATIO))
    );
    count = Math.min(count, slots.length);

    for (var i = 0; i < count; i++) {
      particles.push(createParticle(slots[i], radius));
    }

    settleOverlaps(10);

    for (i = 0; i < particles.length; i++) {
      applyTransform(particles[i]);
    }

    if (!reducedMotion) {
      lastTime = performance.now();
      rafId = window.requestAnimationFrame(tick);
    }
  }

  rebuild();

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(rebuild, 180);
  });

  window.addEventListener(
    "pagehide",
    function () {
      stopLoop();
    },
    { once: true }
  );
})();
