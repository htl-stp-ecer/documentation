---
title: "list"
author: "Schwanzer Florian"
date: 2026-03-26
draft: true
weight: 6
---

# raccoon list

List can be used to either show all projects or all missions in an project.

## raccoon list projects

### Options

| Option | Default | Description                      |
|--------|---------|----------------------------------|
| `--path PATH` | current directory | Directory to search for projects |

### What it does:

- Searches the specified directory and its immediate subdirectories
- Finds all directories containing raccoon.project.yml
- Displays a table with project information
- Shows mission count for each project

### Example Output
```
Searching for projects in: /home/user/example

                      Raccoon Projects                       
┏━━━━━━┳━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━┓
┃    # ┃ Project Name      ┃ Location            ┃ Missions ┃
┡━━━━━━╇━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━┩
│    1 │ SensorCalibration │ ./SensorCalibration │        2 │
│    2 │ Example Project   │ ./manual-example    │        1 │
│    3 │ test              │ ./test              │        3 │
│    4 │ TestProject       │ ./TestProject       │        1 │
└──────┴───────────────────┴─────────────────────┴──────────┘
```


## raccoon list missions
List all the missions in the current project


### Example Output

```
Project: SensorCalibration
Location: /home/user/example/SensorCalibration

                         Missions                          
┏━━━━━━┳━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━┓
┃    # ┃ Mission Class   ┃ File                ┃ Status   ┃
┡━━━━━━╇━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━┩
│    1 │ SetupMission    │ setup_mission.py    │ ✓ Exists │
│    2 │ ShutdownMission │ shutdown_mission.py │ ✓ Exists │
└──────┴─────────────────┴─────────────────────┴──────────┘

Total: 2 mission(s)

╭───────────────────────────────────────────╮
│ All clear - no warnings or errors logged! │
╰───────────────────────────────────────────╯
```