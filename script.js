// Configuración centralizada para mejor mantenibilidad
const CONFIG = {
    PARTICLES: {
        COUNT: 60,
        CONNECTION_DISTANCE: 120,
        MOUSE_RADIUS: 100
    },
    ANIMATION: {
        DURATIONS: {
            PAGE_LOAD: 1000,
            STAGGER: 100
        }
    },
    SOUND: {
        VOLUME: 0.1,
        FREQUENCIES: {
            HOVER: 600,
            CLICK: 800,
            SUCCESS: 1000,
            TRANSITION: 400
        }
    },
    PERFORMANCE: {
        THROTTLE_DELAY: 16, // ~60fps
        LAZY_LOAD_THRESHOLD: 0.1
    }
};

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar todas las funcionalidades
    initCustomCursor();
    initTypewriterEffect();
    initAnimations();
    initParticles();
    initSoundSystem();
    initPerformanceOptimizations();
    initInteractionEffects();
    initEnhancedAnalytics();
    initOptimizedEventListeners();
    initScrollAnimations();
});

// Sistema de partículas interactivo
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Configuración de partículas
    let particlesArray = [];
    const { COUNT, CONNECTION_DISTANCE, MOUSE_RADIUS } = CONFIG.PARTICLES;
    
    // Ajustar tamaño del canvas
    function handleResize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticlesArray();
    }
    
    // Inicializar array de partículas
    function initParticlesArray() {
        particlesArray = [];
        for (let i = 0; i < COUNT; i++) {
            const size = Math.random() * 2 + 1;
            const x = Math.random() * (canvas.width - size * 2) + size;
            const y = Math.random() * (canvas.height - size * 2) + size;
            const directionX = (Math.random() * 0.4) - 0.2;
            const directionY = (Math.random() * 0.4) - 0.2;
            
            particlesArray.push({
                x, y, directionX, directionY, size,
                color: `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`
            });
        }
    }
    
    // Dibujar partículas
    function drawParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar conexiones primero
        drawConnections();
        
        // Dibujar partículas
        for (let i = 0; i < particlesArray.length; i++) {
            ctx.beginPath();
            ctx.arc(
                particlesArray[i].x,
                particlesArray[i].y,
                particlesArray[i].size,
                0, Math.PI * 2
            );
            ctx.closePath();
            ctx.fillStyle = particlesArray[i].color;
            ctx.fill();
        }
    }
    
    // Dibujar conexiones entre partículas
    function drawConnections() {
        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a; b < particlesArray.length; b++) {
                const distance = Math.hypot(
                    particlesArray[a].x - particlesArray[b].x,
                    particlesArray[a].y - particlesArray[b].y
                );
                
                if (distance < CONNECTION_DISTANCE) {
                    const opacity = 1 - (distance / CONNECTION_DISTANCE);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.1})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }
        }
    }
    
    // Actualizar posición de partículas
    function updateParticles() {
        for (let i = 0; i < particlesArray.length; i++) {
            // Rebotar en los bordes
            if (particlesArray[i].x <= 0 || particlesArray[i].x >= canvas.width) {
                particlesArray[i].directionX = -particlesArray[i].directionX;
            }
            if (particlesArray[i].y <= 0 || particlesArray[i].y >= canvas.height) {
                particlesArray[i].directionY = -particlesArray[i].directionY;
            }
            
            // Mover partículas
            particlesArray[i].x += particlesArray[i].directionX;
            particlesArray[i].y += particlesArray[i].directionY;
        }
    }
    
    // Animación loop
    function animateParticles() {
        updateParticles();
        drawParticles();
        requestAnimationFrame(animateParticles);
    }
    
    // Interacción con el mouse
    let mouse = { x: null, y: null, radius: MOUSE_RADIUS };
    
    const handleMouseMove = throttle((event) => {
        mouse.x = event.x;
        mouse.y = event.y;
        
        // Efecto de repulsión en partículas cercanas
        for (let i = 0; i < particlesArray.length; i++) {
            const dx = mouse.x - particlesArray[i].x;
            const dy = mouse.y - particlesArray[i].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < mouse.radius) {
                const force = (mouse.radius - distance) / mouse.radius;
                const angle = Math.atan2(dy, dx);
                
                particlesArray[i].x -= Math.cos(angle) * force * 3;
                particlesArray[i].y -= Math.sin(angle) * force * 3;
            }
        }
    }, CONFIG.PERFORMANCE.THROTTLE_DELAY);
    
    function handleMouseLeave() {
        mouse.x = undefined;
        mouse.y = undefined;
    }
    
    // Inicializar
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    animateParticles();
}

