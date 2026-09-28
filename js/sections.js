/* ==========================================================================
   IntegroLabs — Bloques interactivos
   Franja de recorrido · comparador antes/después · stepper del método ·
   carrusel · equipo · mockup de chat.
   Depende de main.js (prefersReducedMotion, WHATSAPP_NUMBER, lenisInstance)
   y de icons.js (ilIcon, ilHydrate).
   ========================================================================== */

/* ---------- Configuración editable (equipo) ----------
   Rutas de las fotos y perfiles de LinkedIn. Si una foto no existe o no
   carga, se muestran las iniciales. Si LINKEDIN_* está vacío, no se muestra
   el ícono. */
const PHOTO_JM = ""; // ej. "assets/team/juan-manuel.jpg" (vacío = se muestran las iniciales)
const PHOTO_JL = ""; // ej. "assets/team/jean-lucas.jpg"
const LINKEDIN_JM = ""; // TODO: URL del perfil de Juan Manuel Chacin
const LINKEDIN_JL = ""; // TODO: URL del perfil de Jean Lucas Bello

document.addEventListener("DOMContentLoaded", () => {
  initFlowStrip();
  initCompare();
  initStepper();
  initCarousel();
  initTeam();
  initChat();
});

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/* Ejecuta start()/stop() según la visibilidad del elemento. */
function whenVisible(el, onChange, threshold = 0) {
  const io = new IntersectionObserver((entries) => onChange(entries[0].isIntersecting), { threshold });
  io.observe(el);
  return io;
}

/* ==========================================================================
   1. Franja animada: recorrido del cliente
   Un solo bucle rAF mueve la franja (translateX) y el punto a la vez para
   que nunca se desincronicen. Velocidad de la franja = separación / 1.8 s,
   así el punto se queda en la misma zona de pantalla (~30% desde la izq.).
   ========================================================================== */
