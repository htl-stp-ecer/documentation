---
title: "IMU Calibration"
date: 2024-01-01
draft: false
weight: 3
---

# IMU Calibration

To make the raw IMU values useful, the IMU has to be calibrated. The following calibrations need to be applied for best results.

## 1. Core Sensor Calibration

### 1.1 Axis Alignment & Scaling

1. **Single-Axis Rotation Tests**

    * Rotate the gyro about each principal axis at a known, steady rate. Record all three axes concurrently.
    * Compute an **axis-misalignment matrix**: ideally only the driven axis measures rotation; cross-coupling terms indicate misalignment.

2. **Scale Factor Adjustment**

    * Compare measured vs. known rates (e.g., 15 deg/s measured vs. 17 deg/s actual) to derive per-axis scale factors.

3. **Repeat for Accelerometer & Magnetometer**

    * Apply identical misalignment/scale calibration to accelerometer data (static gravity tests) and magnetometer data (with only Earth's field).

### 1.2 Magnetometer Hard- and Soft-Iron Calibration

1. **Data Collection**

    * Rotate through full 3D space away from magnets/metal for ~5 minutes, including static holds.

2. **Outlier Removal**

    * Detect and discard spikes (Mahalanobis distance or simple thresholding).

3. **Ellipsoid Fitting**

    * Fit raw points to an ellipsoid:
        * **Hard-iron** -- compute offset (center of ellipsoid).
        * **Soft-iron** -- compute deformation matrix to "sphere-ify" data.

4. **Validation**

    * Check that the mean magnitude is approximately equal to the local Earth field (~48 uT for many regions).

### 1.3 Noise Analysis

* **Allan Variance** to decompose:
    * **Angle Random Walk (ARW)** for gyro.
    * **Bias Instability** for long-term drift.
* Use these parameters to tune filter covariances and understand expected drift rates.

## 2. Use Cases

Once calibrated, the IMU can be used for:

- **Compass (Heading)** -- determine which direction the robot is facing
- **Tilt Detection** -- detect if the robot has tilted from the table (e.g., by driving over a pom)
- **Tilt-Compensated Compass** -- heading aligned with the accelerometer for accuracy on uneven surfaces
- **Madgwick Filter** -- lightweight sensor fusion algorithm
- **EKF Filter** -- Extended Kalman Filter for more accurate state estimation

## 3. Advanced Topics

- **Autotune filter via genetic evolution** -- optimize filter parameters automatically
- **Temperature drift & compensation** -- account for sensor drift as temperature changes
- **Collision detection + Collision angle** -- detect when the robot hits something and from which direction
