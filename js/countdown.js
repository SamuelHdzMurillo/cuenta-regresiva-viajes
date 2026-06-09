/**
 * Cuenta regresiva con flip animation y hitos especiales
 */
const Countdown = (() => {
    let targetDate = null;
    let intervalId = null;
    let lastDays = null;
    let onComplete = null;
    let onTick = null;

    const UNITS = ['days', 'hours', 'minutes', 'seconds'];
    const MILESTONES = [
        { days: 30, msg: '🌴 ¡Solo 30 días! El paraíso te espera', class: 'milestone-30' },
        { days: 15, msg: '🎆 ¡15 días! La emoción crece', class: 'milestone-15' },
        { days: 7, msg: '✨ ¡Una semana! Prepárate para la aventura', class: 'milestone-7' },
        { days: 3, msg: '🔥 ¡3 días! Las vacaciones están aquí', class: 'milestone-3' },
        { days: 1, msg: '🎉 ¡MAÑANA! El gran día está a la vuelta de la esquina', class: 'milestone-1' }
    ];

    function pad(n) {
        return n < 10 ? '0' + n : String(n);
    }

    function setTargetDate(date) {
        targetDate = typeof date === 'number' ? date : new Date(date).getTime();
    }

    function getDefaultTargetDate() {
        const currentYear = new Date().getFullYear();
        let target = new Date(`${currentYear}-07-17T00:00:00`).getTime();
        if (target < Date.now()) {
            target = new Date(`${currentYear + 1}-07-17T00:00:00`).getTime();
        }
        return target;
    }

    function updateFlipElement(id, newValue) {
        const el = document.getElementById(id);
        if (!el) return;

        const oldValue = el.dataset.value || el.textContent;
        if (oldValue === newValue) return;

        const block = el.closest('.time-block');
        if (block) {
            block.classList.add('flip-active', 'pulse');
            setTimeout(() => block.classList.remove('flip-active', 'pulse'), 600);
        }

        el.textContent = newValue;
        el.dataset.value = newValue;

        if (typeof Effects !== 'undefined') {
            Effects.burstAtElement(block);
        }
    }

    function applyMilestoneClass(days) {
        MILESTONES.forEach(m => document.body.classList.remove(m.class));

        const active = MILESTONES.find(m => days <= m.days && days > 0);
        if (active) {
            document.body.classList.add(active.class);
            const msgEl = document.getElementById('milestoneMsg');
            if (msgEl) msgEl.textContent = active.msg;
        } else {
            const msgEl = document.getElementById('milestoneMsg');
            if (msgEl) msgEl.textContent = days > 30 ? '🌊 Cada segundo te acerca al paraíso' : '';
        }
    }

    function tick() {
        if (!targetDate) return;

        const now = Date.now();
        const distance = targetDate - now;

        if (distance <= 0) {
            stop();
            showComplete();
            if (onComplete) onComplete();
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        updateFlipElement('days', pad(days));
        updateFlipElement('hours', pad(hours));
        updateFlipElement('minutes', pad(minutes));
        updateFlipElement('seconds', pad(seconds));

        applyMilestoneClass(days);

        if (lastDays !== days) {
            lastDays = days;
            if (typeof Effects !== 'undefined') {
                Effects.triggerMilestoneEffect(days);
            }
            if (days <= 3 && typeof Effects !== 'undefined') {
                Effects.colorExplosion();
            }
        }

        if (onTick) onTick({ days, hours, minutes, seconds, distance });
    }

    function showComplete() {
        const section = document.getElementById('countdownSection');
        if (section) section.style.opacity = '0.3';

        if (typeof Effects !== 'undefined') {
            Effects.startCelebration();
        }

        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 500, 100, 500]);
        }
    }

    function start() {
        stop();
        if (!targetDate) targetDate = getDefaultTargetDate();
        tick();
        intervalId = setInterval(tick, 1000);
    }

    function stop() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    function formatDateDisplay(dateStr) {
        const d = new Date(dateStr || targetDate);
        const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
            'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        return `${d.getDate()} de ${months[d.getMonth()]}`;
    }

    function getDaysRemaining() {
        if (!targetDate) return Infinity;
        return Math.floor((targetDate - Date.now()) / (1000 * 60 * 60 * 24));
    }

    return {
        setTargetDate,
        getDefaultTargetDate,
        start,
        stop,
        formatDateDisplay,
        getDaysRemaining,
        set onComplete(fn) { onComplete = fn; },
        set onTick(fn) { onTick = fn; }
    };
})();
