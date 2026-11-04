/* ==========================================================================
   Google Analytics 4 — un solo lugar para todo el sitio.
   Para activarlo, pega el ID de medición (empieza por "G-") en GA_ID.
   Vacío = no se carga nada.
   ========================================================================== */
(function () {
  var GA_ID = "";
  if (!GA_ID) return;
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID);
})();
