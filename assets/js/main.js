/* ============================================================
   TRW RACING — interactions
   Vanilla JS, no dependencies. Every effect degrades to a
   readable page: without JS nothing is hidden (see .js rules).
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- 1. Start lights ----------
     Five columns light one by one, hold for a random beat, then go out
     together: that is the start. Click or any key skips it. */
  function initLights(onGo) {
    var root = $('#lights'), msg = $('#lightsMsg');
    var cols = root ? $$('.lights__col', root) : [];
    var timers = [], done = false;

    function go() {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      if (root) {
        cols.forEach(function (c) { c.classList.remove('is-on'); });
        root.classList.add('is-go');
        if (msg) msg.textContent = 'Lights out';
        setTimeout(function () { root.classList.add('is-out'); }, reduced ? 0 : 380);
        setTimeout(function () { root.classList.add('is-gone'); }, reduced ? 0 : 1300);
      }
      setTimeout(function () {
        document.body.classList.remove('is-loading');
        document.body.classList.add('is-ready');
        onGo();
      }, reduced ? 0 : 420);
    }

    if (!root || reduced) { go(); return; }

    cols.forEach(function (c, i) {
      timers.push(setTimeout(function () {
        c.classList.add('is-on');
        if (msg) msg.textContent = i < 4 ? 'Lights ' + (i + 1) : 'Hold';
      }, 350 + i * 420));
    });
    timers.push(setTimeout(go, 350 + 4 * 420 + 450 + Math.random() * 450));

    root.addEventListener('click', go);
    document.addEventListener('keydown', function once() { go(); document.removeEventListener('keydown', once); });
  }

  /* ---------- 2. Hero title: split into letters ---------- */
  function splitTitle() {
    $$('[data-split]').forEach(function (line, l) {
      var text = line.textContent;
      line.textContent = '';
      line.setAttribute('aria-hidden', 'true');
      line.style.setProperty('--l', l);
      Array.prototype.forEach.call(text, function (ch, c) {
        var s = document.createElement('span');
        s.className = 'ch';
        s.style.setProperty('--c', c);
        s.textContent = ch === ' ' ? ' ' : ch;
        line.appendChild(s);
      });
    });
  }

  /* ---------- 3. Scroll reveal ---------- */
  function initReveal() {
    var items = $$('[data-reveal]');
    if (!hasIO || reduced) { items.forEach(function (n) { n.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var n = e.target, d = parseInt(n.getAttribute('data-delay') || '0', 10);
        setTimeout(function () { n.classList.add('is-in'); }, d);
        io.unobserve(n);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (n) { io.observe(n); });
  }

  /* ---------- 4. Lazy sections ----------
     A [data-lazy] section shows a pit board ("Loading timing data")
     until the reader scrolls to it, loads, then its [data-stagger]
     children drive in one after another. */
  function initLazy() {
    var sections = $$('[data-lazy]');
    sections.forEach(function (sec) {
      var board = document.createElement('div');
      board.className = 'pitboard';
      board.setAttribute('aria-hidden', 'true');
      board.innerHTML = '<div class="pitboard__row"><span></span><em>Box</em></div><div class="pitboard__bar"><i></i></div>';
      board.querySelector('span').textContent = sec.getAttribute('data-lazy');
      sec.appendChild(board);
    });

    function load(sec) {
      if (sec.classList.contains('is-loading') || sec.classList.contains('is-loaded')) return;
      var ms = reduced ? 0 : 550 + Math.round(Math.random() * 350);
      sec.style.setProperty('--load', ms + 'ms');
      // next frame so the bar transition starts from zero
      requestAnimationFrame(function () {
        sec.classList.add('is-loading');
        setTimeout(function () {
          sec.classList.remove('is-loading');
          sec.classList.add('is-loaded');
          var items = $$('[data-stagger]', sec);
          var settle = reduced ? 0 : items.length * 75 + 900;
          setTimeout(function () {
            items.forEach(function (n) { n.removeAttribute('data-stagger'); });
            var b = $('.pitboard', sec);
            if (b) b.remove();
          }, settle);
        }, ms);
      });
    }

    if (!hasIO) { sections.forEach(load); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        load(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -25% 0px' });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---------- 5. Counters ---------- */
  function initCounters() {
    var nodes = $$('.counter');
    function countTo(node) {
      var target = parseInt(node.getAttribute('data-target'), 10) || 0;
      if (reduced) { node.textContent = target; return; }
      var dur = 1500, t0 = performance.now();
      (function step(now) {
        var p = Math.min((now - t0) / dur, 1);
        node.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }
    if (!hasIO) { nodes.forEach(countTo); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        countTo(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ---------- 6. Header, menu, lap progress, sector HUD ---------- */
  function initChrome() {
    var header = $('#header'), nav = $('#nav'), burger = $('#burger');
    var links = $$('.nav__link');
    var lapFill = $('#lapFill'), hud = $('#hud'), hudSector = $('#hudSector'), hudName = $('#hudName'), hudPct = $('#hudPct');
    var toTop = $('#toTop');
    var sectors = $$('[data-sector]');
    var rail = $('#railFill'), timeline = $('#timeline');
    var lastY = window.scrollY, ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY, vh = window.innerHeight;
      var max = document.documentElement.scrollHeight - vh;
      var p = max > 0 ? clamp(y / max, 0, 1) : 0;

      header.classList.toggle('is-stuck', y > 40);
      header.classList.toggle('is-hidden', y > 500 && y > lastY && !nav.classList.contains('is-open'));
      lastY = y;

      if (lapFill) lapFill.style.transform = 'scaleX(' + p + ')';
      if (toTop) toTop.classList.toggle('is-visible', y > vh);

      var current = sectors[0];
      sectors.forEach(function (s) { if (s.getBoundingClientRect().top <= vh * 0.4) current = s; });
      if (hud && current) {
        hud.classList.toggle('is-visible', y > vh * 0.5);
        var s = current.getAttribute('data-sector');
        if (hudSector.textContent !== s) { hudSector.textContent = s; hudSector.setAttribute('data-s', s); }
        hudName.textContent = current.getAttribute('data-name');
        hudPct.textContent = Math.round(p * 100);
      }
      links.forEach(function (a) { a.classList.toggle('is-active', current && a.getAttribute('href') === '#' + current.id); });

      if (rail && timeline) {
        var r = timeline.getBoundingClientRect();
        rail.style.transform = 'scaleY(' + clamp((vh * 0.65 - r.top) / r.height, 0, 1) + ')';
      }
    }

    function closeMenu() {
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Open menu');
      document.documentElement.classList.remove('is-menu-open');
    }
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.documentElement.classList.toggle('is-menu-open', open);
    });
    links.forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); });

    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- 7. Telemetry: a car lapping the test circuit ----------
     Speed comes from the track itself: curvature is sampled along the
     path, turned into a corner speed, then limited by braking and
     acceleration passes, so the car brakes before bends and the gear,
     shift lights and sector times all follow from that. */
  function initTelemetry() {
    var path = $('#trackPath');
    if (!path || !path.getTotalLength) return;
    var car = $('#car'), glow = $('#carGlow'), trail = $('#mapTrail');
    var roSpeed = $('#roSpeed'), roGear = $('#roGear'), roLap = $('#roLap'), roBest = $('#roBest');
    var shift = $$('#shift i'), shiftWrap = $('#shift');
    var secs = $$('.tele__sectors .sec[data-s]');
    var hero = $('#hero');

    var L = path.getTotalLength(), N = 480, i;
    var pts = [];
    for (i = 0; i < N; i++) { var q = path.getPointAtLength(L * i / N); pts.push([q.x, q.y]); }

    // curvature: change of heading between neighbouring samples
    var k = [];
    for (i = 0; i < N; i++) {
      var a = pts[i], b = pts[(i + 3) % N], c = pts[(i + 6) % N];
      var h1 = Math.atan2(b[1] - a[1], b[0] - a[0]), h2 = Math.atan2(c[1] - b[1], c[0] - b[0]);
      var d = Math.abs(h2 - h1); if (d > Math.PI) d = 2 * Math.PI - d;
      k.push(d);
    }
    var kMax = Math.max.apply(null, k) || 1;
    var VMAX = 318, VMIN = 92, v = [];
    for (i = 0; i < N; i++) v.push(VMAX - (VMAX - VMIN) * Math.pow(clamp(k[i] / (kMax * 0.8), 0, 1), 0.7));
    for (var pass = 0; pass < 3; pass++) {
      for (i = N - 1; i >= 0; i--) v[i] = Math.min(v[i], v[(i + 1) % N] + 6.5);   // braking zones
      for (i = 0; i < N; i++) v[(i + 1) % N] = Math.min(v[(i + 1) % N], v[i] + 2.4); // traction
    }
    var avg = v.reduce(function (s, x) { return s + x; }, 0) / N;
    var LAP_SIM = 19;                      // seconds of animation per lap
    var pxPerKmh = L / (LAP_SIM * avg);     // px per second, per km/h
    var DISPLAY = 106.4 / LAP_SIM;          // shown lap time ≈ 1:46

    var GEARS = [0, 95, 128, 160, 195, 232, 268, 300, 999];
    var TRAIL = 120;
    if (trail) trail.style.strokeDasharray = TRAIL + ' ' + (L + TRAIL);

    // sector boundary markers on the map
    var marks = $('#sectorMarks');
    [1, 2].forEach(function (n) {
      var pt = path.getPointAtLength(L * n / 3);
      var ns = 'http://www.w3.org/2000/svg';
      var r = document.createElementNS(ns, 'circle');
      r.setAttribute('cx', pt.x); r.setAttribute('cy', pt.y); r.setAttribute('r', 7); r.setAttribute('class', 'map__sector');
      var t = document.createElementNS(ns, 'text');
      t.setAttribute('x', pt.x + 14); t.setAttribute('y', pt.y - 12); t.setAttribute('class', 'map__sector-label');
      t.textContent = 'S' + (n + 1);
      marks.appendChild(r); marks.appendChild(t);
    });

    var dist = 0, lapT = 0, secStart = 0, sector = 0, pace = 1;
    var best = [Infinity, Infinity, Infinity], bestLap = Infinity;
    var running = true, last = performance.now();

    function fmt(t) {
      var m = Math.floor(t / 60), s = t - m * 60;
      return m + ':' + (s < 10 ? '0' : '') + s.toFixed(3);
    }
    function fmtS(t) { return t.toFixed(3); }

    function speedAt(s) {
      var f = (((s % L) + L) % L / L) * N, i0 = Math.floor(f) % N, i1 = (i0 + 1) % N, u = f - Math.floor(f);
      return v[i0] * (1 - u) + v[i1] * u;
    }

    function closeSector(idx, t) {
      var el = secs[idx];
      var cls = t < best[idx] ? 'is-purple' : (t < best[idx] * 1.006 ? 'is-green' : 'is-yellow');
      if (t < best[idx]) best[idx] = t;
      el.classList.remove('is-purple', 'is-green', 'is-yellow', 'is-flash');
      void el.offsetWidth;
      el.classList.add(cls, 'is-flash');
      el.querySelector('b').textContent = fmtS(t);
    }

    function render(kmh) {
      var pt = path.getPointAtLength(dist);
      car.setAttribute('cx', pt.x); car.setAttribute('cy', pt.y);
      glow.setAttribute('cx', pt.x); glow.setAttribute('cy', pt.y);
      if (trail) trail.style.strokeDashoffset = String(-(dist - TRAIL));
      roSpeed.textContent = Math.round(kmh);
      var g = 1; while (kmh > GEARS[g] && g < 8) g++;
      roGear.textContent = g;
      var lo = GEARS[g - 1], hi = Math.min(GEARS[g], 330);
      var rpm = clamp((kmh - lo) / (hi - lo), 0, 1);
      var lit = Math.round(rpm * shift.length);
      shift.forEach(function (n, j) { n.classList.toggle('on', j < lit); });
      shiftWrap.classList.toggle('is-limit', rpm > 0.93);
      roLap.textContent = fmt(lapT * DISPLAY);
    }

    function frame(now) {
      var dt = clamp((now - last) / 1000, 0, 0.05);
      last = now;
      if (running) {
        var kmh = speedAt(dist) * pace;
        dist += kmh * pxPerKmh * dt;
        lapT += dt;
        var bound = L * (sector + 1) / 3;
        if (dist >= bound) {
          closeSector(sector, (lapT - secStart) * DISPLAY);
          secStart = lapT;
          sector++;
          if (sector === 3) {
            var lt = lapT * DISPLAY;
            if (lt < bestLap) { bestLap = lt; roBest.textContent = fmt(lt); }
            dist -= L; lapT = 0; secStart = 0; sector = 0;
            pace = 0.985 + Math.random() * 0.03;
          }
        }
        render(kmh);
      }
      requestAnimationFrame(frame);
    }

    if (reduced) { dist = L * 0.08; render(speedAt(dist)); return; }
    if (hasIO && hero) {
      new IntersectionObserver(function (e) { running = e[0].isIntersecting; last = performance.now(); }).observe(hero);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- 8. Hero speed streaks (canvas) ---------- */
  function initStreaks() {
    var cv = $('#streaks'), hero = $('#hero');
    if (!cv || reduced) return;
    var ctx = cv.getContext('2d'), w = 0, h = 0, dpr = 1, lines = [], visible = true;
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lines = [];
      var n = Math.round(w / 30);
      for (var i = 0; i < n; i++) lines.push(spawn(true));
    }
    function spawn(anywhere) {
      return {
        x: anywhere ? Math.random() * w : w + Math.random() * w * 0.5,
        y: Math.random() * h,
        len: 60 + Math.random() * 240,
        sp: 700 + Math.random() * 1500,
        a: 0.05 + Math.random() * 0.25,
        red: Math.random() < 0.18
      };
    }
    var last = performance.now();
    function frame(now) {
      var dt = clamp((now - last) / 1000, 0, 0.05); last = now;
      if (visible) {
        ctx.clearRect(0, 0, w, h);
        lines.forEach(function (l, i) {
          l.x -= l.sp * dt;
          if (l.x + l.len < 0) lines[i] = l = spawn(false);
          var g = ctx.createLinearGradient(l.x, 0, l.x + l.len, 0);
          var col = l.red ? '228,0,43' : '255,255,255';
          g.addColorStop(0, 'rgba(' + col + ',' + l.a + ')');
          g.addColorStop(1, 'rgba(' + col + ',0)');
          ctx.fillStyle = g;
          ctx.fillRect(l.x, l.y, l.len, l.red ? 2 : 1);
        });
      }
      requestAnimationFrame(frame);
    }
    size();
    window.addEventListener('resize', size);
    if (hasIO && hero) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(hero);
    requestAnimationFrame(frame);
  }

  /* ---------- 9. Chequered flag (canvas, CTA) ---------- */
  function initFlag() {
    var cv = $('#flag'), sec = $('#contact');
    if (!cv) return;
    var ctx = cv.getContext('2d'), w = 0, h = 0, dpr = 1, visible = false, cell = 44;
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      var cols = Math.ceil(w / cell) + 2, rows = Math.ceil(h / cell) + 2;
      function P(cx, cy) {
        var x = cx * cell - cell, y = cy * cell - cell;
        var wave = Math.sin(x * 0.012 + t * 2.2) * 14 + Math.sin(x * 0.02 + y * 0.01 + t * 1.3) * 6;
        return [x + wave * 0.3, y + wave];
      }
      for (var cy = 0; cy < rows; cy++) {
        for (var cx = 0; cx < cols; cx++) {
          var a = P(cx, cy), b = P(cx + 1, cy), c = P(cx + 1, cy + 1), d = P(cx, cy + 1);
          var shade = 0.55 + 0.45 * Math.cos((cx * cell) * 0.012 + t * 2.2);
          var dark = (cx + cy) % 2;
          var g = dark ? Math.round(20 * shade) : Math.round(255 * shade);
          ctx.fillStyle = 'rgb(' + g + ',' + g + ',' + g + ')';
          ctx.beginPath();
          ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]);
          ctx.closePath(); ctx.fill();
        }
      }
    }
    function frame(now) {
      if (visible) draw(now / 1000);
      requestAnimationFrame(frame);
    }
    size();
    window.addEventListener('resize', size);
    if (reduced) { draw(0); return; }
    if (hasIO && sec) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(sec);
    else visible = true;
    requestAnimationFrame(frame);
  }

  /* ---------- 10. Program tabs ---------- */
  function initTabs() {
    var wrap = $('#tabs'), ink = $('#tabsInk');
    if (!wrap) return;
    var tabs = $$('.tab', wrap);
    function moveInk(tab) {
      ink.style.width = tab.offsetWidth + 'px';
      ink.style.transform = 'translateX(' + tab.offsetLeft + 'px)';
    }
    function select(tab) {
      var key = tab.getAttribute('data-tab');
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      $$('.panel').forEach(function (p) { p.classList.toggle('is-active', p.getAttribute('data-panel') === key); });
      moveInk(tab);
    }
    tabs.forEach(function (tab, i) {
      tab.tabIndex = i === 0 ? 0 : -1;
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!dir) return;
        var next = tabs[(i + dir + tabs.length) % tabs.length];
        next.focus(); select(next);
      });
    });
    var active = $('.tab.is-active', wrap) || tabs[0];
    moveInk(active);
    window.addEventListener('resize', function () { moveInk($('.tab.is-active', wrap) || active); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveInk($('.tab.is-active', wrap) || active); });
  }

  /* ---------- 11. News filters ---------- */
  function initFilters() {
    var wrap = $('#filters');
    if (!wrap) return;
    var buttons = $$('.filter', wrap), cards = $$('#newsGrid .card');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-filter'), n = 0;
        buttons.forEach(function (b) { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-pressed', String(b === btn)); });
        cards.forEach(function (card) {
          var show = key === 'all' || card.getAttribute('data-cat') === key;
          card.classList.toggle('is-hidden', !show);
          card.classList.remove('is-refilter');
          if (show && !reduced) { void card.offsetWidth; card.style.setProperty('--n', n++); card.classList.add('is-refilter'); }
        });
      });
    });
  }

  /* ---------- 12. Countdown to R8 ---------- */
  function initCountdown() {
    var root = $('#countdown');
    if (!root) return;
    var target = new Date(2026, 10, 14, 14, 0, 0);
    if (target < new Date()) { target = new Date(); target.setDate(target.getDate() + 12); target.setHours(14, 0, 0, 0); }
    var f = { d: $('[data-cd="d"]', root), h: $('[data-cd="h"]', root), m: $('[data-cd="m"]', root), s: $('[data-cd="s"]', root) };
    function pad(n) { return n < 10 ? '0' + n : String(n); }
    function tick() {
      var s = Math.floor(Math.max(target - new Date(), 0) / 1000);
      f.d.textContent = pad(Math.floor(s / 86400));
      f.h.textContent = pad(Math.floor(s / 3600) % 24);
      f.m.textContent = pad(Math.floor(s / 60) % 60);
      f.s.textContent = pad(s % 60);
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- 13. CTA form ---------- */
  function initForm() {
    var form = $('#ctaForm'), msg = $('#ctaMsg');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('#ctaEmail');
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      msg.textContent = ok ? 'Copy that — we will be in touch.' : 'Enter a valid email address, e.g. name@team.com';
      msg.classList.toggle('is-ok', ok);
      if (ok) form.reset(); else input.focus();
    });
  }

  /* ---------- 14. Marquees (rAF, seamless) ---------- */
  function initMarquees() {
    var roots = $$('[data-marquee]');
    roots.forEach(function (root) {
      var track = $('.marquee__track', root);
      root._track = track;
      root._seed = track.firstElementChild.outerHTML;
      root._offset = 0;
      root._visible = true;
      root._paused = false;
      // +1 = content travels right-to-left, -1 = left-to-right
      root._dir = root.getAttribute('data-direction') === 'reverse' ? -1 : 1;
      // reduced motion keeps the loop but at a calm pace
      root._speed = (parseFloat(root.getAttribute('data-speed')) || 60) * (reduced ? 0.35 : 1);
      root._cur = root._speed;
      root._build = function () {
        track.innerHTML = root._seed;
        var gw = track.firstElementChild.getBoundingClientRect().width;
        if (!gw) return;
        root._groupW = gw;
        var copies = Math.ceil(root.offsetWidth / gw) + 2, html = '';
        for (var i = 0; i < copies; i++) html += root._seed;
        track.innerHTML = html;
        root._offset = root._offset % gw;
      };
      root._build();
      // hovering eases the row down to a crawl instead of stopping it dead
      if (root.hasAttribute('data-pause-on-hover')) {
        root.addEventListener('mouseenter', function () { root._paused = true; });
        root.addEventListener('mouseleave', function () { root._paused = false; });
      }
    });
    if (hasIO) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { e.target._visible = e.isIntersecting; });
      }, { rootMargin: '120px 0px' });
      roots.forEach(function (r) { io.observe(r); });
    }
    var last = performance.now();
    (function frame(now) {
      var dt = clamp((now - last) / 1000, 0, 0.05); last = now;
      roots.forEach(function (r) {
        if (!r._groupW || !r._visible) return;
        var target = r._paused ? r._speed * 0.12 : r._speed;
        r._cur += (target - r._cur) * Math.min(1, dt * 3.5);
        r._offset = (r._offset + r._dir * r._cur * dt) % r._groupW;
        if (r._offset < 0) r._offset += r._groupW;
        r._track.style.transform = 'translate3d(' + (-r._offset).toFixed(2) + 'px,0,0)';
      });
      requestAnimationFrame(frame);
    })(last);
    function rebuild() { roots.forEach(function (r) { r._build(); }); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);
    var t;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(rebuild, 200); });
  }


  /* ---------- 15. Ghost words slide with scroll ---------- */
  function initGhosts() {
    var ghosts = $$('[data-ghost]');
    ghosts.forEach(function (g, i) {
      var word = g.getAttribute('data-ghost');
      g.textContent = new Array(7).join(word + ' · ');
      g._dir = i % 2 ? 1 : -1;
    });
    if (reduced) return;
    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight;
      ghosts.forEach(function (g) {
        var r = g.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var p = (vh - r.top) / (vh + r.height);           // 0 → 1 while the section crosses the screen
        var w = g.scrollWidth;
        var x = -w * 0.25 + g._dir * (p - 0.5) * w * 0.18;
        g.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
      });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- 16. Garage carousel: the next car drives in ---------- */
  function initGarage() {
    var root = $('#garage');
    if (!root) return;
    var slides = $$('.slide', root), dots = $$('.dot', root), cur = 0;
    function show(n, dir) {
      n = (n + slides.length) % slides.length;
      if (n === cur) return;
      slides[cur].classList.remove('is-active', 'from-left');
      cur = n;
      var s = slides[cur];
      s.classList.toggle('from-left', dir < 0);
      void s.offsetWidth;
      s.classList.add('is-active');
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === cur); d.setAttribute('aria-current', i === cur ? 'true' : 'false'); });
    }
    $$('.garage__arrow', root).forEach(function (b) {
      b.addEventListener('click', function () { var d = +b.getAttribute('data-dir'); show(cur + d, d); });
    });
    dots.forEach(function (d) { d.addEventListener('click', function () { var n = +d.getAttribute('data-go'); show(n, n > cur ? 1 : -1); }); });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') show(cur + 1, 1);
      if (e.key === 'ArrowLeft') show(cur - 1, -1);
    });
    // swipe on touch screens
    var x0 = null;
    root.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    });
  }

  /* ---------- 17. Driver line-up by season ---------- */
  function initDrivers() {
    var grid = $('#dgrid'), wrap = $('#years'), dataEl = $('#rosterData'), tpl = $('#helmetTpl');
    if (!grid || !wrap || !dataEl) return;
    var roster = JSON.parse(dataEl.textContent);
    var helmet = tpl ? tpl.innerHTML : '';
    var buttons = $$('.year', wrap);
    var order = buttons.map(function (b) { return b.getAttribute('data-year'); });
    var current = order[0];

    function esc(t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
    function card(d, i) {
      return '<article class="dcard" style="--i:' + i + ';--c1:' + d.c1 + ';--c2:' + d.c2 + '">' +
        '<div class="dcard__art"><span class="dcard__logo">TRW</span><span class="dcard__no">' + esc(d.num) + '</span>' + helmet +
        '<h3 class="dcard__name"><small>' + esc(d.first) + '</small>' + esc(d.last) + '</h3></div>' +
        '<p class="dcard__meta"><span>' + esc(d.nat) + ' · ' + esc(d.cls) + '</span><span class="mono">' + esc(d.lap) + '</span></p></article>';
    }
    function select(year) {
      if (year === current || !roster[year]) return;
      current = year;
      buttons.forEach(function (b) {
        var on = b.getAttribute('data-year') === year;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      grid.classList.remove('is-swap');
      grid.innerHTML = roster[year].map(card).join('');
      if (!reduced) { void grid.offsetWidth; grid.classList.add('is-swap'); }
    }
    buttons.forEach(function (b) { b.addEventListener('click', function () { select(b.getAttribute('data-year')); }); });
    $$('.years__arrow', wrap).forEach(function (a) {
      a.addEventListener('click', function () {
        var i = order.indexOf(current) + parseInt(a.getAttribute('data-step'), 10);
        if (i >= 0 && i < order.length) select(order[i]);
      });
    });
  }

  /* ---------- Boot ---------- */
  function boot() {
    var year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
    splitTitle();
    initLazy();
    initChrome();
    initTabs();
    initFilters();
    initCountdown();
    initForm();
    initMarquees();
    initCounters();
    initStreaks();
    initFlag();
    initTelemetry();
    initGhosts();
    initGarage();
    initDrivers();
    // reveals wait for the start so nothing animates behind the lights
    initLights(initReveal);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
