/**
 * Liana Solar - Hero Video & Image Slider
 * Features:
 * - Slide 1: Video (vedio.mp4) playing in smooth slow-motion (0.65x speed)
 * - Slide 2: High-res image (slide2.jpg)
 * - Slide 3: High-res image (slide3.jpg)
 * - Automatic progression from video -> slide 2 -> slide 3 -> loop back
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
		var slowPlaybackRate = 0.65; // User requested: slow motion playback

		// Initialize Video settings
		if (video) {
			video.playbackRate = slowPlaybackRate;
			video.muted = true;
			video.setAttribute('playsinline', '');
			video.setAttribute('webkit-playsinline', '');

			// When video metadata is loaded, make sure playback rate is locked to slow speed
			video.addEventListener('loadedmetadata', function () {
				video.playbackRate = slowPlaybackRate;
			});

			// When video ends, automatically advance to Slide 2
			video.addEventListener('ended', function () {
				if (currentIndex === 0) {
					goToSlide(1);
				}
			});

			// If video stalls or loops, monitor time
			video.addEventListener('timeupdate', function () {
				if (currentIndex === 0 && video.duration > 0) {
					if (video.currentTime >= video.duration - 0.2) {
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
				// Force reflow
				void el.offsetWidth;
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

			// Handle slide actions
			var currentSlide = slides[currentIndex];
			var slideType = currentSlide.getAttribute('data-type');

			if (slideType === 'video' && video) {
				try {
					video.currentTime = 0;
					video.playbackRate = slowPlaybackRate;
					var playPromise = video.play();
					if (playPromise !== undefined) {
						playPromise.catch(function (err) {
							console.log('Video autoplay fallback:', err);
							// Fallback timer if browser blocked autoplay
							slideTimer = setTimeout(function () {
								goToSlide(currentIndex + 1);
							}, 8000);
						});
					}
				} catch (e) {
					console.warn(e);
				}

				// Fallback timer in case video ended event doesn't fire
				var estDuration = (video.duration && !isNaN(video.duration)) ? (video.duration / slowPlaybackRate * 1000) + 500 : 9000;
				slideTimer = setTimeout(function () {
					if (currentIndex === 0) {
						goToSlide(1);
					}
				}, Math.min(Math.max(estDuration, 6000), 12000));

			} else {
				// Image slide: Pause video to save CPU/GPU
				if (video) {
					video.pause();
				}
				var duration = parseInt(currentSlide.getAttribute('data-duration'), 10) || 6000;
				slideTimer = setTimeout(function () {
					goToSlide(currentIndex + 1);
				}, duration);
			}

			setTimeout(function () {
				isTransitioning = false;
			}, 800);
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

		// Touch swipe support
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
					goToSlide(currentIndex + 1); // swipe left -> next
				} else {
					goToSlide(currentIndex - 1); // swipe right -> prev
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
