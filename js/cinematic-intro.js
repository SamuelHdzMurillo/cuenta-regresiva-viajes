/**
 * Secuencia de entrada — explosión cinematográfica
 */
const CinematicIntro = (() => {
    const TIMING = {
        phase1End: 2000,
        phase2End: 4500,
        phase3End: 5800,
        total: 7000
    };

    let canvas, ctx, introEl;
    let particles = [];
    let explosionParticles = [];
    let shockwaves = [];
    let fragments = [];
    let startTime = 0;
    let animFrame = null;
    let completed = false;
    let skipped = false;
    let explosionTriggered = false;
    let onComplete = null;

    const COLORS = ['#00d4aa', '#a855f7', '#ff6b35', '#ffd700', '#00b4ff', '#ffffff'];

    function init() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            finish();
            return;
        }

        introEl = document.getElementById('cinematicIntro');
        canvas = document.getElementById('introCanvas');
        if (!canvas || !introEl) { finish(); return; }

        ctx = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);

        introEl.addEventListener('click', skip);
        introEl.addEventListener('touchstart', skip, { passive: true });

        initParticles(80);
        startTime = performance.now();

        try {
            if (typeof AudioPlayer !== 'undefined') AudioPlayer.playIntroSequence();
        } catch (e) {
            console.warn('Intro audio:', e);
        }

        requestAnimationFrame(() => {
            resize();
            animate();
        });
        setTimeout(() => { if (!completed && !skipped) finish(); }, TIMING.total + 500);
    }

    function resize() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function initParticles(count) {
        particles = [];
        const w = canvas.width || window.innerWidth;
        const h = canvas.height || window.innerHeight;
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.5 + 0.2,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                absorbed: false,
                absorbSpeed: 0
            });
        }
    }

    function elapsed() {
        return performance.now() - startTime;
    }

    function triggerExplosion() {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        introEl.classList.add('shake-intense');
        document.getElementById('introFlash')?.classList.add('active');

        if (typeof AudioPlayer !== 'undefined') AudioPlayer.playExplosion();

        shockwaves.push({
            x: cx, y: cy, radius: 0,
            maxRadius: Math.max(canvas.width, canvas.height) * 1.1,
            opacity: 1, width: 6
        });

        for (let i = 0; i < 200; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 16 + 4;
            explosionParticles.push({
                x: cx, y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 5 + 1,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                life: 1,
                decay: Math.random() * 0.018 + 0.01
            });
        }

        for (let i = 0; i < 25; i++) {
            fragments.push({
                x: cx, y: cy,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
                size: Math.random() * 10 + 3,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.25,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                life: 1
            });
        }

        setTimeout(() => introEl.classList.remove('shake-intense'), 600);
        setTimeout(() => document.getElementById('introFlash')?.classList.remove('active'), 350);
    }

    function drawParticles(list, cx, cy, radius, progress) {
        list.forEach(p => {
            if (!p.absorbed && progress > 0.1) {
                const dx = cx - p.x;
                const dy = cy - p.y;
                if (Math.sqrt(dx * dx + dy * dy) < radius + 40) {
                    p.absorbed = true;
                    p.absorbSpeed = 0.06 + Math.random() * 0.04;
                }
            }
            if (p.absorbed) {
                p.x += (cx - p.x) * p.absorbSpeed;
                p.y += (cy - p.y) * p.absorbSpeed;
                p.opacity *= 0.9;
                if (p.opacity < 0.05) return;
            } else {
                p.x += p.vx;
                p.y += p.vy;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.opacity;
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    function drawExplosionEffects(fade = 1) {
        shockwaves = shockwaves.filter(sw => {
            sw.radius += (sw.maxRadius - sw.radius) * 0.1;
            sw.opacity *= 0.93;
            if (sw.opacity < 0.02) return false;

            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${sw.opacity * fade})`;
            ctx.lineWidth = sw.width * sw.opacity;
            ctx.stroke();
            return true;
        });

        explosionParticles = explosionParticles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.97;
            p.vy *= 0.97;
            p.life -= p.decay;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life * fade;
            ctx.fill();
            return p.life > 0;
        });

        fragments = fragments.filter(f => {
            f.x += f.vx;
            f.y += f.vy;
            f.vy += 0.12;
            f.rotation += f.rotSpeed;
            f.life -= 0.015;

            ctx.save();
            ctx.translate(f.x, f.y);
            ctx.rotate(f.rotation);
            ctx.fillStyle = f.color;
            ctx.globalAlpha = f.life * fade;
            ctx.fillRect(-f.size / 2, -f.size / 4, f.size, f.size / 2);
            ctx.restore();
            return f.life > 0;
        });
        ctx.globalAlpha = 1;
    }

    function animate() {
        if (skipped || completed) return;

        const t = elapsed();
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (t < TIMING.phase1End) {
            const progress = t / TIMING.phase1End;
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.opacity * Math.min(1, progress * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;

        } else if (t < TIMING.phase2End) {
            const progress = (t - TIMING.phase1End) / (TIMING.phase2End - TIMING.phase1End);
            const radius = 15 + progress * 100;

            ctx.fillStyle = 'rgba(0,0,0,0.9)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            drawParticles(particles, cx, cy, radius, progress);

            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.8);
            grad.addColorStop(0, `rgba(255,255,255,${0.4 + progress * 0.5})`);
            grad.addColorStop(0.3, `rgba(0,212,170,${0.3 + progress * 0.4})`);
            grad.addColorStop(0.7, `rgba(168,85,247,${0.2 + progress * 0.2})`);
            grad.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.arc(cx, cy, radius * 1.8, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = 0.6 + progress * 0.4;
            ctx.fill();
            ctx.globalAlpha = 1;

        } else if (t < TIMING.phase3End) {
            if (!explosionTriggered) {
                explosionTriggered = true;
                triggerExplosion();
            }

            const progress = (t - TIMING.phase2End) / (TIMING.phase3End - TIMING.phase2End);
            ctx.fillStyle = `rgba(0,0,0,${Math.max(0, 0.5 - progress * 0.45)})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            drawExplosionEffects(1);

        } else if (t < TIMING.total) {
            const progress = (t - TIMING.phase3End) / (TIMING.total - TIMING.phase3End);
            const fade = 1 - progress;

            ctx.fillStyle = `rgba(0,0,0,${fade * 0.6})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            drawExplosionEffects(fade);

        } else {
            finish();
            return;
        }

        animFrame = requestAnimationFrame(animate);
    }

    function skip() {
        if (skipped || completed) return;
        skipped = true;
        if (animFrame) cancelAnimationFrame(animFrame);
        finish();
    }

    function finish() {
        if (completed) return;
        completed = true;
        if (animFrame) cancelAnimationFrame(animFrame);

        document.body.classList.remove('intro-active');
        introEl?.classList.add('fade-out');
        introEl?.classList.remove('shake-intense');

        const main = document.getElementById('mainContent');
        const scene = document.getElementById('scene');
        if (main) {
            main.classList.add('revealed');
            main.style.opacity = '1';
            main.style.visibility = 'visible';
        }
        if (scene) {
            scene.classList.add('revealed');
            scene.style.opacity = '1';
            scene.style.visibility = 'visible';
        }

        setTimeout(() => {
            if (introEl) {
                introEl.style.display = 'none';
                introEl.setAttribute('aria-hidden', 'true');
            }
            if (onComplete) onComplete();
        }, 800);
    }

    return {
        init,
        skip,
        set onComplete(fn) { onComplete = fn; }
    };
})();
