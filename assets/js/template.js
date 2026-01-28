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

	var initio_parallax_animation = function() { 
		$('.parallax').each( function(i, obj) {
			var speed = $(this).attr('parallax-speed');
			if( speed ) {
				var background_pos = '-' + (window.pageYOffset / speed) + "px";
				$(this).css( 'background-position', 'center ' + background_pos );
			}
		});
	}
	
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
			$media.addClass('is-visible');
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


});