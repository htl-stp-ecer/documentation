---
title: "Logs and errors"
author: "Mario Scholze"
date: 2026-11-19
draft: false
weight: 80
description: "Where the camera service logs, what ends up in the journal and in the log of each run, and which errors reach your program and the UI."
---

# Logs and errors

The service writes down what it does, so you can see why a camera did not open or which processor failed. There are three places to look, and each one has its own job.

| Where | What it holds | Use it for |
|---|---|---|
| The journal of the service | Everything from INFO up: leases, frame statistics, backend and processor changes, the camera opening, retries and failures | Following what happens now |
| The log of each run | Only what is worth keeping: warnings and errors, what happens at start, backend and processor changes | Finding out afterwards what went wrong |
| The error channel | Errors as messages, for your program and the UI | Showing a problem to the user |

## The journal

```bash
journalctl -u raccoon-cam -f
```

The service logs through the standard `logging` module. The journal gets every record at INFO and above. Routine traffic, such as `renew` and the name of each command, is DEBUG and does not appear there.

| What | Example |
|---|---|
| Start of the service | The instance, the configured backend and the stream settings |
| A lease | `lease ... held, the camera stays closed` (a program that loaded processors), `acquired (1 active)`, `released (0 left)`, `expired` |
| Opening the camera | The backend and its options, the number of open attempts and the delay, the first frame |
| Backend and processors | `backend selected`, `processor X loaded`, `processor X is active now (was Y)`, `processor X removed` |
| Closing | `no program needs the camera (released): closing it`, and why |
| Statistics | Every 30 seconds while a camera is open: frames per second received, processed and dropped, the number of processors and leases |
| A stalled service | `the service was stalled for 4.2 s: leases extended by that time` |

When the last lease goes away, the service closes the camera at once and the journal says which reason applies: the program released it, or its lease ran out because the program vanished.

## The log of each run

On a robot, the service also hands its records to the logger of `raccoon-lib`. That logger writes one JSON object per line to `libstp.jsonl`, the same format and the same tools as the log of your robot program. Every start of the service gets its own directory:

```text
/var/log/raccoon-cam/20261119T101500Z/libstp.jsonl
```

The directory name is the start time in UTC. The newest 10 runs are kept and older ones are deleted when the service starts.

Not everything goes in there, so the file stays small and readable:

| In the file | Left out |
|---|---|
| Warnings and errors: retries, failures, a processor that fails | Leases |
| What happens at start: the opening of the camera and the settings it got | Frame statistics |
| Changes of backend and processors, one short line each | Routine commands |

Warnings and errors also reach the journal, through the console of `raccoon-lib`. The service does not print them a second time.

The directory comes from systemd (`LogsDirectory=raccoon-cam`) or from `RACCOON_CAM_LOG_DIR`. For example, `RACCOON_CAM_LOG_DIR=/dev/shm/raccoon-cam-logs` keeps the logs in memory, so nothing is written to the SD card and nothing survives a reboot. A `LIBSTP_LOG_DIR` that is already set in the environment wins over both.

Without `raccoon-lib`, on a laptop or in tests, only `logging` is used.

## Errors in your program and in the UI

The service publishes an error as a message when something goes wrong while a camera is in use. It sends it twice, on different channels (see [Channels]({{< ref "/01-programming-guide/06-camera/06-service.md" >}}#channels)).

| Channel | Receiver | Content |
|---|---|---|
| `raccoon/cam/error` | Clients | JSON with `message` and `context`. Retained, so a client that connects later sees the last one. `CamClient.last_error` holds it |
| `raccoon/errors` | The UI | The same message as text, prefixed with `raccoon-cam:` |

What causes one:

| Cause | `context` |
|---|---|
| The backend could not start (a missing dependency, a bad option) | `phase: start` |
| The camera did not open after the allowed attempts | `phase: open` |
| A processor failed, or was disabled after five failures in a row | `processor: <name>` |
| The frame stream cannot encode JPEGs, so it is turned off | `phase: stream` |

A camera that is only slow to come back is not an error for the UI. A USB camera needs a few seconds to reopen right after it was closed, so a failed open is sent to the UI only once it has kept failing for 5 seconds, and then every tenth attempt. Before that the attempts are in the journal and in the status of the backend (`open_attempts`).

A start that fails for good also sets `failed` in the status. Your program sees it as a `FailedCamera` from `start_camera()`, see [Retries and failure]({{< ref "/01-programming-guide/06-camera/01-client-api.md" >}}#retries-and-failure).

A processor that fails never stops the service. The failure is counted per processor (`failures`, `last_error` in the status), and after five in a row that processor is disabled. Another processor that you swap to with `change_processor` runs normally.
