---
title: "Create"
author: "Florian Schwanzer"
date: 2026-03-19
draft: true
weight: 2
---

# Create
There are two different types that can be created.

## Creating a Project
```bash
raccoon create project <name>
```
With this command we can create a new Raccoon Project with the specified name.

Further arguments that can be given:
- `--path`
    ```bash
    raccoon create project TestProject --path /path/to/parent/dir
    ```
    With the given option `--path` you can tell Raccoon to create the project in a specific directory.
    
    Default is the current directory.
- `--no-wizard`
  ```bash
  raccoon create project TestProject --no-wizard
  ```
  The configuration wizard will be skipped for creation. This is not recommended

### Setup-Wizard Steps
TODO: Move to wizard command section
1. Establish Connection to Pi
   2. Pi address (IP or hostname)
   3. Port
   4. SSH Username
5. Project Name (Default: the given name in the command)
6. Drivetrain Type (mechanum, differential) (Default: mechanum)
7. Port of the front-left motor (Default: 0)
8. Is the front-left motor inverted (Default: No)
9. Port of the front-right motor (Default: 1)
10. Is the front-right motor inverted (Default: Yes)
11. Port of the rear-left motor (Default: 2)
12. Is the rear-left motor inverted (Default: No)
13. Port of the rear-right motor (Default: 3)
14. Is the rear-right motor inverted (Default: Yes)
15. Diameter of the wheel in mm (Default: 60)
16. Track width (cm, left <-> right wheel centers) (Default: 19)
17. Wheelbase (cm, front <-> rear axle centers) (Default: 12)
18. Velocity low-pass alpha (0-1) (Default: 0.8)
19. Run the guided encoder encoder tick acceleration (Default: No)
    20. Ticks per wheel revolution (Default: 314159)

### What the command does
1. Creates a new project with the given name and path
2. Creates project template structure (/src, /src/hardware, /src/missions, etc.)
3. Creates config files with the given setup values
   4. `connection.yml` with the connection to the pi
   5. `hardware.yml` with Settings for the ports
   6. `missions.yml` with all defined missions
   7. `motors.yml` settings for the motors
   8. `robot.yml` settings for the drive, motionPID and odometry
   9. `servos.yml` settings for the servos
4. Create a `raccoon.project.yml` with the references to the config files

## Creating a Mission


