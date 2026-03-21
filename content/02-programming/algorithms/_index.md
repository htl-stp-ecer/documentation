---
title: "Deep Dives"
author: "Tobias Madlberger"
date: 2026-03-21
draft: false
weight: 20
---

# Deep Dives

This section covers the key algorithms and techniques that power LibSTP's sensor and motion systems. Understanding these is not required to use the SDK — the high-level steps handle everything — but it helps when tuning parameters or debugging unexpected behavior.

| Page | What It Does |
|------|-------------|
| [Line Following]({{< ref "line-following" >}}) | PID-based edge tracking with profiled and directional variants |
| [Lineup]({{< ref "lineup" >}}) | Single-pass geometric line alignment |
| [IR Sensor Calibration (K-Means)]({{< ref "ir-calibration" >}}) | Clustering-based threshold detection for IR sensors |
| [Wait for Light]({{< ref "wait-for-light" >}}) | Kalman-filtered start lamp detection with test/arm workflow |
