---
title: "System Architecture"
date: 2024-01-01
draft: false
weight: 1
---

# Raccoon System Architecture

## The Big Picture

Raccoon is a layered system where each component has a clear responsibility. Data flows from hardware sensors up through firmware, across SPI to the Raspberry Pi, then out via LCM messaging to any consumer -- the library, UI, simulators, or vision systems.

```mermaid
block-beta
    columns 1
    block:user["User Programs (Python) — Missions, Steps, Motion Commands"]
    end
    space
    block:lib["libstp (C++20 + Python bindings) — Drive, Motion, Kinematics, Odometry, Calibration"]
    end
    space
    block:bridge["stm32-data-reader (C++20, runs on Pi) — SPI ↔ LCM bridge"]
    end
    space
    block:fw["STM32 Firmware (bare-metal C) — Motor PID 200Hz, BEMF, IMU fusion, ADC, Servos"]
    end
    space
    block:hw["Physical Hardware — 4 DC Motors, 4 Servos, MPU9250 IMU, Analog/Digital Sensors"]
    end

    user --> lib
    lib --> bridge
    bridge --> fw
    fw --> hw

    style user fill:#4a90d9,color:#fff
    style lib fill:#7b68ee,color:#fff
    style bridge fill:#e67e22,color:#fff
    style fw fill:#c0392b,color:#fff
    style hw fill:#27ae60,color:#fff
```

## How the Repositories Connect

This diagram shows how all 12 repositories in the Raccoon system interact:

```mermaid
graph TB
    subgraph "Developer Laptop"
        TOOL[raccoon CLI<br/><i>toolchain/</i>]
        IDE_FE[WebIDE Frontend<br/><i>Angular</i>]
    end

    subgraph "Raspberry Pi"
        LIB[libstp<br/><i>library/</i>]
        READER[stm32-data-reader<br/><i>stm32-data-reader/</i>]
        BOTUI[StpVelox UI<br/><i>botui/</i>]
        FPI[flutter-pi<br/><i>flutter-pi/</i>]
        IDE_BE[WebIDE Backend<br/><i>backendide/</i>]
        YOLO[Object Detector<br/><i>object-detector/</i>]
        PROG[User Programs<br/><i>Python</i>]
    end

    subgraph "STM32 Microcontroller"
        FW[Firmware<br/><i>Firmware-Stp/</i>]
    end

    subgraph "Simulation & Planning"
        SIM[Botball Simulator<br/><i>Botball-Simulator/</i>]
        MSIM[Mission Simulator<br/><i>goonbuddyy/</i>]
        PATH[Path Planner<br/><i>path-planner-test/</i>]
    end

    subgraph "Game Table Hardware"
        GT[Game Table<br/><i>gametable/</i>]
    end

    TOOL -- "SSH/SFTP sync<br/>+ remote exec" --> PROG
    TOOL -- "codegen YAML→Python" --> PROG
    IDE_FE -- "REST API" --> IDE_BE
    IDE_BE -- "step discovery" --> LIB

    PROG -- "Python API" --> LIB
    LIB -- "LCM publish/<br/>subscribe" --> READER
    READER -- "SPI @ 20MHz" --> FW

    BOTUI -- "runs on" --> FPI
    BOTUI -- "LCM subscribe" --> READER
    YOLO -- "LCM publish<br/>detections" --> READER

    SIM -- "synthetic training<br/>data" --> YOLO
    PATH -- "command sequences" --> MSIM
    PATH -- "commands" --> PROG

    BOTUI -- "LCM dynamic UI" --> PROG

    style FW fill:#c0392b,color:#fff
    style READER fill:#e67e22,color:#fff
    style LIB fill:#7b68ee,color:#fff
    style BOTUI fill:#2980b9,color:#fff
    style TOOL fill:#16a085,color:#fff
    style YOLO fill:#8e44ad,color:#fff
    style SIM fill:#f39c12,color:#fff
    style MSIM fill:#f39c12,color:#fff
    style PATH fill:#d35400,color:#fff
    style GT fill:#27ae60,color:#fff
    style FPI fill:#2c3e50,color:#fff
    style IDE_BE fill:#1abc9c,color:#fff
    style IDE_FE fill:#1abc9c,color:#fff
    style PROG fill:#4a90d9,color:#fff
```

## Data Flow: Sensor Reading

When your program reads a sensor value, here's what happens across the full stack:

```mermaid
sequenceDiagram
    participant HW as Physical Sensor
    participant STM as STM32 Firmware
    participant SPI as SPI Bus (20 MHz)
    participant DR as stm32-data-reader
    participant LCM as LCM Multicast
    participant LIB as libstp
    participant UI as botui
    participant PY as Your Python Code

    HW->>STM: ADC sample (1 kHz DMA)
    STM->>STM: Store in TX buffer
    STM->>SPI: Full-duplex transfer
    SPI->>DR: Receive TX buffer
    DR->>LCM: Publish libstp/analog/{port}/value
    LCM->>LIB: Deliver to subscriber
    LCM->>UI: Deliver to subscriber
    LIB->>PY: Return sensor value
    UI->>UI: Update display
```

## Data Flow: Motor Command

When your program commands a motor, the data flows in the opposite direction:

```mermaid
sequenceDiagram
    participant PY as Your Python Code
    participant LIB as libstp
    participant LCM as LCM Multicast
    participant DR as stm32-data-reader
    participant SPI as SPI Bus (20 MHz)
    participant STM as STM32 Firmware
    participant MOT as DC Motor

    PY->>LIB: motor.setVelocity(500)
    LIB->>LCM: Publish motor/{port}/velocity_cmd
    LCM->>DR: Deliver command
    DR->>DR: Write to RX buffer
    DR->>SPI: Full-duplex transfer
    SPI->>STM: Receive RX buffer
    STM->>STM: PID control loop (200 Hz)
    STM->>MOT: PWM output
    MOT-->>STM: BEMF feedback
```

