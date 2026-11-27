/**
 * UI sounds synthesized on the device (react-native-audio-api, Web Audio API) — no audio files,
 * no licences. Same recipes as design-system/tools/synth_sounds.py.
 *
 *   trong  bronze drum strike: low boom with inharmonic bronze partials (ngày giỗ, ngày lễ)
 *   mo     wooden-fish tap: short hollow knock (selections)
 *   chuong temple bell: classic bell partial ratios (reminders)
 *   chime  bright three-note bell arpeggio (birthdays, weddings)
 *   tear   paper tear: crackling filtered noise (tear-off calendar)
 *
 * Buffers are rendered once, lazily, on first use. Every call is a no-op while sound is off.
 */
import { AudioBuffer, AudioContext } from 'react-native-audio-api';

export type SoundName = 'trong' | 'mo' | 'chuong' | 'chime' | 'tear';

const RATE = 44100;
let ctx: AudioContext | null = null;
const cache = new Map<SoundName, AudioBuffer>();
let enabled = true;

/** Deterministic pseudo-random numbers so a sound is identical on every play. */
function seeded(seed: number) {
  const M = 4294967296; // 2^32; s * 1664525 stays below 2^53, so the arithmetic is exact
  let s = seed % M;
  return () => {
    s = (s * 1664525 + 1013904223) % M;
    return s / M;
  };
}

function env(t: number, attack: number, decay: number) {
  const e = Math.exp(-t / decay);
  return t < attack ? (e * t) / attack : e;
}

type Synth = (t: number, i: number, rand: () => number) => number;

function render(seconds: number, synth: Synth, peak: number, seed = 7): AudioBuffer {
  const audio = getContext();
  const n = Math.floor(seconds * RATE);
  const buffer = audio.createBuffer(1, n, RATE);
  const data = buffer.getChannelData(0);
  const rand = seeded(seed);
  let max = 1e-9;
  for (let i = 0; i < n; i++) {
    data[i] = synth(i / RATE, i, rand);
    max = Math.max(max, Math.abs(data[i]));
  }
  const fade = Math.floor(0.08 * RATE);
  for (let i = 0; i < n; i++) {
    const tail = i > n - fade ? ((n - i) / fade) ** 2 : 1;
    data[i] = (data[i] / max) * peak * tail;
  }
  return buffer;
}

const recipes: Record<SoundName, () => AudioBuffer> = {
  trong: () => {
    const f0 = 68;
    const partials: [number, number, number][] = [[2.31, 0.35, 0.55], [3.62, 0.22, 0.38], [5.07, 0.14, 0.25], [6.83, 0.08, 0.18]];
    let phase = 0;
    let noise = 0;
    return render(2.4, (t, _i, rand) => {
      phase += (2 * Math.PI * f0 * (1 + 0.35 * Math.exp(-t / 0.05))) / RATE;
      let x = Math.sin(phase) * env(t, 0.004, 0.9);
      for (const [r, a, d] of partials) {
        x += a * Math.sin(2 * Math.PI * f0 * r * t + r) * env(t, 0.002, d);
      }
      noise = noise * 0.9 + (rand() * 2 - 1) * 0.1;
      return x + 0.35 * noise * env(t, 0.001, 0.02);
    }, 0.8);
  },
  mo: () =>
    render(0.3, (t, _i, rand) =>
      Math.sin(2 * Math.PI * 820 * t) * env(t, 0.0008, 0.035) +
      0.6 * Math.sin(2 * Math.PI * 1340 * t) * env(t, 0.0008, 0.02) +
      0.25 * (rand() * 2 - 1) * env(t, 0.0005, 0.004), 0.55),
  chuong: () => {
    const f = 660;
    const partials: [number, number, number][] = [[0.5, 0.35, 1.6], [1, 0.6, 1.2], [1.19, 0.45, 0.9], [1.5, 0.25, 0.7], [2, 0.5, 0.8], [2.51, 0.2, 0.45]];
    return render(2.8, t => partials.reduce((x, [r, a, d]) => x + a * Math.sin(2 * Math.PI * f * r * t) * env(t, 0.003, d), 0), 0.6);
  },
  chime: () => {
    const notes = [880, 1108.7, 1318.5]; // A5, C#6, E6: a bright major arpeggio
    return render(2.2, t =>
      notes.reduce((x, f, k) => {
        const tk = t - k * 0.12;
        if (tk < 0) {
          return x;
        }
        return x + (Math.sin(2 * Math.PI * f * tk) + 0.3 * Math.sin(2 * Math.PI * f * 2.76 * tk)) * env(tk, 0.002, 0.6);
      }, 0), 0.5);
  },
  tear: () => {
    let lp = 0;
    let hp = 0;
    let prev = 0;
    return render(0.42, (t, _i, rand) => {
      // crackle: noise gated by random grains, swelling then fading like fibres giving way
      const swell = Math.sin(Math.min(1, t / 0.42) * Math.PI);
      const grain = rand() < 0.08 ? 1 : 0.25;
      const n = (rand() * 2 - 1) * grain * swell;
      lp = lp * 0.55 + n * 0.45; // soften
      hp = 0.9 * (hp + lp - prev); // remove rumble
      prev = lp;
      return hp;
    }, 0.5, 11);
  },
};

function getContext(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext({ sampleRate: RATE });
  }
  return ctx;
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

export function isSoundEnabled() {
  return enabled;
}

export function playSound(name: SoundName, volume = 1) {
  if (!enabled) {
    return;
  }
  try {
    const audio = getContext();
    let buffer = cache.get(name);
    if (!buffer) {
      buffer = recipes[name]();
      cache.set(name, buffer);
    }
    const source = audio.createBufferSource();
    source.buffer = buffer;
    const gain = audio.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(audio.destination);
    source.start();
  } catch (e) {
    // Sound is decoration: never let an audio failure break an interaction.
    if (__DEV__) {
      console.warn('sound failed', e);
    }
  }
}
