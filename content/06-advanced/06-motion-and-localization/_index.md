---
title: "Motion and Localization"
author: "Mario Scholze"
date: 2026-11-19
draft: false
weight: 50
description: "How the robot moves and knows where it is: drive system, kinematics, odometry, IMU, localization and robot.yml."
---

# Motion and Localization

The driving steps in the [Programming Guide]({{< ref "/01-programming-guide/02-driving/_index.md" >}}) are simple to call. This section explains what happens below them, and how to tune it.

| Page | What it covers |
|------|----------------|
| [Drive System]({{< ref "/06-advanced/06-motion-and-localization/01-drive-system.md" >}}) | From a velocity command to the wheels, velocity control, kinematics, motion PID and auto-tuning |
| [Motion Flow and Kinematics]({{< ref "/06-advanced/06-motion-and-localization/02-motion-flow-and-kinematics.md" >}}) | The control stack between a mission step and the motor commands |
| [Odometry]({{< ref "/06-advanced/06-motion-and-localization/03-odometry.md" >}}) | Position and heading, coordinate frames, odometry sources |
| [IMU]({{< ref "/06-advanced/06-motion-and-localization/04-imu.md" >}}) | Gyro, accelerometer and magnetometer, and how heading is derived |
| [Localization and Resync]({{< ref "/06-advanced/06-motion-and-localization/05-localization-and-resync.md" >}}) | A particle-filter pose estimate that corrects odometry drift |
| [robot.yml Reference]({{< ref "/06-advanced/06-motion-and-localization/06-robot-yml.md" >}}) | Every key of `config/robot.yml` |
