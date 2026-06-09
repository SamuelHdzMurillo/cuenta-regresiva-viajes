/**
 * Reproductor de audio ambiental con Web Audio API
 */
const AudioPlayer = (() => {
    let audioCtx = null;
    let masterGain = null;
    let currentNodes = [];
    let introNodes = [];
    let isPlaying = false;
    let currentTrack = 0;
    let volume = 0.4;

    const TRACKS = [
        { id: 'waves', name: 'Olas del Mar', icon: '🌊' },
        { id: 'beach', name: 'Playa Tranquila', icon: '🏖️' },
        { id: 'seagulls', name: 'Gaviotas', icon: '🕊️' },
        { id: 'tropical', name: 'Tropical Relajante', icon: '🌴' },
        { id: 'lounge', name: 'Lounge Resort', icon: '🍹' }
    ];

    function init() {
        buildTrackList();
        bindControls();
    }

    function ensureContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioCtx.createGain();
            masterGain.gain.value = volume;
            masterGain.connect(audioCtx.destination);
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }

    function stopCurrent() {
        currentNodes.forEach(node => {
            try {
                if (node.stop) node.stop();
                node.disconnect();
            } catch (_) { /* noop */ }
        });
        currentNodes = [];
    }

    function stopIntro() {
        introNodes.forEach(node => {
            try {
                if (node.stop) node.stop();
                node.disconnect();
            } catch (_) { /* noop */ }
        });
        introNodes = [];
    }

    function createNoise(duration, filterFreq, filterQ, gain) {
        const bufferSize = audioCtx.sampleRate * duration;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;
        filter.Q.value = filterQ;

        const gainNode = audioCtx.createGain();
        gainNode.gain.value = gain;

        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(masterGain);

        source.start();
        return [source, filter, gainNode];
    }

    function createOscillator(freq, type, gain, detune = 0) {
        const osc = audioCtx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        osc.detune.value = detune;

        const gainNode = audioCtx.createGain();
        gainNode.gain.value = gain;

        osc.connect(gainNode);
        gainNode.connect(masterGain);
        osc.start();
        return [osc, gainNode];
    }

    function playIntroSequence() {
        ensureContext();
        stopIntro();

        const rumble = createNoise(6, 80, 2, 0.2);
        introNodes.push(...rumble);
        const rumbleGain = rumble[2];
        if (rumbleGain) {
            rumbleGain.gain.setValueAtTime(0, audioCtx.currentTime);
            rumbleGain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 1.5);
            rumbleGain.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 3.5);
            rumbleGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 6);
        }

        setTimeout(stopIntro, 7000);
    }

    function playExplosion() {
        ensureContext();

        const bufferSize = audioCtx.sampleRate * 2;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.3));
        }

        const source = audioCtx.createBufferSource();
        source.buffer = buffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 1.5);

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 2);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        source.start();
    }

    function playTrack(index) {
        ensureContext();
        stopCurrent();
        currentTrack = ((index % TRACKS.length) + TRACKS.length) % TRACKS.length;
        const track = TRACKS[currentTrack];

        switch (track.id) {
            case 'waves':
                currentNodes = createNoise(4, 400, 0.5, 0.15);
                currentNodes.push(...createNoise(4, 200, 1, 0.1));
                modulateWave(currentNodes[2]);
                break;
            case 'beach':
                currentNodes = createNoise(4, 600, 0.3, 0.08);
                currentNodes.push(...createNoise(4, 300, 0.8, 0.06));
                currentNodes.push(...createOscillator(110, 'sine', 0.02));
                break;
            case 'seagulls':
                currentNodes = createNoise(4, 800, 0.2, 0.04);
                scheduleSeagullCalls();
                break;
            case 'tropical':
                currentNodes = createOscillator(220, 'sine', 0.04);
                currentNodes.push(...createOscillator(330, 'sine', 0.02, 5));
                currentNodes.push(...createOscillator(440, 'triangle', 0.015, -3));
                currentNodes.push(...createNoise(4, 2000, 0.1, 0.02));
                modulateTropical();
                break;
            case 'lounge':
                currentNodes = createOscillator(261.63, 'sine', 0.03);
                currentNodes.push(...createOscillator(329.63, 'sine', 0.025));
                currentNodes.push(...createOscillator(392, 'sine', 0.02));
                currentNodes.push(...createNoise(4, 1500, 0.5, 0.015));
                modulateLounge();
                break;
        }

        updateUI();
        isPlaying = true;
        updatePlayButton();
    }

    function modulateWave(gainNode) {
        if (!gainNode || !audioCtx) return;
        const osc = audioCtx.createOscillator();
        osc.frequency.value = 0.15;
        const modGain = audioCtx.createGain();
        modGain.gain.value = 0.08;
        osc.connect(modGain);
        modGain.connect(gainNode.gain);
        osc.start();
        currentNodes.push(osc, modGain);
    }

    function modulateTropical() {
        if (!audioCtx) return;
        [1, 3, 5].forEach((idx, i) => {
            const gainNode = currentNodes[idx];
            if (!gainNode?.gain) return;
            const lfo = audioCtx.createOscillator();
            lfo.frequency.value = 0.1 + i * 0.05;
            const lfoGain = audioCtx.createGain();
            lfoGain.gain.value = 0.01;
            lfo.connect(lfoGain);
            lfoGain.connect(gainNode.gain);
            lfo.start();
            currentNodes.push(lfo, lfoGain);
        });
    }

    function modulateLounge() {
        if (!audioCtx) return;
        const lfo = audioCtx.createOscillator();
        lfo.frequency.value = 0.08;
        const lfoGain = audioCtx.createGain();
        lfoGain.gain.value = 0.008;
        lfo.connect(lfoGain);
        if (currentNodes[1]) lfoGain.connect(currentNodes[1].gain);
        lfo.start();
        currentNodes.push(lfo, lfoGain);
    }

    function scheduleSeagullCalls() {
        function chirp() {
            if (!isPlaying || TRACKS[currentTrack].id !== 'seagulls') return;
            const freq = 800 + Math.random() * 600;
            const osc = audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.5, audioCtx.currentTime + 0.3);
            const g = audioCtx.createGain();
            g.gain.setValueAtTime(0, audioCtx.currentTime);
            g.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 0.05);
            g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
            osc.connect(g);
            g.connect(masterGain);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.5);
            setTimeout(chirp, 2000 + Math.random() * 4000);
        }
        chirp();
    }

    function pause() {
        stopCurrent();
        isPlaying = false;
        updatePlayButton();
    }

    function toggle() {
        if (isPlaying) pause();
        else playTrack(currentTrack);
    }

    function nextTrack() { playTrack(currentTrack + 1); }
    function prevTrack() { playTrack(currentTrack - 1); }

    function setVolume(val) {
        volume = val / 100;
        if (masterGain) masterGain.gain.value = volume;
    }

    function buildTrackList() {
        const list = document.getElementById('trackList');
        if (!list) return;
        list.innerHTML = TRACKS.map((t, i) =>
            `<li data-index="${i}" class="${i === 0 ? 'active' : ''}">${t.icon} ${t.name}</li>`
        ).join('');

        list.addEventListener('click', (e) => {
            const li = e.target.closest('li');
            if (!li) return;
            playTrack(parseInt(li.dataset.index, 10));
        });
    }

    function updateUI() {
        const track = TRACKS[currentTrack];
        const nameEl = document.getElementById('trackName');
        const iconEl = document.getElementById('trackIcon');
        if (nameEl) nameEl.textContent = track.name;
        if (iconEl) iconEl.textContent = track.icon;

        document.querySelectorAll('#trackList li').forEach((li, i) => {
            li.classList.toggle('active', i === currentTrack);
        });
    }

    function updatePlayButton() {
        const btn = document.getElementById('playPause');
        if (btn) btn.textContent = isPlaying ? '⏸' : '▶';
    }

    function bindControls() {
        document.getElementById('playPause')?.addEventListener('click', toggle);
        document.getElementById('nextTrack')?.addEventListener('click', nextTrack);
        document.getElementById('prevTrack')?.addEventListener('click', prevTrack);
        document.getElementById('volumeSlider')?.addEventListener('input', (e) => {
            setVolume(parseInt(e.target.value, 10));
        });
    }

    function playFestive() {
        playTrack(3);
        if (masterGain) masterGain.gain.value = Math.min(volume * 1.5, 1);
    }

    return {
        init,
        toggle,
        playTrack,
        pause,
        nextTrack,
        prevTrack,
        setVolume,
        playFestive,
        playIntroSequence,
        playExplosion,
        TRACKS
    };
})();
