---
title: "Custom Steps"
author: "Mario Scholze"
date: 2026-11-15
draft: false
weight: 70
description: "Write your own steps and compose existing ones into reusable building blocks."
---

# Custom Steps

When a sequence of steps shows up in several missions, wrap it in your own step. The simplest custom step is a function that returns `seq(...)`; for full control you subclass `Step`.

| Page | What it covers |
|------|----------------|
| [Custom Steps]({{< ref "/01-programming-guide/07-custom-steps/01-custom-steps.md" >}}) | Function-based steps (recommended), `@dsl` for WebIDE discovery, class-based steps, custom motion steps, resources |

Custom steps live in `src/steps/` of your project. Read [Steps DSL]({{< ref "/01-programming-guide/01-basics/07-steps-dsl.md" >}}) first if you have not met `seq`, `parallel` and the builder methods yet.
