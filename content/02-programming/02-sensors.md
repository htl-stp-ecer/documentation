---
title: "Sensors & Actuators"
date: 2024-01-01
draft: false
weight: 3
---

# Sensors & Actuators

This page covers how to read sensor values and control actuators (servos) from your mission code.

---

## Analog Sensors

Analog sensors return a numeric value (0–4095 on the Wombat's 12-bit ADC). Common examples: light sensors, IR distance sensors.

```python
value = self.robot.sensors.analog(port=0)
```

Replace `0` with the port number your sensor is connected to (0–5). You set these port assignments during `raccoon wizard`.

---

## Digital Sensors

Digital sensors return `True` or `False`. Common examples: bump sensors, push buttons, IR line sensors.

```python
pressed = self.robot.sensors.digital(port=0)
```

---

## IMU (Gyroscope / Accelerometer)

The Wombat has a built-in 9-axis IMU. You can read heading, rotation rates, acceleration, and orientation:

```python
heading = self.robot.imu.heading()          # degrees, 0–360
gyro = self.robot.imu.gyro()                # rotation rate (deg/s)
accel = self.robot.imu.acceleration()       # (x, y, z) in m/s²
```

> **[TODO: Confirm the exact method names on self.robot.imu — check the generated robot.py or libstp source]**

---

## Servos

Servos are controlled by position (angle in degrees, 0–180):

```python
self.robot.servo(port=0).set_position(90)   # move to 90 degrees
self.robot.servo(port=0).set_position(0)    # move to 0 degrees
```

Replace `0` with the servo port (0–3).

---

## Battery Voltage

Read the current battery voltage:

```python
voltage = self.robot.battery.voltage()
```

A fully charged battery is around 8.4V; below ~6V the robot may not operate motors reliably.

---

## Using Sensors in Conditions

A common pattern is waiting for a sensor to change state:

```python
def sequence(self):
    # Drive forward until a bump sensor is triggered
    while not self.robot.sensors.digital(port=2):
        self.robot.drive.set_speed(left=50, right=50)

    self.robot.drive.stop()
```

Or using an IR sensor value as a threshold:

```python
def sequence(self):
    # Drive until we're close to an object (sensor reads above 3000)
    while self.robot.sensors.analog(port=0) < 3000:
        self.robot.drive.set_speed(left=40, right=40)

    self.robot.drive.stop()
```

---

## Sensor Data on the Robot Screen

You can also monitor sensor values live on the robot's touchscreen without writing code. See [Robot UI — Sensors & Actors]({{< ref "/04-robot-ui/01-sensors-actors" >}}).
