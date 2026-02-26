---
title: "Sensors & Actors"
date: 2024-01-01
draft: false
weight: 2
---

# Sensors & Actors

The Sensors & Actors section lets you view live sensor readings and interact with motors and servos directly from the touchscreen — no code required.

---

## Navigating to Sensors & Actors

From the dashboard, tap the green **Sensors & Actors** tile.

You will see a list of sensor categories. Tap a category to see the individual sensors inside it.

> **[PICTURE: Sensor category selection screen with list of categories]**

---

## Sensor Categories

### IMU (Inertial Measurement Unit)

Shows the robot's:

- **Heading** — current compass direction (0–360°)
- **Gyroscope** — rotation rates on all three axes
- **Accelerometer** — acceleration on all three axes
- **Orientation quaternion** — raw orientation data for advanced use
- **Temperature** — IMU chip temperature

Values update in real time.

> **[PICTURE: IMU readings screen showing gyro, accel, and heading values]**

### Analog Sensors

Shows a live reading for each configured analog port (0–5). The value is a number from 0 to 4095. Higher values typically mean more light detected (for light sensors) or closer proximity (for IR sensors), depending on the sensor type.

> **[PICTURE: Analog sensor screen showing live bar graph or numeric readings for each port]**

### Digital Sensors

Shows `ON` or `OFF` for each configured digital port. Useful for verifying that bump sensors and buttons respond when pressed.

### Motors

Shows the back-EMF reading for each motor (an indirect measure of motor speed). You can also set motor power directly from this screen for testing:

- Tap a motor to select it
- Use the on-screen slider or buttons to set the power level (-100 to 100)
- Tap **Stop** or set power to 0 to stop the motor

> **[PICTURE: Motor control screen with power slider and back-EMF reading]**

### Servos

Shows the current position for each servo (0–180°). Tap a servo and drag the slider to move it to a new position. Useful for finding the correct angles for your mechanism before writing code.

> **[PICTURE: Servo control screen with angle slider]**

### Battery

Shows the current battery voltage. A full charge is around 8.4V. Below approximately 6V the robot may not operate motors reliably.

### Temperature

Shows internal temperature readings from the system.

---

## Real-Time Updates

All values on the sensor screens update continuously. You can leave a sensor screen open while running a program to monitor values during execution.
