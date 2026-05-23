'use client';

class AudioEngine {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (this.ctx) return;
    try {
      // Lazy init to bypass browser autostart policies
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    } catch (e) {
      console.warn("Web Audio API is not supported in this browser:", e);
    }
  }

  private resumeCtx() {
    this.initCtx();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a retro dual-tone coin insert chime
  playCoinInsert() {
    this.resumeCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    
    // First tone (medium high)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(987.77, t); // B5
    gain1.gain.setValueAtTime(0.08, t);
    gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    
    // Second tone (higher pitch, starts slightly later)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1318.51, t + 0.08); // E6
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.setValueAtTime(0.08, t + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);

    osc1.start(t);
    osc1.stop(t + 0.1);
    
    osc2.start(t + 0.08);
    osc2.stop(t + 0.3);
  }

  // Play mechanical camera shutter sound (white noise + envelope)
  playShutter() {
    this.resumeCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const duration = 0.25;
    const bufferSize = this.ctx.sampleRate * duration;
    
    // Generate white noise buffer
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter for a more mechanical clack
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 1.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    // Add a low metallic thump osc for shutter body vibration
    const thump = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();
    thump.type = 'triangle';
    thump.frequency.setValueAtTime(180, t);
    thump.frequency.exponentialRampToValueAtTime(60, t + 0.12);
    
    thumpGain.gain.setValueAtTime(0.2, t);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    thump.connect(thumpGain);
    thumpGain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + duration);
    
    thump.start(t);
    thump.stop(t + 0.12);
  }

  // Play a simple countdown beep
  playBeep(isFinal = false) {
    this.resumeCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Final beep is high pitch, standard beeps are mid pitch
    osc.frequency.setValueAtTime(isFinal ? 1600 : 880, t);
    
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (isFinal ? 0.25 : 0.12));

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + (isFinal ? 0.3 : 0.15));
  }

  // Play mechanical buzzing hum that mimics physical printing
  playPrinter(durationSec = 2.5) {
    this.resumeCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    
    // Low frequency sawtooth hum
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(75, t);
    
    // Stepper motor vibration: modulate the pitch slightly with an LFO
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 16; // 16Hz chatter
    lfoGain.gain.value = 8; // pitch sweep range +/- 8Hz

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    // Apply high-shelf filter to cut down aggressive buzz, keeping it muffled/inside mechanical slot
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);

    // Fade-in/Fade-out envelope
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.15); // fade in
    gain.gain.setValueAtTime(0.12, t + durationSec - 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + durationSec); // fade out

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    lfo.start(t);
    osc.start(t);
    
    lfo.stop(t + durationSec);
    osc.stop(t + durationSec);
  }

  // Play smooth synthesizer swoop during zoom transition
  playZoomSwoop() {
    this.resumeCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(650, t + 1.8);

    // Modulate volume to sound spinny
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(4, t);
    lfo.frequency.exponentialRampToValueAtTime(25, t + 1.8);
    lfoGain.gain.value = 0.03;

    // Fade envelope
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.4);
    gain.gain.setValueAtTime(0.1, t + 1.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.95);

    osc.connect(gain);
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    lfo.start(t);
    
    osc.stop(t + 2.0);
    lfo.stop(t + 2.0);
  }

  // Play retro UI click sound
  playClick() {
    this.resumeCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  // Play nice retro futuristic powerup chord arpeggio
  playLobbyChime() {
    this.resumeCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
    
    notes.forEach((freq, index) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const startTime = t + (index * 0.08);
      const duration = 0.5;

      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.04, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    });
  }
}

// Export singleton instance
export const audio = new AudioEngine();
