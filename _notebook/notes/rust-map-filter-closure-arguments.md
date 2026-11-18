---
title: map() and filter() closure arguments
date: 2026-11-16
topic: Rust
summary: How map() and filter() pass iterator items to closures.
---

Iterator adaptor `map()` passes iterator item directly to the closure by value, while `filter()` passes a reference to the item to the closure.

Beware pattern matching of Copyable values in the closure, as `.iter()` produces items of type `&T`
