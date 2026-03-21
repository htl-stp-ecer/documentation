---
title: "Sensors & Actors"
author: "Jakob Schlögl"
date: 2026-03-05
draft: false
weight: 2
---

# Sensors & Actors
The first thing you see will be a screen with multiple boxes. Each box represents either one or a group of sensor. 
![IMG: Selection of graphs for each sensor and actor](/images/botui/sensors/botui-sensors.png)

## Graph views 
Graph views display sensor data over time in a visual format. They are used to monitor and analyze values measured by different sensors connected to the system.

The graph shown below contains mock data of an analog sensor graph. The x-axis represents the elapsed time in seconds, while the y-axis represents the measured sensor value.
![IMG: Example graph of an analog sensor with mock data](/images/botui/sensors/botui-sensors-graphview.png)

Graph views are available on several pages, including:
- Analog
- Digital
- Gyro
- Accel
- Magneto
- Orientation
- Temperature
- Battery

## Slider Controls
Sliders allow users to set specific values for different components. For motors, sliders can be used to adjust power and velocity, while for servos they control the angle.

The image below shows an example of a motor power control.  
![IMG: Example slider controller from motor power](/images/botui/sensors/botui-sensors-slider.png)

For motors, it is also possible to open a graph view that displays **BEMF** (back electromotive force) and the **position over time**. 

As shown in the image below you can also enter a target position for the motors at different velocities. 
![IMG: Adjust the motor](/images/botui/sensors/botui-sensors-motor.png)