---
title: "Simulation & Vision"
date: 2024-01-01
draft: false
weight: 8
---

# Simulation, Vision, and Advanced Tools

Beyond the core platform, Raccoon includes simulation environments, computer vision, path planning, and a web-based IDE backend.

## Botball Simulator

**Repository:** `Botball-Simulator/`
**Tech:** Unity (C#)

A 3D physics-based simulator for testing robot behavior without hardware. Features:

- Realistic physics simulation of the game table environment
- Camera randomization for generating synthetic training data
- Background clutter and lighting variation for robust object detection training
- Object placement randomization on the table surface

Used primarily for generating training datasets for the object detector and validating robot behavior in a controlled environment.

## Mission Simulator (goonbuddyy)

**Repository:** `goonbuddyy/`
**Tech:** Unity (C#) + Angular (TypeScript)

A mission-focused simulator with two components:

### Unity Game
- Tests path planning output and sensor-based maneuvers
- Validates command sequences (drive, turn, line-up, line-follow)
- WebGL build for browser access

### Web Simulator (Angular)
- Interactive game table canvas with pan/zoom
- Real-time robot animation from command sequences
- Sensor simulation (line detection, wall bumping)
- Playback controls (play, pause, step, reset)
- Command editing and verification
- Built with Angular 19, PrimeNG, and RxJS

The web simulator is accessible at the gametable web interface and allows testing missions without hardware.

## Object Detector

**Repository:** `object-detector/`
**Tech:** Python, PyTorch, YOLOv11/v12

Real-time object detection for identifying game elements on the table during competition.

### Pipeline
1. **Data Collection** -- Camera images + synthetic data from the simulator
2. **Annotation** -- Label Studio for manual labeling, Roboflow for dataset management
3. **Training** -- YOLOv11/v12 nano models optimized for Raspberry Pi inference
4. **Inference** -- Real-time detection streaming results via LCM (`libstp/yolo/frame`)

### Training
```bash
# Train YOLOv11 nano model
python train.py --model yolo11n --data dataset.yaml --epochs 100

# Or use the Jupyter notebooks
jupyter lab train.ipynb
```

### Integration
Detection results are published as `yolo_frame_t` LCM messages containing bounding boxes with class labels and confidence scores. The botui can visualize these in the YOLO Viewer screen.

### Dataset Tools
- `scripts/active_select.py` -- Active learning for efficient labeling
- `scripts/tile_dataset.py` -- Dataset preprocessing
- `scripts/convert_to_yolo.py` -- Format conversion
- `scripts/merge_datasets.py` -- Combine multiple data sources

## Path Planner

**Repository:** `path-planner-test/`
**Tech:** Python, NetworkX, Shapely

A correction-aware path planner designed for robots without encoders. Instead of finding the shortest path, it optimizes for paths that maximize opportunities for position correction using environmental features.

### Key Insight

The robot drifts 2.5-7.5% per movement (no encoders). The planner exploits game table features for correction:

| Feature | Correction Method |
|---------|------------------|
| Black lines | Line-up: drive perpendicular until both sensors detect the line |
| Walls/PVC pipes | Wall alignment: drive against the wall to reset position |
| Line paths | Line following: follow a line for maximum accuracy |

### Pipeline
```
PNG Map (1px = 1 inch) → Feature Extraction → Navigation Graph → A* Pathfinding → Command Sequence
```

1. **Map Loading** -- Reads a PNG image of the game table
2. **Feature Extraction** -- Detects black lines, walls, and intersections
3. **Graph Construction** -- Builds nodes at correction points (line endpoints, wall corners)
4. **Pathfinding** -- A* search with drift-based cost function (prefers correction-rich paths)
5. **Command Generation** -- Converts path to executable commands (drive, turn, line-up, follow-line)

### Robot Model
- Default: 22cm wide x 10cm long
- Two front-mounted black/white sensors
- No encoders -- relies entirely on environmental features for position correction

### Interactive Visualization (v2.0)
- MapViewer GUI with zoom/pan and feature overlays
- Hover tooltips showing feature details
- Point placement for start/goal with heading
- Path computation with status feedback

### Testing
253 tests validate the full pipeline from map parsing through command generation.

## WebIDE Backend

**Repository:** `backendide/`
**Tech:** Python, FastAPI

The backend for the browser-based development environment. Provides REST APIs for:

### Step Discovery
Scans the installed `libstp` package for `@dsl` decorated functions and returns their signatures, types, and metadata. This powers the drag-and-drop step editor in the WebIDE.

### Device Management
- `GET /device/info` -- Hostname, battery voltage/percentage, dimensions, sensors
- `PUT /device/hostname` -- Change device hostname
- Battery monitoring via LCM subscription

### Architecture
```
FastAPI (Uvicorn)
├── Device API (/api/v1/device)
├── Steps API (/api/v1/steps)
├── Battery Listener (LCM background thread)
├── SQLite storage (device config)
└── Unity WebGL static file serving
```

The backend uses dependency injection with mock/system repository switching, enabling testing without hardware.

### Running
```bash
python run.py           # Development (HTTP, port 8000)
python run_https.py     # Production (HTTPS with certs)
```

Deploys as a systemd service (`ide-backend.service`) on the Raspberry Pi.

## Game Table

**Repository:** `gametable/`
**Tech:** ESP32 (PlatformIO) + Next.js (TypeScript)

Manages the physical game table hardware and provides a web dashboard:

- **Embedded firmware** (ESP32-C3) for table sensors and scoring
- **Web interface** (Next.js 16 + React 19 + Tailwind CSS) for tournament management, monitoring, and configuration

The web interface runs on the game table's own microcontroller, providing a separate control interface from the robot.