function initFlowStrip() {
  const root = document.getElementById("flow");
  const track = document.getElementById("flowTrack");
  if (!root || !track) return;

  const STAGES = [
    ["Anuncio", "megaphone"], ["Landing", "layout-template"], ["Lead", "user-plus"], ["WhatsApp", "message-circle"],
    ["Respuesta automática", "bot"], ["Calificación", "filter"], ["CRM", "database"],
    ["Asesor", "headset"], ["Oferta", "file-text"], ["Venta", "circle-dollar-sign"],
    ["Seguimiento", "refresh-cw"],
  ];
  const N = STAGES.length;
  const T_MOVE = 0.9, T_CYCLE = 1.8; // 0.9 s de tramo + 0.9 s de pausa

  let D = 170, L = N * D, x0 = 0, els = [], dot = null;
  let t = 0, last = 0, raf = 0, visible = false, lastKey = "";
  let staticTimer = 0;

  function build() {
    const W = root.clientWidth;
    D = W < 760 ? 130 : 170;
    L = N * D;
    const copies = Math.ceil(W / L) + 2;
    x0 = 0.3 * W - D / 2;

    track.innerHTML = "";
    els = [];
    for (let g = 0; g < copies * N; g++) {
      const [label, icon] = STAGES[g % N];
      const s = document.createElement("div");
      s.className = "flow__stage";
      s.style.left = `${g * D}px`;
      s.style.width = `${D}px`;
      s.innerHTML =
        `<span class="flow__node"></span><span class="flow__label">${window.ilIcon(icon, 14)}<span>${label}</span></span>`;
      track.appendChild(s);
      els.push(s);
    }
    dot = document.createElement("span");
    dot.className = "flow__dot";
    track.appendChild(dot);
    lastKey = "";
  }

  function setStates(activeG, trailGs) {
    const key = activeG + "|" + trailGs.join(",");
    if (key === lastKey) return;
    lastKey = key;
    els.forEach((el, g) => {
      el.classList.toggle("is-active", g === activeG);
      el.classList.toggle("is-trail", trailGs.includes(g));
    });
  }

  function render(time) {
    // todo se deriva de "tt" (un ciclo completo = N * 1.8 s) para que
    // franja, punto y etapa activa se reinicien exactamente a la vez.
    const tt = time % (N * T_CYCLE);
    const v = D / T_CYCLE;
    const m = v * tt;
    const s = Math.floor(tt / T_CYCLE);
    const p = tt - s * T_CYCLE;
    const idx = s % N;
    const e = p < T_MOVE ? easeInOutCubic(p / T_MOVE) : 1;
    const pd = L + (idx - 1 + e) * D + D / 2;

    track.style.transform = `translate3d(${x0 - L - m}px,0,0)`;
    dot.style.transform = `translate3d(${pd - 4.5}px,0,0)`;

    const arrived = p >= T_MOVE;
    const ref = N + (arrived ? idx : idx - 1);
    const trail = arrived ? [ref - 1, ref - 2, ref - 3] : [ref, ref - 1, ref - 2];
    setStates(arrived ? N + idx : -1, trail);
  }

  function frame(now) {
    raf = 0;
    if (!visible) return;
    const dt = Math.min(0.05, (now - last) / 1000); // evita saltos al volver a la pestaña
    last = now;
    t += dt;
    render(t);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    visible = true;
    if (prefersReducedMotion || raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() { visible = false; }

  function buildStatic() {
    // reduced motion: sin desplazamiento, solo alterna la etapa activa cada 1.8 s
    build();
    dot.style.display = "none";
    track.style.transform = `translate3d(${24 - L}px,0,0)`;
    let k = 0;
    clearInterval(staticTimer);
    const tick = () => {
      const g = N + (k % N);
      setStates(g, [g - 1, g - 2, g - 3]);
      k++;
    };
    tick();
    staticTimer = setInterval(tick, 1800);
  }

  function init() {
    if (prefersReducedMotion) { buildStatic(); return; }
    build();
    render(t);
  }
  init();

  let rz;
  window.addEventListener("resize", () => {
    clearTimeout(rz);
    rz = setTimeout(init, 150);
  });
  whenVisible(root, (v) => (v ? start() : stop()));
}

/* ==========================================================================
   2. Comparador antes / después
   ========================================================================== */
function initCompare() {
  const el = document.getElementById("compare");
  const range = document.getElementById("compareRange");
  if (!el || !range) return;

  let pos = prefersReducedMotion ? 50 : 88;
  let introRAF = 0;

  function setPos(p) {
    pos = Math.max(0, Math.min(100, p));
    el.style.setProperty("--pos", pos.toFixed(2));
    range.value = String(Math.round(pos));
  }
  setPos(pos);

  const cancelIntro = () => { if (introRAF) { cancelAnimationFrame(introRAF); introRAF = 0; } };

  // Animación de pista: 88% -> 50% en 1.4 s la primera vez que entra en pantalla
  if (!prefersReducedMotion) {
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      const from = pos, to = 50, dur = 1400, t0 = performance.now();
      const step = (now) => {
        const k = clamp01((now - t0) / dur);
        setPos(from + (to - from) * easeOutCubic(k));
        introRAF = k < 1 ? requestAnimationFrame(step) : 0;
      };
      introRAF = requestAnimationFrame(step);
    }, { threshold: 0.35 });
    io.observe(el);
  }

  const fromEvent = (e) => {
    const r = el.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * 100;
  };
  let dragging = false;
  el.addEventListener("pointerdown", (e) => {
    if (e.target === range || (e.pointerType === "mouse" && e.button !== 0)) return;
    cancelIntro();
    dragging = true;
    el.setPointerCapture(e.pointerId);
    setPos(fromEvent(e)); // un clic mueve la barra a ese punto
  });
  el.addEventListener("pointermove", (e) => { if (dragging) setPos(fromEvent(e)); });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((n) =>
    el.addEventListener(n, () => { dragging = false; })
  );
  range.addEventListener("input", () => { cancelIntro(); setPos(Number(range.value)); });

  // Pausa flotación y pulso cuando la sección no está en pantalla
  whenVisible(el, (v) => el.classList.toggle("is-paused", !v));
}

/* ==========================================================================
   3. Stepper del método: un punto recorre los 4 pasos
   ========================================================================== */
