/* ==========================================================================
   IntegroLabs — Landing Page Behavior (base)
   Vanilla JS + GSAP/ScrollTrigger/Lenis (cargados por <script> en index.html,
   sin bundler). Cada librería se detecta: si un CDN falla, el sitio sigue
   funcionando con movimiento más simple.

   Los bloques nuevos (franja, comparador, stepper, carrusel, equipo, chat)
   viven en js/sections.js.
   ========================================================================== */

// Número de WhatsApp en formato internacional, sin "+" ni espacios.
// Lo usan el hero, el formulario y el cierre. Cámbialo solo aquí.
const WHATSAPP_NUMBER = "584220140873";

const hasGSAP = typeof window.gsap !== "undefined";
const hasScrollTrigger = hasGSAP && typeof window.ScrollTrigger !== "undefined";
const hasLenis = typeof window.Lenis !== "undefined";
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

let lenisInstance = null;

if (hasGSAP && hasScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
}

function waLink(text) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

document.addEventListener("DOMContentLoaded", () => {
  initYear();
  initSmoothScroll();
  initMobileNav();
  initAnchorScroll();
  initWhatsAppCtas();
  initMagneticButtons();
  initHeads();
  initNavSpy();
  initScrollReveal();
  initScrollProgress();
  initWizard();
});

/* ---------- Footer year ---------- */
function initYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
}

/* ---------- Botones "Cuéntanos tu caso" (hero y cierre) -> WhatsApp ---------- */
function initWhatsAppCtas() {
  document.querySelectorAll(".js-wa-cta").forEach((a) => {
    a.href = waLink("Hola, quiero contarles mi caso");
  });
}

/* ---------- Lenis smooth scroll, conectado al ticker de GSAP ---------- */
function initSmoothScroll() {
  if (prefersReducedMotion || !hasLenis) return;

  lenisInstance = new Lenis({ duration: 1.1, smoothWheel: true });

  if (hasGSAP) {
    lenisInstance.on("scroll", () => hasScrollTrigger && ScrollTrigger.update());
    gsap.ticker.add((time) => lenisInstance.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (time) => { lenisInstance.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
}

/* ---------- Anclas: pasan por Lenis para mantener la sensación de scroll ---------- */
function navHeight() {
  const c = document.querySelector(".nav__capsule");
  return (c ? c.offsetHeight : 0) + 16;
}

function initAnchorScroll() {
  const anchors = document.querySelectorAll('a[href^="#"]:not([target="_blank"])');
  anchors.forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenisInstance) {
        lenisInstance.scrollTo(target, { offset: -navHeight() });
      } else {
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navHeight(), behavior: prefersReducedMotion ? "auto" : "smooth" });
      }
    });
  });
}

/* ---------- Menú: cápsula (translúcida al hacer scroll) + panel móvil ---------- */
function initMobileNav() {
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("navToggle");
  const panel = document.getElementById("navPanel");
  if (!nav) return;

  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 20);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (!toggle || !panel) return;
  const setOpen = (open) => {
    panel.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };
  toggle.addEventListener("click", (e) => { e.stopPropagation(); setOpen(!panel.classList.contains("is-open")); });
  panel.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  // tocar fuera del panel lo cierra
  document.addEventListener("click", (e) => {
    if (panel.classList.contains("is-open") && !panel.contains(e.target)) setOpen(false);
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
}

/* ---------- Botones magnéticos ---------- */
function initMagneticButtons() {
  if (!isFinePointer || prefersReducedMotion || !hasGSAP) return;

  document.querySelectorAll(".magnetic").forEach((el) => {
    const strength = 0.35;
    const moveX = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
    const moveY = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });

    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      moveX((e.clientX - (rect.left + rect.width / 2)) * strength);
      moveY((e.clientY - (rect.top + rect.height / 2)) * strength);
    });
    el.addEventListener("mouseleave", () => { moveX(0); moveY(0); });
  });
}

/* ---------- Entrada de encabezados ----------
   Cada [data-head] recibe la clase "is-in" una sola vez (el hero al cargar,
   las secciones al entrar en pantalla con 25% visible). La secuencia en sí
   (línea del eyebrow, texto, máscara de los hooks, apoyo, CTA) es CSS puro
   y solo se oculta si <html> tiene la clase "js" y no hay reduced-motion. */
