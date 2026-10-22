---
title: Least squares as orthogonal projection
date: 2026-10-18
topic: Mathematics
summary: The normal equations and their geometric interpretation.
abstract: A geometric picture to keep beside the algebra.
example: true
---

Suppose the columns of a matrix $A$ describe the patterns we know how to make. Our data vector $b$ may not lie in their span. Least squares asks for the closest vector that does.

## The problem

$$
\hat{x}=\underset{x}{\operatorname{argmin}}\;\|Ax-b\|_2^2.
$$

At a minimum, the residual $r=b-A\hat{x}$ is orthogonal to every column of $A$. Taking a derivative gives the normal equations:

$$
A^{\mathsf T}A\hat{x}=A^{\mathsf T}b.
$$

## The picture to remember

> The fitted vector is the orthogonal projection of the observations onto the column space.

The projected vector is unique. The coefficient vector is unique only when the columns of $A$ are linearly independent.

## A practical note

The normal equations explain the geometry beautifully, but explicitly forming them can square the condition number. For numerical work, a QR or singular value decomposition is often the better starting point.

*Example note demonstrating the notebook format.*
