/* ═══════════════════════════════════════════════════════════
   MOHSEN PARCHAMI · PORTFOLIO  |  script.js
═══════════════════════════════════════════════════════════ */

'use strict';

/* ── 1. SCROLL PROGRESS BAR ─────────────────────────────── */
(function initScrollBar() {
    var bar = document.getElementById('scrollBar');
    if (!bar) return;

    var total = 0;          // cached: avoids scrollHeight read on every scroll
    var ticking = false;

    function measure() {
        total = document.documentElement.scrollHeight - window.innerHeight;
    }

    function render() {
        ticking = false;
        var ratio = total > 0 ? window.scrollY / total : 0;
        bar.style.transform = 'scaleX(' + Math.min(ratio, 1) + ')';   // composited
    }

    function onScroll() {
        if (!ticking) { ticking = true; requestAnimationFrame(render); }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { measure(); render(); }, { passive: true });
    window.addEventListener('load', function () { measure(); render(); });
    measure();
    render();
})();

/* ── 2. NAV: active spy ─────────────────────────────────── */
(function initNav() {
    var links = Array.from(document.querySelectorAll('.nav-link[data-section]'));
    var sections = links.map(function (l) {
        return document.getElementById(l.dataset.section);
    }).filter(Boolean);
    var offsets = [];       // cached: avoids offsetTop read on every scroll
    var ticking = false;

    function measure() {
        offsets = sections.map(function (s) { return s.offsetTop; });
    }

    function render() {
        ticking = false;
        var sy = window.scrollY + 120;
        var current = null;     // nothing active while on the hero
        for (var i = 0; i < sections.length; i++) {
            if (offsets[i] <= sy) current = sections[i];
        }
        links.forEach(function (l) {
            l.classList.toggle('active', l.dataset.section === (current && current.id));
        });
    }

    function onScroll() {
        if (!ticking) { ticking = true; requestAnimationFrame(render); }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { measure(); render(); }, { passive: true });
    window.addEventListener('load', measure);
    measure();
    render();
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

/* ── 7. SYSTEMS TABS + LAZY GIFs ────────────────────────── */
/* Shared helper: swap data-src → src and start playback (Safari-safe).
   Used by the preloader below and the tab controller in initSystemsPicker. */
function loadVideo(el) {
    if (!el || !el.dataset || !el.dataset.src) return;
    el.src = el.dataset.src;
    el.removeAttribute('data-src');
    if (el.tagName === 'VIDEO') {
        el.load();
        var p = el.play();
        if (p && p.catch) p.catch(function () {});
    }
}

(function initSysPreload() {
    var sys = document.getElementById('systems');
    if (!sys) return;
    var preloadObs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
            var group = document.querySelector('[data-project-panels]:not(.sys-hidden)');
            if (group) group.querySelectorAll('.lazy-gif[data-src]').forEach(loadVideo);
            preloadObs.disconnect();
        }
    }, { threshold: 0.15 });
    preloadObs.observe(sys);
})();

/* SYSTEMS: single tab + project controller.
   Sole owner of picker buttons, tab rows (click + arrow keys),
   panel switching, and lazy video loading for BOTH projects. */
(function initSystemsPicker() {
    var picker = document.querySelector('.sys-project-picker');
    if (!picker) return;

    var projectBtns = picker.querySelectorAll('.sys-project-btn');

    function switchProject(project) {
        // update picker buttons
        projectBtns.forEach(function (btn) {
            var on = btn.dataset.project === project;
            btn.classList.toggle('active', on);
            btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        });

        // show/hide tab rows, reset active tab to first
        document.querySelectorAll('[data-project-tabs]').forEach(function (el) {
            var on = el.dataset.projectTabs === project;
            el.classList.toggle('sys-hidden', !on);
            if (on) {
                el.querySelectorAll('.sys-tab').forEach(function (t, i) {
                    t.classList.toggle('active', i === 0);
                    t.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
                });
            }
        });

        // show/hide panel groups, reset active panel to first
        document.querySelectorAll('[data-project-panels]').forEach(function (el) {
            var on = el.dataset.projectPanels === project;
            el.classList.toggle('sys-hidden', !on);
            if (on) {
                el.querySelectorAll('.sys-panel').forEach(function (p, i) { p.classList.toggle('active', i === 0); });
                loadVideo(el.querySelector('.sys-panel.active .lazy-gif'));
            }
        });
    }

    projectBtns.forEach(function (btn) {
        btn.addEventListener('click', function () { switchProject(btn.dataset.project); });
    });

    // wire tabs (click + arrow-key nav) inside each project tab group
    document.querySelectorAll('[data-project-tabs]').forEach(function (tabRow) {
        var tabs = Array.from(tabRow.querySelectorAll('.sys-tab'));

        function activate(tab) {
            var project = tabRow.dataset.projectTabs;
            var panelKey = tab.dataset.tab;

            tabs.forEach(function (t) {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');

            var panelGroup = document.querySelector('[data-project-panels="' + project + '"]');
            if (!panelGroup) return;
            panelGroup.querySelectorAll('.sys-panel').forEach(function (p) { p.classList.remove('active'); });
            var target = panelGroup.querySelector('[data-panel="' + panelKey + '"]');
            if (!target) return;
            target.classList.add('active');

            loadVideo(target.querySelector('.lazy-gif'));
        }

        tabs.forEach(function (tab, i) {
            tab.addEventListener('click', function () { activate(tab); });
            tab.addEventListener('keydown', function (e) {
                if (e.key === 'ArrowRight') {
                    var next = tabs[(i + 1) % tabs.length];
                    next.focus(); activate(next);
                }
                if (e.key === 'ArrowLeft') {
                    var prev = tabs[(i - 1 + tabs.length) % tabs.length];
                    prev.focus(); activate(prev);
                }
            });
        });
    });
})();