function initHeads() {
  const heads = Array.from(document.querySelectorAll("[data-head]"));
  const show = (el) => el.classList.add("is-in");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    heads.forEach(show);
    return;
  }

  const hero = document.querySelector(".hero [data-head]");
  if (hero) requestAnimationFrame(() => requestAnimationFrame(() => show(hero)));

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { show(en.target); io.unobserve(en.target); }
      });
    },
    { threshold: 0.25 }
  );
  heads.filter((h) => h !== hero).forEach((h) => io.observe(h));
}

/* ---------- Menú: marca como activo el enlace de la sección visible (umbral 40%) ---------- */
function initNavSpy() {
  const links = Array.from(document.querySelectorAll("[data-nav]"));
  if (!links.length || !("IntersectionObserver" in window)) return;

  const ids = [...new Set(links.map((a) => a.dataset.nav))];
  const visible = [];
  const paint = () => {
    const id = visible.length ? visible[visible.length - 1] : null;
    links.forEach((a) => {
      const on = a.dataset.nav === id;
      a.classList.toggle("is-current", on);
      if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        const i = visible.indexOf(en.target.id);
        if (en.isIntersecting && i === -1) visible.push(en.target.id);
        if (!en.isIntersecting && i !== -1) visible.splice(i, 1);
      });
      paint();
    },
    { threshold: 0.4 }
  );
  ids.forEach((id) => { const sec = document.getElementById(id); if (sec) io.observe(sec); });
}

/* ---------- Reveal al hacer scroll ---------- */
function initScrollReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  if (prefersReducedMotion) {
    items.forEach((el) => el.classList.add("in-view"));
    return;
  }

  if (hasGSAP && hasScrollTrigger) {
    items.forEach((el) => {
      el.classList.add("gsap-driven");
      gsap.fromTo(
        el,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true } }
      );
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add("in-view"), Math.min(i * 60, 240));
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );
  items.forEach((el) => observer.observe(el));
}

/* ---------- Barra de progreso de scroll ---------- */
function initScrollProgress() {
  const bar = document.getElementById("scrollProgress");
  if (!bar) return;

  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
  };

  if (lenisInstance) lenisInstance.on("scroll", update);
  else window.addEventListener("scroll", update, { passive: true });
  update();
}

/* ---------- Formulario "Empecemos" (4 pasos) ----------
   1 dolor (checkbox, multiple + "Otro")  2 canal  3 contacto  4 enviar.
   El paso 4 abre WhatsApp con un mensaje precargado y muestra una
   confirmación con enlace de respaldo. */
