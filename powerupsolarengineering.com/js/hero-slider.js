/**
 * Liana Solar - Hero Video & Image Slider
 * Features:
 * - Slide 1: Video (vedio.mp4) playing in super smooth cinematic SLOW MOTION (0.5x speed)
 * - Slide 2: High-res image (slide2.jpg)
 * - Slide 3: High-res image (slide3.jpg)
 * - Automatic progression from video -> slide 2 -> slide 3 -> loop back to video
 * - Manual controls (Prev / Next arrows, Indicator dots, Touch Swipe)
 * - Dynamic caption animation on slide change
 */

(function () {
	'use strict';

	function initHeroSlider() {
		var sliderWrap = document.getElementById('heroSliderWrap');
		if (!sliderWrap) return;

		var slides = sliderWrap.querySelectorAll('.hero-slide');
		var dots = sliderWrap.querySelectorAll('.hero-dot');
		var prevBtn = document.getElementById('heroPrev');
		var nextBtn = document.getElementById('heroNext');
		var video = document.getElementById('heroSlideVideo');

		if (!slides.length) return;

		var currentIndex = 0;
		var slideTimer = null;
		var isTransitioning = false;
		var SLOW_SPEED = 0.5; // Smooth slow motion (0.5x speed)

		// Set and enforce slow playback rate on video
		function enforceSlowSpeed() {
			if (!video) return;
			try {
				if (video.playbackRate !== SLOW_SPEED) {
					video.playbackRate = SLOW_SPEED;
				}
				if (video.defaultPlaybackRate !== SLOW_SPEED) {
					video.defaultPlaybackRate = SLOW_SPEED;
				}
			} catch (e) {}
		}

		// Initialize Video settings & event listeners
		if (video) {
			video.muted = true;
			video.setAttribute('muted', '');
			video.setAttribute('playsinline', '');
			video.setAttribute('webkit-playsinline', '');
			enforceSlowSpeed();

			// Continuously lock playback speed to slow motion
			['loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'play', 'playing'].forEach(function (evtName) {
				video.addEventListener(evtName, enforceSlowSpeed);
			});

			// When video finishes, advance to Slide 2
			video.addEventListener('ended', function () {
				if (currentIndex === 0) {
					goToSlide(1);
				}
			});

			// Backup time monitor in case browser loops or stalls at end
			video.addEventListener('timeupdate', function () {
				enforceSlowSpeed();
				if (currentIndex === 0 && video.duration > 0) {
					if (video.currentTime >= video.duration - 0.25) {
						goToSlide(1);
					}
				}
			});
		}

		function clearTimer() {
			if (slideTimer) {
				clearTimeout(slideTimer);
				slideTimer = null;
			}
		}

		function resetCaptionAnimations(slideEl) {
			var texts = slideEl.querySelectorAll('.text');
			texts.forEach(function (el) {
				el.style.animation = 'none';
				void el.offsetWidth; // Force reflow
				el.style.animation = '';
			});
		}

		function goToSlide(targetIndex) {
			if (targetIndex === currentIndex && slides[currentIndex].classList.contains('active')) return;
			if (isTransitioning) return;
			isTransitioning = true;
			clearTimer();

			// Normalize targetIndex
			if (targetIndex < 0) {
				targetIndex = slides.length - 1;
			} else if (targetIndex >= slides.length) {
				targetIndex = 0;
			}

			// Update slides
			slides.forEach(function (slide, idx) {
				if (idx === targetIndex) {
					slide.classList.add('active');
					resetCaptionAnimations(slide);
				} else {
					slide.classList.remove('active');
				}
			});

			// Update dots
			dots.forEach(function (dot, idx) {
				if (idx === targetIndex) {
					dot.classList.add('active');
				} else {
					dot.classList.remove('active');
				}
			});

			currentIndex = targetIndex;

			// Handle slide specific behavior
			var currentSlide = slides[currentIndex];
			var slideType = currentSlide.getAttribute('data-type');

			if (slideType === 'video' && video) {
				try {
					video.currentTime = 0;
					enforceSlowSpeed();
					var playPromise = video.play();
					if (playPromise !== undefined) {
						playPromise.then(function () {
							enforceSlowSpeed();
						}).catch(function (err) {
							console.log('Autoplay info:', err);
							// Fallback timer if autoplay is blocked
							slideTimer = setTimeout(function () {
								if (currentIndex === 0) goToSlide(1);
							}, 10000);
						});
					}
				} catch (e) {
					console.warn(e);
				}

				// Fallback safety timer: video duration / SLOW_SPEED + safety margin
				var maxVideoWait = (video.duration && !isNaN(video.duration) && video.duration > 0)
					? ((video.duration / SLOW_SPEED) * 1000) + 600
					: 11000;

				slideTimer = setTimeout(function () {
					if (currentIndex === 0) {
						goToSlide(1);
					}
				}, Math.min(Math.max(maxVideoWait, 7000), 16000));

			} else {
				// Image slides: pause video to save resources
				if (video) {
					try {
						video.pause();
					} catch (e) {}
				}

				var duration = parseInt(currentSlide.getAttribute('data-duration'), 10) || 6000;
				slideTimer = setTimeout(function () {
					goToSlide(currentIndex + 1);
				}, duration);
			}

			setTimeout(function () {
				isTransitioning = false;
			}, 700);
		}

		// Button events
		if (prevBtn) {
			prevBtn.addEventListener('click', function (e) {
				e.preventDefault();
				goToSlide(currentIndex - 1);
			});
		}

		if (nextBtn) {
			nextBtn.addEventListener('click', function (e) {
				e.preventDefault();
				goToSlide(currentIndex + 1);
			});
		}

		// Dot events
		dots.forEach(function (dot) {
			dot.addEventListener('click', function () {
				var idx = parseInt(this.getAttribute('data-index'), 10);
				goToSlide(idx);
			});
		});

		// Touch swipe support for mobile
		var touchStartX = 0;
		var touchEndX = 0;
		sliderWrap.addEventListener('touchstart', function (e) {
			touchStartX = e.changedTouches[0].screenX;
		}, { passive: true });

		sliderWrap.addEventListener('touchend', function (e) {
			touchEndX = e.changedTouches[0].screenX;
			var diff = touchStartX - touchEndX;
			if (Math.abs(diff) > 45) {
				if (diff > 0) {
					goToSlide(currentIndex + 1); // swipe left -> next slide
				} else {
					goToSlide(currentIndex - 1); // swipe right -> prev slide
				}
			}
		}, { passive: true });

		// Start initial slide
		goToSlide(0);
	}

	// Initialize on DOM ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initHeroSlider);
	} else {
		initHeroSlider();
	}
})();
