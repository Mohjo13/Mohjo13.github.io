jQuery(document).ready(function($) {

	var my_nav = $('.navbar-sticky'); 
	// grab the initial top offset of the navigation 
	var sticky_navigation_offset_top = my_nav.offset().top;
	
	// our function that decides weather the navigation bar should have "fixed" css position or not.
	var sticky_navigation = function(){
		var scroll_top = $(window).scrollTop(); // our current vertical position from the top
		
		// if we've scrolled more than the navigation, change its position to fixed to stick to top, otherwise change it back to relative
		if (scroll_top > sticky_navigation_offset_top) { 
			my_nav.addClass( 'stick' );
		} else {
			my_nav.removeClass( 'stick' );
		}   
	};

	var initio_parallax_animation = function () {
		$('.parallax').each(function () {
			var speed = parseFloat($(this).attr('parallax-speed')) || 2;

			// Normal parallax amount
			var raw = window.pageYOffset / speed;

			// MOBILE: clamp movement so the image never "runs out"
			if (window.matchMedia && window.matchMedia('(max-width: 991px)').matches) {
				raw = Math.min(raw, 0); // try 80–160
			}

			$(this).css('background-position', 'center ' + (-raw) + 'px');
		});
	};

	
	// run our function on load
	sticky_navigation();
	
	// and run it again every time you scroll
	$(window).scroll(function() {
		 sticky_navigation();
		 initio_parallax_animation();
	});
	/* ================================
   PROJECT IMAGE REVEAL (once)
   ================================ */

	(function setupProjectRevealOnce() {
		var $media = $('#projects .project-media');
		if (!$media.length) return;

		var alreadyRevealed = false;

		function reveal() {
			if (alreadyRevealed) return;
			alreadyRevealed = true;

			// 1) Image reveal (already exists)
			$media.addClass('is-visible');

			// 2) Stage the text animations
			$('#projects').addClass('is-revealed');
		}


		// Trigger if arriving via anchor
		if (window.location.hash === '#projects') {
			setTimeout(reveal, 80);
		}

		// IntersectionObserver trigger
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
			// Fallback: simple scroll check
			$(window).on('scroll', function () {
				var top = $('#projects').offset().top;
				var viewBottom = $(window).scrollTop() + $(window).height();
				if (viewBottom > top + 100) reveal();
			});
		}
	})();


	/* ================================
   SKILLS ICON REVEAL (staggered)
   - Triggers on scroll into #skills
   - Triggers when navigating to #skills via anchor
   ================================ */

	
	function revealSkillsIcons() {


		var $icons = $('#skills .skill-icon img');
		if (!$icons.length) return;

		$icons.each(function (i, el) {
			setTimeout(function () {
				$(el).addClass('is-visible');
			}, i * 300); // left -> right stagger
		});
	}

	// 1) Trigger when #skills enters viewport (scroll)
	(function setupSkillsObserver() {
		var skillsEl = document.getElementById('skills');
		if (!skillsEl) return;

		// Fallback if IntersectionObserver not supported
		if (!('IntersectionObserver' in window)) {
			$(window).on('scroll', function () {
				var top = $('#skills').offset().top;
				var bottom = top + $('#skills').outerHeight();
				var viewBottom = $(window).scrollTop() + $(window).height();

				if (viewBottom > top + 80) revealSkillsIcons();
			});
			return;
		}

		var observer = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				var $icons = $('#skills .skill-icon img');

				if (entry.isIntersecting) {
					// reset first (important for re-trigger)
					$icons.removeClass('is-visible');

					$icons.each(function (i, el) {
						setTimeout(function () {
							$(el).addClass('is-visible');
						}, i * 140);
					});
				} else {
					// hide again when leaving section
					$icons.removeClass('is-visible');
				}
			});
		}, { threshold: 0.25 });

		observer.observe(document.getElementById('skills'));

		// ================================
		// NAV ACTIVE STATE (scroll-based)
		// ================================
		(function navActiveOnScroll() {
			var $links = $('.navbar-nav a[href^="#"]');
			if (!$links.length) return;

			var sections = $links.map(function () {
				var id = $(this).attr('href');
				var el = document.querySelector(id);
				return el ? el : null;
			}).get();

			function setActive(id) {
				$('.navbar-nav li').removeClass('active');
				$('.navbar-nav a[href="' + id + '"]').parent('li').addClass('active');
			}

			function onScroll() {
				var scrollPos = window.scrollY || document.documentElement.scrollTop;
				var offset = 120; // matches your scroll-margin-top-ish feel

				var current = '#top';
				for (var i = 0; i < sections.length; i++) {
					var top = sections[i].offsetTop;
					if (scrollPos + offset >= top) current = '#' + sections[i].id;
				}
				setActive(current);
			}

			window.addEventListener('scroll', onScroll, { passive: true });
			window.addEventListener('hashchange', onScroll);
			onScroll();
		})();


	})();

	// 2) Trigger when arriving via anchor (#skills) (click nav or direct URL)
	function triggerIfHashIsSkills() {
		if (window.location.hash === '#skills') {
			// slight delay so layout is settled after jump
			setTimeout(revealSkillsIcons, 60);
		}
	}

	triggerIfHashIsSkills();
	$(window).on('hashchange', triggerIfHashIsSkills);

	// If user clicks nav link to #skills before hashchange fires
	$('a[href="#skills"]').on('click', function () {
		setTimeout(revealSkillsIcons, 120);
	});

	/* ================================
   STEAM SKETCH BUTTON (inject lines + hover anim)
   ================================ */
	(function initSketchButtons() {
		const createSVG = (width, height, radius) => {
			const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");

			svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

			rect.setAttribute("x", "0");
			rect.setAttribute("y", "0");
			rect.setAttribute("width", "100%");
			rect.setAttribute("height", "100%");
			rect.setAttribute("rx", `${radius}`);
			rect.setAttribute("ry", `${radius}`);
			rect.setAttribute("pathLength", "10");

			svg.appendChild(rect);
			return svg;
		};

		document.querySelectorAll(".sketch-button.steam-sketch").forEach((btn) => {
			// Prevent duplicate injection if script runs twice
			if (btn.querySelector(".lines")) return;

			const style = getComputedStyle(btn);
			const radius = parseInt(style.borderRadius, 10) || 0;

			const lines = document.createElement("div");
			lines.className = "lines";

			const groupTop = document.createElement("div");
			const groupBottom = document.createElement("div");

			const svg = createSVG(btn.offsetWidth, btn.offsetHeight, radius);

			// Top group (4 layers)
			groupTop.appendChild(svg);
			groupTop.appendChild(svg.cloneNode(true));
			groupTop.appendChild(svg.cloneNode(true));
			groupTop.appendChild(svg.cloneNode(true));

			// Bottom group (4 layers)
			groupBottom.appendChild(svg.cloneNode(true));
			groupBottom.appendChild(svg.cloneNode(true));
			groupBottom.appendChild(svg.cloneNode(true));
			groupBottom.appendChild(svg.cloneNode(true));

			lines.appendChild(groupTop);
			lines.appendChild(groupBottom);
			btn.appendChild(lines);

			btn.addEventListener("pointerenter", () => {
				btn.classList.add("start");
			});

			// Remove class when any of the injected SVG animations end
			btn.addEventListener("animationend", () => {
				btn.classList.remove("start");
			});
		});
	})();

	/* ================================
   Navbar collapse behavior
   - Expanded at top/home
   - Collapsed when scrolled down (unless hovered)
   ================================ */
	(function setupNavbarAutoCollapse() {
		var $nav = $('.navbar-sticky');
		if (!$nav.length) return;

		var TOP_EXPANDED_THRESHOLD = 40; // px from top considered "home"

		function updateNavCollapseState() {
			// Don't collapse on mobile
			if (window.matchMedia('(max-width: 767px)').matches) {
				$nav.removeClass('is-collapsed');
				return;
			}

			var atTop = $(window).scrollTop() <= TOP_EXPANDED_THRESHOLD;

			// At home/top: always expanded
			if (atTop) {
				$nav.removeClass('is-collapsed');
				return;
			}

			// Elsewhere: collapsed until hovered
			$nav.addClass('is-collapsed');
		}

		// Update on load + scroll + resize
		updateNavCollapseState();
		$(window).on('scroll resize', updateNavCollapseState);

		// Safety: if you jump via anchors, re-evaluate after scroll settles
		$(window).on('hashchange', function () {
			setTimeout(updateNavCollapseState, 80);
		});
	})();
	/* ================================
	   SYSTEMS: Tabs + Carousel (Option C)
	   - Tabs select slides
	   - Arrows prev/next with loop
	   - Horizontal scroll with snap
	   - Scroll updates active tab + URL
	   - Deep-link: #systems-camera / #systems-movement / #systems-shaders / #systems-lighting
	   ================================ */
	(function setupSystemsCarousel() {
		var root = document.querySelector('[data-systems-carousel]');
		if (!root) return;

		var track = root.querySelector('[data-sys-track]');
		var viewport = root.querySelector('[data-sys-viewport]');
		var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-sys-tab]'));
		var slides = Array.prototype.slice.call(root.querySelectorAll('[data-sys-slide]'));
		var btnPrev = root.querySelector('[data-sys-prev]');
		var btnNext = root.querySelector('[data-sys-next]');

		if (!track || !slides.length || !tabs.length) return;

		var order = slides.map(function (el) { return el.getAttribute('data-sys-slide'); });
		var currentKey = order[0] || 'camera';
		var isProgrammaticScroll = false;

		function keyToHash(key) {
			return '#systems-' + key;
		}

		function setActiveTab(key) {
			tabs.forEach(function (btn) {
				var isActive = btn.getAttribute('data-sys-tab') === key;
				btn.classList.toggle('is-active', isActive);
				btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
			});
		}

		function getSlideByKey(key) {
			return slides.find(function (el) {
				return el.getAttribute('data-sys-slide') === key;
			});
		}

		function scrollToKey(key, opts) {
			opts = opts || {};
			var slide = getSlideByKey(key);
			if (!slide) return;

			currentKey = key;
			setActiveTab(key);

			// scroll into view (within horizontal track)
			isProgrammaticScroll = true;
			slide.scrollIntoView({
				behavior: opts.instant ? 'auto' : 'smooth',
				inline: 'start',
				block: 'nearest'
			});

			// update URL without forcing a jump to the anchor
			try {
				history.replaceState(null, '', keyToHash(key));
			} catch (e) { }

			window.setTimeout(function () { isProgrammaticScroll = false; }, 250);
		}

		function nextKey(dir) {
			var idx = order.indexOf(currentKey);
			if (idx < 0) idx = 0;

			if (dir > 0) idx = (idx + 1) % order.length;
			else idx = (idx - 1 + order.length) % order.length;

			return order[idx];
		}

		// Tabs click
		tabs.forEach(function (btn) {
			btn.addEventListener('click', function () {
				var key = btn.getAttribute('data-sys-tab');
				if (!key) return;
				scrollToKey(key);
			});
		});

		// Arrows
		if (btnPrev) btnPrev.addEventListener('click', function () {
			scrollToKey(nextKey(-1));
		});
		if (btnNext) btnNext.addEventListener('click', function () {
			scrollToKey(nextKey(1));
		});

		

		// Detect which slide is most "current" during scroll -> update tab + URL
		function updateFromScroll() {
			if (isProgrammaticScroll) return;

			var trackRect = track.getBoundingClientRect();
			var trackLeft = trackRect.left;

			// choose slide whose left edge is closest to track's left padding area
			var best = null;
			var bestDist = Infinity;

			slides.forEach(function (slide) {
				var r = slide.getBoundingClientRect();
				var dist = Math.abs(r.left - trackLeft);
				if (dist < bestDist) {
					bestDist = dist;
					best = slide;
				}
			});

			if (!best) return;
			var key = best.getAttribute('data-sys-slide');
			if (!key || key === currentKey) return;

			currentKey = key;
			setActiveTab(key);
			try { history.replaceState(null, '', keyToHash(key)); } catch (e) { }
		}

		track.addEventListener('scroll', function () {
			window.clearTimeout(track._sysT);
			track._sysT = window.setTimeout(updateFromScroll, 80);
		}, { passive: true });

		// Deep-link on load
		function applyHashOnLoad() {
			var h = window.location.hash || '';
			var match = h.match(/^#systems-([a-z0-9_-]+)$/i);
			if (!match) {
				// default state (camera first)
				setActiveTab(currentKey);
				return;
			}

			var key = match[1].toLowerCase();
			if (order.indexOf(key) === -1) {
				setActiveTab(currentKey);
				return;
			}

			// If user arrived from navbar click to #systems, let layout settle a tiny bit
			window.setTimeout(function () {
				scrollToKey(key, { instant: true });
			}, 60);
		}

		applyHashOnLoad();

		// If hash changes (user pastes link / back-forward)
		window.addEventListener('hashchange', function () {
			applyHashOnLoad();
		});
	})();

});