(() => {
    'use strict';

    const find = (selector, scope = document) => scope.querySelector(selector);
    const findAll = (selector, scope = document) => [...scope.querySelectorAll(selector)];
    const boundedIndex = (index, length) => (index % length + length) % length;

    class RotationClock {
        constructor(delay, advance) {
            this.delay = delay;
            this.advance = advance;
            this.timerId = null;
            this.pauseTargets = new Set();
        }

        halt = () => {
            if (this.timerId === null) return;
            window.clearTimeout(this.timerId);
            this.timerId = null;
        };

        schedule = () => {
            this.halt();
            if (document.hidden || this.pauseTargets.size > 0) return;

            this.timerId = window.setTimeout(() => {
                this.advance();
                this.schedule();
            }, this.delay);
        };

        restart = () => {
            this.schedule();
        };

        pauseWith(element) {
            if (!element) return;

            const pointerPause = {};
            const focusPause = {};
            element.addEventListener('pointerenter', () => {
                this.pauseTargets.add(pointerPause);
                this.halt();
            });
            element.addEventListener('pointerleave', () => {
                this.pauseTargets.delete(pointerPause);
                this.schedule();
            });
            element.addEventListener('focusin', () => {
                this.pauseTargets.add(focusPause);
                this.halt();
            });
            element.addEventListener('focusout', (event) => {
                if (!element.contains(event.relatedTarget)) {
                    this.pauseTargets.delete(focusPause);
                    this.schedule();
                }
            });
        }

        connectVisibility() {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.halt();
                } else {
                    this.schedule();
                }
            });
        }
    }

    class ModalSurface {
        constructor({ overlay, panel, closeDelay, updatePageLock }) {
            this.overlay = overlay;
            this.panel = panel;
            this.closeDelay = closeDelay;
            this.updatePageLock = updatePageLock;
            this.lastFocus = null;
            this.hideTimer = null;

            this.overlay.addEventListener('click', (event) => {
                if (event.target === this.overlay) this.close();
            });

            this.overlay.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    this.close();
                    return;
                }

                if (event.key === 'Tab') this.keepFocusInside(event);
            });
        }

        open(trigger) {
            if (this.hideTimer !== null) window.clearTimeout(this.hideTimer);

            this.lastFocus = trigger || document.activeElement;
            this.overlay.hidden = false;
            this.overlay.setAttribute('aria-hidden', 'false');
            this.updatePageLock();

            window.requestAnimationFrame(() => {
                this.overlay.classList.add('is-active');
                this.panel?.focus();
            });
        }

        close = () => {
            if (this.overlay.hidden) return;

            this.overlay.classList.remove('is-active');

            this.hideTimer = window.setTimeout(() => {
                this.overlay.hidden = true;
                this.overlay.setAttribute('aria-hidden', 'true');
                this.updatePageLock();
                if (this.lastFocus instanceof HTMLElement) this.lastFocus.focus();
            }, this.closeDelay);
        };

        connectCloseButtons(buttons) {
            buttons.filter(Boolean).forEach((button) => button.addEventListener('click', this.close));
        }

        keepFocusInside(event) {
            const focusable = findAll('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled])', this.overlay);
            if (focusable.length === 0) return;

            const first = focusable.at(0);
            const last = focusable.at(-1);

            if (event.shiftKey && (document.activeElement === first || !focusable.includes(document.activeElement))) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
    }

    class ProjectInspector {
        constructor(dialog, cards, updatePageLock) {
            this.dialog = dialog;
            this.cards = cards;
            this.updatePageLock = updatePageLock;
            this.current = 0;
            this.returnTarget = null;
            this.closeTimer = null;
            this.pointerStart = null;

            this.image = find('#inspectorImage');
            this.title = find('#inspectorTitle');
            this.category = find('#inspectorCategory');
            this.summary = find('#inspectorSummary');
            this.fullLink = find('#inspectorFullLink');
            this.dismissButton = find('#inspectorDismiss');
            this.previousButton = find('#inspectorPrevious');
            this.nextButton = find('#inspectorNext');
            this.visual = find('.inspector-visual', dialog);
        }

        ready() {
            return Boolean(this.image && this.title && this.category && this.summary && this.fullLink);
        }

        connect() {
            this.dismissButton?.addEventListener('click', this.dismiss);
            this.previousButton?.addEventListener('click', () => this.move(-1));
            this.nextButton?.addEventListener('click', () => this.move(1));

            this.dialog.addEventListener('cancel', (event) => {
                event.preventDefault();
                this.dismiss();
            });

            this.dialog.addEventListener('click', (event) => {
                if (event.target === this.dialog) this.dismiss();
            });

            this.dialog.addEventListener('keydown', (event) => {
                if (event.key === 'ArrowLeft') {
                    event.preventDefault();
                    this.move(-1);
                }

                if (event.key === 'ArrowRight') {
                    event.preventDefault();
                    this.move(1);
                }
            });

            this.visual?.addEventListener('pointerdown', (event) => {
                this.pointerStart = event.clientX;
            });

            this.visual?.addEventListener('pointerup', (event) => {
                if (this.pointerStart === null) return;
                const distance = event.clientX - this.pointerStart;
                this.pointerStart = null;
                if (Math.abs(distance) > 60) this.move(distance > 0 ? -1 : 1);
            });
        }

        present(index, trigger) {
            if (!this.ready()) return;
            if (this.closeTimer !== null) window.clearTimeout(this.closeTimer);

            this.returnTarget = trigger;
            this.render(index);

            if (!this.dialog.open) this.dialog.showModal();
            this.updatePageLock();
            window.requestAnimationFrame(() => {
                this.dialog.classList.add('is-visible');
                this.dismissButton?.focus();
            });
        }

        render(index) {
            this.current = boundedIndex(index, this.cards.length);
            const card = this.cards[this.current];
            const preview = find('.portfolio-image', card);
            if (!preview) return;

            const source = preview.currentSrc || preview.src;
            this.image.src = source;
            this.image.alt = preview.alt + ' - expanded project image';
            this.title.textContent = find('.portfolio-title', card)?.textContent.trim() || 'Project preview';
            this.category.textContent = find('.portfolio-category', card)?.textContent.trim() || '';
            this.summary.textContent = card.dataset.workSummary || '';
            this.fullLink.href = source;
        }

        move(direction) {
            this.render(this.current + direction);
        }

        dismiss = () => {
            if (!this.dialog.open) return;

            this.dialog.classList.remove('is-visible');
            this.closeTimer = window.setTimeout(() => {
                this.dialog.close();
                this.image?.removeAttribute('src');
                this.updatePageLock();
                if (this.returnTarget instanceof HTMLElement) this.returnTarget.focus();
            }, 220);
        };
    }

    class PortfolioRuntime {
        constructor() {
            this.header = find('#portfolioHeader');
            this.navigation = find('#primaryNavigation');
            this.menuButton = find('#navigationToggle');
            this.feedbackLayer = find('#feedbackOverlay');
            this.projectDialog = find('#projectInspector');
            this.projectInspector = null;
            this.feedbackModal = null;
        }

        start() {
            this.configureNavigation();
            this.configurePortraitRotation();
            this.configureSkillReveal();
            this.configureProjectFilters();
            this.configureProjectInspector();
            this.configureTestimonials();
            this.configureFeedbackModal();
            this.configureContactForm();

            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && this.navigation?.classList.contains('is-open')) {
                    this.closeNavigation();
                    this.menuButton?.focus();
                }
            });
        }

        updatePageLock = () => {
            const navigationOpen = this.navigation?.classList.contains('is-open') ?? false;
            const feedbackOpen = this.feedbackLayer ? !this.feedbackLayer.hidden : false;
            const projectOpen = this.projectDialog?.open ?? false;
            document.body.classList.toggle('page-locked', navigationOpen || feedbackOpen || projectOpen);
        };

        closeNavigation = () => {
            if (!this.navigation || !this.menuButton) return;

            this.navigation.classList.remove('is-open');
            this.menuButton.classList.remove('is-active');
            this.menuButton.setAttribute('aria-expanded', 'false');
            this.updatePageLock();
        };

        configureNavigation() {
            if (this.navigation && this.menuButton) {
                this.menuButton.addEventListener('click', () => {
                    const expanded = this.navigation.classList.toggle('is-open');
                    this.menuButton.classList.toggle('is-active', expanded);
                    this.menuButton.setAttribute('aria-expanded', String(expanded));
                    this.updatePageLock();
                });

                findAll('a', this.navigation).forEach((link) => {
                    link.addEventListener('click', this.closeNavigation);
                });

                window.addEventListener('resize', () => {
                    if (window.innerWidth > 768) this.closeNavigation();
                });
            }

            const links = findAll('.navigation-anchor');
            const sections = links.map((link) => document.getElementById(link.hash.slice(1))).filter(Boolean);
            let framePending = false;

            const paintNavigationState = () => {
                const pageOffset = window.scrollY;
                this.header?.classList.toggle('is-compact', pageOffset > 50);

                const readingLine = pageOffset + 140;
                const currentSection = sections.reduce((current, section) => {
                    return readingLine >= section.offsetTop ? section.id : current;
                }, sections.at(0)?.id || '');

                links.forEach((link) => {
                    const selected = link.hash === '#' + currentSection;
                    link.classList.toggle('is-active', selected);

                    if (selected) {
                        link.setAttribute('aria-current', 'page');
                    } else {
                        link.removeAttribute('aria-current');
                    }
                });

                framePending = false;
            };

            window.addEventListener('scroll', () => {
                if (framePending) return;
                framePending = true;
                window.requestAnimationFrame(paintNavigationState);
            }, { passive: true });

            paintNavigationState();
        }

        configurePortraitRotation() {
            const carousel = find('#profileCarousel');
            const slides = carousel ? findAll('.portrait-slide', carousel) : [];
            if (slides.length === 0) return;

            let current = Math.max(0, slides.findIndex((slide) => slide.classList.contains('is-active')));

            const display = (requested) => {
                current = boundedIndex(requested, slides.length);
                slides.forEach((slide, index) => {
                    const visible = index === current;
                    slide.classList.toggle('is-active', visible);
                    slide.setAttribute('aria-hidden', String(!visible));
                });
            };

            const clock = new RotationClock(5000, () => display(current + 1));
            display(current);
            clock.pauseWith(carousel);
            clock.connectVisibility();
            clock.schedule();
        }

        configureSkillReveal() {
            const list = find('#competencyList');
            if (!list) return;

            const bars = findAll('[role="progressbar"]', list);
            let revealed = false;

            bars.forEach((bar) => {
                const fill = find('.competency-level', bar);
                if (fill) fill.style.width = '0%';
                bar.setAttribute('aria-valuenow', '0');
            });

            const reveal = () => {
                if (revealed) return;
                revealed = true;

                bars.forEach((bar, position) => {
                    const requested = Number.parseInt(bar.dataset.percentage || '0', 10);
                    const percentage = Number.isFinite(requested) ? Math.max(0, Math.min(100, requested)) : 0;
                    const fill = find('.competency-level', bar);

                    if (fill) {
                        fill.style.transitionDelay = String(position * 90) + 'ms';
                        window.requestAnimationFrame(() => {
                            fill.style.width = String(percentage) + '%';
                        });
                    }

                    bar.setAttribute('aria-valuenow', String(percentage));
                });
            };

            if (!('IntersectionObserver' in window)) {
                reveal();
                return;
            }

            const observer = new IntersectionObserver((records) => {
                if (!records.some((record) => record.isIntersecting)) return;
                reveal();
                observer.disconnect();
            }, { threshold: 0.25 });

            observer.observe(list);
        }

        configureProjectFilters() {
            const controls = find('#workFilters');
            const gallery = find('#workGallery');
            if (!controls || !gallery) return;

            const buttons = findAll('.category-control', controls);
            const cards = findAll('.portfolio-item', gallery);

            const selectCategory = (category) => {
                buttons.forEach((button) => {
                    const selected = button.dataset.workFilter === category;
                    button.classList.toggle('is-active', selected);
                    button.setAttribute('aria-pressed', String(selected));
                });

                cards.forEach((card) => {
                    const visible = category === 'all' || card.dataset.workCategory === category;
                    card.hidden = !visible;
                    card.setAttribute('aria-hidden', String(!visible));
                });
            };

            controls.addEventListener('click', (event) => {
                const button = event.target.closest('[data-work-filter]');
                if (!button || !controls.contains(button)) return;
                selectCategory(button.dataset.workFilter || 'all');
            });

            selectCategory('all');
        }

        configureProjectInspector() {
            const gallery = find('#workGallery');
            if (!gallery || !this.projectDialog) return;

            const cards = findAll('.portfolio-item', gallery);
            if (cards.length === 0) return;

            this.projectInspector = new ProjectInspector(this.projectDialog, cards, this.updatePageLock);
            if (!this.projectInspector.ready()) return;

            this.projectInspector.connect();

            gallery.addEventListener('click', (event) => {
                const trigger = event.target.closest('[data-inspect-project]');
                if (!trigger || !gallery.contains(trigger)) return;

                const card = trigger.closest('.portfolio-item');
                const index = cards.indexOf(card);
                if (index >= 0) this.projectInspector.present(index, trigger);
            });
        }

        configureTestimonials() {
            const track = find('#reviewTrack');
            const navigation = find('#reviewControls');
            if (!track || !navigation) return;

            const reviews = findAll('.review-panel', track);
            const dots = findAll('.review-dot', navigation);
            if (reviews.length === 0 || reviews.length !== dots.length) return;

            let current = 0;

            const displayReview = (requested) => {
                current = boundedIndex(requested, reviews.length);

                reviews.forEach((review, index) => {
                    const visible = index === current;
                    review.classList.toggle('is-active', visible);
                    review.setAttribute('aria-hidden', String(!visible));
                });

                dots.forEach((dot, index) => {
                    const selected = index === current;
                    dot.classList.toggle('is-active', selected);
                    dot.setAttribute('aria-selected', String(selected));
                    dot.tabIndex = selected ? 0 : -1;
                });
            };

            const clock = new RotationClock(7000, () => displayReview(current + 1));

            navigation.addEventListener('click', (event) => {
                const dot = event.target.closest('[data-review-target]');
                if (!dot || !navigation.contains(dot)) return;

                displayReview(Number.parseInt(dot.dataset.reviewTarget || '0', 10));
                clock.restart();
            });

            navigation.addEventListener('keydown', (event) => {
                const accepted = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
                if (!accepted.includes(event.key)) return;

                event.preventDefault();
                const destination = {
                    ArrowLeft: current - 1,
                    ArrowRight: current + 1,
                    Home: 0,
                    End: reviews.length - 1
                }[event.key];

                displayReview(destination);
                dots[current].focus();
                clock.restart();
            });

            displayReview(0);
            clock.pauseWith(track);
            clock.pauseWith(navigation);
            clock.connectVisibility();
            clock.schedule();
        }

        configureFeedbackModal() {
            if (!this.feedbackLayer) return;

            this.feedbackModal = new ModalSurface({
                overlay: this.feedbackLayer,
                panel: find('.feedback-dialog', this.feedbackLayer),
                closeDelay: 300,
                updatePageLock: this.updatePageLock
            });

            this.feedbackModal.connectCloseButtons([
                find('#feedbackClose'),
                find('#feedbackConfirm')
            ]);
        }

        configureContactForm() {
            const form = find('#messageForm');
            const submit = find('#messageSubmit');
            const status = find('#submissionFeedback');
            if (!form || !submit || !status) return;

            const fields = findAll('input, textarea', form);
            let pending = false;

            const showFieldState = (field, message = '') => {
                const error = find('#' + field.id + 'Error');
                const invalid = Boolean(message);
                field.classList.toggle('has-error', invalid);
                field.setAttribute('aria-invalid', String(invalid));

                if (error) {
                    error.textContent = message;
                    error.classList.toggle('is-visible', invalid);
                }
            };

            fields.forEach((field) => {
                field.addEventListener('invalid', () => showFieldState(field, field.validationMessage));
                field.addEventListener('input', () => {
                    field.setCustomValidity('');
                    showFieldState(field);
                });
            });

            form.addEventListener('submit', async (event) => {
                event.preventDefault();

                fields.forEach((field) => {
                    const value = field.value.trim();
                    const tooShort = field.minLength > 0 && value.length < field.minLength;
                    field.setCustomValidity(field.required && (!value || tooShort)
                        ? 'Please enter at least ' + Math.max(1, field.minLength) + ' non-space characters.'
                        : '');
                });

                if (pending || !form.checkValidity()) {
                    form.reportValidity();
                    return;
                }

                pending = true;
                submit.disabled = true;
                submit.classList.add('is-loading');
                status.textContent = '';
                status.className = 'submission-status';

                const names = ['name', 'email', 'website', 'message'];
                const payload = names.reduce((result, name) => {
                    result[name] = form.elements[name].value.trim();
                    return result;
                }, {});

                try {
                    const response = await fetch('https://jsonplaceholder.typicode.com/users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
                        body: JSON.stringify(payload)
                    });

                    if (!response.ok) throw new Error(String(response.status));

                    form.reset();
                    fields.forEach((field) => showFieldState(field));
                    this.feedbackModal?.open(submit);
                } catch {
                    status.textContent = 'Your message could not be sent. Please try again.';
                    status.classList.add('is-error');
                } finally {
                    pending = false;
                    submit.disabled = false;
                    submit.classList.remove('is-loading');
                }
            });
        }
    }

    const launch = () => new PortfolioRuntime().start();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', launch, { once: true });
    } else {
        launch();
    }
})();
