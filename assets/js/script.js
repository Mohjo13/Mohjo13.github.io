/* ═══════════════════════════════════════════════════════════
   MOHSEN PARCHAMI — PORTFOLIO  |  script.js
═══════════════════════════════════════════════════════════ */

'use strict';

/* ── 1. SCROLL PROGRESS BAR ─────────────────────────────── */
(function initScrollBar() {
    var bar = document.getElementById('scrollBar');
    if (!bar) return;

    function update() {
        var scrolled = window.scrollY;
        var total = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (total > 0 ? (scrolled / total) * 100 : 0) + '%';
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
})();

/* ── 2. NAV: active spy + background ───────────────────── */
(function initNav() {
    var links = Array.from(document.querySelectorAll('.nav-link[data-section]'));
    var sections = links.map(function (l) {
        return document.getElementById(l.dataset.section);
    }).filter(Boolean);
    var navbar = document.getElementById('navbar');

    function onScroll() {
        var sy = window.scrollY + 80;
        var current = sections[0];
        sections.forEach(function (s) { if (s && s.offsetTop <= sy) current = s; });
        links.forEach(function (l) {
            l.classList.toggle('active', l.dataset.section === (current && current.id));
        });
        if (navbar) {
            navbar.style.background = window.scrollY > 20
                ? 'rgba(10,12,16,0.97)'
                : 'rgba(10,12,16,0.85)';
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
})();

/* ── 3. MOBILE BURGER ───────────────────────────────────── */
(function initBurger() {
    var burger = document.getElementById('navBurger');
    var mobile = document.getElementById('navMobile');
    if (!burger || !mobile) return;

    burger.addEventListener('click', function () {
        var open = mobile.classList.toggle('open');
        burger.setAttribute('aria-expanded', open);
    });

    mobile.querySelectorAll('.nav-mobile-link').forEach(function (l) {
        l.addEventListener('click', function () {
            mobile.classList.remove('open');
            burger.setAttribute('aria-expanded', false);
        });
    });
})();

/* ── 4. SMOOTH ANCHOR SCROLL ────────────────────────────── */
(function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener('click', function (e) {
            var target = document.querySelector(link.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            var navH = (document.getElementById('navbar') || {}).offsetHeight || 60;
            window.scrollTo({
                top: target.getBoundingClientRect().top + window.scrollY - navH,
                behavior: 'smooth'
            });
        });
    });
})();

/* ── 5. SCROLL REVEAL ───────────────────────────────────── */
(function initReveal() {
    var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) { obs.observe(el); });
})();

/* ── 6. TYPEWRITER ──────────────────────────────────────── */
(function initTypewriter() {
    var el = document.getElementById('typewriter');
    if (!el) return;

    var text = 'Building gameplay that feels, stories that linger, and worlds that pull you in deeper than you meant to go.';
    var startAt = 1100;  /* ms — after hero name finishes animating */
    var charMs = 40;
    var i = 0;

    setTimeout(function () {
        var iv = setInterval(function () {
            el.textContent = text.slice(0, ++i);
            if (i >= text.length) clearInterval(iv);
        }, charMs);
    }, startAt);
})();

/* ── 7. SYSTEMS TABS + LAZY GIFs ────────────────────────── */
(function initSysTabs() {
    var tabs = Array.from(document.querySelectorAll('.sys-tab'));
    var panels = Array.from(document.querySelectorAll('.sys-panel'));
    if (!tabs.length) return;

    function loadGif(panelName) {
        var panel = document.querySelector('.sys-panel[data-panel="' + panelName + '"]');
        if (!panel) return;
        panel.querySelectorAll('.lazy-gif[data-src]').forEach(function (img) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });
    }

    function activate(name) {
        tabs.forEach(function (t) {
            var on = t.dataset.tab === name;
            t.classList.toggle('active', on);
            t.setAttribute('aria-selected', on);
        });
        panels.forEach(function (p) {
            p.classList.toggle('active', p.dataset.panel === name);
        });
        loadGif(name);
    }

    tabs.forEach(function (tab, i) {
        tab.addEventListener('click', function () { activate(tab.dataset.tab); });
        tab.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowRight') {
                var next = tabs[(i + 1) % tabs.length];
                next.focus(); activate(next.dataset.tab);
            }
            if (e.key === 'ArrowLeft') {
                var prev = tabs[(i - 1 + tabs.length) % tabs.length];
                prev.focus(); activate(prev.dataset.tab);
            }
        });
    });

    /* preload remaining GIFs when section comes into view */
    var sys = document.getElementById('systems');
    if (sys) {
        var preloadObs = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting) {
                ['movement', 'shaders', 'lighting'].forEach(loadGif);
                preloadObs.disconnect();
            }
        }, { threshold: 0.15 });
        preloadObs.observe(sys);
    }
})();

/* ── 9. SKETCH BUTTON GLOW RIM ──────────────────────────── */
(function initSketchButtons() {

    function createSVG(w, h, r) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        rect.setAttribute('width', '100%');
        rect.setAttribute('height', '100%');
        rect.setAttribute('rx', r);
        rect.setAttribute('ry', r);
        rect.setAttribute('pathLength', '10');
        svg.appendChild(rect);
        return svg;
    }

    function initEl(el) {
        if (el.querySelector('.btn-lines')) return;

        var style = getComputedStyle(el);
        var radius = parseInt(style.borderRadius, 10) || 8;
        var w = el.offsetWidth;
        var h = el.offsetHeight;

        // if element has no size yet (e.g. hidden/not rendered), skip
        if (!w || !h) return;

        var lines = document.createElement('div');
        lines.className = 'btn-lines';

        var topGroup = document.createElement('div');
        var bottomGroup = document.createElement('div');
        var svg = createSVG(w, h, radius);

        for (var i = 0; i < 4; i++) {
            topGroup.appendChild(svg.cloneNode(true));
            bottomGroup.appendChild(svg.cloneNode(true));
        }

        bottomGroup.style.transform = 'rotate(180deg)';
        lines.appendChild(topGroup);
        lines.appendChild(bottomGroup);
        el.appendChild(lines);

        el.addEventListener('pointerenter', function () {
            el.classList.remove('btn-glow-active');
            void el.offsetWidth; // force reflow so animation restarts
            el.classList.add('btn-glow-active');
        });

        el.addEventListener('animationend', function () {
            el.classList.remove('btn-glow-active');
        });
    }

    // wait for full paint before measuring sizes
    window.addEventListener('load', function () {
        document.querySelectorAll('.btn').forEach(initEl);
    });

})();

(function initTilt() {
    var card = document.getElementById('projectCard');
    if (!card) return;
    if (window.matchMedia('(hover: none)').matches) return;

    var MAX = 10;

    card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transition = 'transform 0.1s ease';
        card.style.transform =
            'perspective(900px) rotateY(' + (x * MAX * 2) + 'deg) rotateX(' + (-y * MAX) + 'deg) scale(1.015)';
    });

    card.addEventListener('mouseleave', function () {
        card.style.transition = 'transform 0.5s ease';
        card.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) scale(1)';
    });
})();
