/* ==========================================================================
   IntegroLabs — Página "Páginas web"
   Depende de main.js (waLink, prefersReducedMotion).
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initWebCtas();
  initDevicesAutoScroll();
  initBuildDemo();
});

/* Botones "Quiero mi página web" -> WhatsApp con mensaje propio */
function initWebCtas() {
  document.querySelectorAll(".js-wa-web").forEach((a) => {
    a.href = waLink("Hola, quiero una página web para mi negocio");
  });
}

/* En pantallas táctiles no hay hover: las capturas recorren la página solas
   mientras el escenario está visible. */
function initDevicesAutoScroll() {
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (canHover || prefersReducedMotion || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => en.target.classList.toggle("is-auto", en.isIntersecting)),
    { threshold: 0.35 }
  );
  document.querySelectorAll("[data-devices]").forEach((el) => io.observe(el));
}

/* Animación del hero: una página que se arma, recibe un clic y genera un
   mensaje por WhatsApp. Cada fase es una clase en #build; el CSS hace el
   resto. Solo corre mientras el hero está en pantalla. */
function initBuildDemo() {
  const el = document.getElementById("build");
  if (!el) return;
  const PHASES = ["is-built", "is-click", "is-press", "is-msg"];
  if (prefersReducedMotion) { el.classList.add("is-built", "is-msg"); return; }

  // [ms desde el inicio del ciclo, clases activas]
  const STEPS = [
    [100, ["is-built"]],
    [2700, ["is-built", "is-click"]],
    [3700, ["is-built", "is-click", "is-press"]],
    [3900, ["is-built", "is-click", "is-msg"]],
    [4700, ["is-built", "is-msg"]],
    [7600, []],
  ];
  const CYCLE = 8400;
  let timers = [], running = false;

  const set = (cls) => PHASES.forEach((c) => el.classList.toggle(c, cls.includes(c)));
  const cycle = () => {
    STEPS.forEach(([t, cls]) => timers.push(setTimeout(() => set(cls), t)));
    timers.push(setTimeout(cycle, CYCLE));
  };
  const start = () => { if (running) return; running = true; set([]); cycle(); };
  const stop = () => { running = false; timers.forEach(clearTimeout); timers = []; };

  if (!("IntersectionObserver" in window)) { start(); return; }
  new IntersectionObserver((en) => (en[0].isIntersecting ? start() : stop()), { threshold: 0.2 }).observe(el);
}
