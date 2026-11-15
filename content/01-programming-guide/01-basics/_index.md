---
title: "Basics"
author: "Mario Scholze"
date: 2026-11-15
draft: false
weight: 10
description: "How a raccoon project is built, how the config becomes code, how missions work and how you run them."
---

# Basics

Everything you need before the robot can drive: what is in a project, how the YAML config turns into Python, how missions are written and how you run them.

| Page | What it covers |
|------|----------------|
| [Project Structure]({{< ref "/01-programming-guide/01-basics/01-project-structure.md" >}}) | Every file and folder in a project and what it is for |
| [Configuration Reference]({{< ref "/01-programming-guide/01-basics/02-config-reference.md" >}}) | The base config: `raccoon.project.yml` and all files in `config/` |
| [YAML Includes]({{< ref "/01-programming-guide/01-basics/03-yaml-includes.md" >}}) | Splitting the config over several files with `!include` and `!include-merge` |
| [Code Generator]({{< ref "/01-programming-guide/01-basics/04-code-generator.md" >}}) | How `raccoon codegen` turns the YAML into `Defs` and `Robot` |
| [Robot Definition]({{< ref "/01-programming-guide/01-basics/05-robot-definition.md" >}}) | Declaring drivetrain, motors, servos and sensors |
| [Missions]({{< ref "/01-programming-guide/01-basics/06-missions.md" >}}) | Writing, numbering and ordering missions, `raccoon missions` |
| [Steps DSL]({{< ref "/01-programming-guide/01-basics/07-steps-dsl.md" >}}) | What a step is, chaining, step lifecycle |
| [Run Configurations]({{< ref "/01-programming-guide/01-basics/08-run-configurations.md" >}}) | Named profiles for `raccoon run` |
| [Parallel and Background]({{< ref "/01-programming-guide/01-basics/09-parallel-and-background.md" >}}) | Doing several things at once |

A good first read is [How Raccoon works]({{< ref "/06-advanced/02-project-model.md" >}}), which explains how these pieces fit together.
