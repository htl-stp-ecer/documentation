# Quick Start Session Notes
*Raw notes from beginner walkthrough — source material for rewriting the quick start docs*

---

## Required Resources (Hardware)
- Wombat controller
- SD card (needs flashing — see Step 0)
- Battery pack
- DC motors + cables
- **USB keyboard** ← required to enter WiFi password on the Wombat

---

## Step 0 — Flash the SD Card
- Download the latest RaccoonOS `.img` file — TODO: INSERT DOWNLOAD LINK
- Flash it using **Balena Etcher** or **Raspberry Pi Imager**
- Unscrew the lid on the **back** of the Wombat to access the SD card slot — be careful!
- Insert the flashed SD card
- *(For workshop/sessions where SD is pre-flashed: skip this step)*

---

## Step 1 — Power On & Confirm Boot
- Connect battery and power on the Wombat
- Confirm it booted by seeing the **BotUI** appear on the touchscreen

---

## Step 2 — Connect the Wombat to a Network
Three connection modes available (via **Settings → WiFi** in BotUI):
- **Hotspot**: Wombat creates its own WiFi network — you connect your laptop to it
- **WiFi Client**: Wombat joins an existing WiFi network
- **LAN**: Plug in ethernet cable (peer-to-peer also supported)

### For WiFi Client mode:
1. Settings → WiFi → select **WiFi Client** from dropdown
2. Click **Connect to WiFi** — lists detected networks
3. Scroll and click your network
4. Enter password using a **USB keyboard** plugged into the Wombat
5. Click **Connect** — status turns green when successful
6. Go back to WiFi overview → click **Device Info** to see the assigned IP address

> **TODO:** Link to BotUI docs for full detail on each mode — also update BotUI section to cover WiFi modes in depth

### Troubleshooting — robot not reachable after connecting:
- Sometimes the IP isn't reachable right after connecting (network manager bug)
- **Fix: Reboot the Wombat** — it will reconnect and become reachable

---

## Step 3 — Install raccoon-cli on Your Laptop

**Requires Python 3.11+**

1. Go to https://github.com/htl-stp-ecer/raccoon-cli/releases/
2. Find the latest release — **follow the install instructions in the release itself**, they may be more recent than these docs
3. Download both `.whl` files and install them:

Via `gh` CLI (replace version number with the latest):
```bash
gh release download v0.1.25 -R htl-stp-ecer/raccoon-cli -p "*.whl"
pip install raccoon_transport-0.1.25-py3-none-any.whl raccoon-0.1.25-py3-none-any.whl
```

Or if you downloaded the `.whl` files manually:
```bash
pip install raccoon_transport-0.1.25-py3-none-any.whl raccoon-0.1.25-py3-none-any.whl
```

**On Ubuntu/Debian**, pip will complain about an externally-managed environment. Add `--break-system-packages`:
```bash
pip install --break-system-packages raccoon_transport-*.whl raccoon-*.whl
```

If `raccoon` is not found after installing, check that Python's script directory is in your `$PATH`.

### Verify the install:
```bash
raccoon -h
```
You should see a list of available commands.

---

## Step 4 — Create a Project

The raccoon CLI only works inside a project folder. Create one first:

```bash
raccoon create project MyRobot
cd MyRobot
```

This scaffolds the project structure.

---

## Step 5 — Connect to the Robot

