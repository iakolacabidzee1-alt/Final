document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const portfolioHeader = document.getElementById('portfolioHeader');
    const primaryNavigation = document.getElementById('primaryNavigation');
    const navigationToggle = document.getElementById('navigationToggle');
    const feedbackOverlay = document.getElementById('feedbackOverlay');
    const showcaseOverlay = document.getElementById('showcaseOverlay');

    function syncPageScrollLock() {
        const menuIsOpen = primaryNavigation?.classList.contains('is-open') ?? false;
        const modalIsOpen = feedbackOverlay ? !feedbackOverlay.hidden : false;
        const lightboxIsOpen = showcaseOverlay ? !showcaseOverlay.hidden : false;
        document.body.classList.toggle('page-locked', menuIsOpen || modalIsOpen || lightboxIsOpen);
    }

    function closeCompactNavigation() {
        if (!primaryNavigation || !navigationToggle) return;

        primaryNavigation.classList.remove('is-open');
        navigationToggle.classList.remove('is-active');
        navigationToggle.setAttribute('aria-expanded', 'false');
        syncPageScrollLock();
    }

    function initPrimaryNavigation() {
        if (primaryNavigation && navigationToggle) {
            navigationToggle.addEventListener('click', () => {
                const isOpen = primaryNavigation.classList.toggle('is-open');
                navigationToggle.classList.toggle('is-active', isOpen);
                navigationToggle.setAttribute('aria-expanded', String(isOpen));
                syncPageScrollLock();
            });

            primaryNavigation.querySelectorAll('a').forEach((link) => {
                link.addEventListener('click', closeCompactNavigation);
            });

            window.addEventListener('resize', () => {
                if (window.innerWidth > 768 && primaryNavigation.classList.contains('is-open')) {
                    closeCompactNavigation();
                }
            });
        }

        const navigationAnchors = [...document.querySelectorAll('.navigation-anchor')];
        const sections = [...document.querySelectorAll('main section[id]')];
        let scrollUpdateRequested = false;

        function updateHeaderAndActiveLink() {
            const scrollPosition = window.scrollY;
            portfolioHeader?.classList.toggle('is-compact', scrollPosition > 50);

            const markerPosition = scrollPosition + 140;
            let activeSectionId = sections[0]?.id ?? '';

            sections.forEach((section) => {
                if (markerPosition >= section.offsetTop) {
                    activeSectionId = section.id;
                }
            });

            navigationAnchors.forEach((link) => {
                const isActive = link.getAttribute('href') === `#${activeSectionId}`;
                link.classList.toggle('is-active', isActive);

                if (isActive) {
                    link.setAttribute('aria-current', 'page');
                } else {
                    link.removeAttribute('aria-current');
                }
            });

            scrollUpdateRequested = false;
        }

        window.addEventListener('scroll', () => {
            if (scrollUpdateRequested) return;

            scrollUpdateRequested = true;
            window.requestAnimationFrame(updateHeaderAndActiveLink);
        }, { passive: true });

        updateHeaderAndActiveLink();
    }

    function initProfileCarousel() {
        const panels = [...document.querySelectorAll('#profileCarousel .portrait-slide')];
        if (panels.length === 0) return;

        const intervalDuration = 5000;
        let activeIndex = Math.max(0, panels.findIndex((slide) => slide.classList.contains('is-active')));
        let sliderTimer = null;

        function showSlide(index) {
            activeIndex = (index + panels.length) % panels.length;

            panels.forEach((slide, slideIndex) => {
                const isActive = slideIndex === activeIndex;
                slide.classList.toggle('is-active', isActive);
                slide.setAttribute('aria-hidden', String(!isActive));
            });
        }

        function stopSlider() {
            if (sliderTimer !== null) {
                window.clearInterval(sliderTimer);
                sliderTimer = null;
            }
        }

        function startSlider() {
            stopSlider();

            if (panels.length > 1 && !document.hidden) {
                sliderTimer = window.setInterval(() => showSlide(activeIndex + 1), intervalDuration);
            }
        }

        document.addEventListener('visibilitychange', startSlider);
        showSlide(activeIndex);
        startSlider();
    }

    function initCompetencyBars() {
        const competencyList = document.getElementById('competencyList');
        if (!competencyList) return;

        const progressBars = [...competencyList.querySelectorAll('[role="progressbar"]')];
        let hasAnimated = false;

        progressBars.forEach((progressBar) => {
            const fill = progressBar.querySelector('.competency-level');
            if (fill) fill.style.width = '0%';
            progressBar.setAttribute('aria-valuenow', '0');
        });

        function animateSkillBars() {
            if (hasAnimated) return;
            hasAnimated = true;

            progressBars.forEach((progressBar) => {
                const value = Number.parseInt(progressBar.dataset.percentage ?? '0', 10);
                const safeValue = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
                const fill = progressBar.querySelector('.competency-level');

                if (fill) fill.style.width = `${safeValue}%`;
                progressBar.setAttribute('aria-valuenow', String(safeValue));
            });
        }

        if (!('IntersectionObserver' in window)) {
            animateSkillBars();
            return;
        }

        const skillsObserver = new IntersectionObserver((entries, observer) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                animateSkillBars();
                observer.disconnect();
            }
        }, { threshold: 0.25 });

        skillsObserver.observe(competencyList);
    }

    function initWorkFilters() {
        const workFilters = document.getElementById('workFilters');
        const portfolioItems = [...document.querySelectorAll('#workGallery .portfolio-item')];
        if (!workFilters || portfolioItems.length === 0) return;

        const categoryControls = [...workFilters.querySelectorAll('.category-control')];

        function applyFilter(filterValue) {
            categoryControls.forEach((button) => {
                const isActive = button.dataset.workFilter === filterValue;
                button.classList.toggle('is-active', isActive);
                button.setAttribute('aria-pressed', String(isActive));
            });

            portfolioItems.forEach((card) => {
                const shouldShow = filterValue === 'all' || card.dataset.workCategory === filterValue;
                card.hidden = !shouldShow;
            });
        }

        workFilters.addEventListener('click', (event) => {
            const selectedButton = event.target.closest('.category-control');
            if (!selectedButton || !workFilters.contains(selectedButton)) return;
            applyFilter(selectedButton.dataset.workFilter ?? 'all');
        });

        applyFilter('all');
    }

    function initReviewCarousel() {
        const slider = document.getElementById('reviewTrack');
        const reviewControls = document.getElementById('reviewControls');
        if (!slider || !reviewControls) return;

        const panels = [...slider.querySelectorAll('.review-panel')];
        const dots = [...reviewControls.querySelectorAll('.review-dot')];
        if (panels.length === 0 || panels.length !== dots.length) return;

        const intervalDuration = 7000;
        let activeIndex = 0;
        let sliderTimer = null;

        function showReview(index) {
            activeIndex = (index + panels.length) % panels.length;

            panels.forEach((slide, slideIndex) => {
                const isActive = slideIndex === activeIndex;
                slide.classList.toggle('is-active', isActive);
                slide.setAttribute('aria-hidden', String(!isActive));
            });

            dots.forEach((dot, dotIndex) => {
                const isActive = dotIndex === activeIndex;
                dot.classList.toggle('is-active', isActive);
                dot.setAttribute('aria-selected', String(isActive));
                dot.tabIndex = isActive ? 0 : -1;
            });
        }

        function stopSlider() {
            if (sliderTimer !== null) {
                window.clearInterval(sliderTimer);
                sliderTimer = null;
            }
        }

        function startSlider() {
            stopSlider();

            if (panels.length > 1 && !document.hidden) {
                sliderTimer = window.setInterval(() => showReview(activeIndex + 1), intervalDuration);
            }
        }

        reviewControls.addEventListener('click', (event) => {
            const selectedDot = event.target.closest('.review-dot');
            if (!selectedDot || !reviewControls.contains(selectedDot)) return;

            showReview(Number.parseInt(selectedDot.dataset.reviewTarget ?? '0', 10));
            startSlider();
        });

        reviewControls.addEventListener('keydown', (event) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();

            let nextIndex = activeIndex;
            if (event.key === 'ArrowLeft') nextIndex -= 1;
            if (event.key === 'ArrowRight') nextIndex += 1;
            if (event.key === 'Home') nextIndex = 0;
            if (event.key === 'End') nextIndex = panels.length - 1;

            showReview(nextIndex);
            dots[activeIndex].focus();
            startSlider();
        });

        document.addEventListener('visibilitychange', startSlider);
        showReview(0);
        startSlider();
    }

    function initShowcaseOverlay() {
        const workGallery = document.getElementById('workGallery');
        if (!workGallery || !showcaseOverlay) return;

        const portfolioItems = [...workGallery.querySelectorAll('.portfolio-item')];
        const showcaseDialog = showcaseOverlay.querySelector('.showcase-dialog');
        const showcaseImage = document.getElementById('showcaseImage');
        const showcaseTitle = document.getElementById('showcaseHeading');
        const showcaseCategory = document.getElementById('showcaseCategory');
        const showcaseSummary = document.getElementById('showcaseSummary');
        const fullSizeLink = document.getElementById('showcaseFullLink');
        const closeButton = document.getElementById('showcaseClose');
        const previousButton = document.getElementById('showcasePrevious');
        const nextButton = document.getElementById('showcaseNext');

        if (!showcaseDialog || !showcaseImage || !showcaseTitle || !showcaseCategory || !showcaseSummary || !fullSizeLink) return;

        let activeIndex = 0;
        let previouslyFocusedElement = null;
        let hideTimer = null;

        function showPortfolioItem(index) {
            activeIndex = (index + portfolioItems.length) % portfolioItems.length;
            const card = portfolioItems[activeIndex];
            const sourceImage = card.querySelector('.portfolio-image');

            showcaseImage.src = sourceImage.currentSrc || sourceImage.src;
            showcaseImage.alt = `${sourceImage.alt} — full-size preview`;
            showcaseTitle.textContent = card.querySelector('.portfolio-title')?.textContent.trim() ?? 'Project preview';
            showcaseCategory.textContent = card.querySelector('.portfolio-category')?.textContent.trim() ?? '';
            showcaseSummary.textContent = card.dataset.workSummary ?? '';
            fullSizeLink.href = sourceImage.currentSrc || sourceImage.src;
        }

        function open(index, trigger) {
            if (hideTimer !== null) window.clearTimeout(hideTimer);

            previouslyFocusedElement = trigger;
            showPortfolioItem(index);
            showcaseOverlay.hidden = false;
            showcaseOverlay.setAttribute('aria-hidden', 'false');
            window.requestAnimationFrame(() => {
                showcaseOverlay.classList.add('is-active');
                showcaseDialog.focus();
            });
            syncPageScrollLock();
        }

        function close() {
            showcaseOverlay.classList.remove('is-active');
            showcaseOverlay.setAttribute('aria-hidden', 'true');

            hideTimer = window.setTimeout(() => {
                showcaseOverlay.hidden = true;
                showcaseImage.removeAttribute('src');
                syncPageScrollLock();
            }, 250);

            if (previouslyFocusedElement instanceof HTMLElement) {
                previouslyFocusedElement.focus();
            }
        }

        workGallery.addEventListener('click', (event) => {
            const trigger = event.target.closest('[data-showcase-trigger]');
            if (!trigger || !workGallery.contains(trigger)) return;

            const card = trigger.closest('.portfolio-item');
            open(portfolioItems.indexOf(card), trigger);
        });

        closeButton?.addEventListener('click', close);
        previousButton?.addEventListener('click', () => showPortfolioItem(activeIndex - 1));
        nextButton?.addEventListener('click', () => showPortfolioItem(activeIndex + 1));

        showcaseOverlay.addEventListener('click', (event) => {
            if (event.target === showcaseOverlay) close();
        });

        document.addEventListener('keydown', (event) => {
            if (showcaseOverlay.hidden) return;

            if (event.key === 'Escape') {
                event.preventDefault();
                close();
                return;
            }

            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                showPortfolioItem(activeIndex - 1);
                return;
            }

            if (event.key === 'ArrowRight') {
                event.preventDefault();
                showPortfolioItem(activeIndex + 1);
                return;
            }

            if (event.key !== 'Tab') return;

            const focusableElements = [...showcaseOverlay.querySelectorAll('button:not([disabled]), a[href]')];
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        });
    }

    function initFeedbackDialog() {
        if (!feedbackOverlay) return { open: () => {} };

        const feedbackDialog = feedbackOverlay.querySelector('.feedback-dialog');
        const closeButtons = [
            document.getElementById('feedbackClose'),
            document.getElementById('feedbackConfirm')
        ].filter(Boolean);
        let previouslyFocusedElement = null;
        let hideTimer = null;

        function open() {
            if (hideTimer !== null) window.clearTimeout(hideTimer);

            previouslyFocusedElement = document.activeElement;
            feedbackOverlay.hidden = false;
            feedbackOverlay.setAttribute('aria-hidden', 'false');
            window.requestAnimationFrame(() => {
                feedbackOverlay.classList.add('is-active');
                feedbackDialog?.focus();
            });
            syncPageScrollLock();
        }

        function close() {
            feedbackOverlay.classList.remove('is-active');
            feedbackOverlay.setAttribute('aria-hidden', 'true');
            syncPageScrollLock();

            hideTimer = window.setTimeout(() => {
                feedbackOverlay.hidden = true;
                syncPageScrollLock();
            }, 300);

            if (previouslyFocusedElement instanceof HTMLElement) {
                previouslyFocusedElement.focus();
            }
        }

        closeButtons.forEach((button) => button.addEventListener('click', close));

        feedbackOverlay.addEventListener('click', (event) => {
            if (event.target === feedbackOverlay) close();
        });

        feedbackOverlay.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                close();
                return;
            }

            if (event.key !== 'Tab') return;

            const focusableElements = [...feedbackOverlay.querySelectorAll('button:not([disabled]), a[href]')];
            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        });

        return { open, close };
    }

    function initMessageForm(openFeedbackDialog) {
        const messageForm = document.getElementById('messageForm');
        const messageSubmit = document.getElementById('messageSubmit');
        const submissionFeedback = document.getElementById('submissionFeedback');
        if (!messageForm || !messageSubmit || !submissionFeedback) return;

        const fields = [...messageForm.querySelectorAll('input, textarea')];
        let isSubmitting = false;

        function setFieldError(field, message = '') {
            const errorElement = document.getElementById(`${field.id}Error`);
            field.classList.toggle('has-error', Boolean(message));

            if (errorElement) {
                errorElement.textContent = message;
                errorElement.classList.toggle('is-visible', Boolean(message));
            }
        }

        fields.forEach((field) => {
            field.addEventListener('invalid', () => setFieldError(field, field.validationMessage));
            field.addEventListener('input', () => setFieldError(field));
        });

        messageForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (isSubmitting || !messageForm.checkValidity()) {
                messageForm.reportValidity();
                return;
            }

            isSubmitting = true;
            submissionFeedback.textContent = '';
            submissionFeedback.className = 'submission-status';
            messageSubmit.disabled = true;
            messageSubmit.classList.add('is-loading');

            const requestBody = {
                name: messageForm.elements.name.value.trim(),
                email: messageForm.elements.email.value.trim(),
                website: messageForm.elements.website.value.trim(),
                message: messageForm.elements.message.value.trim()
            };

            try {
                const response = await fetch('https://jsonplaceholder.typicode.com/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json; charset=UTF-8'
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }

                messageForm.reset();
                fields.forEach((field) => setFieldError(field));
                openFeedbackDialog();
            } catch {
                submissionFeedback.textContent = 'Your message could not be sent. Please try again.';
                submissionFeedback.classList.add('is-error');
            } finally {
                isSubmitting = false;
                messageSubmit.disabled = false;
                messageSubmit.classList.remove('is-loading');
            }
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && primaryNavigation?.classList.contains('is-open')) {
            closeCompactNavigation();
            navigationToggle?.focus();
        }
    });

    initPrimaryNavigation();
    initProfileCarousel();
    initCompetencyBars();
    initWorkFilters();
    initShowcaseOverlay();
    initReviewCarousel();

    const feedbackController = initFeedbackDialog();
    initMessageForm(feedbackController.open);
});