function initWizard() {
  const form = document.getElementById("qualForm");
  if (!form) return;

  const steps = Array.from(form.querySelectorAll(".wizard__step"));
  const totalSteps = steps.length;
  const progressBar = document.getElementById("progressBar");
  const stepLabel = document.getElementById("stepLabel");
  const nextBtn = document.getElementById("nextBtn");
  const backBtn = document.getElementById("backBtn");
  const whatsappBtn = document.getElementById("whatsappBtn");
  const doneTitle = document.getElementById("doneTitle");
  const sendBox = document.getElementById("wizardSend");
  const sentBox = document.getElementById("wizardSent");
  const waBackup = document.getElementById("waBackup");
  const otherWrap = document.getElementById("otherWrap");
  const otherCheck = document.getElementById("dolorOtro");
  const otherText = document.getElementById("dolorOtroText");

  let current = 1;

  const stepEl = (n) => steps.find((s) => Number(s.dataset.step) === n);
  const errEl = (n) => document.getElementById(`err${n}`);

  function updateProgress() {
    progressBar.style.width = `${(current / totalSteps) * 100}%`;
    stepLabel.textContent = `Paso ${current} de ${totalSteps}`;
    form.dataset.currentStep = String(current);
  }

  function focusStepTitle(n) {
    const el = stepEl(n).querySelector("legend, h3");
    if (el) el.focus({ preventScroll: true });
  }

  function showStep(n, { user = false } = {}) {
    steps.forEach((s) => s.classList.toggle("is-active", Number(s.dataset.step) === n));
    backBtn.disabled = n === 1;
    nextBtn.textContent = "Siguiente";
    updateProgress();
    if (user) {
      const wizardEl = document.getElementById("wizard");
      if (lenisInstance) lenisInstance.scrollTo(wizardEl, { offset: -20 });
      else wizardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      focusStepTitle(n);
    }
    if (hasScrollTrigger) ScrollTrigger.refresh();
  }

  function shake(el) {
    if (hasGSAP && !prefersReducedMotion) gsap.fromTo(el, { x: -6 }, { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" });
  }

  function setError(n, msg) {
    errEl(n).textContent = msg;
    if (msg) shake(stepEl(n));
  }

  /* "Otro": campo de texto con aparición suave */
  function syncOther() {
    const open = otherCheck.checked;
    otherWrap.classList.toggle("is-open", open);
    otherText.tabIndex = open ? 0 : -1;
    if (open) setTimeout(() => otherText.focus({ preventScroll: true }), 120);
  }
  otherCheck.addEventListener("change", syncOther);

  // El mensaje de error desaparece en cuanto el usuario marca o escribe
  form.addEventListener("change", (e) => {
    const n = Number(e.target.closest(".wizard__step")?.dataset.step);
    if (n) setError(n, "");
  });
  form.addEventListener("input", (e) => {
    const n = Number(e.target.closest(".wizard__step")?.dataset.step);
    if (n) setError(n, "");
  });

  function validate(n) {
    const el = stepEl(n);
    if (n === 1) {
      const checked = el.querySelectorAll('input[name="dolor"]:checked');
      if (!checked.length) {
        setError(1, "Elige al menos una opción para continuar");
        return false;
      }
      if (otherCheck.checked && !otherText.value.trim()) {
        setError(1, "Cuéntanos en pocas palabras qué te cuesta para continuar");
        otherText.focus({ preventScroll: true });
        return false;
      }
      return true;
    }
    const radios = Array.from(el.querySelectorAll('input[type="radio"][required]'));
    if (radios.length && !el.querySelector('input[type="radio"]:checked')) {
      setError(n, "Elige una opción para continuar");
      return false;
    }
    for (const f of el.querySelectorAll('input[type="text"][required]')) {
      if (!f.value.trim()) {
        setError(n, "Completa los campos para continuar");
        f.focus({ preventScroll: true });
        return false;
      }
    }
    return true;
  }

  function buildMessage() {
    const data = new FormData(form);
    const dolores = data.getAll("dolor").map((v) =>
      v === "Otro" ? `Otro: ${(data.get("dolor_otro") || "").toString().trim()}` : v
    );
    const q2 = stepEl(2).querySelector("legend").textContent.trim();
    const lines = [
      "Hola, quiero contarles mi caso.",
      `Lo que más me cuesta hoy: ${dolores.join(", ")}`,
      `${q2} ${data.get("canal") || ""}`.trim(),
    ];
    // Paso 3: cada campo con su propia etiqueta
    stepEl(3).querySelectorAll(".field").forEach((f) => {
      const label = f.querySelector("span").textContent.trim();
      const input = f.querySelector("input");
      lines.push(`${label}: ${input.value.trim()}`);
    });
    return lines.join("\n");
  }

  function personalize() {
    const nombre = (new FormData(form).get("nombre") || "").toString().trim().split(" ")[0];
    doneTitle.textContent = nombre
      ? `Gracias, ${nombre}. Ya sabemos por dónde empezar.`
      : "Listo, ya sabemos por dónde empezar.";
  }

  nextBtn.addEventListener("click", () => {
    if (!validate(current)) return;
    if (current < totalSteps) {
      current += 1;
      if (current === totalSteps) personalize();
      showStep(current, { user: true });
    }
  });

  backBtn.addEventListener("click", () => {
    if (current > 1) {
      current -= 1;
      // volver desde el estado enviado: restaurar el botón de envío
      sendBox.hidden = false;
      sentBox.hidden = true;
      showStep(current, { user: true });
    }
  });

  whatsappBtn.addEventListener("click", () => {
    const url = waLink(buildMessage());
    window.open(url, "_blank", "noopener");
    waBackup.href = url;
    sendBox.hidden = true;
    sentBox.hidden = false;
    document.getElementById("sentTitle").focus({ preventScroll: true });
  });

  form.addEventListener("submit", (e) => e.preventDefault());

  showStep(current);
}
