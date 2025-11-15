/* ============================================
   APEX INTELLIGENCE - UI/UX ENHANCEMENTS JS
   ============================================ */

(function() {
    'use strict';

    // ========================================
    // 1. ENHANCED CUSTOM CURSOR (Desktop Only)
    // ========================================

    function initCustomCursor() {
        if (window.innerWidth <= 768) return;

        const cursor = document.getElementById('customCursor');
        const follower = document.getElementById('cursorFollower');

        if (!cursor || !follower) return;

        let mouseX = 0;
        let mouseY = 0;
        let followerX = 0;
        let followerY = 0;
        let lastTime = Date.now();

        // Track mouse position
        document.addEventListener('mousemove', function(e) {
            mouseX = e.clientX;
            mouseY = e.clientY;

            // Main cursor follows instantly (centered)
            cursor.style.left = mouseX + 'px';
            cursor.style.top = mouseY + 'px';
        });

        // Delayed follower with 100ms delay using requestAnimationFrame
        function animateFollower() {
            const currentTime = Date.now();
            const deltaTime = currentTime - lastTime;

            // Calculate easing with time-based delay for smooth 100ms effect
            const speed = 0.12; // Adjusted for ~100ms perceived delay

            followerX += (mouseX - followerX) * speed;
            followerY += (mouseY - followerY) * speed;

            follower.style.left = followerX + 'px';
            follower.style.top = followerY + 'px';

            lastTime = currentTime;
            requestAnimationFrame(animateFollower);
        }
        animateFollower();

        // Expand on hover over interactive elements
        const interactiveSelectors = [
            'a', 'button', 'input', 'textarea', 'select',
            '.search-filter-tag', '.tool-card', '.intel-card',
            '.market-card', '.stat-card', '.analysis-card',
            '.comparison-card', '.use-case-card', '.testimonial-card',
            '.btn-subscribe', '.btn-tool', '.btn-primary', '.btn-secondary',
            '.btn-export', '.analyze-btn', '.add-card-btn'
        ];

        const interactiveElements = document.querySelectorAll(interactiveSelectors.join(', '));

        interactiveElements.forEach(element => {
            element.addEventListener('mouseenter', function() {
                follower.classList.add('hover');
                cursor.classList.add('expand');
            });
            element.addEventListener('mouseleave', function() {
                follower.classList.remove('hover');
                cursor.classList.remove('expand');
            });
        });
    }

    // ========================================
    // 2. SMOOTH PAGE TRANSITIONS
    // ========================================

    function initPageTransitions() {
        // Create transition overlay if it doesn't exist
        let overlay = document.querySelector('.page-transition-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'page-transition-overlay';
            document.body.appendChild(overlay);
        }

        // Add page-content class to main content
        const content = document.querySelector('.content');
        if (content) {
            content.classList.add('page-content');
        }

        // Intercept link clicks for smooth transitions
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');

            // Skip if not a link, external link, or has special attributes
            if (!link) return;
            if (link.hostname !== window.location.hostname) return;
            if (link.hasAttribute('download')) return;
            if (link.getAttribute('target') === '_blank') return;
            if (link.hash && link.pathname === window.location.pathname) return; // Skip anchor links

            const href = link.getAttribute('href');
            if (!href || href === '#' || href.startsWith('javascript:')) return;

            // Prevent default and do smooth transition
            e.preventDefault();

            // Activate overlay
            overlay.classList.add('active');

            // Navigate after fade out
            setTimeout(function() {
                window.location.href = href;
            }, 200);
        });

        // Stagger reveal items on page load
        initStaggerReveal();
    }

    function initStaggerReveal() {
        // Add stagger-item class to cards and sections
        const staggerSelectors = [
            '.tool-card',
            '.intel-card',
            '.market-card',
            '.stat-card',
            '.use-case-card',
            '.testimonial-card'
        ];

        staggerSelectors.forEach(selector => {
            const items = document.querySelectorAll(selector);
            items.forEach((item, index) => {
                // Only add stagger to first 10 items for performance
                if (index < 10) {
                    item.classList.add('stagger-item');
                    item.style.animationDelay = (index * 50) + 'ms';
                }
            });
        });
    }

    // ========================================
    // 3. SKELETON SCREEN UTILITIES
    // ========================================

    const SkeletonScreen = {
        // Create a skeleton card
        createCard: function() {
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton skeleton-card';
            skeleton.innerHTML = `
                <div style="padding: 20px;">
                    <div class="skeleton skeleton-circle" style="margin-bottom: 16px;"></div>
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text short"></div>
                    <div style="margin-top: 20px;">
                        <div class="skeleton skeleton-button"></div>
                    </div>
                </div>
            `;
            return skeleton;
        },

        // Create skeleton text lines
        createText: function(lines = 3) {
            const container = document.createElement('div');
            for (let i = 0; i < lines; i++) {
                const line = document.createElement('div');
                line.className = 'skeleton skeleton-text';
                if (i === lines - 1) line.classList.add('short');
                container.appendChild(line);
            }
            return container;
        },

        // Replace loading spinner with skeleton
        replaceSkeleton: function(loadingElement, skeletonType = 'card') {
            if (!loadingElement) return;

            loadingElement.classList.add('skeleton-active');
            const spinner = loadingElement.querySelector('.spinner');
            if (spinner) {
                spinner.style.display = 'none';
            }

            let skeleton;
            if (skeletonType === 'card') {
                skeleton = this.createCard();
            } else if (skeletonType === 'text') {
                skeleton = this.createText();
            }

            if (skeleton) {
                loadingElement.appendChild(skeleton);
            }
        },

        // Show content and hide skeleton
        showContent: function(skeletonContainer, contentElement) {
            if (!skeletonContainer || !contentElement) return;

            skeletonContainer.classList.add('loaded');
            contentElement.classList.add('content-loaded');

            setTimeout(function() {
                skeletonContainer.remove();
            }, 300);
        }
    };

    // Make it globally available
    window.SkeletonScreen = SkeletonScreen;

    // ========================================
    // 4. ACHIEVEMENT NOTIFICATION SYSTEM
    // ========================================

    const NotificationSystem = {
        container: null,
        notifications: [],

        init: function() {
            // Create notification container if it doesn't exist
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.className = 'notification-container';
                document.body.appendChild(this.container);
            }
        },

        show: function(options) {
            this.init();

            const {
                title = 'Achievement',
                message = '',
                icon = '🏆',
                duration = 3000,
                onClick = null
            } = options;

            // Create notification element
            const notification = document.createElement('div');
            notification.className = 'achievement-notification';

            notification.innerHTML = `
                <div class="notification-icon">${icon}</div>
                <div class="notification-content">
                    <div class="notification-title">${title}</div>
                    <div class="notification-message">${message}</div>
                </div>
                <button class="notification-close" aria-label="Close notification">×</button>
                <div class="notification-progress"></div>
            `;

            // Add click handler if provided
            if (onClick) {
                notification.style.cursor = 'none';
                notification.addEventListener('click', function(e) {
                    if (!e.target.closest('.notification-close')) {
                        onClick();
                        NotificationSystem.dismiss(notification);
                    }
                });
            }

            // Close button handler
            const closeBtn = notification.querySelector('.notification-close');
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                NotificationSystem.dismiss(notification);
            });

            // Add to container
            this.container.appendChild(notification);
            this.notifications.push(notification);

            // Auto-dismiss after duration
            if (duration > 0) {
                setTimeout(function() {
                    NotificationSystem.dismiss(notification);
                }, duration);
            }

            return notification;
        },

        dismiss: function(notification) {
            if (!notification || !notification.parentNode) return;

            notification.classList.add('dismissing');

            setTimeout(function() {
                if (notification.parentNode) {
                    notification.remove();
                }
                const index = NotificationSystem.notifications.indexOf(notification);
                if (index > -1) {
                    NotificationSystem.notifications.splice(index, 1);
                }
            }, 300);
        },

        // Predefined notification types
        success: function(message, title = 'Success') {
            return this.show({
                title: title,
                message: message,
                icon: '✓',
                duration: 3000
            });
        },

        error: function(message, title = 'Error') {
            return this.show({
                title: title,
                message: message,
                icon: '⚠',
                duration: 4000
            });
        },

        info: function(message, title = 'Info') {
            return this.show({
                title: title,
                message: message,
                icon: 'ℹ',
                duration: 3000
            });
        },

        achievement: function(message, title = 'Achievement Unlocked') {
            return this.show({
                title: title,
                message: message,
                icon: '🏆',
                duration: 4000
            });
        },

        loading: function(message, title = 'Loading') {
            return this.show({
                title: title,
                message: message,
                icon: '⟳',
                duration: 0 // Don't auto-dismiss loading notifications
            });
        }
    };

    // Make it globally available
    window.NotificationSystem = NotificationSystem;

    // ========================================
    // 5. AUTO-INITIALIZE ON DOM READY
    // ========================================

    function init() {
        // Initialize custom cursor
        initCustomCursor();

        // Initialize page transitions
        initPageTransitions();

        // Initialize notification system
        NotificationSystem.init();

        // Example: Show welcome notification on homepage
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
            setTimeout(function() {
                NotificationSystem.info('Explore our advanced TCG intelligence tools', 'Welcome to Apex Intelligence');
            }, 500);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ========================================
    // 6. UTILITY FUNCTIONS
    // ========================================

    // Debounce function for performance
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Re-initialize on window resize (for cursor)
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            const wasMobile = window.innerWidth <= 768;
            const isMobile = window.innerWidth <= 768;

            if (wasMobile !== isMobile) {
                // Reinitialize cursor if viewport changed
                initCustomCursor();
            }
        }, 250);
    });

})();