// Sistema de sonidos sútiles
function initSoundSystem() {
    // Verificar soporte de AudioContext
    if (!(window.AudioContext || window.webkitAudioContext)) {
        console.log('AudioContext no soportado');
        document.querySelector('.sound-toggle').style.display = 'none';
        return;
    }

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let isSoundEnabled = true;
    const soundToggle = document.querySelector('.sound-toggle');
    
    if (!soundToggle) return;
    
    // Crear oscilador para sonidos
    function createTone(frequency, duration, volume = CONFIG.SOUND.VOLUME) {
        if (!isSoundEnabled || audioContext.state !== 'running') return;
        
        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.value = volume;
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        } catch (error) {
            console.log('Error creando tono:', error);
        }
    }
    
    // Sonidos específicos
    const sounds = {
        hover: () => createTone(CONFIG.SOUND.FREQUENCIES.HOVER, 0.1, 0.08),
        click: () => createTone(CONFIG.SOUND.FREQUENCIES.CLICK, 0.15, 0.1),
        success: () => createTone(CONFIG.SOUND.FREQUENCIES.SUCCESS, 0.2, 0.12),
        transition: () => createTone(CONFIG.SOUND.FREQUENCIES.TRANSITION, 0.3, 0.05)
    };
    
    // Toggle de sonido
    function toggleSound() {
        isSoundEnabled = !isSoundEnabled;
        soundToggle.classList.toggle('muted', !isSoundEnabled);
        
        // Guardar preferencia en localStorage
        try {
            localStorage.setItem('soundEnabled', isSoundEnabled);
        } catch (error) {
            console.log('Error guardando preferencia de sonido:', error);
        }
        
        // Sonido de confirmación
        if (isSoundEnabled) {
            createTone(1200, 0.1, 0.15);
        }
    }
    
    // Cargar preferencia guardada
    try {
        const savedSoundPreference = localStorage.getItem('soundEnabled');
        if (savedSoundPreference !== null) {
            isSoundEnabled = JSON.parse(savedSoundPreference);
            soundToggle.classList.toggle('muted', !isSoundEnabled);
        }
    } catch (error) {
        console.log('Error cargando preferencia de sonido:', error);
    }
    
    // Aplicar sonidos a elementos interactivos
    function applySoundEffects() {
        const interactiveElements = document.querySelectorAll(
            '.link, .project-link, .cert-badge, .social-icon, .sound-toggle'
        );
        
        interactiveElements.forEach(element => {
            // Sonido al hover
            element.addEventListener('mouseenter', () => {
                if (element !== soundToggle && isSoundEnabled) {
                    sounds.hover();
                }
            });
            
            // Sonido al click
            element.addEventListener('click', (e) => {
                if (element !== soundToggle && isSoundEnabled) {
                    sounds.click();
                }
            });
        });
        
        // Sonido especial para el toggle de sonido
        soundToggle.addEventListener('click', (e) => {
            e.preventDefault();
            toggleSound();
        });
    }
    
    // Inicializar sistema de audio después de interacción del usuario
    function initAudioContext() {
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('AudioContext activado');
            }).catch(error => {
                console.log('Error activando AudioContext:', error);
            });
        }
    }
    
    // Eventos para activar el audio context
    document.addEventListener('click', initAudioContext, { once: true });
    document.addEventListener('touchstart', initAudioContext, { once: true });
    
    applySoundEffects();
}

