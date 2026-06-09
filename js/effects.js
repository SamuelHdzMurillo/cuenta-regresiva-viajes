/**
 * Efectos visuales: partículas, confeti, fuegos artificiales
 */
const Effects = (() => {
    let particlesCtx, particlesCanvas;
    let effectsCtx, effectsCanvas;
    let celebrationCtx, celebrationCanvas;
    let particles = [];
    let confetti = [];
    let fireworks = [];
    let celebrationActive = false;
    let animFrame;

    const COLORS = ['#00d4aa', '#a855f7', '#ff6b35', '#ff6b9d', '#ffd700', '#0077b6', '#ffffff'];

    function init() {
        particlesCanvas = document.getElementById('particlesCanvas');
        effectsCanvas = document.getElementById('effectsCanvas');
        celebrationCanvas = document.getElementById('celebrationCanvas');

        if (particlesCanvas) {
            particlesCtx = particlesCanvas.getContext('2d');
            resizeCanvas(particlesCanvas);
        }
        if (effectsCanvas) {
            effectsCtx = effectsCanvas.getContext('2d');
            resizeCanvas(effectsCanvas);
        }

        window.addEventListener('resize', () => {
            resizeCanvas(particlesCanvas);
            resizeCanvas(effectsCanvas);
            if (celebrationCanvas) resizeCanvas(celebrationCanvas);
        });

        initParticles(40);
        animate();
    }

    function resizeCanvas(canvas) {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function getIntensity() {
        const style = getComputedStyle(document.documentElement);
        return parseFloat(style.getPropertyValue('--particle-intensity')) || 1;
    }

    function initParticles(count) {
        particles = [];
        for (let i = 0; i < count; i++) {
            particles.push(createParticle());
        }
    }

    function createParticle() {
        return {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: Math.random() * -0.5 - 0.2,
            opacity: Math.random() * 0.5 + 0.2,
            color: COLORS[Math.floor(Math.random() * COLORS.length)]
        };
    }

    function drawParticles() {
        if (!particlesCtx || !particlesCanvas) return;
        const w = particlesCanvas.width;
        const h = particlesCanvas.height;
        const intensity = getIntensity();
        const count = Math.floor(particles.length * intensity);

        particlesCtx.clearRect(0, 0, w, h);

        for (let i = 0; i < count; i++) {
            const p = particles[i];
            particlesCtx.beginPath();
            particlesCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            particlesCtx.fillStyle = p.color;
            particlesCtx.globalAlpha = p.opacity;
            particlesCtx.fill();

            p.x += p.speedX;
            p.y += p.speedY;

            if (p.y < -10 || p.x < -10 || p.x > w + 10) {
                Object.assign(p, createParticle(), { y: h + 10 });
            }
        }
        particlesCtx.globalAlpha = 1;
    }

    function spawnConfetti(count = 30, x, y) {
        for (let i = 0; i < count; i++) {
            confetti.push({
                x: x ?? Math.random() * window.innerWidth,
                y: y ?? -10,
                w: Math.random() * 10 + 5,
                h: Math.random() * 6 + 3,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 10,
                speedX: (Math.random() - 0.5) * 6,
                speedY: Math.random() * 4 + 2,
                opacity: 1
            });
        }
    }

    function spawnFirework(x, y, intensity = 1) {
        const particleCount = Math.floor(40 * intensity);
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = Math.random() * 4 + 2;
            fireworks.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color,
                life: 1,
                size: Math.random() * 3 + 1
            });
        }
    }

    function drawEffects() {
        if (!effectsCtx || !effectsCanvas) return;
        const w = effectsCanvas.width;
        const h = effectsCanvas.height;

        effectsCtx.clearRect(0, 0, w, h);

        // Confeti
        confetti = confetti.filter(c => {
            effectsCtx.save();
            effectsCtx.translate(c.x, c.y);
            effectsCtx.rotate(c.rotation * Math.PI / 180);
            effectsCtx.fillStyle = c.color;
            effectsCtx.globalAlpha = c.opacity;
            effectsCtx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
            effectsCtx.restore();

            c.x += c.speedX;
            c.y += c.speedY;
            c.rotation += c.rotSpeed;
            c.speedY += 0.05;
            c.opacity -= 0.003;

            return c.opacity > 0 && c.y < h + 50;
        });

        // Fuegos artificiales
        fireworks = fireworks.filter(f => {
            effectsCtx.beginPath();
            effectsCtx.arc(f.x, f.y, f.size * f.life, 0, Math.PI * 2);
            effectsCtx.fillStyle = f.color;
            effectsCtx.globalAlpha = f.life;
            effectsCtx.fill();

            f.x += f.vx;
            f.y += f.vy;
            f.vy += 0.05;
            f.life -= 0.015;

            return f.life > 0;
        });

        effectsCtx.globalAlpha = 1;
    }

    function burstAtElement(element) {
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        spawnConfetti(15, x, y);
        for (let i = 0; i < 3; i++) {
            setTimeout(() => spawnFirework(x + (Math.random() - 0.5) * 40, y, 0.5), i * 100);
        }
    }

    function triggerMilestoneEffect(days) {
        if (days <= 0) return;
        if (days <= 30 && days > 15) {
            if (Math.random() < 0.02) spawnConfetti(20);
        } else if (days <= 15 && days > 7) {
            if (Math.random() < 0.03) {
                spawnFirework(
                    Math.random() * window.innerWidth,
                    Math.random() * window.innerHeight * 0.5,
                    0.6
                );
            }
        } else if (days <= 7 && days > 3) {
            if (Math.random() < 0.05) spawnConfetti(25);
            if (Math.random() < 0.02) spawnFirework(Math.random() * window.innerWidth, 200, 0.8);
        } else if (days <= 3 && days > 1) {
            spawnConfetti(10);
            spawnFirework(window.innerWidth / 2, 150, 1);
        } else if (days === 1) {
            spawnConfetti(40);
            for (let i = 0; i < 5; i++) {
                setTimeout(() => spawnFirework(
                    Math.random() * window.innerWidth,
                    Math.random() * 300 + 50,
                    1.2
                ), i * 400);
            }
        }
    }

    function startCelebration() {
        celebrationActive = true;
        const overlay = document.getElementById('celebrationOverlay');
        if (overlay) overlay.classList.add('active');

        if (celebrationCanvas) {
            celebrationCtx = celebrationCanvas.getContext('2d');
            resizeCanvas(celebrationCanvas);
        }

        // Confeti infinito
        setInterval(() => {
            if (celebrationActive) spawnConfetti(15);
        }, 300);

        // Fuegos masivos
        setInterval(() => {
            if (celebrationActive) {
                spawnFirework(
                    Math.random() * window.innerWidth,
                    Math.random() * window.innerHeight * 0.6,
                    1.5
                );
            }
        }, 500);

        animateCelebration();
    }

    let celebrationParticles = [];

    function animateCelebration() {
        if (!celebrationActive || !celebrationCtx) return;
        const w = celebrationCanvas.width;
        const h = celebrationCanvas.height;

        celebrationCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        celebrationCtx.fillRect(0, 0, w, h);

        if (Math.random() < 0.1) {
            celebrationParticles.push({
                x: Math.random() * w,
                y: h,
                size: Math.random() * 4 + 2,
                speed: Math.random() * 3 + 1,
                color: COLORS[Math.floor(Math.random() * COLORS.length)]
            });
        }

        celebrationParticles = celebrationParticles.filter(p => {
            celebrationCtx.beginPath();
            celebrationCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            celebrationCtx.fillStyle = p.color;
            celebrationCtx.fill();
            p.y -= p.speed;
            return p.y > -10;
        });

        requestAnimationFrame(animateCelebration);
    }

    function animate() {
        drawParticles();
        drawEffects();
        animFrame = requestAnimationFrame(animate);
    }

    function colorExplosion() {
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                spawnFirework(
                    Math.random() * window.innerWidth,
                    Math.random() * 400 + 100,
                    1.3
                );
                spawnConfetti(30);
            }, i * 200);
        }
    }

    return {
        init,
        burstAtElement,
        triggerMilestoneEffect,
        spawnConfetti,
        spawnFirework,
        startCelebration,
        colorExplosion
    };
})();
