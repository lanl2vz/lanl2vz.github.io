---
title: Notes on the Fourier transform
date: 2026-10-22
topic: Mathematics
summary: Transform conventions, a two-frequency example, and the inverse transform.
abstract: The continuous Fourier transform, its inverse, and a two-frequency example. Frequency is measured in hertz throughout.
example: true
---

The Fourier transform represents a signal in terms of its frequency components. This note fixes a transform convention and illustrates the correspondence between the time and frequency representations.

## Time and frequency

A time-domain representation describes how a signal varies with time. A frequency-domain representation describes the amplitudes and phases of its constituent oscillations.

## Transform convention

For a sufficiently well-behaved signal $f(t)$, define its Fourier transform by

$$
\hat{f}(\nu) = \int_{-\infty}^{\infty} f(t)\,e^{-2\pi i\nu t}\,\mathrm{d}t.
$$

Here $t$ is time in seconds and $\nu$ is frequency in hertz. The complex exponential acts as a probe: how much of the signal agrees with an oscillation at this frequency?

The inverse transform reconstructs the signal:

$$
f(t) = \int_{-\infty}^{\infty} \hat{f}(\nu)\,e^{2\pi i\nu t}\,\mathrm{d}\nu.
$$

## A small example

Take two cosines, one at 3 Hz and a quieter one at 7 Hz:

$$
f(t) = \cos(2\pi\cdot 3t) + 0.45\cos(2\pi\cdot 7t).
$$

![A two-tone waveform in time, alongside a one-sided amplitude spectrum with peaks at 3 and 7 Hz.](assets/fourier.svg)

*Figure 1. One signal, two descriptions. The one-sided amplitude spectrum shows the two constituent amplitudes; it is not a power spectrum.*

The left panel looks complicated because the oscillations overlap. The right panel separates them. The representation has changed; the information has not.

## Conventions and sampled data

Different books distribute the factors of $2\pi$ differently. Write down your transform convention before comparing formulas. This is necessary when comparing expressions from different sources.

For sampled data, the finite observation window and the sampling rate matter too. The continuous transform is a starting point, not a substitute for checking how the measurements were made.

---

*Example note demonstrating equations, a figure, and a companion PDF.*

[Fourier transform — companion sheet (PDF)](assets/fourier-companion.pdf)
