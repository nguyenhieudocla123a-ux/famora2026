"""Synthesizes FamilyHub's UI sounds from scratch (no samples, no licences needed).

  trong.wav  - bronze drum (trống đồng) strike: low boom with inharmonic bronze partials
  chuong.wav - small temple bell (chuông) for reminders: classic bell partial ratios, long ring
  mo.wav     - wooden fish (mõ) tap for selections: short hollow knock

Usage: python design-system/tools/synth_sounds.py  -> writes design-system/sounds/*.wav
"""
from pathlib import Path
import wave

import numpy as np

RATE = 44100
OUT = Path(__file__).resolve().parent.parent / "sounds"
rng = np.random.default_rng(7)  # fixed seed: identical files on every run


def envelope(t, attack, decay):
    """Fast linear attack, exponential decay."""
    env = np.exp(-t / decay)
    a = t < attack
    env[a] *= t[a] / attack
    return env


def fade_out(x, seconds=0.25):
    n = int(seconds * RATE)
    x[-n:] *= np.linspace(1, 0, n) ** 2
    return x


def write(name, x, peak=0.85):
    x = x / np.max(np.abs(x)) * peak
    pcm = (x * 32767).astype(np.int16)
    OUT.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUT / name), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(pcm.tobytes())
    print(f"wrote sounds/{name} ({len(x) / RATE:.2f}s)")


def trong():
    dur = 2.6
    t = np.arange(int(dur * RATE)) / RATE
    f0 = 68.0
    # membrane-like pitch drop on the fundamental
    freq = f0 * (1 + 0.35 * np.exp(-t / 0.05))
    phase = 2 * np.pi * np.cumsum(freq) / RATE
    x = 1.0 * np.sin(phase) * envelope(t, 0.004, 0.9)
    # inharmonic bronze partials: the "metal" in a bronze drum
    for ratio, amp, dec in [(2.31, 0.35, 0.55), (3.62, 0.22, 0.38), (5.07, 0.14, 0.25), (6.83, 0.08, 0.18), (9.4, 0.05, 0.12)]:
        x += amp * np.sin(2 * np.pi * f0 * ratio * t + rng.uniform(0, 6)) * envelope(t, 0.002, dec)
    # stick attack: a short burst of filtered noise
    noise = rng.standard_normal(len(t))
    noise = np.convolve(noise, np.ones(12) / 12, mode="same")
    x += 0.35 * noise * envelope(t, 0.001, 0.02)
    return fade_out(x, 0.4)


def chuong():
    dur = 3.2
    t = np.arange(int(dur * RATE)) / RATE
    f = 660.0
    x = np.zeros_like(t)
    # hum, prime, tierce, quint, nominal, upper partials of a cast bell
    for ratio, amp, dec in [(0.5, 0.35, 1.6), (1.0, 0.6, 1.2), (1.19, 0.45, 0.9), (1.5, 0.25, 0.7), (2.0, 0.5, 0.8), (2.51, 0.2, 0.45), (3.01, 0.12, 0.3)]:
        beat = 1 + 0.002 * np.sin(2 * np.pi * 3.1 * t)  # slight shimmer
        x += amp * np.sin(2 * np.pi * f * ratio * t * beat) * envelope(t, 0.003, dec)
    return fade_out(x, 0.6)


def mo():
    dur = 0.32
    t = np.arange(int(dur * RATE)) / RATE
    x = np.sin(2 * np.pi * 820 * t) * envelope(t, 0.0008, 0.035)
    x += 0.6 * np.sin(2 * np.pi * 1340 * t) * envelope(t, 0.0008, 0.02)
    x += 0.25 * rng.standard_normal(len(t)) * envelope(t, 0.0005, 0.004)
    return fade_out(x, 0.08)


if __name__ == "__main__":
    write("trong.wav", trong())
    write("chuong.wav", chuong(), peak=0.7)
    write("mo.wav", mo(), peak=0.6)
