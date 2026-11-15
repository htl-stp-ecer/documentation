---
title: "Advanced"
author: "Mario Scholze"
date: 2026-11-15
draft: false
weight: 60
description: "How RaccoonOS works inside: the platform architecture, the library layers, the STM32 firmware and Pi bridge, the transport and the Web IDE internals."
---

# Advanced

You do not need this section to program a robot. It documents **how RaccoonOS is built**: which components exist, how they talk to each other, and how the firmware, the transport and the Web IDE work inside. Read it when you debug something deep, extend the platform, or are just curious.

## The platform at a glance

```mermaid
flowchart LR
    subgraph Laptop
        CLI["raccoon CLI<br/>Web IDE"]
    end
    subgraph Pi["Raspberry Pi (Wombat)"]
        SRV["raccoon-server<br/>(port 8421)"]
        LIB["raccoon-lib<br/>your missions"]
        BUS[("raccoon-transport<br/>shared-memory ring<br/>/dev/shm")]
        RDR["stm32-data-reader"]
        UI["botui"]
        CAM["raccoon-cam"]
    end
    MCU["STM32 firmware<br/>motors, IMU"]

    CLI -- "SSH / HTTP" --> SRV
    SRV -- "starts" --> LIB
    LIB <--> BUS
    UI <--> BUS
    CAM <--> BUS
    RDR <--> BUS
    RDR <-- "SPI" --> MCU
```

| Component | What it is | Repository |
|-----------|-----------|------------|
| **raccoon-lib** | The C++20 library with Python bindings: steps, missions, motion control, odometry. Your mission code runs on it | `raccoon-lib` |
| **STM32 firmware** | Runs on the STM32 microcontroller: motor control, IMU, and the chassis velocity loop | `stm32-data-reader` (`firmware/`) |
| **stm32-data-reader** | Service on the Pi that talks SPI to the STM32 and publishes its data on the transport | `stm32-data-reader` |
| **raccoon-transport** | Messages, channels and the shared-memory transport between all components, for C++, Python and Dart, plus the contract hash | `raccoon-transport` |
| **botui** | The touchscreen UI on the robot (Flutter, rendered with flutter-pi) | `botui` |
| **raccoon-cli / raccoon-server** | The laptop tool and the daemon on the Pi that receives files and starts programs. The Web IDE is part of it | `raccoon-cli` |
| **raccoon-cam** | Camera service with pluggable image processors | `raccoon-cam` |
| **raccoon-image** | Builds the RaccoonOS SD card image from a bundle of component releases | `raccoon-image` |

Every component is built and released on its own. A **bundle** names the exact version of each, and the transport **contract hash** makes sure they all speak the same wire format. See [Releases]({{< ref "/07-build-and-contribute/releases/_index.md" >}}).

## In this section

| Page | What it covers |
|------|----------------|
| [Library Architecture]({{< ref "/06-advanced/01-architecture.md" >}}) | The layers of `raccoon-lib`, the module map and what happens when you call `drive_forward(25)` |
| [Transport]({{< ref "/06-advanced/transport/_index.md" >}}) | Channels, messages, the shared-memory ring and the contract check |
| [Firmware and Pi Bridge]({{< ref "/06-advanced/firmware/_index.md" >}}) | STM32 firmware, SPI protocol, motor control, sensor pipeline, the Pi bridge |
| [Web IDE Internals]({{< ref "/06-advanced/web-ide-internals/_index.md" >}}) | How the Web IDE backend and frontend are built |

Looking for how to build or release these components yourself? That is in [Build and Contribute]({{< ref "/07-build-and-contribute/_index.md" >}}).
