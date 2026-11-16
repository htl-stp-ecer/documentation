---
title: "Settings"
author: "Jakob Schlögl, Mario Scholze"
date: 2026-11-16
draft: false
weight: 4
---

# Settings

The Settings screen is a grid of seven tiles. Four of them (Network, System, Display, Services) lead to further screens, the other three open one screen each.

| Tile | Opens |
|------|-------|
| **Network** | [Connection mode, Wi-Fi, hotspot, Ethernet](#network) |
| **System** | [Hostname, keyboard layout, reboot, shutdown](#system) |
| **Display** | [Color theme, rotation, overview panel, screensaver, touch calibration, hide UI](#display) |
| **Personality** | [The robot's face](#personality) |
| **Logs** | [Output of earlier program runs](#logs) |
| **Versions** | [Installed component versions](#app-status) |
| **Services** | [Status and control of the robot's systemd services](#services) |

![IMG: Homepage for settings](/images/botui/settings/botui-settings.png)

## Where Settings Are Stored

Settings live in two different places. This matters when something does not survive a restart, or when you change a robot with `raccoon` from the laptop.

| Kept by | Settings | Survive a reboot? |
|---------|----------|-------------------|
| **BotUI** (its own preferences on the robot) | Color theme, overview panel position, screensaver on/off, touch calibration, remembered screen rotation | Yes |
| **The operating system** | Hostname, keyboard layout, Wi-Fi networks and hotspot, service autostart, screen rotation (in the `flutter-ui` service) | Yes |

None of this touches your project's configuration (`raccoon.project.yml`, `robot.yml`, calibration files). Those belong to the project and are managed with the [raccoon CLI]({{< ref "/03-raccoon-cli/_index.md" >}}).

Everything that changes the system runs with `sudo`. If passwordless `sudo` is missing for the `pi` user, BotUI says so in a dialog ("Missing passwordless sudo, can't …") instead of failing quietly.

---

## Network {#network}

**Settings → Network** has two tiles:

- **Manage Connection**: pick the connection mode and manage it.
- **Network Scan**: see which Wi-Fi channels are busy.

### Manage Connection

At the top you choose the **network mode**. Exactly one mode is active at a time, and switching takes a few seconds (a message "Switching to …" is shown until it is done).

| Mode | The robot… | Tiles below the selector |
|------|------------|---------------------------|
| **WiFi** | joins an existing Wi-Fi network | Scan Networks, Saved Networks, Device Info |
| **Hotspot** | creates its own Wi-Fi network that your laptop joins | Hotspot Settings, Device Info |
| **Ethernet** | uses the cable only; Wi-Fi and hotspot are off | Device Info |

#### WiFi Mode

- **Scan Networks** lists the networks in range with signal strength. Tap one to connect. A network with a password asks for it (a USB keyboard is needed to type it, see below), an open network connects directly, and a WPA2/WPA3 Enterprise network asks for the user name and password. **Manual** at the top connects to a network that is not in the list (hidden SSID): enter the name, choose the encryption type, enter the credentials.
- **Saved Networks** lists every network the robot has connected to before. A saved network is reconnected by itself when it is in range. Each entry shows whether the robot is connected to it, when it was last connected or that it is not in range, and the saved password. Tap an entry to connect, or remove it from the list (with confirmation).

> **Note:** Typing a password needs a USB keyboard on the Wombat. The layout of that keyboard is set under [System → Keyboard](#system).

#### Hotspot Mode

**Hotspot Settings** is where the hotspot is configured and started:

| Setting | Notes |
|---------|-------|
| **Network Name (SSID)** | At least 3 characters |
| **Password** | At least 8 characters; a button generates a secure one |
| **WiFi Band** | 2.4 GHz, 5 GHz or Auto |
| **Security** | WPA3 Personal (recommended) or WPA2 Personal |
| **Hidden Network** | Does not appear in scan lists |

![IMG: Example of using default values to create a new hotspot](/images/botui/settings/wifi-hotspot.png)

The buttons are **Start Hotspot**, and, once it runs, **Restart** (apply changed settings) and **Stop Hotspot**. If you switch to Hotspot mode without having configured one, BotUI starts one with a generated name `Raccoon-Robot-NNN` and password `raccoonNNN` (three random digits), on the best band.

The hotspot needs a restart after you [change the hostname](#system); BotUI does that for you.

#### Ethernet Mode

Uses the wired connection only. The Ethernet status shows whether the mode is active and whether a cable is detected. You can only switch to Ethernet mode while a cable is plugged in.

BotUI also reacts to the cable itself, see [System Popups → Ethernet cable]({{< ref "/05-bot-ui/07-system-popups.md#ethernet-cable" >}}).

#### Device Info

**Device Info** is the page to open after connecting: it shows the **IP address** you need for `raccoon connect`, the **MAC address**, and the status. Depending on the mode it adds the SSID and security of the joined network, the Ethernet role (host or client) and connected devices, or the hotspot's name, password (hidden until you tap show), security, band and connected devices.

![IMG: Device info example screen](/images/botui/settings/wifi-device-info.png)

If the robot says it is connected, but your laptop cannot reach it, reboot the robot. NetworkManager sometimes needs that.

### Network Scan

**Network Scan** is the **Wi-Fi Channel Graph**. It scans the surroundings and shows, for the 2.4 GHz and 5 GHz band, how many networks use which channel and how much they overlap. It **recommends** the channel with the least interference. Use it before a competition to set the hotspot band, because at a crowded event the choice of channel decides whether the connection is stable.

---

## System {#system}

| Tile | What it does |
|------|--------------|
| **Hostname** | Sets the robot's name. This changes the system hostname and the mDNS name together, so other devices reach the robot as `<name>.local`. Only letters, digits and hyphens are allowed (up to 63 characters). **Apply** saves it and restarts the hotspot if one is running. |
| **Keyboard** | Chooses the layout of a USB keyboard: **English (US)** or **German (DE / AT)**. It is written to `/etc/default/keyboard`; a reboot makes sure it applies everywhere. |
| **Reboot** | Asks for confirmation ("The device will restart."), then reboots. |
| **Shutdown** | Asks for confirmation ("The device will power off."), then powers off. Always shut the robot down this way before pulling the battery. |

Give every robot its own **hostname**, especially when several robots share a network. The name is shown on the Dashboard, and it is what you use as `<name>.local`.

---

## Display {#display}

| Tile | What it does |
|------|--------------|
| **Color Theme** | [Changes the colors of all tiles](#color-theme) |
| **Rotate** | [Turns the screen](#rotate) |
| **Overview** | Cycles the [overview panel]({{< ref "/05-bot-ui/00-dashboard.md#overview-panel" >}}) between left, right and off. The label shows the current state, and in portrait mode it says Top / Bottom. |
| **Screensaver** | Turns the [screensaver]({{< ref "/05-bot-ui/00-dashboard.md#screensaver" >}}) on or off. The tile reads **Screensaver On** (cyan) or **Screensaver Off** (grey). |
| **Calibrate** | [Calibrates the touchscreen](#calibrate) |
| **Hide UI** | [Stops BotUI](#hide-ui) |

### Color Theme {#color-theme}

One tile per theme, tap to select; the selected one has a white border and a check mark. The choice is saved at once and applies to the whole app.

| Theme | Look |
|-------|------|
| **Colorful** | Every kind of tile has its own color (default) |
| **Raccoon** | The docs palette: gold, rust and green, repeating from tile to tile, with dark text |
| **Monochrome** | One grey for everything |

Disabled things are grey in every theme.

### Rotate {#rotate}

Turns the display by **0°**, **90°**, **180°** or **270°** (clockwise). Picking another angle changes the `flutter-ui` service so that `flutter-pi` starts with `-r <angle>` (as a drop-in file, the packaged unit stays untouched), reloads systemd and restarts the UI. The screen says "Applying rotation…" while this happens, which takes a few seconds.

![IMG: Screen of the rotation options](/images/botui/settings/rotate-screen.png)

In portrait the Dashboard stacks the overview panel and the menu on top of each other.

### Calibrate {#calibrate}

Calibrates the touchscreen with five targets: the four corners and the center. Each target is a crosshair with a wombat on it, and the text says "Tap the wombat-crosshair (N / 5)". Tap as exactly as you can, and hold the finger or stylus as upright as possible.

After the fifth tap BotUI calculates the 6-coefficient affine matrix with a least-squares fit, saves it in its own preferences and in `/etc/pointercal` (the standard `tslib` file), and restarts `flutter-ui.service` so it takes effect. The matrix is then applied to every tap in the app.

Calibrate again if taps land beside your finger.

### Hide UI {#hide-ui}

Stops the BotUI app so that you can reach the Linux console on the display. A dialog asks first ("The UI will stop. Reboot required to restore."). It runs `systemctl stop flutter-ui`. To bring the UI back without a reboot, log in over SSH and run `sudo systemctl start flutter-ui`. It does not show logs; for those use [Services → Logs](#services).

---

## Personality {#personality}

A read-only page that shows the robot's face. Each robot gets its own look. It is derived from the MAC address of the device, so a robot always has the same face and two robots do not look the same. It is the face you see in the screensaver.

The left side is a live, animated preview (blinking, looking around). The right side lists the traits:

| Attribute | Possible values |
|-----------|-----------------|
| **Trait** | Cheerful, Grumpy, Sleepy, Nervous, Chill, Dramatic, Brainy, Playful |
| **Eye shape** | Rounded, Standard, Angular, Pill, Blocky |
| **Pupil style** | Tall rectangle, Circle, Diamond, Horizontal bar, Cross, Solid |
| **Eyebrows** | Standard, Curved, Thin, Thick, Split, Notched |
| **Eye size** | Width and height factors |
| **Cosmetics** | None, or any of: Antenna, Scar, Freckles, Blush, Circuit lines, Ear nodes, Crown dots, Chin mark |
| **Palette** | Name of the color palette and its variant |

Nothing here can be edited.

---

## Logs {#logs}

**Logs** lists every program run on the robot, newest first, across all programs. Each row shows

- the **number** (1 is the newest run on the robot; this is the same number that `raccoon logs show` uses),
- the **program name**,
- red **`n E`** and yellow **`n W`** badges if the run logged errors or warnings,
- the **duration**, and
- the **start time**.

Tap a row to read the run. The lines are laid out in the same columns as `raccoon logs show`: elapsed time, level, `file:line`, function (if the log has one) and message. Lines are never wrapped; scroll sideways for long ones.

The chips above the log switch levels on and off: **TRACE**, **DEBUG**, **INFO**, **WARN**, **ERROR**. By default INFO, WARN and ERROR are shown. Lines of other levels (such as CRITICAL) are always shown. A counter shows how many lines are visible. The refresh button in the top bar of the list reloads it.

The list loads the 20 newest runs of each program. See [raccoon logs]({{< ref "/03-raccoon-cli/15-logs.md" >}}) for the laptop side.

---

## Versions {#app-status}

**Versions** shows which versions of the RaccoonOS components belong together, and which are installed. Open it first when the robot behaves differently from what you expect.

The page has two sections, in the same component order:

**Bundle metadata** is what the bundle file `/etc/raccoon-bundle.json` says ([Transport contract]({{< ref "/06-advanced/transport/01-contract.md" >}})). **Bundle Version** is the name of the bundle, followed by the version of each component that this bundle expects and the `contract_hash`. The values are shown exactly as written in the file: `v173` stays `v173`, an empty value stays empty, and `dev` is shown as `dev` (version check for this component switched off). If the file is missing or broken, the page says "bundle file missing" or "bundle file unreadable". This part works even when the server is not reachable.

**Installed versions** is what is really on the robot. It is read from the `raccoon-server` (`/version`), except for BotUI itself, whose version is built into the app and shown immediately.

| Component | What it is |
|-----------|------------|
| `raccoon-cli` | The raccoon command-line tool |
| `raccoon-lib` | The Python robot library |
| `raccoon-transport` | The shared-memory transport |
| `botui` | This app |
| `stm32-data-reader` | The service that talks to the STM32 coprocessor |
| `raccoon-cam` | The camera service |

A component that is not installed shows "not installed". If the server cannot be reached, a message says `raccoon-server not reachable`. The refresh button in the top bar reads everything again.

> **Tip:** Before a competition, open Versions and check that the installed versions match the bundle and what you tested with.

---

## Services {#services}

**Services** shows the state of the five systemd services that make up the robot, one tile each:

| Service | Name on screen |
|---------|----------------|
| `ssh.service` | SSH |
| `raccoon.service` | Raccoon |
| `flutter-ui.service` | Bot UI |
| `stm32_data_reader.service` | STM32 Reader |
| `raccoon-cam.service` | Camera |

| Tile status | Meaning |
|-------------|---------|
| **Running** (green) | Active and running |
| **Orange** | Active, but not "running" (for example it already finished) |
| **Red** | Not active, or the state could not be read |
| **Grey** | The service does not exist on this system |

All services are queried at the same time with a timeout of 10 seconds, so the page never hangs. The refresh button in the top bar queries them again, and the page also refreshes when you come back from a service.

Tap a service for its control page, with four buttons:

| Button | Does |
|--------|------|
| **Start** / **Stop** | Starts or stops the service, depending on its current state |
| **Restart** | Restarts it |
| **Logs** | Shows the `journalctl` output of the service: the last 200 lines, then new lines live. The pause button stops the scrolling, the refresh button reloads. |
| **Enable** / **Disable** | Turns autostart at boot on or off |

![IMG: Example status page of the flutter-ui.service](/images/botui/settings/systemd-status.png)

Stopping `flutter-ui` stops BotUI itself, and stopping `raccoon` or `stm32_data_reader` stops programs and hardware access. These are tools for diagnosing a problem, not for everyday use.
