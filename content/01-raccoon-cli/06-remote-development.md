---
title: "Remote Development"
date: 2024-01-01
draft: false
weight: 7
---

# Remote Development

raccoon lets you develop on your laptop and run on the robot with automatic file sync. The remote development commands manage the connection between your laptop and the robot.

---

## Connecting to a Robot

```bash
raccoon connect <ip-address>
```

Example:

```bash
raccoon connect 192.168.4.1
```

raccoon saves this connection so you do not need to specify the IP address every time. If you work with multiple robots, run `raccoon connect` with the new IP to switch.

---

## Checking the Connection Status

```bash
raccoon status
```

Shows:

- Whether you are currently connected
- The IP address and hostname of the connected robot
- The port being used

---

## Syncing Files Manually

`raccoon run` syncs files automatically, but you can also sync manually:

```bash
raccoon sync
```

This uploads only the files that have changed since the last sync, keeping things fast.

To force a full re-upload of all files (useful after major changes or if files seem out of sync):

```bash
raccoon sync --force
```

---

## Disconnecting

```bash
raccoon disconnect
```

Removes the saved connection. The robot continues running normally — this only affects your laptop's raccoon state.

---

## Switching Between Robots

If you have multiple robots, simply run `raccoon connect` with the new IP address. The previous connection is replaced.

raccoon remembers previously connected robots in `~/.raccoon/config.yml`. You can also set a default user there:

```yaml
known_pis:
  - hostname: raccoon-pi
    address: 192.168.4.1
default_pi_user: pi
```

---

## Opening the Web IDE

```bash
raccoon web
```

This opens the Web IDE in your default browser, automatically pointed at the connected robot. See the [Web IDE guide]({{< ref "/03-web-ide" >}}) for full details.
