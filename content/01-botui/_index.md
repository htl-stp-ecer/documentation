---
title: "Bot UI"
author: "Jakob Schlögl"
date: 2026-03-05
draft: false
weight: 1
---

# Bot UI
The Robot UI is the touchscreen interface displayed on the robot's screen. It gives you access to multiple features without needing a laptop or any other device. Everything is executed directly on the robot. 

## Installation
### Requirements
Make sure the following versions are installed:
- Flutter: `>= 3.35.0`
- Dart: `>= 3.9.0 < 4.0.0`

The following tools are required but do not have strict version constraints:
- Python 3 (used by `install.py`)
- SSH & SCP (for deployment to the Raspberry Pi)
- flutterpi_tool (for build, run, and deployment)
- Git (with a configured SSH key for Git dependencies)

### Clone the Repository
Clone the project from the official HTL-STP-ECER GitHub repository using one of the following methods. This project uses submodules, so it must be cloned with `--recurse-submodules`:
```bash
git clone https://github.com/htl-stp-ecer/botui.git --recurse-submodules
```
or via SSH:
```bash
git clone git@github.com:htl-stp-ecer/botui.git --recurse-submodules
```
or using GitHub CLI:
```bash
gh repo clone htl-stp-ecer/botui -- --recurse-submodules
```

### Project Setup
Navigate into the project directory and install dependencies:
```bash
cd botui
dart pub get
```

### Code Generation
Run the code generation step:
```bash
dart run build_runner build -d
```

### Build & Deployment
The project provides scripts for building and deploying to your Raspberry Pi. You can customize the behavior using the following environment variables:

- **`RPI_HOST`** – IP address of the Raspberry Pi. \
Default: `192.168.4.1`
- **`RPI_USER`** – SSH user for deployment. \
Default: `pi`
- **`BUILD_NUMBER`** – Optional build identifier to tag your deployment. \
Default: `0`

All variables have sensible defaults, so setting them is optional. To deploy, simply run:
```bash
chmod +x deploy.sh
./deploy.sh
```

## Features
- [Dashboard]({{< ref "/01-botui/00-dashboard" >}}): The first screen you see when starting the robot.
- [Sensors & Actors]({{< ref "/01-botui/01-sensors-actors" >}}): A screen for all the sensor and actor graphs.
- [Programs]({{< ref "/01-botui/02-programs" >}}): Here you can see all your executable programs.
- [Settings]({{< ref "/01-botui/03-settings" >}}): The settings of the robot can be found here.