---
title: "Custom Steps"
author: "Mario Scholze"
date: 2026-11-19
draft: false
weight: 70
description: "Write your own steps: first with run() and defer(), then as classes that inherit from Step."
---

# Custom Steps

When a sequence of steps shows up in several missions, or the library lacks a step you need, write your own. Start simple and move to classes only when you must.

| Page | What it covers |
|------|----------------|
| [Custom Steps: run, defer and functions]({{< ref "/01-programming-guide/07-custom-steps/01-run-defer-and-functions.md" >}}) | `run(...)`, `defer(...)` and functions that return a `seq`, plus `@dsl` for the step palette |
| [Step Classes]({{< ref "/01-programming-guide/07-custom-steps/02-step-classes.md" >}}) | Writing classes that inherit from `Step` or `MotionStep`, resources, organizing steps |

Custom steps live in `src/steps/` of your project. Read [Concept]({{< ref "/01-programming-guide/01-basics/01-concept.md" >}}) and [Steps DSL]({{< ref "/06-advanced/08-runtime-and-tooling/06-steps-dsl.md" >}}) first if you have not met `seq`, `parallel` and the builder methods yet.
