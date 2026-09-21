/* ============================================================
   TRW RACING — interactions
   Vanilla JS, no dependencies.
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- 1. Preloader ---------- */
  function initPreloader() {
    var el = $('#preloader'), bar = $('#preloaderBar'), count = $('#preloaderCount');
    if (!el) { document.body.classList.remove('is-loading'); return; }

    var value = 0, done = false;
    var timer = setInterval(function () {
      value = Math.min(value + Math.random() * 9 + 3, 99);
      render(value);
      if (value >= 99) { clearInterval(timer); }
    }, 90);

    function render(v) {
      var n = Math.floor(v);
      if (bar) bar.style.width = n + '%';
      if (count) count.textContent = n;
    }

    function finish() {
      if (done) return;
      done = true;
      clearInterval(timer);
      render(100);
      setTimeout(function () {
        el.classList.add('is-done');
        document.body.classList.remove('is-loading');
        document.body.classList.add('is-ready');
        setTimeout(function () { el.classList.add("is-hidden"); }, 1100);
        startWordAnimation();
      }, 320);
    }

    window.addEventListener('load', function () { setTimeout(finish, reduced ? 0 : 500); });
    // safety net if `load` never fires (slow fonts, blocked assets)
    setTimeout(finish, 4500);
  }

  /* ---------- 2. Hero headline: staggered word rise ---------- */
  function startWordAnimation() {
    $$('[data-split]').forEach(function (word, i) {
      word.style.animationDelay = (i * 90) + 'ms';
    });
  }

  /* ---------- 3. Scroll reveal (scroll loading) ---------- */
  function initReveal() {
    var items = $$('[data-reveal]');
    if (!('IntersectionObserver' in window) || reduced) {
      items.forEach(function (n) { n.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var node = entry.target;
        var delay = parseInt(node.getAttribute('data-delay') || '0', 10);
        setTimeout(function () { node.classList.add('is-in'); }, delay);
        io.unobserve(node);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (n) { io.observe(n); });
  }

  /* ---------- 4. Animated counters ---------- */
  function initCounters() {
    var nodes = $$('.counter');
    if (!nodes.length) return;
    if (!('IntersectionObserver' in window) || reduced) {
      nodes.forEach(function (n) { n.textContent = n.getAttribute('data-target'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countTo(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    nodes.forEach(function (n) { io.observe(n); });

    function countTo(node) {
      var target = parseInt(node.getAttribute('data-target'), 10) || 0;
      var duration = 1600, start = performance.now();
      (function step(now) {
        var p = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        node.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(step);
      })(start);
    }
  }

  /* ---------- 5. Header: stick, auto-hide, active link ---------- */
  function initHeader() {
    var header = $('#header'), nav = $('#nav'), burger = $('#burger');
    var links = $$('.nav__link');
    var sections = links
      .map(function (a) { return $(a.getAttribute('href')); })
      .filter(Boolean);
    var lastY = window.scrollY;

    function onScroll() {
      var y = window.scrollY;
      header.classList.toggle('is-stuck', y > 40);
      var menuOpen = nav.classList.contains('is-open');
      header.classList.toggle('is-hidden', y > 400 && y > lastY && !menuOpen);
      lastY = y;

      var current = null;
      sections.forEach(function (sec) {
        if (sec.getBoundingClientRect().top <= window.innerHeight * 0.35) current = sec.id;
      });
      links.forEach(function (a) {
        a.classList.toggle('is-active', a.getAttribute('href') === '#' + current);
      });
    }

    function closeMenu() {
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      document.documentElement.classList.remove('is-menu-open');
    }

    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      document.documentElement.classList.toggle('is-menu-open', open);
    });
    links.forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 6. Scroll progress + back to top ---------- */
  function initProgress() {
    var bar = $('#scrollBar'), top = $('#toTop');
    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? (window.scrollY / max) * 100 : 0;
      if (bar) bar.style.width = p + '%';
      if (top) top.classList.toggle('is-visible', window.scrollY > window.innerHeight);
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    if (top) top.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
    update();
  }

  /* ---------- 7. Parallax layers ---------- */
  function initParallax() {
    var layers = $$('[data-parallax]');
    if (!layers.length || reduced) return;
    var ticking = false;
    function update() {
      layers.forEach(function (layer) {
        var speed = parseFloat(layer.getAttribute('data-parallax')) || 0.2;
        var rect = layer.parentElement.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
        layer.style.transform = 'translate3d(0,' + (-rect.top * speed) + 'px,0)';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------- 8. Program tabs ---------- */
  function initTabs() {
    var wrap = $('#tabs'), ink = $('#tabsInk');
    if (!wrap) return;
    var tabs = $$('.tab', wrap);

    function moveInk(tab) {
      if (!ink) return;
      ink.style.width = tab.offsetWidth + 'px';
      ink.style.transform = 'translateX(' + tab.offsetLeft + 'px)';
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var key = tab.getAttribute('data-tab');
        tabs.forEach(function (t) { t.classList.toggle('is-active', t === tab); });
        $$('.panel').forEach(function (p) {
          p.classList.toggle('is-active', p.getAttribute('data-panel') === key);
        });
        moveInk(tab);
      });
    });

    var active = $('.tab.is-active', wrap) || tabs[0];
    if (active) { moveInk(active); window.addEventListener('resize', function () { moveInk($('.tab.is-active', wrap) || active); }); }
  }

  /* ---------- 9. News filters ---------- */
  function initFilters() {
    var wrap = $('#filters');
    if (!wrap) return;
    var buttons = $$('.filter', wrap), cards = $$('#newsGrid .card');

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-filter');
        buttons.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        cards.forEach(function (card, i) {
          var show = key === 'all' || card.getAttribute('data-cat') === key;
          card.classList.toggle('is-hidden', !show);
          if (show && !reduced) {
            card.style.animation = 'none';
            void card.offsetWidth;
            card.style.animation = 'panelIn .5s var(--ease) ' + (i * 50) + 'ms both';
          }
        });
      });
    });
  }

  /* ---------- 10. Custom cursor ---------- */
  function initCursor() {
    var cursor = $('#cursor');
    if (!cursor || window.matchMedia('(pointer: coarse)').matches) {
      if (cursor) cursor.style.display = 'none';
      return;
    }
    var dot = $('.cursor__dot', cursor), ring = $('.cursor__ring', cursor);
    var mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
    });

    (function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();

    $$('[data-cursor], a, button').forEach(function (node) {
      node.addEventListener('mouseenter', function () {
        cursor.classList.add('is-active');
        ring.setAttribute('data-label', node.getAttribute('data-cursor') === 'view' ? 'View'
          : node.getAttribute('data-cursor') === 'read' ? 'Read' : '');
      });
      node.addEventListener('mouseleave', function () {
        cursor.classList.remove('is-active');
        ring.removeAttribute('data-label');
      });
    });
  }

  /* ---------- 11. Countdown to next race ---------- */
  function initCountdown() {
    var root = $('#countdown');
    if (!root) return;
    var target = new Date();
    target.setDate(target.getDate() + 34);
    target.setHours(14, 0, 0, 0);

    var fields = {
      d: $('[data-cd="d"]', root), h: $('[data-cd="h"]', root),
      m: $('[data-cd="m"]', root), s: $('[data-cd="s"]', root)
    };

    function pad(n) { return n < 10 ? '0' + n : String(n); }

    function tick() {
      var diff = Math.max(target - new Date(), 0);
      var s = Math.floor(diff / 1000);
      fields.d.textContent = pad(Math.floor(s / 86400));
      fields.h.textContent = pad(Math.floor(s / 3600) % 24);
      fields.m.textContent = pad(Math.floor(s / 60) % 60);
      fields.s.textContent = pad(s % 60);
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- 12. CTA form ---------- */
  function initForm() {
    var form = $('#ctaForm'), msg = $('#ctaMsg');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="email"]');
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      msg.textContent = ok ? 'Thanks — we will be in touch.' : 'Please enter a valid email address.';
      msg.style.color = ok ? '#4ade80' : '';
      if (ok) form.reset();
    });
  }

  /* ---------- 13. Misc ---------- */
  function initMisc() {
    var year = $('#year');
    if (year) year.textContent = new Date().getFullYear();

    $$('.lang__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('.lang__btn').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      });
    });
  }

  /* ---------- 14. Marquees ----------
     Driven by rAF rather than a CSS animation: no keyframe/custom-property
     quirks, exact direction control, and it cannot be switched off by a
     blanket `animation` override. The authored group is cloned until the
     track covers the container, and the offset wraps modulo one group
     width, so the loop is seamless in both directions. */
  function initMarquees() {
    var roots = $$('[data-marquee]');
    if (!roots.length) return;

    roots.forEach(function (root) {
      var track = $('.marquee__track', root);
      if (!track) return;

      root._track = track;
      root._seed = track.firstElementChild.outerHTML;
      root._offset = 0;
      root._visible = true;
      root._paused = false;
      // +1 = content travels left (right-to-left), -1 = travels right
      root._dir = root.getAttribute('data-direction') === 'reverse' ? -1 : 1;
      // px per second; reduced-motion keeps the loop but takes the edge off
      root._speed = (parseFloat(root.getAttribute('data-speed')) || 60) * (reduced ? 0.4 : 1);

      root._build = function () {
        track.innerHTML = root._seed;
        var groupWidth = track.firstElementChild.getBoundingClientRect().width;
        if (!groupWidth) return;
        root._groupW = groupWidth;

        var copies = Math.ceil(root.offsetWidth / groupWidth) + 2;
        var html = '';
        for (var i = 0; i < copies; i++) html += root._seed;
        track.innerHTML = html;
        root._offset = root._offset % groupWidth;
      };

      root._build();

      if (root.hasAttribute('data-pause-on-hover')) {
        root.addEventListener('mouseenter', function () { root._paused = true; });
        root.addEventListener('mouseleave', function () { root._paused = false; });
      }
    });

    // only animate what is on screen
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { e.target._visible = e.isIntersecting; });
      }, { rootMargin: '120px 0px' });
      roots.forEach(function (r) { io.observe(r); });
    }

    var last = performance.now();
    (function frame(now) {
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      roots.forEach(function (root) {
        if (!root._groupW || !root._visible || root._paused) return;
        var w = root._groupW;
        root._offset = (root._offset + root._dir * root._speed * dt) % w;
        if (root._offset < 0) root._offset += w;
        root._track.style.transform = 'translate3d(' + (-root._offset).toFixed(2) + 'px,0,0)';
      });
      requestAnimationFrame(frame);
    })(last);

    function rebuild() { roots.forEach(function (r) { r._build(); }); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);

    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(rebuild, 200);
    });
  }

  /* ---------- Boot ---------- */
  function boot() {
    initPreloader();
    initReveal();
    initCounters();
    initHeader();
    initProgress();
    initParallax();
    initTabs();
    initFilters();
    initCursor();
    initCountdown();
    initForm();
    initMisc();
    initMarquees();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