// Cursor personalizado ultra suave y elegante
function initCustomCursor() {
    const cursor = document.querySelector('.custom-cursor');
    const follower = document.querySelector('.cursor-follower');
    
    if (!cursor || !follower) return;
    
    // Variables para suavizado
    let mouseX = 0, mouseY = 0;
    let followerX = 0, followerY = 0;
    
    // Solo activar en dispositivos de escritorio
    if (window.matchMedia("(min-width: 481px)").matches && 
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        
        const handleMouseMove = throttle((e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            // Cursor principal - sin delay
            cursor.style.left = mouseX + 'px';
            cursor.style.top = mouseY + 'px';
        }, CONFIG.PERFORMANCE.THROTTLE_DELAY);
        
        // Seguimiento suavizado del cursor
        document.addEventListener('mousemove', handleMouseMove);
        
        // Animación suavizada para el follower
        function animateFollower() {
            // Suavizado más agresivo para mayor elegancia
            followerX += (mouseX - followerX - (follower.offsetWidth / 2)) * 0.1;
            followerY += (mouseY - followerY - (follower.offsetHeight / 2)) * 0.1;
            
            follower.style.left = followerX + 'px';
            follower.style.top = followerY + 'px';
            
            requestAnimationFrame(animateFollower);
        }
        
        animateFollower();
        
        // Efectos al hacer hover en elementos interactivos
        const interactiveElements = document.querySelectorAll('a, button, .link, .project-link, .cert-badge, .social-icon');
        
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.style.transform = 'scale(1.4)';
                cursor.style.background = 'linear-gradient(45deg, #ffffff, #e3f2fd)';
                follower.style.transform = 'scale(1.6)';
                follower.style.borderColor = 'rgba(255, 255, 255, 0.6)';
            });
            
            el.addEventListener('mouseleave', () => {
                cursor.style.transform = 'scale(1)';
                cursor.style.background = 'linear-gradient(45deg, #ffffff, #e3f2fd)';
                follower.style.transform = 'scale(1)';
                follower.style.borderColor = 'rgba(255, 255, 255, 0.4)';
            });
        });
    } else {
        // Ocultar cursores personalizados en dispositivos no compatibles
        cursor.style.display = 'none';
        follower.style.display = 'none';
    }
}

// Efecto máquina de escribir para el subtítulo
function initTypewriterEffect() {
    const typewriterElement = document.getElementById('typewriter');
    if (!typewriterElement) return;
    
    const texts = [
        "Soporte IT & Administrador de Sistemas Junior",
        "Especialista en Ciberseguridad",
        "Desarrollador Python",
        "IT Support Specialist"
    ];
    
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;
    
    function typeWriter() {
        const currentText = texts[textIndex];
        
        if (isDeleting) {
            // Borrando texto
            typewriterElement.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 50;
        } else {
            // Escribiendo texto
            typewriterElement.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 100;
        }
        
        // Cambiar entre escribir y borrar
        if (!isDeleting && charIndex === currentText.length) {
            // Esperar al final del texto
            isDeleting = true;
            typingSpeed = 1500;
        } else if (isDeleting && charIndex === 0) {
            // Cambiar al siguiente texto
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
            typingSpeed = 500;
        }
        
        setTimeout(typeWriter, typingSpeed);
    }
    
    // Iniciar el efecto después de un pequeño delay
    setTimeout(typeWriter, 1000);
}

// Animaciones de entrada mejoradas
function initAnimations() {
    const container = document.querySelector('.container');
    if (!container) return;
    
    // Pequeño delay para asegurar que todo está cargado
    setTimeout(() => {
        container.classList.add('loaded');
    }, 200);
}

