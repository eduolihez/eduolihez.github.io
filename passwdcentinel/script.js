// Password Sentinel Website - JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
    
    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
        });
    });
    
    // Smooth Scrolling for Navigation Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Navbar Background on Scroll
    function updateNavbarBackground() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    }
    
    window.addEventListener('scroll', updateNavbarBackground);
    updateNavbarBackground(); // Initial call
    
    // Contact Form Handling
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            
            // Basic validation
            if (!name || !email || !message) {
                showNotification('Por favor, completa todos los campos.', 'error');
                return;
            }
            
            if (!isValidEmail(email)) {
                showNotification('Por favor, ingresa un email válido.', 'error');
                return;
            }
            
            // Simulate form submission
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Enviando...';
            submitBtn.disabled = true;
            
            // Simulate API call
            setTimeout(() => {
                showNotification('¡Mensaje enviado! Te contactaré pronto.', 'success');
                contactForm.reset();
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 2000);
        });
    }
    
    // Email validation
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Notification system
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 90px;
            right: 20px;
            background: ${getNotificationColor(type)};
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            max-width: 400px;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
    
    function getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }
    
    function getNotificationColor(type) {
        const colors = {
            success: '#2ed573',
            error: '#ff4757',
            warning: '#ffa502',
            info: '#667eea'
        };
        return colors[type] || colors.info;
    }
    
    // Interactive Features Demo
    function initInteractiveDemo() {
        const passwordInput = document.querySelector('.password-analysis input');
        const strengthFill = document.querySelector('.strength-fill');
        const strengthText = document.querySelector('.strength-text');
        const strengthScore = document.querySelector('.strength-score');
        
        if (passwordInput && strengthFill) {
            // Update strength indicator based on input
            function updateStrengthIndicator() {
                const password = passwordInput.value;
                const strength = calculatePasswordStrength(password);
                
                // Update visual indicators
                strengthFill.className = `strength-fill ${strength.class}`;
                strengthFill.style.width = strength.width;
                
                if (strengthText) strengthText.textContent = strength.text;
                if (strengthScore) strengthScore.textContent = strength.score;
                
                // Update feature indicators
                updateFeatureIndicators(password);
            }
            
            // Calculate password strength
            function calculatePasswordStrength(password) {
                let score = 0;
                
                // Length
                if (password.length >= 20) score += 30;
                else if (password.length >= 16) score += 25;
                else if (password.length >= 12) score += 20;
                else if (password.length >= 8) score += 10;
                else score += 0;
                
                // Character variety
                if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 25;
                if (/\d/.test(password)) score += 20;
                if (/[^a-zA-Z0-9]/.test(password)) score += 25;
                
                // Cap at 100
                score = Math.min(score, 100);
                
                // Determine strength class
                if (score >= 80) {
                    return { class: 'very-strong', width: '100%', text: 'Muy Fuerte', score: `${score}%` };
                } else if (score >= 60) {
                    return { class: 'strong', width: '75%', text: 'Fuerte', score: `${score}%` };
                } else if (score >= 40) {
                    return { class: 'medium', width: '50%', text: 'Media', score: `${score}%` };
                } else {
                    return { class: 'weak', width: '25%', text: 'Débil', score: `${score}%` };
                }
            }
            
            // Update feature indicators
            function updateFeatureIndicators(password) {
                const indicators = document.querySelectorAll('.feature-indicator');
                
                if (indicators.length >= 4) {
                    // Length indicator
                    indicators[0].textContent = password.length >= 8 ? 
                        `✓ Longitud: ${password.length}` : `❌ Longitud: ${password.length}`;
                    indicators[0].className = `feature-indicator ${password.length >= 8 ? 'positive' : 'negative'}`;
                    
                    // Upper/lower case indicator
                    const hasBothCases = /[a-z]/.test(password) && /[A-Z]/.test(password);
                    indicators[1].textContent = hasBothCases ? '✓ May/min' : '❌ May/min';
                    indicators[1].className = `feature-indicator ${hasBothCases ? 'positive' : 'negative'}`;
                    
                    // Numbers indicator
                    const hasNumbers = /\d/.test(password);
                    indicators[2].textContent = hasNumbers ? '✓ Números' : '❌ Números';
                    indicators[2].className = `feature-indicator ${hasNumbers ? 'positive' : 'negative'}`;
                    
                    // Symbols indicator
                    const hasSymbols = /[^a-zA-Z0-9]/.test(password);
                    indicators[3].textContent = hasSymbols ? '✓ Símbolos' : '❌ Símbolos';
                    indicators[3].className = `feature-indicator ${hasSymbols ? 'positive' : 'negative'}`;
                }
            }
            
            // Add negative style for feature indicators
            const style = document.createElement('style');
            style.textContent = `
                .feature-indicator.negative {
                    background: rgba(255, 71, 87, 0.1);
                    color: #ff4757;
                }
            `;
            document.head.appendChild(style);
            
            // Add event listener
            passwordInput.addEventListener('input', updateStrengthIndicator);
            
            // Initial update
            updateStrengthIndicator();
        }
    }
    
    // Initialize interactive demo
    initInteractiveDemo();
    
    // Animation on scroll
    function initScrollAnimations() {
        const animatedElements = document.querySelectorAll('.feature-card, .step, .screenshot-item');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });
        
        animatedElements.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(element);
        });
    }
    
    // Initialize scroll animations
    initScrollAnimations();
    
    // Add loading animation
    window.addEventListener('load', function() {
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.3s ease';
        
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 100);
    });
});