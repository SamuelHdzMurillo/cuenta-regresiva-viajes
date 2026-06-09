/**
 * App principal: configuración, compartir, captura, orquestación
 */
const App = (() => {
    const STORAGE_KEY = 'vacationCountdownSettings';

    const DEFAULTS = {
        destination: 'Maldivas · Resort de Lujo',
        targetDate: null,
        bgImage: '',
        theme: 'tropical',
        partyMode: false,
        relaxMode: false,
        dayNight: true,
        musicTrack: 0,
        volume: 40
    };

    let settings = { ...DEFAULTS };

    function loadSettings() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) settings = { ...DEFAULTS, ...JSON.parse(saved) };
        } catch (_) {
            settings = { ...DEFAULTS };
        }
    }

    function saveSettings() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }

    function applySettings() {
        document.documentElement.setAttribute('data-theme', settings.theme);
        document.body.classList.toggle('party-mode', settings.partyMode);
        document.body.classList.toggle('relax-mode', settings.relaxMode);

        const destLabel = document.getElementById('destinationLabel');
        const celebrationDest = document.getElementById('celebrationDest');
        const heroAccent = document.getElementById('heroAccent');
        if (destLabel) destLabel.textContent = settings.destination;
        if (celebrationDest) celebrationDest.textContent = `Disfruta cada segundo en ${settings.destination.split('·')[0].trim()}`;
        if (heroAccent) heroAccent.textContent = settings.destination.split('·')[0].trim().toLowerCase();

        const customBg = document.getElementById('customBg');
        if (customBg) {
            if (settings.bgImage) {
                customBg.style.backgroundImage = `url(${settings.bgImage})`;
                customBg.classList.add('active');
            } else {
                customBg.classList.remove('active');
                customBg.style.backgroundImage = '';
            }
        }

        if (settings.targetDate) {
            Countdown.setTargetDate(settings.targetDate);
        } else {
            Countdown.setTargetDate(Countdown.getDefaultTargetDate());
        }

        const dateDisplay = document.getElementById('dateDisplay');
        if (dateDisplay) {
            const d = settings.targetDate
                ? new Date(settings.targetDate)
                : new Date(Countdown.getDefaultTargetDate());
            dateDisplay.textContent = Countdown.formatDateDisplay(d);
        }

        Background.setDayNight(settings.dayNight);

        if (typeof AudioPlayer !== 'undefined') {
            AudioPlayer.setCurrentTrack(settings.musicTrack);
            AudioPlayer.setVolume(settings.volume);
            const slider = document.getElementById('volumeSlider');
            if (slider) slider.value = settings.volume;
        }

        syncPanelInputs();
    }

    function syncPanelInputs() {
        const dest = document.getElementById('inputDestination');
        const date = document.getElementById('inputDate');
        const bg = document.getElementById('inputBgImage');
        const party = document.getElementById('toggleParty');
        const relax = document.getElementById('toggleRelax');
        const dayNight = document.getElementById('toggleDayNight');

        if (dest) dest.value = settings.destination;
        if (date) {
            const d = settings.targetDate
                ? new Date(settings.targetDate)
                : new Date(Countdown.getDefaultTargetDate());
            date.value = d.toISOString().split('T')[0];
        }
        if (bg) bg.value = settings.bgImage;
        if (party) party.checked = settings.partyMode;
        if (relax) relax.checked = settings.relaxMode;
        if (dayNight) dayNight.checked = settings.dayNight;

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === settings.theme);
        });

        document.getElementById('btnParty')?.classList.toggle('active', settings.partyMode);
        document.getElementById('btnRelax')?.classList.toggle('active', settings.relaxMode);
    }

    function readPanelInputs() {
        settings.destination = document.getElementById('inputDestination')?.value || DEFAULTS.destination;
        const dateVal = document.getElementById('inputDate')?.value;
        if (dateVal) settings.targetDate = new Date(dateVal + 'T00:00:00').getTime();
        settings.bgImage = document.getElementById('inputBgImage')?.value || '';
        settings.partyMode = document.getElementById('toggleParty')?.checked || false;
        settings.relaxMode = document.getElementById('toggleRelax')?.checked || false;
        settings.dayNight = document.getElementById('toggleDayNight')?.checked ?? true;

        const activeTheme = document.querySelector('.theme-btn.active');
        if (activeTheme) settings.theme = activeTheme.dataset.theme;
    }

    function showToast(msg) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    function openPanel(panelId) {
        document.getElementById(panelId)?.classList.add('open');
        document.getElementById('panelBackdrop')?.classList.add('open');
    }

    function closePanels() {
        document.querySelectorAll('.settings-panel, .audio-player').forEach(p => p.classList.remove('open'));
        document.getElementById('panelBackdrop')?.classList.remove('open');
    }

    async function shareCountdown() {
        const days = Countdown.getDaysRemaining();
        const text = days > 0
            ? `¡Solo faltan ${days} días para mis vacaciones en ${settings.destination}! 🏝️✈️`
            : `¡Mis vacaciones en ${settings.destination} han comenzado! 🎉🏖️`;

        if (navigator.share) {
            try {
                await navigator.share({ title: 'Cuenta Regresiva Vacaciones', text, url: window.location.href });
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
                a.download = `vacaciones-${settings.destination.replace(/\s+/g, '-').slice(0, 20)}.png`;
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
        document.getElementById('btnSettings')?.addEventListener('click', () => openPanel('settingsPanel'));
        document.getElementById('closeSettings')?.addEventListener('click', closePanels);
        document.getElementById('panelBackdrop')?.addEventListener('click', closePanels);

        document.getElementById('btnMusic')?.addEventListener('click', () => {
            document.getElementById('audioPlayer')?.classList.toggle('open');
        });

        document.getElementById('btnParty')?.addEventListener('click', () => {
            settings.partyMode = !settings.partyMode;
            if (settings.partyMode) settings.relaxMode = false;
            applySettings();
            saveSettings();
            showToast(settings.partyMode ? '🎉 Modo fiesta activado' : 'Modo fiesta desactivado');
        });

        document.getElementById('btnRelax')?.addEventListener('click', () => {
            settings.relaxMode = !settings.relaxMode;
            if (settings.relaxMode) settings.partyMode = false;
            applySettings();
            saveSettings();
            showToast(settings.relaxMode ? '🌊 Modo relajante activado' : 'Modo relajante desactivado');
        });

        document.getElementById('btnShare')?.addEventListener('click', shareCountdown);
        document.getElementById('btnCapture')?.addEventListener('click', captureScreen);
        document.getElementById('celebrationShare')?.addEventListener('click', shareCountdown);

        document.getElementById('saveSettings')?.addEventListener('click', () => {
            readPanelInputs();
            applySettings();
            saveSettings();
            closePanels();
            Countdown.stop();
            Countdown.start();
            showToast('Configuración guardada');
        });

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        document.getElementById('volumeSlider')?.addEventListener('change', (e) => {
            settings.volume = parseInt(e.target.value, 10);
            saveSettings();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closePanels();
        });
    }

    function init() {
        loadSettings();
        applySettings();

        Background.init();
        Effects.init();
        AudioPlayer.init();
        bindEvents();

        Countdown.onComplete = () => {
            if (typeof AudioPlayer !== 'undefined') AudioPlayer.playFestive();
        };

        Countdown.onTick = ({ days }) => {
            if (days <= 7 && days > 0 && settings.partyMode) {
                if (Math.random() < 0.01) Effects.spawnConfetti(5);
            }
        };

        Countdown.start();
    }

    return { init, shareCountdown, captureScreen, showToast };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