// Efectos de interacción mejorados
function initInteractionEffects() {
    // Efecto de ripple en los enlaces
    const links = document.querySelectorAll('.link, .project-link');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            // Crear efecto de ripple mejorado
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 70%);
                transform: scale(0);
                animation: ripple-animation 0.6s ease-out;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                pointer-events: none;
                z-index: 1;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Añadir estilos para la animación ripple mejorada
    if (!document.querySelector('#ripple-styles')) {
        const style = document.createElement('style');
        style.id = 'ripple-styles';
        style.textContent = `
            @keyframes ripple-animation {
                0% {
                    transform: scale(0);
                    opacity: 1;
                }
                100% {
                    transform: scale(3);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Efecto de tilt MUY sutil en la tarjeta principal (solo escritorio)
    if (window.matchMedia("(min-width: 1025px)").matches) {
        const container = document.querySelector('.container');
        if (!container) return;
        
        let isHovering = false;
        
        container.addEventListener('mouseenter', () => {
            isHovering = true;
        });
        
        container.addEventListener('mouseleave', () => {
            isHovering = false;
            // Reset suave al salir
            container.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
            container.style.transition = 'transform 0.4s ease';
            
            setTimeout(() => {
                container.style.transition = '';
            }, 400);
        });
        
        const handleTiltMove = throttle((e) => {
            if (!isHovering) return;
            
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Efecto MUY sutil - reducido a 1/4 de la intensidad original
            const rotateY = (x - centerX) / 80; // Muy reducido
            const rotateX = (centerY - y) / 80; // Muy reducido
            
            container.style.transform = `
                perspective(1000px)
                rotateX(${rotateX}deg)
                rotateY(${rotateY}deg)
                translateZ(2px) // Muy sutil
            `;
            container.style.transition = 'transform 0.1s linear'; // Transición muy rápida
        }, CONFIG.PERFORMANCE.THROTTLE_DELAY);
        
        container.addEventListener('mousemove', handleTiltMove);
    }
}

// Optimizaciones de rendimiento avanzadas
function initPerformanceOptimizations() {
    // Precarga de imágenes críticas con callback
    const criticalImages = [
        '/src/eduolihez_pfp.jpg'
    ];
    
    let loadedImages = 0;
    const totalImages = criticalImages.length;
    
    criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            loadedImages++;
            if (loadedImages === totalImages) {
                // Todas las imágenes críticas cargadas
                document.body.classList.add('images-loaded');
            }
        };
        img.onerror = () => {
            loadedImages++;
            console.log(`Error cargando imagen: ${src}`);
        };
    });
    
    // Observador de intersección para elementos fuera de vista
    const observerOptions = {
        root: null,
        rootMargin: '50px',
        threshold: CONFIG.PERFORMANCE.LAZY_LOAD_THRESHOLD
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                // Cargar imágenes lazy si existen
                const lazyImages = entry.target.querySelectorAll('img[loading="lazy"]');
                lazyImages.forEach(img => {
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                    }
                });
            }
        });
    }, observerOptions);
    
    // Observar elementos que pueden beneficiarse del lazy loading
    const elementsToObserve = document.querySelectorAll('.cert-badge, .project-link');
    elementsToObserve.forEach(el => observer.observe(el));
    
    // Optimización del fondo animado
    let isTabActive = true;
    
    function handleVisibilityChange() {
        isTabActive = !document.hidden;
        // Aquí podrías pausar/continuar animaciones si es necesario
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
}

// Analytics y métricas de rendimiento mejoradas
function initEnhancedAnalytics() {
    // Registrar métricas de rendimiento
    const perfData = performance.timing;
    const loadTime = perfData.loadEventEnd - perfData.navigationStart;
    
    console.log(`🚀 Tiempo de carga total: ${loadTime}ms`);
    
    // Track tiempo en página
    let timeStart = Date.now();
    let goals = {
        'cv_download': false,
        'email_click': false,
        'project_visit': false,
        'certification_view': false
    };
    
    function trackGoal(goalName) {
        if (!goals[goalName]) {
            goals[goalName] = true;
            console.log(`🎯 Goal completado: ${goalName}`);
            // Aquí integrar con Google Analytics
        }
    }
    
    window.addEventListener('beforeunload', () => {
        const timeSpent = Date.now() - timeStart;
        console.log(`⏱️ Tiempo en página: ${Math.round(timeSpent/1000)}s`);
    });
    
    // Trackear interacciones importantes
    const trackableElements = document.querySelectorAll('a[href^="http"], .link, .project-link, .cert-badge');
    
    trackableElements.forEach(element => {
        element.addEventListener('click', function(e) {
            const linkText = this.textContent.trim().substring(0, 30);
            const href = this.href;
            
            console.log(`🔗 Clic en: ${linkText} (${href})`);
            
            // Track goals específicos
            if (href.includes('/src/Edu_Olivares_CV.pdf')) {
                trackGoal('cv_download');
            } else if (href.includes('mailto:')) {
                trackGoal('email_click');
            } else if (href.includes('/followguard/')) {
                trackGoal('project_visit');
            } else if (href.includes('credly.com') || href.includes('First_Certificate')) {
                trackGoal('certification_view');
            }
        });
    });
}

// Event listeners optimizados con delegación
function initOptimizedEventListeners() {
    const interactiveSelectors = '.link, .project-link, .cert-badge, .social-icon, .sound-toggle';
    
    // Delegación de eventos para mejor performance
    document.addEventListener('mouseenter', function(e) {
        if (e.target.matches(interactiveSelectors)) {
            // Podrías añadir efectos hover globales aquí
        }
    }, true);
    
    document.addEventListener('click', function(e) {
        if (e.target.matches(interactiveSelectors)) {
            // Efectos click globales
        }
    }, true);
}

// Animaciones de scroll mejoradas
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { 
        threshold: CONFIG.PERFORMANCE.LAZY_LOAD_THRESHOLD,
        rootMargin: '50px' 
    });
    
    // Observar elementos que se animan al entrar en vista
    document.querySelectorAll('.link, .cert-badge, .project-link').forEach(el => {
        observer.observe(el);
    });
}

// Utilidad throttle para optimizar eventos
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Manejo de errores global
window.addEventListener('error', function(e) {
    console.error('Error global capturado:', e.error);
});

// Exportar configuración para debugging (solo en desarrollo)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.CONFIG = CONFIG;
}