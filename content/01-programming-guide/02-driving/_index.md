---
title: "Driving"
author: "Mario Scholze"
date: 2026-11-19
draft: false
weight: 20
description: "Drive, turn, arc and strafe, stop on conditions, keep an absolute heading, follow lines, line up and align on walls."
---

# Driving

All steps that move the robot as a whole. They use the drivetrain from your config (differential or mecanum) and the IMU for heading. How the control works inside is in [Advanced]({{< ref "/06-advanced/06-motion-and-localization/_index.md" >}}).

| Page | What it covers |
|------|----------------|
| [Drive, Turn and Arc]({{< ref "/01-programming-guide/02-driving/01-drive-turn-arc.md" >}}) | `drive_forward`, `drive_backward`, `turn_left`, `turn_right`, arcs, speed mode |
| [Strafe and Mecanum]({{< ref "/01-programming-guide/02-driving/02-strafe-and-mecanum.md" >}}) | Sideways and diagonal driving on mecanum and omni robots |
| [Until Conditions]({{< ref "/01-programming-guide/02-driving/03-until-conditions.md" >}}) | `.until(...)`, combining conditions with `&` and `\|` |
| [Absolute Heading]({{< ref "/01-programming-guide/02-driving/04-absolute-heading.md" >}}) | `mark_heading_reference`, `turn_to_heading_left`, `turn_to_heading_right` and `heading=` |
| [Line Following]({{< ref "/01-programming-guide/02-driving/05-line-following.md" >}}) | Following a line with IR sensors |
| [Lineup]({{< ref "/01-programming-guide/02-driving/06-lineup.md" >}}) | Aligning the robot on a line or edge |
| [Smooth Path and Spline Motion]({{< ref "/01-programming-guide/02-driving/07-smooth-path.md" >}}) | Driving through several segments without stopping |
| [Optimize]({{< ref "/01-programming-guide/02-driving/08-optimize.md" >}}) | `optimize([...])`: merge segments, cut corners, one closed-loop move |
| [Wall Alignment]({{< ref "/01-programming-guide/02-driving/09-wall-alignment.md" >}}) | Squaring up against a wall |

Driving accuracy depends on calibration. Run through [Calibration]({{< ref "/01-programming-guide/05-calibration/_index.md" >}}) once your robot drives.
