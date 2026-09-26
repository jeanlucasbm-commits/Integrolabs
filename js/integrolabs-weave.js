/*!
 * IntegroLabs · Hero "Tejido" v1
 * Animación en <canvas> sin dependencias.
 *
 * Uso: <canvas data-weave aria-hidden="true"></canvas> dentro del hero.
 * El canvas debe cubrir todo el hero (position:absolute; inset:0).
 * - Pantallas horizontales: la animación ocurre en la mitad derecha y
 *   la zona izquierda queda casi vacía para el texto.
 * - Pantallas verticales (móvil): la animación ocurre en la mitad inferior.
 *
 * Colores (variables CSS opcionales, heredables desde el hero):
 *   --weave-bg      debe ser igual al fondo del hero
 *   --weave-line    líneas de conexión
 *   --weave-pulse   pulsos de luz
 *   --weave-t1..t4  colores de los hilos
 *
 * Repetir la animación: document.querySelector('[data-weave]').weaveReplay()
 */
(function () {
  'use strict';

  var K = 26, N = 5;
  var LAYOUT = [[.20, .21], [.55, .15], [.83, .34], [.31, .53], [.66, .56], [.47, .85]];
  var ORDER = [0, 1, 3, 4, 2, 5];
  var EDGES = [[0, 1], [1, 2], [0, 3], [1, 4], [2, 4], [3, 4], [3, 5], [4, 5]];
  var PAIRS = [[0, 1], [3, 2], [1, 0], [2, 3], [0, 3], [1, 2]];
  var T = { tense: 2300, tenseEnd: 3400, build: 3300, stagger: 420, buildDur: 1300, edgeDur: 650, pulseDur: 950 };
  var DEF = { bg: '#131B2C', line: '#A6AEC4', pulse: '#FFE7A8', th: ['#E6E0D2', '#6DB3A8', '#D9A441', '#8FA2E0'] };

  function clamp(x, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return Math.max(a, Math.min(b, x)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function mount(canvas) {
    var ctx = canvas.getContext('2d');
    var reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
    var darkMQ = matchMedia('(prefers-color-scheme: dark)');
    var W = 0, H = 0, S = 0, scale = 1, mode = 'h';
    var C = DEF, modules = [], threads = [], edges = [], pulses = [];
    var t0 = 0, last = 0, ct = 0, nextPulse = 0, allEnd = 0, raf = null, visible = true, started = false;

    function readColors() {
      var cs = getComputedStyle(canvas);
      function g(n, d) { return cs.getPropertyValue(n).trim() || d; }
      C = {
        bg: g('--weave-bg', DEF.bg), line: g('--weave-line', DEF.line), pulse: g('--weave-pulse', DEF.pulse),
        th: [g('--weave-t1', DEF.th[0]), g('--weave-t2', DEF.th[1]), g('--weave-t3', DEF.th[2]), g('--weave-t4', DEF.th[3])]
      };
    }

    function build() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      if (!W || !H) return false;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      mode = W / H >= 1.1 ? 'h' : 'v';
      var R = mode === 'h'
        ? { x: W * .50, y: H * .08, w: W * .46, h: H * .84 }
        : { x: W * .05, y: H * .50, w: W * .90, h: H * .46 };
      var Mr = Math.min(R.w, R.h);
      S = Mr * .2; scale = Math.max(S / 120, .6);

      var rng = mulberry32(11);
      var gap = S / N, maxDelay = (N - 1) * 55 + 160;
      modules = LAYOUT.map(function (p, i) {
        var start = T.build + ORDER.indexOf(i) * T.stagger;
        return { idx: i, cx: R.x + p[0] * R.w, cy: R.y + p[1] * R.h, glow: 0, start: start, end: start + T.buildDur + maxDelay, h: [], v: [] };
      });

      threads = [];
      modules.forEach(function (m) {
        for (var dir = 0; dir < 2; dir++) for (var k = 0; k < N; k++) {
          var off = -S / 2 + (k + .5) * gap;
          var stray = rng() < .25; // hilos que nacen en la zona del texto
          var cx, cy;
          if (mode === 'h') {
            cx = stray ? (.03 + rng() * .47) * W : R.x + (.05 + rng() * .9) * R.w;
            cy = (.08 + rng() * .84) * H;
          } else {
            cx = (.08 + rng() * .84) * W;
            cy = stray ? (.05 + rng() * .45) * H : R.y + (.05 + rng() * .9) * R.h;
          }
          var th = {
            m: m, dir: dir, k: k,
            x0: dir ? m.cx + off : m.cx - S / 2, x1: dir ? m.cx + off : m.cx + S / 2,
            y0: dir ? m.cy - S / 2 : m.cy + off, y1: dir ? m.cy + S / 2 : m.cy + off,
            color: PAIRS[m.idx][dir], delay: k * 55 + dir * 160,
            cx: cx, cy: cy, ang: rng() * Math.PI, len: (.35 + rng() * .45) * Mr * (stray ? 1.4 : 1),
            f: .8 + rng() * 1.6, ph: rng() * 6.283, sp: .5 + rng() * .9, amp: (.025 + rng() * .05) * Mr, rot: (rng() - .5) * .3,
            pts: new Float32Array(K * 2), e: 0, sign: 1
          };
          threads.push(th);
          (dir ? m.v : m.h).push(th);
        }
      });

      edges = EDGES.map(function (pair) {
        var A = modules[pair[0]], B = modules[pair[1]];
        var dx = B.cx - A.cx, dy = B.cy - A.cy, h = S / 2 + 8 * scale;
        var k = Math.min(h / Math.abs(dx || 1e-6), h / Math.abs(dy || 1e-6));
        return { a: A, b: B, x0: A.cx + dx * k, y0: A.cy + dy * k, x1: B.cx - dx * k, y1: B.cy - dy * k, start: Math.max(A.end, B.end) + 80, p: 0 };
      });
      allEnd = Math.max.apply(null, edges.map(function (e) { return e.start + T.edgeDur; }));
      return true;
    }

    function place(th, time, ctime, tens) {
      var e = ease(clamp((time - th.m.start - th.delay) / T.buildDur));
      th.e = e;
      var p = th.pts, j, u;
      if (e >= 1) {
        for (j = 0; j < K; j++) { u = j / (K - 1); p[2 * j] = lerp(th.x0, th.x1, u); p[2 * j + 1] = lerp(th.y0, th.y1, u); }
        return;
      }
      var target = th.dir ? Math.PI / 2 : 0;
      var a = th.ang + th.rot * ctime;
      var d = target - a; d = ((d + Math.PI / 2) % Math.PI + Math.PI) % Math.PI - Math.PI / 2;
      a += d * tens * .75;
      if (e === 0) th.sign = Math.cos(a - target) >= 0 ? 1 : -1;
      var dx = Math.cos(a), dy = Math.sin(a);
      var amp = th.amp * lerp(1, .3, tens);
      var M = Math.min(W, H);
      var cx = th.cx + Math.sin(ctime * .35 + th.ph) * .03 * M;
      var cy = th.cy + Math.cos(ctime * .3 + th.ph) * .03 * M;
      for (j = 0; j < K; j++) {
        u = j / (K - 1);
        var ub = th.sign > 0 ? u : 1 - u;
        var w = Math.sin(ub * th.f * 6.283 + ctime * th.sp * 2 + th.ph) + .4 * Math.sin(ub * th.f * 14 - ctime * th.sp * 2.6);
        var bx = cx + (ub - .5) * th.len * dx - dy * w * amp;
        var by = cy + (ub - .5) * th.len * dy + dx * w * amp;
        p[2 * j] = lerp(bx, lerp(th.x0, th.x1, u), e);
        p[2 * j + 1] = lerp(by, lerp(th.y0, th.y1, u), e);
      }
    }

    function strokePts(p) {
      ctx.beginPath(); ctx.moveTo(p[0], p[1]);
      for (var j = 1; j < K - 1; j++) {
        ctx.quadraticCurveTo(p[2 * j], p[2 * j + 1], (p[2 * j] + p[2 * j + 2]) / 2, (p[2 * j + 1] + p[2 * j + 3]) / 2);
      }
      ctx.lineTo(p[2 * K - 2], p[2 * K - 1]); ctx.stroke();
    }
    function line(x0, y0, x1, y1) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }

    function spawnPulse(from) {
      var avail = edges.filter(function (e) { return e.p >= 1 && (!from || e.a === from || e.b === from); });
      if (!avail.length) return;
      var ed = avail[Math.floor(Math.random() * avail.length)];
      var rev = from ? ed.b === from : Math.random() < .5;
      pulses.push({ ed: ed, rev: rev, t: 0 });
      var o = rev ? ed.b : ed.a; o.glow = Math.max(o.glow, .35);
    }

    // Protege la legibilidad del texto: atenúa lo que cae en la zona izquierda (o superior en móvil)
    function applyMask() {
      var g = mode === 'h' ? ctx.createLinearGradient(0, 0, W * .55, 0) : ctx.createLinearGradient(0, 0, 0, H * .55);
      g.addColorStop(0, 'rgba(0,0,0,.12)');
      g.addColorStop(.7, 'rgba(0,0,0,.45)');
      g.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.globalCompositeOperation = 'destination-in';
      ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    }

    function draw(time, ctime, tens, dt, now, animate) {
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = 'round';
      threads.forEach(function (th) { place(th, time, ctime, tens); });

      edges.forEach(function (ed) {
        var p = clamp((time - ed.start) / T.edgeDur); ed.p = p;
        if (p <= 0) return;
        var q = ease(p);
        ctx.globalAlpha = .5; ctx.strokeStyle = C.line; ctx.lineWidth = 1.1 * scale;
        line(ed.x0, ed.y0, lerp(ed.x0, ed.x1, q), lerp(ed.y0, ed.y1, q));
        ctx.globalAlpha = .75; ctx.fillStyle = C.line;
        ctx.beginPath(); ctx.arc(ed.x0, ed.y0, 2 * scale, 0, 6.283); ctx.fill();
        if (p >= 1) { ctx.beginPath(); ctx.arc(ed.x1, ed.y1, 2 * scale, 0, 6.283); ctx.fill(); }
      });

      var lwF = 2.1 * scale;
      modules.forEach(function (m) {
        [m.h, m.v].forEach(function (list) {
          list.forEach(function (th) {
            ctx.globalAlpha = lerp(.42, .95, th.e);
            ctx.strokeStyle = C.th[th.color];
            ctx.lineWidth = lerp(1.1 * scale, lwF, th.e);
            strokePts(th.pts);
          });
        });
        var settle = clamp((time - m.end) / 450);
        if (settle > 0) {
          var gap = S / N, hs = gap * .34;
          ctx.lineCap = 'butt';
          for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) {
            if ((i + j) % 2) continue;
            var x = m.cx - S / 2 + (i + .5) * gap, y = m.cy - S / 2 + (j + .5) * gap;
            ctx.globalAlpha = settle; ctx.strokeStyle = C.bg; ctx.lineWidth = lwF + 3;
            line(x - hs, y, x + hs, y);
            ctx.globalAlpha = .95 * settle; ctx.strokeStyle = C.th[PAIRS[m.idx][0]]; ctx.lineWidth = lwF;
            line(x - hs - 1, y, x + hs + 1, y);
          }
          ctx.lineCap = 'round';
        }
        if (m.glow > .01) {
          ctx.globalAlpha = m.glow * .55; ctx.strokeStyle = C.pulse; ctx.lineWidth = lwF;
          m.h.concat(m.v).forEach(function (th) { line(th.x0, th.y0, th.x1, th.y1); });
        }
        m.glow *= Math.exp(-dt / 520);
      });

      if (animate && time > allEnd) {
        if (now > nextPulse) { spawnPulse(null); nextPulse = now + 900 + Math.random() * 900; }
        for (var n = pulses.length - 1; n >= 0; n--) {
          var pl = pulses[n], ed = pl.ed;
          pl.t += dt / T.pulseDur;
          var sx = pl.rev ? ed.x1 : ed.x0, sy = pl.rev ? ed.y1 : ed.y0, ex = pl.rev ? ed.x0 : ed.x1, ey = pl.rev ? ed.y0 : ed.y1;
          if (pl.t >= 1) {
            var dest = pl.rev ? ed.a : ed.b;
            dest.glow = 1; pulses.splice(n, 1);
            if (Math.random() < .55 && pulses.length < 4) spawnPulse(dest);
            continue;
          }
          var q2 = ease(pl.t), qt = ease(Math.max(0, pl.t - .22));
          ctx.globalAlpha = .55; ctx.strokeStyle = C.pulse; ctx.lineWidth = 1.6 * scale;
          line(lerp(sx, ex, qt), lerp(sy, ey, qt), lerp(sx, ex, q2), lerp(sy, ey, q2));
          ctx.globalAlpha = 1; ctx.fillStyle = C.pulse; ctx.shadowColor = C.pulse; ctx.shadowBlur = 10 * scale;
          ctx.beginPath(); ctx.arc(lerp(sx, ex, q2), lerp(sy, ey, q2), 2.6 * scale, 0, 6.283); ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      ctx.globalAlpha = 1;
      applyMask();
    }

    function frame(now) {
      raf = null;
      if (!visible) return;
      var time = now - t0, dt = Math.min(50, now - last); last = now;
      var tens = clamp((time - T.tense) / (T.tenseEnd - T.tense));
      ct += dt / 1000 * lerp(1, .3, ease(tens));
      draw(time, ct, tens, dt, now, true);
      raf = requestAnimationFrame(frame);
    }

    function drawStatic() { draw(1e7, 0, 1, 16, 0, false); }

    function start() {
      if (raf) cancelAnimationFrame(raf);
      raf = null; pulses = []; ct = 0; nextPulse = 0; started = true;
      modules.forEach(function (m) { m.glow = 0; });
      threads.forEach(function (th) { th.e = 0; });
      if (reduceMQ.matches) { drawStatic(); return; }
      t0 = last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    readColors();
    if (build()) start();

    new ResizeObserver(function () {
      if (build()) { if (!started) start(); else if (reduceMQ.matches) drawStatic(); }
    }).observe(canvas);

    // Pausa cuando el hero sale de pantalla (ahorra batería y CPU)
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible && started && !raf && !reduceMQ.matches) { last = performance.now(); raf = requestAnimationFrame(frame); }
    }).observe(canvas);

    darkMQ.addEventListener('change', function () { readColors(); if (reduceMQ.matches) drawStatic(); });
    reduceMQ.addEventListener('change', start);
    canvas.weaveReplay = function () { build(); start(); };
  }

  function init() {
    var list = document.querySelectorAll('canvas[data-weave]');
    for (var i = 0; i < list.length; i++) mount(list[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