## Development Workflow

How the toolchain supports the development cycle:

```mermaid
flowchart LR
    A["raccoon create<br/>project"] --> B["raccoon wizard<br/>configure hardware"]
    B --> C["Edit missions<br/>in IDE"]
    C --> D["raccoon run"]
    D --> E{"On Pi?"}
    E -- "Yes" --> F["raccoon codegen<br/>YAML → Python"]
    F --> G["Execute program"]
    E -- "No" --> H["SFTP sync to Pi"]
    H --> F
    G --> I["LCM sensor data<br/>+ motor commands"]
    I --> J["View output<br/>in terminal"]
    J --> C

    style A fill:#16a085,color:#fff
    style B fill:#16a085,color:#fff
    style D fill:#16a085,color:#fff
    style F fill:#7b68ee,color:#fff
    style G fill:#4a90d9,color:#fff
    style I fill:#e67e22,color:#fff
```

## LCM Communication Hub

LCM (Lightweight Communications and Marshalling) is the central nervous system. All components communicate through it via UDP multicast:

```mermaid
graph TB
    LCM((LCM Bus<br/>UDP Multicast<br/>239.255.76.67:7667))

    DR[stm32-data-reader] -- "publishes sensors<br/>subscribes commands" --> LCM
    LIB[libstp] -- "publishes commands<br/>subscribes sensors" --> LCM
    UI[botui] -- "subscribes sensors<br/>+ dynamic UI" --> LCM
    YOLO[Object Detector] -- "publishes<br/>yolo/frame" --> LCM
    IDE[WebIDE Backend] -- "subscribes<br/>battery/voltage" --> LCM
    PROG[User Programs] -- "publishes<br/>screen_render" --> LCM

    style LCM fill:#e74c3c,color:#fff,stroke-width:3px
    style DR fill:#e67e22,color:#fff
    style LIB fill:#7b68ee,color:#fff
    style UI fill:#2980b9,color:#fff
    style YOLO fill:#8e44ad,color:#fff
    style IDE fill:#1abc9c,color:#fff
    style PROG fill:#4a90d9,color:#fff
```

## Component Overview

### Hardware Layer

| Component | Chip | Role |
|-----------|------|------|
| Microcontroller | STM32F427VIT6 (Cortex-M4, 180 MHz) | Real-time motor control, sensor sampling |
| IMU | MPU9250 (9-axis) | Orientation, angular velocity, acceleration |
| Companion Computer | Raspberry Pi 4 | Runs all high-level software |
| Display | 800x480 touchscreen | Flutter UI for operator interaction |

### Software Stack

| Layer | Component | Language | Purpose |
|-------|-----------|----------|---------|
| Firmware | Firmware-Stp | C | Motor PID, BEMF, IMU, SPI slave |
| Bridge | stm32-data-reader | C++20 | SPI master, LCM publisher/subscriber |
| Library | libstp | C++20 + Python | Motion control, kinematics, calibration |
| Toolchain | raccoon CLI | Python | Project management, code generation |
| UI | botui (StpVelox) | Dart/Flutter | Touchscreen interface |
| UI Engine | flutter-pi | C | Flutter embedder for Raspberry Pi |
| IDE Backend | backendide | Python/FastAPI | WebIDE API, step discovery |
| Simulator | Botball-Simulator | C#/Unity | 3D physics simulation |
| Vision | object-detector | Python/PyTorch | YOLO object detection |
| Path Planning | path-planner-test | Python | Correction-aware navigation |

## Key Design Decisions

### LCM for Inter-Process Communication

All components communicate via LCM (Lightweight Communications and Marshalling) -- a UDP multicast publish-subscribe system. This means:

- Any number of consumers can subscribe to any channel
- The UI, library, and logging tools all see the same data simultaneously
- Components can be started, stopped, and restarted independently
- Adding new functionality doesn't require modifying existing components

### Separation of Real-Time and Application Logic

The STM32 handles all time-critical operations (motor PID at 200 Hz, BEMF sampling, IMU fusion at 50 Hz). The Raspberry Pi handles high-level logic (path planning, vision, mission sequencing). This split ensures motor control never misses a deadline, regardless of what the Pi is doing.

### Python for User Code, C++ for Performance

User-facing robot programs are written in Python for simplicity. Performance-critical code (kinematics, PID, odometry) is written in C++20 and exposed via pybind11 bindings. This gives users the ease of Python with the speed of C++.

## Repository Map

All repositories live under the Botball project directory:

| Directory | Repository | Description |
|-----------|-----------|-------------|
| `Firmware-Stp/` | STM32 firmware | Bare-metal motor control and sensor sampling |
| `stm32-data-reader/` | Pi-side SPI bridge | Reads STM32 data, publishes/subscribes via LCM |
| `library/` | libstp | Core robotics library (C++ + Python) |
| `toolchain/` | raccoon CLI | Developer tools, project scaffolding, remote dev |
| `backendide/` | WebIDE backend | FastAPI server for the web-based IDE |
| `botui/` | StpVelox UI | Flutter touchscreen interface |
| `flutter-pi/` | Flutter embedder | Runs Flutter apps on Raspberry Pi without X11 |
| `Botball-Simulator/` | 3D simulator | Unity physics simulation |
| `goonbuddyy/` | Mission simulator | Unity + Angular mission testing |
| `object-detector/` | Vision system | YOLO object detection pipeline |
| `path-planner-test/` | Path planner | Correction-aware path planning |
| `gametable/` | Game table | ESP32 firmware + Next.js web interface |