function initStepper() {
  const wrap = document.getElementById("stepper");
  if (!wrap) return;
  const steps = Array.from(wrap.querySelectorAll(".step"));
  const icons = steps.map((s) => s.querySelector(".step__icon"));
  const line = wrap.querySelector(".stepper__line");
  const prog = wrap.querySelector(".stepper__progress");
  const dot = wrap.querySelector(".stepper__dot");
  const vmq = window.matchMedia("(max-width: 767px)");

  const PAUSE = 2.2, MOVE = 0.9, FADE = 0.3;
  const CYCLE = steps.length * PAUSE + (steps.length - 1) * MOVE + FADE;

  let vertical = false, pts = [], cross = 0, len = 0;

  function layout() {
    vertical = vmq.matches;
    const r0 = wrap.getBoundingClientRect();
    pts = icons.map((ic) => {
      const r = ic.getBoundingClientRect();
      return vertical ? r.top + r.height / 2 - r0.top : r.left + r.width / 2 - r0.left;
    });
    const r = icons[0].getBoundingClientRect();
    cross = vertical ? r.left + r.width / 2 - r0.left : r.top + r.height / 2 - r0.top;
    len = pts[pts.length - 1] - pts[0];

    [line, prog].forEach((n) => {
      n.style.left = n.style.top = n.style.width = n.style.height = "";
      if (vertical) { n.style.left = `${cross - 0.5}px`; n.style.top = `${pts[0]}px`; n.style.width = "1px"; n.style.height = `${len}px`; }
      else { n.style.left = `${pts[0]}px`; n.style.top = `${cross - 0.5}px`; n.style.width = `${len}px`; n.style.height = "1px"; }
    });
    if (vertical) { dot.style.left = `${cross - 5.5}px`; dot.style.top = "0px"; }
    else { dot.style.left = "0px"; dot.style.top = `${cross - 5.5}px`; }
  }

  function setPosition(pos) {
    const f = len ? clamp01((pos - pts[0]) / len) : 0;
    prog.style.transform = vertical ? `scaleY(${f})` : `scaleX(${f})`;
    dot.style.transform = vertical ? `translateY(${pos - 5.5}px)` : `translateX(${pos - 5.5}px)`;
  }

  function setStates(active, movingFrom) {
    steps.forEach((s, i) => {
      const done = movingFrom >= 0 ? i <= movingFrom : i < active;
      s.classList.toggle("is-active", movingFrom < 0 && i === active);
      s.classList.toggle("is-done", done);
    });
  }

  function render(time) {
    let x = time % CYCLE;
    for (let i = 0; i < steps.length; i++) {
      if (x < PAUSE) { dot.classList.add("is-on"); setPosition(pts[i]); setStates(i, -1); return; }
      x -= PAUSE;
      if (i < steps.length - 1) {
        if (x < MOVE) {
          const e = easeInOutCubic(x / MOVE);
          dot.classList.add("is-on");
          setPosition(pts[i] + (pts[i + 1] - pts[i]) * e);
          setStates(-1, i);
          return;
        }
        x -= MOVE;
      }
    }
    // fade out del punto tras el último paso; al reiniciar la línea se vacía
    dot.classList.remove("is-on");
    setPosition(pts[pts.length - 1]);
    setStates(steps.length - 1, -1);
  }

  if (prefersReducedMotion) {
    wrap.classList.add("is-reduced");
    steps.forEach((s) => s.classList.add("is-done"));
    layout();
    prog.style.transform = vertical ? "scaleY(1)" : "scaleX(1)";
    window.addEventListener("resize", () => { layout(); prog.style.transform = vertical ? "scaleY(1)" : "scaleX(1)"; });
    return;
  }

  let t = 0, last = 0, raf = 0, visible = false, started = false;
  function frame(now) {
    raf = 0;
    if (!visible) return;
    t += Math.min(0.05, (now - last) / 1000);
    last = now;
    render(t);
    raf = requestAnimationFrame(frame);
  }
  layout();
  render(0);
  dot.classList.remove("is-on");

  whenVisible(wrap, (v) => {
    visible = v;
    if (v) {
      if (!started) { started = true; t = 0; layout(); } // primera vez: desde el paso 1
      last = performance.now();
      if (!raf) raf = requestAnimationFrame(frame);
    }
  }, 0.3);

  let rz;
  window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { layout(); render(t); }, 150); });
}

/* ==========================================================================
   4. Carrusel "Cómo trabajamos": scroll-snap + flechas + arrastre con mouse
   ========================================================================== */
function initCarousel() {
  const track = document.getElementById("carTrack");
  const prev = document.getElementById("carPrev");
  const next = document.getElementById("carNext");
  if (!track) return;

  const cardW = () => (track.querySelector(".pillar-panel") || track).offsetWidth;
  const behavior = prefersReducedMotion ? "auto" : "smooth";

  function updateArrows() {
    const max = track.scrollWidth - track.clientWidth;
    if (prev) prev.disabled = track.scrollLeft <= 2;
    if (next) next.disabled = track.scrollLeft >= max - 2;
  }
  track.addEventListener("scroll", updateArrows, { passive: true });
  window.addEventListener("resize", updateArrows);
  updateArrows();

  if (prev) prev.addEventListener("click", () => track.scrollBy({ left: -cardW(), behavior }));
  if (next) next.addEventListener("click", () => track.scrollBy({ left: cardW(), behavior }));

  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); track.scrollBy({ left: cardW(), behavior }); }
    if (e.key === "ArrowLeft") { e.preventDefault(); track.scrollBy({ left: -cardW(), behavior }); }
  });

  // Arrastre con mouse (en táctil el navegador ya desliza solo)
  let drag = null;
  track.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    drag = { x: e.clientX, left: track.scrollLeft, moved: false };
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 4) { drag.moved = true; track.classList.add("is-dragging"); }
    if (drag.moved) track.scrollLeft = drag.left - dx;
  });
  window.addEventListener("pointerup", () => {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    if (!moved) return;
    track.classList.remove("is-dragging");
    const w = cardW();
    track.scrollTo({ left: Math.round(track.scrollLeft / w) * w, behavior });
  });
}

