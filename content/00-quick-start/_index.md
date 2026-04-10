---
title: "Quick Start"
author: "Tobias Madlberger"
date: 2026-03-22
draft: false
weight: 1
---

# Quick Start

From unboxed hardware to a driving robot in as few steps as possible.

---

## What You Need

**Hardware:**
- Wombat controller with RaccoonOS flashed to the SD card
- Battery pack
- At least 2 DC motors wired to motor ports
- **USB keyboard** — needed once to enter WiFi password on the Wombat

**On your laptop:**
- Python 3.11 or newer
- A terminal

---

## Step 1 — Flash the SD Card

Download the latest **RaccoonOS** image from:

> **[github.com/htl-stp-ecer/raccoon-image/releases](https://github.com/htl-stp-ecer/raccoon-image/releases)**

Grab the `.img.xz` file from the most recent release. Then flash it to your SD card:

Use **[Raspberry Pi Imager](https://www.raspberrypi.com/software/)** (Windows, macOS, Linux):
1. Click **Choose OS** → **Use custom** → select the `.img.xz` file
2. Click **Choose Storage** → select your SD card
3. Click **Next** and confirm — it will flash and verify automatically

Alternatively, [Balena Etcher](https://etcher.balena.io/) works just as well: **Flash from file** → select the `.img.xz` → **Select target** → **Flash!**

Then unscrew the lid on the **back** of the Wombat, insert the SD card, and close it up again.

> If your SD card was pre-flashed (e.g. at a workshop), skip to Step 2.

> **Important:** After flashing a new SD card, the Wombat's STM32 co-processor firmware also needs to be updated. Once you've completed setup and can reach the robot, run `raccoon update` (see [Step 6](#step-6--update)) to flash the latest STM32 firmware.

---

## Step 2 — Power On & Connect to a Network

Connect the battery and power on the Wombat. After a few seconds the **BotUI** touchscreen dashboard appears — that's your confirmation it booted correctly.

The Wombat supports three connection modes. Open **Settings → WiFi** in BotUI to choose one:

| Mode | When to use |
|------|-------------|
| **WiFi Client** | Join your existing WiFi network |
| **Hotspot** | Wombat creates its own network — your laptop connects to it |
| **LAN** | Plug in an ethernet cable (peer-to-peer also works) |

For **WiFi Client** mode:
1. Select **WiFi Client** from the dropdown and click **Connect to WiFi**
2. Scroll to your network and tap it
3. Enter the password using a **USB keyboard** plugged into the Wombat
4. When the status turns green, go back and tap **Device Info** to see the IP address

> Note the IP — you'll need it shortly. Example: `192.168.178.124`

**If the robot isn't reachable after connecting:** this is a known network manager issue. Reboot the Wombat and it will reconnect.

→ See [BotUI documentation]({{< ref "/01-botui" >}}) for full detail on all connection modes.

---

## Step 3 — Install raccoon-cli

raccoon-cli is the tool you use to manage projects, generate code, and run programs on the robot.

**Requires Python 3.11+.**

1. Go to **[github.com/htl-stp-ecer/raccoon-cli/releases](https://github.com/htl-stp-ecer/raccoon-cli/releases)** and find the latest release
2. Download both `.whl` files
3. Install them:

```bash
pip install raccoon_transport-*.whl raccoon-*.whl
```

> **Ubuntu/Debian:** pip may refuse with `externally-managed-environment`. Add `--break-system-packages`:
> ```bash
> pip install --break-system-packages raccoon_transport-*.whl raccoon-*.whl
> ```

> **"raccoon: command not found"** after installing? Make sure Python's script directory is in your `$PATH`.

Verify it worked:

```bash
raccoon -h
```

You should see a list of available commands.

---

## Step 4 — Create a Project

raccoon only works inside a project folder. Create one first:

```bash
raccoon create project MyRobot
cd MyRobot
```

→ See [Project Structure]({{< ref "/02-programming/01-project-structure" >}}) for an explanation of what gets created.

---

## Step 5 — Connect to the Robot

```bash
raccoon connect 192.168.178.124
```

Replace the IP with the one shown on your Wombat's screen.

On first connect, raccoon will attempt SSH key authentication. If that fails it asks:
> *"Set up SSH key authentication now?"*

Say **yes**. When prompted for a password, use the Wombat's default credentials:
- **User:** `pi`
- **Password:** `raspberrypi`

raccoon will create an SSH key, copy it to the Wombat, and save an API token. From here on, no password is needed.

> **Security:** Change the default password once your setup is complete.

If the robot's IP ever changes, just re-run `raccoon connect <new-IP>`.

---

## Step 6 — Update

If raccoon warns about a version mismatch between your laptop and the robot, run:

```bash
raccoon update
```

This checks both sides against the latest release and updates anything that's out of date. It requires the [GitHub CLI (`gh`)](https://cli.github.com/) to be installed and authenticated.

---

## Step 7 — Configure Your Hardware

`raccoon create project` already asked you for basic hardware settings (drivetrain type, motor ports, etc.) during project creation. If you need to change anything later, run the interactive wizard:

```bash
raccoon wizard
```

It walks you through drivetrain type, motor ports, inversion, and robot dimensions. Answers are saved to `raccoon.project.yml` and the `config/` files.

**The most critical setting:** all motors must spin **forward** when given a positive power command. Decide which direction is "forward" for your robot, then set `inverted: true` in `config/motors.yml` for any motor that spins the wrong way.

> The Wombat can be mounted in any orientation — the software accounts for it.

→ See [Robot Definition]({{< ref "/02-programming/02-robot-definition" >}}) for the full YAML reference.

---

## Step 8 — Run It

```bash
raccoon run
```

This does everything in one command:
1. Saves a local checkpoint (safety snapshot)
2. Syncs your files to the robot
3. Runs code generation on the robot (`defs.py`, `robot.py`)
4. Executes `src/main.py`, streaming output to your terminal
5. Saves another checkpoint and pulls any updated files back

You should see the robot boot, run the setup mission, and wait. Press **Ctrl+C** to stop.

A fresh project has no missions yet — you'll see:
```
warning  | [Robot]: Robot does not have any missions attached
```
That's expected. The robot is running correctly.

---

## Step 9 — Test Basic Motion

Create a smoke test mission:

```bash
raccoon create mission M01SmokeMission
```

Open the generated file in `src/missions/m01_smoke_mission.py` and add a simple sequence:

```python
from libstp import *


class M01SmokeMission(Mission):
    def sequence(self) -> Sequential:
        return seq([
            drive_forward(30),   # drive 30 cm forward
            turn_right(90),      # turn 90° right
        ])
```

Then register it in `config/missions.yml`:

```yaml
- SetupMission: setup
- M01SmokeMission
```

Run it:

```bash
raccoon run
```

The robot should drive forward and turn. Distance and straightness may be off — that's fine for now. What matters is that it moves in the right direction.

**If it doesn't move at all:** check `config/motors.yml` — are the port numbers correct, and is `inverted` set correctly for each motor?

→ See [Missions]({{< ref "/02-programming/03-missions" >}}) and [Steps]({{< ref "/02-programming/04-steps" >}}) for the full API.

---

## What Comes Next

Your robot is running. Here's where to go from here:

| Topic | Where |
|-------|-------|
| Make it drive accurately | [Calibration]({{< ref "/02-programming/10-calibration" >}}) |
| Add sensors, servos, and other hardware | [Robot Definition]({{< ref "/02-programming/02-robot-definition" >}}) — edit `raccoon.project.yml` |
| Writing real missions | [Missions]({{< ref "/02-programming/03-missions" >}}) |
| Sensors, servos, drive system | [Programming Guide]({{< ref "/02-programming" >}}) |
| Configure sensor positions visually | [Web IDE]({{< ref "/03-web-ide" >}}) — run with `raccoon web` |
| All CLI commands explained | [raccoon-cli reference]({{< ref "/04-raccoon-cli" >}}) |
| What you can do from the touchscreen | [BotUI]({{< ref "/01-botui" >}}) |

---

## Optional: IDE Setup

Open the project folder in your preferred IDE (PyCharm, VS Code, etc.). You'll have full tab completion on all libstp types out of the box — no special interpreter configuration needed.
