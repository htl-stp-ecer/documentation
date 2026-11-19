---
title: "Basics"
author: "Mario Scholze"
date: 2026-11-19
draft: false
weight: 10
description: "The concept of raccoon, the project and its config, the code generator, run configurations, missions, steps, waiting and the start lamp."
---

# Basics

Everything you need before the robot can drive: what raccoon is made of, what is in a project, how the YAML config turns into Python, how you run it, and how a mission is built from steps.

| Page | What it covers |
|------|----------------|
| [Concept]({{< ref "/01-programming-guide/01-basics/01-concept.md" >}}) | What a step is and how everything fits together, in short |
| [Project Structure]({{< ref "/01-programming-guide/01-basics/02-project-structure.md" >}}) | Every file and folder in a project and what it is for |
| [Config Structure]({{< ref "/01-programming-guide/01-basics/03-config-structure.md" >}}) | What the config files contain and which ones you should not touch |
| [Run Configurations]({{< ref "/01-programming-guide/01-basics/04-run-configurations.md" >}}) | Named profiles for `raccoon run` and `run-configurations.yml` |
| [Code Generator]({{< ref "/01-programming-guide/01-basics/05-code-generator.md" >}}) | How `raccoon codegen` turns the YAML into `Defs` and `Robot` |
| [Robot Definition]({{< ref "/01-programming-guide/01-basics/06-robot-definition.md" >}}) | What the generated `Defs` and `Robot` classes contain |
| [Missions]({{< ref "/01-programming-guide/01-basics/07-missions.md" >}}) | Writing, numbering and ordering missions, setup and shutdown |
| [Sequences, Parallel and Background]({{< ref "/01-programming-guide/01-basics/08-parallel-and-background.md" >}}) | Doing steps one after another, together or in the background |
| [Wait For Steps]({{< ref "/01-programming-guide/01-basics/10-wait-for.md" >}}) | Pausing until a condition, time, button or sensor |
| [Wait for Light]({{< ref "/01-programming-guide/01-basics/11-wait-for-light.md" >}}) | Starting the run on the start lamp |

For the full picture of how a project becomes a running robot, see [Project Model]({{< ref "/06-advanced/02-project-model.md" >}}) in Advanced.
