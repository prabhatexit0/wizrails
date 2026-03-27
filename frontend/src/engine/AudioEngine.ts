// Retro audio system using Web Audio API oscillators

import { useGameStore } from '../store';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private chugOsc: OscillatorNode | null = null;
  private chugGain: GainNode | null = null;
  private muted = false;
  private volume = 0.3;
  private chugRunning = false;

  init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.ctx.destination);
  }

  private ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  update(_dt: number) {
    if (!this.ctx || !this.masterGain || this.muted) return;

    const speed = useGameStore.getState().speedKmh;

    if (speed > 1) {
      if (!this.chugRunning) this.startChug();
      if (this.chugOsc && this.chugGain) {
        // Vary frequency and volume with speed
        this.chugOsc.frequency.value = 30 + speed * 0.5;
        this.chugGain.gain.value = Math.min(0.15, speed * 0.002);
      }
    } else {
      if (this.chugRunning) this.stopChug();
    }
  }

  private startChug() {
    if (!this.ctx || !this.masterGain) return;
    this.chugOsc = this.ctx.createOscillator();
    this.chugGain = this.ctx.createGain();
    this.chugOsc.type = 'sawtooth';
    this.chugOsc.frequency.value = 40;
    this.chugGain.gain.value = 0.05;
    this.chugOsc.connect(this.chugGain);
    this.chugGain.connect(this.masterGain);
    this.chugOsc.start();
    this.chugRunning = true;
  }

  private stopChug() {
    if (this.chugOsc) {
      this.chugOsc.stop();
      this.chugOsc.disconnect();
      this.chugOsc = null;
    }
    if (this.chugGain) {
      this.chugGain.disconnect();
      this.chugGain = null;
    }
    this.chugRunning = false;
  }

  playWhistle() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.muted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.8);
  }

  playBell() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.muted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  playAlert() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.muted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.setValueAtTime(600, this.ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(400, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  cleanup() {
    this.stopChug();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
