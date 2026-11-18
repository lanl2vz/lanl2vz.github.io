---
title: ref mut inside a wrapped structure
date: 2026-11-18
topic: Rust
summary: Using ref mut to mutate a value inside a structure.
---

`ref mut` reaches value inside a wrapped structure and mutates that value without disturbing that structure.

e.g:

```rust
let mut xs: Vec<(u8, u8)> = vec![(0, 1), (2, 3)];
let (ref mut x1, _) = xs[0];
*x1 = 4;
```