```bash
raccoon connect 192.168.178.124
```
(replace with the IP shown on your Wombat's screen)

What this does:
1. Checks the robot's API server at `<IP>:8421`
2. Tries SSH key authentication — if it fails, asks: *"Set up SSH key authentication now?"*
3. Say **yes** — it will prompt for the Wombat's password
   - Default credentials: **user:** `pi` / **password:** `raspberrypi`
4. Creates and copies an SSH key to the Wombat, then retrieves an API access token

Re-run `raccoon connect <IP>` any time the robot's IP changes.

> **⚠️ Security:** Change the default password once everything is set up!

---

## Step 6 — Update to matching versions

If you see a version mismatch warning (e.g. `Client: 0.1.25  Server: 0.1.23`), run:

```bash
raccoon update
```

This connects to the Pi, checks both sides against the latest GitHub release, and downloads + runs the install scripts automatically.

**Requires the `gh` CLI to be set up** (GitHub CLI), as the repos are currently private.

Usually things still work despite a minor version mismatch, but it's good practice to update before starting.

---

---

## [OPTIONAL] IDE Setup — PyCharm with SSH Interpreter

Not required, but highly recommended for a good coding experience (tab completion against the robot's actual Python environment).

> **Note:** Future versions of raccoon will not require an SSH interpreter setup.

**Requirements:** PyCharm with a [students license](https://www.jetbrains.com/community/education/) (for full SSH interpreter features)

### Steps:
1. Open the project folder (`MyRobot/`) as a PyCharm project
2. Configure an SSH interpreter:
   - Follow: https://www.jetbrains.com/help/pycharm/configuring-remote-interpreters-via-ssh.html
   - **Host:** your Wombat's IP, **Username:** `pi`
   - **No password needed** — SSH key was already set up by `raccoon connect`
   - Just click through / Next on the auth step
3. When asked which interpreter to use: select **"Use existing interpreter"**
   - Use the system-wide **Python 3.13+** on the Pi
4. **Disable automatic file upload** — raccoon handles syncing, this isn't needed
5. PyCharm will index the remote environment — after that you have full tab completion against the robot's libraries

---

---

## Step 7 — Configure Your Hardware

Run the interactive wizard (recommended):
```bash
raccoon wizard
```

Or configure manually — all hardware config lives in `raccoon.project.yml` and the included `config/*.yml` files (split for readability):

| File | What it configures |
|---|---|
| `config/robot.yml` | Drivetrain kinematics, PID, odometry, physical dimensions |
| `config/hardware.yml` | Sensors, motors, servos (pulls in motors.yml + servos.yml) |
| `config/motors.yml` | Motor ports, inversion, calibration |
| `config/servos.yml` | Servo ports and named positions |
| `config/connection.yml` | Robot IP, port, user |

### Drivetrain (`config/robot.yml` → `drive.kinematics`)
- Set `type`: `differential` (2-wheel) or `mecanum` (4-wheel omnidirectional)
- Set `wheel_radius` (meters) and `wheelbase` (meters) — measure your robot
- Set `left_motor` / `right_motor` to the motor names defined in `motors.yml`

### Motors (`config/motors.yml`)
- `port`: physical motor port on the Wombat (0–3)
- `inverted`: set to `true` if the motor spins the wrong direction

> **Critical:** All motors must spin **forward** when commanded a positive power. Define your own "forward" direction — the Wombat can be mounted any way, the software accounts for it. Fix wrong directions with `inverted: true` here or via hardware wiring.

### Sensors (`config/hardware.yml`)
- Define each sensor with its `type` and `port`
- Common types: `Motor`, `Servo`, `IRSensor`, `DigitalSensor`, `AnalogSensor`, `IMU`
- Group IR sensor pairs into a `SensorGroup` for line following and lineup

> **TODO (phase 2):** Link to Robot Definition docs (`02-programming/02-robot-definition.md`) for full config reference — it covers all types with examples.

### ⚠️ This file matters
If the config is wrong, your robot will behave incorrectly. Double-check ports, inversion, and dimensions before running anything.

---

## Step 8 — Run Your Project

```bash
raccoon run
```

This is the command you'll use 99% of the time. It does everything in order:
1. Creates a local checkpoint (safety snapshot in case something goes wrong)
2. Syncs (pushes) your files to the robot
3. Runs `codegen` to regenerate `defs.py` and `robot.py` from your YAML
4. Executes the program on the robot, streaming output back to your terminal
5. Creates another checkpoint
6. Syncs (pulls) any updated files back

You can also trigger individual steps manually if needed:
```bash
raccoon codegen   # regenerate hardware files only
raccoon sync      # push/pull files only
```

But `raccoon run` covers all of it.

### What a successful run looks like

```
INFO     Authentication (publickey) successful!
Checkpoint e4b6191 saved
Syncing 'MyRobot' (pushing to ConeBot)...
INFO     Using rsync backend for file sync
Sync complete!
  Uploaded Files:  16
  Bytes Total: 8978

Running 'MyRobot' on ConeBot...
Command ID: df78490a-...
Press Ctrl+C to stop

INFO     Starting code generation pipeline...
INFO     ✓ Generated defs.py
INFO     ✓ Generated defs.pyi
INFO     ✓ Generated robot.py
INFO     ✓ Code generation completed successfully
INFO     Running src.main...

2026-03-22 12:03:42 | warning  | [Robot]: Robot does not have any missions attached
2026-03-22 12:03:42 | info     | [Robot]: Setup mission found
2026-03-22 12:03:42 | info     | [Robot]: Starting robot
...
^C
Cancelling...
Syncing changes from Pi...
Checkpoint 367f1e8 saved
Sync complete!
  Downloaded: 4
```

Key things to notice:
- **Codegen runs on the robot**, not on your laptop — `defs.py` and `robot.py` are generated there
- **"Robot does not have any missions attached"** is expected for a fresh project — you'll add missions next
- **Output is streamed live** from the robot to your terminal
- Press **Ctrl+C** to stop the run — raccoon will cleanly shut down the robot and pull files back
- Checkpoints are git snapshots saved automatically before and after each run (requires git installed)

---

---

## Step 9 — Smoke Test: Does It Drive?

Before moving on, verify the robot actually drives. Write a minimal test mission with a drive forward and a turn, then run it.

Expected: the robot moves. Distance and straightness may be off — that's fine for now.

**If the robot doesn't drive forward at all**, the problem is almost always the motor config in `config/motors.yml`:
- Are `left_motor` and `right_motor` assigned to the correct ports?
- Are any motors `inverted: true` when they shouldn't be (or vice versa)?
- Remember: both motors must spin **forward** for a positive power command

Fix the YAML, then `raccoon run` again.

> **TODO (phase 2):** Add a minimal drive + turn mission code snippet here as the test case.

---

## [OPTIONAL] Calibration — Make It Drive Correctly

Two calibration steps are needed to make the robot drive cleanly:

### 1. Calibrate encoders (`calibrate()` step)
- Run the `calibrate()` step in your mission
- Calibrates `ticks_to_rad` for each motor (how encoder ticks map to wheel rotation)
- **Must be run every run** for accurate odometry

### 2. Auto-tune (`auto_tune()` step)
- Run the `auto_tune()` step
- Measures the robot's actual speed, acceleration and deceleration
- Tunes PID controllers automatically
- Result: robot drives quickly and correctly
- Run this once (or when hardware changes)

> **TODO (phase 2):** Add code snippets showing how to call `calibrate()` and `auto_tune()` in a mission. Link to calibration docs.

---

## [OPTIONAL] Web IDE — Configure Sensors

```bash
raccoon web
```

Opens the Web IDE in your browser.

If you have sensors defined on your robot, you **must** configure them in the Web IDE settings:
- Open the **Settings** menu in the Web IDE
- Place each sensor on the "virtual" robot to match its **physical position** on the real robot
- Set the correct **rotation center** of the robot
- This is required for correct behaviour when driving to positions or lining up on lines

> **TODO (phase 2):** Link to dedicated Web IDE section for full detail.

---

## Step 10 — Create Your First Mission

```bash
raccoon create mission MyFirstMission
```

Then add it to the missions list in `config/missions.yml`.

> **TODO (phase 2):** Link to programming/missions docs for full detail on writing mission logic — how to name missions correctly, what goes in them, and how the missions list in the YAML works.

---

---

## Confirmed Step Order

1. Flash SD card with RaccoonOS image
2. Insert SD card, power on Wombat, confirm BotUI appears
3. Connect Wombat to network (Settings → WiFi in BotUI)
4. Install raccoon-cli on laptop (Python 3.11+ required)
5. Create a project (`raccoon create project`)
6. Connect to robot (`raccoon connect <IP>`)
7. Update versions (`raccoon update`)
8. Configure hardware (wizard or manual YAML editing)
9. Run smoke test (`raccoon run`) — confirm it drives forward and turns
10. *(Optional)* IDE setup — PyCharm SSH interpreter
11. *(Optional)* Web IDE sensor config (`raccoon web`)
12. *(Optional)* Calibration — `calibrate()` every run, `auto_tune()` once

---

## TODO / Open Questions
- [ ] What is the exact download URL for the RaccoonOS image?
