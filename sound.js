class SoundGenerator {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.initialized = false;
        this.schumannBase = 7.83;
        this.tickingInterval = null;
        this.ambientOscillator = null;
        this.ambientGain = null;
    }

    init() {
        if (this.initialized) return;
        
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.audioContext.destination);
        
        this.initialized = true;
    }

    createOscillator(type, frequency, duration, startTime, gainValue = 0.5) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, startTime);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(gainValue, startTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
        
        return { oscillator, gainNode };
    }

    playTriangleSound(intensity = 0.5) {
        if (!this.initialized) return;
        const now = this.audioContext.currentTime;
        const baseFreq = 440 + Math.random() * 220;
        this.createOscillator('sine', baseFreq, 0.3, now, intensity * 0.3);
        this.createOscillator('triangle', baseFreq * 2, 0.2, now, intensity * 0.2);
    }

    playSquareSound(intensity = 0.5) {
        if (!this.initialized) return;
        const now = this.audioContext.currentTime;
        const baseFreq = 220 + Math.random() * 110;
        this.createOscillator('square', baseFreq, 0.2, now, intensity * 0.2);
        this.createOscillator('sawtooth', baseFreq * 0.5, 0.3, now, intensity * 0.15);
    }

    playCircleSound(intensity = 0.5) {
        if (!this.initialized) return;
        const now = this.audioContext.currentTime;
        const baseFreq = 110 + Math.random() * 55;
        this.createOscillator('sine', baseFreq, 0.5, now, intensity * 0.4);
        this.createOscillator('sine', baseFreq * 1.5, 0.4, now, intensity * 0.2);
    }

    playStarSound(intensity = 0.5) {
        if (!this.initialized) return;
        const now = this.audioContext.currentTime;
        const harmonics = [523.25, 659.25, 783.99, 1046.50];
        harmonics.forEach((freq, i) => {
            setTimeout(() => {
                this.createOscillator('sine', freq, 0.4, this.audioContext.currentTime, intensity * 0.15);
            }, i * 50);
        });
    }

    playTickingSound(panic = false, slow = false) {
        if (!this.initialized) return;
        
        const now = this.audioContext.currentTime;
        let baseFreq = this.schumannBase;
        
        if (panic) {
            baseFreq = this.schumannBase * (1 + Math.random() * 2);
        } else if (slow) {
            baseFreq = this.schumannBase * 0.7;
        }
        
        // Create layered sound
        this.createOscillator('sine', baseFreq, 0.05, now, 0.3);
        
        // Add white noise for tension
        const bufferSize = this.audioContext.sampleRate * 0.05;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(panic ? 0.2 : 0.05, now + 0.01);
        noiseGain.gain.linearRampToValueAtTime(0, now + 0.05);
        
        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = panic ? 3000 : 500;
        
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        
        noiseSource.start(now);
        noiseSource.stop(now + 0.05);
    }

    playRadioMessage() {
        if (!this.initialized) return;
        
        const now = this.audioContext.currentTime;
        
        // Static noise
        const bufferSize = this.audioContext.sampleRate * 0.5;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
        }
        
        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.4, now);
        noiseGain.gain.linearRampToValueAtTime(0, now + 0.5);
        
        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 1000;
        
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        
        noiseSource.start(now);
        
        // Geometric voice sounds
        setTimeout(() => this.playTriangleSound(0.8), 100);
        setTimeout(() => this.playSquareSound(0.7), 200);
        setTimeout(() => this.playCircleSound(0.6), 300);
    }

    startAmbientTension(level = 0.5) {
        if (!this.initialized || this.ambientOscillator) return;
        
        this.ambientOscillator = this.audioContext.createOscillator();
        this.ambientGain = this.audioContext.createGain();
        
        this.ambientOscillator.type = 'sine';
        this.ambientOscillator.frequency.setValueAtTime(this.schumannBase, this.audioContext.currentTime);
        
        // Add modulation
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.frequency.value = 0.5 + level * 2;
        lfoGain.gain.value = level * 20;
        
        lfo.connect(lfoGain);
        lfoGain.connect(this.ambientOscillator.frequency);
        lfo.start();
        
        this.ambientGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.ambientGain.gain.linearRampToValueAtTime(level * 0.1, this.audioContext.currentTime + 2);
        
        this.ambientOscillator.connect(this.ambientGain);
        this.ambientGain.connect(this.masterGain);
        
        this.ambientOscillator.start();
    }

    updateAmbientTension(level) {
        if (!this.ambientGain) return;
        const now = this.audioContext.currentTime;
        this.ambientGain.gain.linearRampToValueAtTime(level * 0.1, now + 0.5);
    }

    playDreamSound() {
        if (!this.initialized) return;
        
        const now = this.audioContext.currentTime;
        
        // Soft, dreamy fade out
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(220, now);
        oscillator.frequency.exponentialRampToValueAtTime(55, now + 2);
        
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 2);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(now);
        oscillator.stop(now + 2);
    }

    playCollapseSound() {
        if (!this.initialized) return;
        
        const now = this.audioContext.currentTime;
        
        // Create rising frequency sweep
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100, now);
        oscillator.frequency.exponentialRampToValueAtTime(10000, now + 2);
        
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 2);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(now);
        oscillator.stop(now + 2);
        
        // Add heavy noise
        const bufferSize = this.audioContext.sampleRate * 2;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * Math.sin(i / bufferSize * Math.PI);
        }
        
        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.5, now);
        noiseGain.gain.linearRampToValueAtTime(0, now + 2);
        
        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(200, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(10000, now + 2);
        
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        
        noiseSource.start(now);
        noiseSource.stop(now + 2);
    }

    playSilence() {
        // 2 seconds of absolute silence after collapse
        if (!this.initialized) return;
        this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        setTimeout(() => {
            if (this.masterGain) {
                this.masterGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            }
        }, 2000);
    }

    stopAll() {
        if (this.ambientOscillator) {
            this.ambientOscillator.stop();
            this.ambientOscillator = null;
        }
    }
}

const sound = new SoundGenerator();