/* ==========================================================================
   5. Equipo: foto con respaldo de iniciales + enlace de LinkedIn opcional
   ========================================================================== */
function initTeam() {
  const CONFIG = {
    JM: { name: "Juan Manuel Chacin", photo: PHOTO_JM, linkedin: LINKEDIN_JM },
    JL: { name: "Jean Lucas Bello", photo: PHOTO_JL, linkedin: LINKEDIN_JL },
  };
  document.querySelectorAll(".team-card[data-member]").forEach((card) => {
    const cfg = CONFIG[card.dataset.member];
    if (!cfg) return;

    const avatar = card.querySelector("[data-avatar]");
    if (cfg.photo && avatar) {
      const img = new Image();
      img.alt = `Foto de ${cfg.name}`;
      img.loading = "lazy";
      img.onerror = () => img.remove(); // queda el texto de iniciales
      img.src = cfg.photo;
      avatar.appendChild(img);
    }

    const link = card.querySelector("[data-linkedin]");
    if (link) {
      if (cfg.linkedin) { link.href = cfg.linkedin; link.hidden = false; }
      else link.remove();
    }
  });
}

/* ==========================================================================
   6. Mockup de chat (cierre)
   ========================================================================== */
function initChat() {
  const body = document.getElementById("chatBody");
  const chat = document.getElementById("chat");
  const cta = document.getElementById("ctaBtn");
  if (!body || !chat) return;

  const SCRIPT = [
    { who: "me", text: "Hola, quiero contarles mi caso", time: "10:02" },
    { who: "them", text: "¡Hola! Cuéntanos qué te está costando más hoy", time: "10:03" },
    { who: "me", text: "Respondo WhatsApp todo el día y se me pierden pedidos", time: "10:03" },
    { who: "them", text: "Agendemos 20 minutos y lo revisamos juntos 📅", time: "10:04" },
  ];
  const DOUBLE_CHECK =
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg>';

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let runId = 0;

  function bubble(m) {
    const d = document.createElement("div");
    d.className = `msg msg--${m.who}`;
    const span = document.createElement("span");
    span.textContent = m.text;
    const meta = document.createElement("div");
    meta.className = "msg__meta";
    meta.innerHTML = `<span>${m.time}</span>${m.who === "me" ? DOUBLE_CHECK : ""}`;
    d.append(span, meta);
    return d;
  }
  function typingEl() {
    const d = document.createElement("div");
    d.className = "typing";
    d.innerHTML = "<i></i><i></i><i></i>";
    return d;
  }
  function bookedEl() {
    const d = document.createElement("div");
    d.className = "booked";
    d.innerHTML =
      `<div class="booked__icon">${window.ilIcon("check", 16)}</div><strong>Llamada agendada</strong><small>20 min · Videollamada</small>`;
    return d;
  }
  const show = (el) => { void el.offsetWidth; el.classList.add("is-in"); };

  if (prefersReducedMotion) {
    SCRIPT.forEach((m) => { const b = bubble(m); body.append(b); b.classList.add("is-in"); });
    const c = bookedEl(); body.append(c); c.classList.add("is-in");
    return;
  }

  async function play() {
    const id = ++runId;
    const alive = () => id === runId;
    while (alive()) {
      body.classList.remove("is-fading");
      body.innerHTML = "";
      for (const m of SCRIPT) {
        if (m.who === "them") {
          const ty = typingEl(); body.append(ty); show(ty);
          await wait(1200); if (!alive()) return;
          ty.remove();
        } else {
          await wait(800); if (!alive()) return;
        }
        const b = bubble(m); body.append(b); show(b);
        await wait(360); if (!alive()) return;
      }
      await wait(800); if (!alive()) return;
      const card = bookedEl(); body.append(card); show(card);
      if (cta) { // pulso del botón: anillo que se expande, 2 veces
        cta.classList.remove("btn--pulse"); void cta.offsetWidth; cta.classList.add("btn--pulse");
        setTimeout(() => cta.classList.remove("btn--pulse"), 1900);
      }
      await wait(6000); if (!alive()) return;
      body.classList.add("is-fading");
      await wait(400);
    }
  }

  whenVisible(chat, (v) => {
    if (v) play();
    else { runId++; }
  }, 0.4);
}
