---
title: "Driving"
author: "Mario Scholze"
date: 2026-11-15
draft: false
weight: 20
description: "Drive, turn, arc and strafe, stop on conditions, keep an absolute heading, follow lines and optimize paths."
---

# Driving

All steps that move the robot as a whole. They use the drivetrain from your config (differential or mecanum) and the IMU for heading.

| Page | What it covers |
|------|----------------|
| [Drive System]({{< ref "/01-programming-guide/02-driving/01-drive-system.md" >}}) | `drive_forward`, `drive_backward`, `turn_*`, arcs, diagonal drives, speed and PID config |
| [Strafe and Mecanum]({{< ref "/01-programming-guide/02-driving/02-strafe-and-mecanum.md" >}}) | Sideways driving on mecanum and omni robots |
| [Stop Conditions]({{< ref "/01-programming-guide/02-driving/03-stop-conditions.md" >}}) | `.until(...)`, combining conditions with `&` and `\|` |
| [Absolute Heading]({{< ref "/01-programming-guide/02-driving/04-absolute-heading.md" >}}) | `mark_heading_reference`, `turn_to_heading_*` and `heading=` |
| [Smooth Path and Spline Motion]({{< ref "/01-programming-guide/02-driving/05-smooth-path.md" >}}) | Driving through several segments without stopping |
| [Optimize]({{< ref "/01-programming-guide/02-driving/06-optimize.md" >}}) | `optimize([...])`: merge segments, cut corners, one closed-loop move |
| [Line Following]({{< ref "/01-programming-guide/02-driving/07-line-following.md" >}}) | Following a line with IR sensors |
| [Lineup]({{< ref "/01-programming-guide/02-driving/08-lineup.md" >}}) | Aligning the robot on a line or edge |
| [Wall Alignment]({{< ref "/01-programming-guide/02-driving/09-wall-alignment.md" >}}) | Squaring up against a wall |
| [Odometry]({{< ref "/01-programming-guide/02-driving/10-odometry.md" >}}) | Position and heading, coordinate frames, odometry sources |
| [Motion Flow and Kinematics]({{< ref "/01-programming-guide/02-driving/11-motion-flow-and-kinematics.md" >}}) | What happens between a step and the wheels |

Driving accuracy depends on calibration. Run through [Calibration]({{< ref "/01-programming-guide/03-calibration/_index.md" >}}) once your robot drives.
