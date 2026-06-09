/**
 * Fondo animado: océano, parallax, día/noche, gaviotas
 */
const Background = (() => {
    let oceanCtx, oceanCanvas;
    let waveOffset = 0;
    let parallaxX = 0, parallaxY = 0;
    let dayNightEnabled = true;
    let animFrame;

    const WAVE_COLORS = [
        'rgba(0, 119, 182, 0.6)',
        'rgba(0, 180, 216, 0.5)',
        'rgba(0, 212, 170, 0.4)',
        'rgba(255, 255, 255, 0.15)'
    ];

    function init() {
        oceanCanvas = document.getElementById('oceanCanvas');
        if (!oceanCanvas) return;
        oceanCtx = oceanCanvas.getContext('2d');
        resizeOcean();
        window.addEventListener('resize', resizeOcean);
        initParallax();
        initSeagulls();
        animateOcean();
        startDayNightCycle();
    }

    function resizeOcean() {
        if (!oceanCanvas) return;
        oceanCanvas.width = window.innerWidth;
        oceanCanvas.height = window.innerHeight * 0.35;
    }

    function drawOcean() {
        const w = oceanCanvas.width;
        const h = oceanCanvas.height;
        const ctx = oceanCtx;

        ctx.clearRect(0, 0, w, h);

        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, 'rgba(0, 100, 150, 0.3)');
        grad.addColorStop(0.5, 'rgba(0, 119, 182, 0.8)');
        grad.addColorStop(1, 'rgba(0, 60, 100, 1)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        for (let layer = 0; layer < 4; layer++) {
            ctx.beginPath();
            const amplitude = 8 + layer * 6;
            const frequency = 0.008 - layer * 0.001;
            const speed = waveOffset * (1 + layer * 0.3);
            const yBase = h * 0.3 + layer * (h * 0.15);

            ctx.moveTo(0, h);
            for (let x = 0; x <= w; x += 3) {
                const y = yBase + Math.sin(x * frequency + speed) * amplitude
                    + Math.sin(x * frequency * 2.3 + speed * 1.5) * (amplitude * 0.4);
                ctx.lineTo(x, y);
            }
            ctx.lineTo(w, h);
            ctx.closePath();
            ctx.fillStyle = WAVE_COLORS[layer];
            ctx.fill();
        }

        const shimmerX = w * 0.5 + parallaxX * 20;
        const shimmerGrad = ctx.createLinearGradient(shimmerX - 30, 0, shimmerX + 30, h);
        shimmerGrad.addColorStop(0, 'rgba(255, 215, 0, 0)');
        shimmerGrad.addColorStop(0.3, 'rgba(255, 215, 0, 0.08)');
        shimmerGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.12)');
        shimmerGrad.addColorStop(0.7, 'rgba(255, 215, 0, 0.08)');
        shimmerGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = shimmerGrad;
        ctx.fillRect(shimmerX - 40, 0, 80, h);

        waveOffset += 0.03;
    }

    function animateOcean() {
        drawOcean();
        animFrame = requestAnimationFrame(animateOcean);
    }

    function initParallax() {
        const layers = document.querySelectorAll('.layer[data-depth]');

        document.addEventListener('mousemove', (e) => {
            parallaxX = (e.clientX / window.innerWidth - 0.5) * 2;
            parallaxY = (e.clientY / window.innerHeight - 0.5) * 2;
            applyParallax(layers);
        });

        document.addEventListener('touchmove', (e) => {
            if (e.touches.length) {
                parallaxX = (e.touches[0].clientX / window.innerWidth - 0.5) * 2;
                parallaxY = (e.touches[0].clientY / window.innerHeight - 0.5) * 2;
                applyParallax(layers);
            }
        }, { passive: true });

        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                if (e.gamma != null) {
                    parallaxX = Math.max(-1, Math.min(1, e.gamma / 45));
                    parallaxY = Math.max(-1, Math.min(1, (e.beta - 45) / 45));
                    applyParallax(layers);
                }
            });
        }
    }

    function applyParallax(layers) {
        layers.forEach(layer => {
            const depth = parseFloat(layer.dataset.depth) || 0.05;
            const x = parallaxX * depth * 80;
            const y = parallaxY * depth * 40;
            layer.style.transform = `translate(${x}px, ${y}px)`;
        });
    }

    function initSeagulls() {
        const container = document.getElementById('seagullsLayer');
        if (!container) return;

        for (let i = 0; i < 5; i++) {
            const gull = document.createElement('div');
            gull.className = 'seagull';
            gull.textContent = '🕊️';
            gull.style.top = `${10 + Math.random() * 25}%`;
            gull.style.animationDuration = `${25 + Math.random() * 20}s`;
            gull.style.animationDelay = `${Math.random() * 30}s`;
            gull.style.fontSize = `${0.8 + Math.random() * 0.8}rem`;
            container.appendChild(gull);
        }
    }

    function startDayNightCycle() {
        const cycleDuration = 120000;

        function updateCycle() {
            if (!dayNightEnabled) return;
            const elapsed = Date.now() % cycleDuration;
            const progress = elapsed / cycleDuration;
            const isNight = progress > 0.55 && progress < 0.95;

            document.body.classList.toggle('night-mode', isNight);

            const skyLayer = document.querySelector('.layer-sky');
            if (skyLayer && !isNight) {
                const dayProgress = progress < 0.55 ? progress / 0.55 : (1 - progress) / 0.05;
                skyLayer.style.filter = `brightness(${0.85 + dayProgress * 0.15})`;
            }
        }

        updateCycle();
        setInterval(updateCycle, 1000);
    }

    function setDayNight(enabled) {
        dayNightEnabled = enabled;
        if (!enabled) document.body.classList.remove('night-mode');
    }

    function destroy() {
        if (animFrame) cancelAnimationFrame(animFrame);
    }

    return { init, setDayNight, destroy };
})();
