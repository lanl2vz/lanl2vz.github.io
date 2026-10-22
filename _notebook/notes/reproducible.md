---
title: Reproducible numerical experiments
date: 2026-10-12
topic: Computation
summary: A short checklist for recording inputs, parameters, and results.
abstract: A short checklist for experiments worth returning to.
example: true
---

A result becomes much more useful when its provenance is easy to recover. The goal is to leave enough context that a future reader can reconstruct the question and the calculation.

## A small record

Keep the input, the parameters, the environment, and the output together. A short human-readable note often explains more than an opaque directory name.

```text
experiment/
  README.md      # question and observations
  parameters.json
  environment.txt
  figures/
  results/
```

## Record the uncertainty

- What was held fixed?
- What changed between runs?
- What failed, and why?
- Which conclusions are tentative?

## Leave the next step

Finish with one concrete next action. “Check whether the residual changes with a longer acquisition window” is more useful than “investigate further.”

*Example note demonstrating the notebook format.*
