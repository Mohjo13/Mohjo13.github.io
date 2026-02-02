jQuery(document).ready(function ($) {

    /* =========================================================
       NAVBAR: Sticky behavior
    ========================================================= */

    var $nav = $('.navbar-sticky');
    if ($nav.length) {
        var stickyOffsetTop = $nav.offset().top;

        function updateStickyNav() {
            var scrollTop = $(window).scrollTop();
            $nav.toggleClass('stick', scrollTop > stickyOffsetTop);
        }

        updateStickyNav();
        $(window).on('scroll', updateStickyNav);
    }


    /* =========================================================
       HERO: Parallax background
    ========================================================= */

    function updateParallax() {
        $('.parallax').each(function () {
            var speed = parseFloat($(this).attr('parallax-speed')) || 2;
            var offset = window.pageYOffset / speed;

            if (window.matchMedia('(max-width: 991px)').matches) {
                offset = Math.min(offset, 0);
            }

            $(this).css('background-position', 'center ' + (-offset) + 'px');
        });
    }

    $(window).on('scroll', updateParallax);


    /* =========================================================
       PROJECTS: Image + text staged reveal (once)
    ========================================================= */

    (function setupProjectReveal() {
        var $media = $('#projects .project-media');
        if (!$media.length) return;

        var revealed = false;

        function reveal() {
            if (revealed) return;
            revealed = true;

            $media.addClass('is-visible');
            $('#projects').addClass('is-revealed');
        }

        if (window.location.hash === '#projects') {
            setTimeout(reveal, 80);
        }

        if ('IntersectionObserver' in window) {
            var el = document.getElementById('projects');
            if (!el) return;

            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        reveal();
                        observer.disconnect();
                    }
                });
            }, { threshold: 0.25 });

            observer.observe(el);
        } else {
            $(window).on('scroll', function () {
                var top = $('#projects').offset().top;
                var viewBottom = $(window).scrollTop() + $(window).height();
                if (viewBottom > top + 100) reveal();
            });
        }
    })();


    /* =========================================================
       SKILLS: Icon stagger reveal
    ========================================================= */

    function revealSkillIcons() {
        var $icons = $('#skills .skill-icon img');
        if (!$icons.length) return;

        $icons.each(function (i, el) {
            setTimeout(function () {
                $(el).addClass('is-visible');
            }, i * 140);
        });
    }

    (function setupSkillsObserver() {
        var skillsEl = document.getElementById('skills');
        if (!skillsEl) return;

        if (!('IntersectionObserver' in window)) {
            $(window).on('scroll', function () {
                var top = $('#skills').offset().top;
                var viewBottom = $(window).scrollTop() + $(window).height();
                if (viewBottom > top + 80) revealSkillIcons();
            });
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                var $icons = $('#skills .skill-icon img');

                if (entry.isIntersecting) {
                    $icons.removeClass('is-visible');
                    revealSkillIcons();
                } else {
                    $icons.removeClass('is-visible');
                }
            });
        }, { threshold: 0.25 });

        observer.observe(skillsEl);
    })();

    function triggerSkillsFromHash() {
        if (window.location.hash === '#skills') {
            setTimeout(revealSkillIcons, 60);
        }
    }

    triggerSkillsFromHash();
    $(window).on('hashchange', triggerSkillsFromHash);
    $('a[href="#skills"]').on('click', function () {
        setTimeout(revealSkillIcons, 120);
    });


    /* =========================================================
       NAVBAR: Active section highlighting
    ========================================================= */

    (function setupNavActiveState() {
        var $links = $('.navbar-nav a[href^="#"]');
        if (!$links.length) return;

        var sections = $links.map(function () {
            var id = $(this).attr('href');
            return document.querySelector(id);
        }).get();

        function setActive(id) {
            $('.navbar-nav li').removeClass('active');
            $('.navbar-nav a[href="' + id + '"]').parent('li').addClass('active');
        }

        function onScroll() {
            var scrollPos = window.scrollY || document.documentElement.scrollTop;
            var offset = 120;
            var current = '#top';

            sections.forEach(function (section) {
                if (scrollPos + offset >= section.offsetTop) {
                    current = '#' + section.id;
                }
            });

            setActive(current);
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('hashchange', onScroll);
        onScroll();
    })();


    /* =========================================================
       BUTTONS: Steam sketch hover effect
    ========================================================= */

    (function initSketchButtons() {

        function createSVG(w, h, r) {
            var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");

            svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
            rect.setAttribute("width", "100%");
            rect.setAttribute("height", "100%");
            rect.setAttribute("rx", r);
            rect.setAttribute("ry", r);
            rect.setAttribute("pathLength", "10");

            svg.appendChild(rect);
            return svg;
        }

        document.querySelectorAll(".sketch-button.steam-sketch").forEach(function (btn) {
            if (btn.querySelector(".lines")) return;

            var style = getComputedStyle(btn);
            var radius = parseInt(style.borderRadius, 10) || 0;

            var lines = document.createElement("div");
            lines.className = "lines";

            var topGroup = document.createElement("div");
            var bottomGroup = document.createElement("div");

            var svg = createSVG(btn.offsetWidth, btn.offsetHeight, radius);

            for (var i = 0; i < 4; i++) {
                topGroup.appendChild(svg.cloneNode(true));
                bottomGroup.appendChild(svg.cloneNode(true));
            }

            bottomGroup.style.transform = "rotate(180deg)";
            lines.appendChild(topGroup);
            lines.appendChild(bottomGroup);
            btn.appendChild(lines);

            btn.addEventListener("pointerenter", function () {
                btn.classList.add("start");
            });

            btn.addEventListener("animationend", function () {
                btn.classList.remove("start");
            });
        });
    })();


    /* =========================================================
       NAVBAR: Auto-collapse (desktop only)
    ========================================================= */

    (function setupNavbarAutoCollapse() {
        if (!$nav.length) return;

        var TOP_THRESHOLD = 40;

        function updateCollapse() {
            if (window.matchMedia('(max-width: 767px)').matches) {
                $nav.removeClass('is-collapsed');
                return;
            }

            var atTop = $(window).scrollTop() <= TOP_THRESHOLD;
            $nav.toggleClass('is-collapsed', !atTop);
        }

        updateCollapse();
        $(window).on('scroll resize', updateCollapse);
        $(window).on('hashchange', function () {
            setTimeout(updateCollapse, 80);
        });
    })();


    /* =========================================================
       SYSTEMS: Tabs + horizontal carousel
    ========================================================= */

    (function setupSystemsCarousel() {
        var root = document.querySelector('[data-systems-carousel]');
        if (!root) return;

        var track = root.querySelector('[data-sys-track]');
        var tabs = Array.from(root.querySelectorAll('[data-sys-tab]'));
        var slides = Array.from(root.querySelectorAll('[data-sys-slide]'));
        var prev = root.querySelector('[data-sys-prev]');
        var next = root.querySelector('[data-sys-next]');

        var order = slides.map(el => el.dataset.sysSlide);
        var current = order[0];
        var programmatic = false;

        function setActiveTab(key) {
            tabs.forEach(btn => {
                btn.classList.toggle('is-active', btn.dataset.sysTab === key);
                btn.setAttribute('aria-selected', btn.dataset.sysTab === key);
            });
        }

        function scrollToKey(key, instant) {
            var slide = slides.find(el => el.dataset.sysSlide === key);
            if (!slide) return;

            current = key;
            setActiveTab(key);
            programmatic = true;

            slide.scrollIntoView({
                behavior: instant ? 'auto' : 'smooth',
                inline: 'start',
                block: 'nearest'
            });

            try { history.replaceState(null, '', '#systems-' + key); } catch (e) { }
            setTimeout(() => programmatic = false, 250);
        }

        function nextKey(dir) {
            var i = order.indexOf(current);
            return order[(i + dir + order.length) % order.length];
        }

        tabs.forEach(btn => {
            btn.addEventListener('click', () => scrollToKey(btn.dataset.sysTab));
        });

        prev && prev.addEventListener('click', () => scrollToKey(nextKey(-1)));
        next && next.addEventListener('click', () => scrollToKey(nextKey(1)));

        track.addEventListener('scroll', () => {
            if (programmatic) return;

            var trackLeft = track.getBoundingClientRect().left;
            var closest = slides.reduce((best, slide) => {
                var dist = Math.abs(slide.getBoundingClientRect().left - trackLeft);
                return dist < best.dist ? { slide, dist } : best;
            }, { slide: null, dist: Infinity }).slide;

            if (closest) {
                var key = closest.dataset.sysSlide;
                if (key !== current) {
                    current = key;
                    setActiveTab(key);
                    try { history.replaceState(null, '', '#systems-' + key); } catch (e) { }
                }
            }
        }, { passive: true });

        (function applyInitialHash() {
            var match = location.hash.match(/^#systems-(.+)$/);
            if (match && order.includes(match[1])) {
                setTimeout(() => scrollToKey(match[1], true), 60);
            } else {
                setActiveTab(current);
            }
        })();
    })();

});
