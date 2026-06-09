/**
 * App principal — datos del viaje fijos (sin edición)
 */
const App = (() => {
    const TRIP = {
        destination: 'Viaje a Cabo · Familia Pérez',
        destinationShort: 'Cabo',
        family: 'Familia Pérez',
        theme: 'sunset',
        dayNight: true
    };

    let partyMode = false;
    let relaxMode = false;

    function applyTrip() {
        document.documentElement.setAttribute('data-theme', TRIP.theme);
        document.body.classList.toggle('party-mode', partyMode);
        document.body.classList.toggle('relax-mode', relaxMode);

        const destLabel = document.getElementById('destinationLabel');
        const celebrationDest = document.getElementById('celebrationDest');
        const heroAccent = document.getElementById('heroAccent');

        if (destLabel) destLabel.textContent = TRIP.destination;
        if (celebrationDest) celebrationDest.textContent = `¡Disfruten Cabo, ${TRIP.family}!`;
        if (heroAccent) heroAccent.textContent = TRIP.destinationShort;

        Countdown.setTargetDate(Countdown.getDefaultTargetDate());

        const dateDisplay = document.getElementById('dateDisplay');
        if (dateDisplay) {
            dateDisplay.textContent = Countdown.formatDateDisplay(Countdown.getDefaultTargetDate());
        }

        Background.setDayNight(TRIP.dayNight);

        if (typeof AudioPlayer !== 'undefined') {
            AudioPlayer.setVolume(40);
            const slider = document.getElementById('volumeSlider');
            if (slider) slider.value = 40;
        }

        document.getElementById('btnParty')?.classList.toggle('active', partyMode);
        document.getElementById('btnRelax')?.classList.toggle('active', relaxMode);
    }

    function showToast(msg) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    function closeAudioPlayer() {
        document.getElementById('audioPlayer')?.classList.remove('open');
    }

    async function shareCountdown() {
        const days = Countdown.getDaysRemaining();
        const text = days > 0
            ? `¡Solo faltan ${days} días para el viaje a Cabo con la Familia Pérez! 🏝️✈️`
            : `¡El viaje a Cabo con la Familia Pérez ha comenzado! 🎉🏖️`;

        if (navigator.share) {
            try {
                await navigator.share({ title: 'Cuenta Regresiva · Familia Pérez', text, url: window.location.href });
                showToast('¡Compartido con éxito!');
            } catch (e) {
                if (e.name !== 'AbortError') copyToClipboard(text);
            }
        } else {
            copyToClipboard(text);
        }
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text + ' ' + window.location.href).then(() => {
            showToast('Texto copiado al portapapeles');
        }).catch(() => showToast('No se pudo copiar'));
    }

    async function captureScreen() {
        showToast('Generando captura...');

        try {
            if (typeof html2canvas === 'undefined') {
                showToast('Biblioteca de captura no disponible');
                return;
            }

            const canvas = await html2canvas(document.body, {
                useCORS: true,
                allowTaint: true,
                scale: 2,
                logging: false,
                backgroundColor: null
            });

            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'viaje-cabo-familia-perez.png';
                a.click();
                URL.revokeObjectURL(url);
                showToast('Captura descargada');
            }, 'image/png');
        } catch (err) {
            showToast('Error al generar captura');
            console.error(err);
        }
    }

    function bindEvents() {
        document.getElementById('btnMusic')?.addEventListener('click', () => {
            document.getElementById('audioPlayer')?.classList.toggle('open');
        });

        document.getElementById('closePlayer')?.addEventListener('click', closeAudioPlayer);

        document.getElementById('btnParty')?.addEventListener('click', () => {
            partyMode = !partyMode;
            if (partyMode) relaxMode = false;
            applyTrip();
            showToast(partyMode ? '🎉 Modo fiesta activado' : 'Modo fiesta desactivado');
        });

        document.getElementById('btnRelax')?.addEventListener('click', () => {
            relaxMode = !relaxMode;
            if (relaxMode) partyMode = false;
            applyTrip();
            showToast(relaxMode ? '🌊 Modo relajante activado' : 'Modo relajante desactivado');
        });

        document.getElementById('btnShare')?.addEventListener('click', shareCountdown);
        document.getElementById('btnCapture')?.addEventListener('click', captureScreen);
        document.getElementById('celebrationShare')?.addEventListener('click', shareCountdown);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeAudioPlayer();
        });
    }

    function init() {
        localStorage.removeItem('vacationCountdownSettings');
        applyTrip();

        Background.init();
        Effects.init();
        AudioPlayer.init();
        bindEvents();

        Countdown.onComplete = () => {
            if (typeof AudioPlayer !== 'undefined') AudioPlayer.playFestive();
        };

        Countdown.onTick = ({ days }) => {
            if (days <= 7 && days > 0 && partyMode) {
                if (Math.random() < 0.01) Effects.spawnConfetti(5);
            }
        };

        Countdown.start();
    }

    return { init, shareCountdown, captureScreen, showToast };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
