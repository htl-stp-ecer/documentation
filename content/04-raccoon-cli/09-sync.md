---
title: "sync"
author: "OpenAI Codex"
date: 2026-06-18
draft: false
weight: 10
description: "How raccoon sync actually works: backends, verification, sync counters, and failure modes."
---

# raccoon sync

```bash
raccoon sync
```

`raccoon sync` is not just "copy files to the Pi." The current implementation is a verified synchronization flow with transfer backends, ignore rules, content fingerprints, and a persisted sync counter.

Source of truth:

- [sync_cmd.py](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/raccoon_cli/commands/sync_cmd.py)
- [sftp_sync.py](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/raccoon_cli/client/sftp_sync.py)
- [api.py](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/raccoon_cli/client/api.py)

## Default behavior

By default:

```bash
raccoon sync
```

means:

- current project only
- push local files to the connected Pi
- delete extraneous files on the destination
- validate the project before push
- verify the result with content fingerprints

## Direction modes

Push is the default:

```bash
raccoon sync
raccoon sync --push
```

Pull explicitly downloads from the Pi:

```bash
raccoon sync --pull
```

The CLI rejects `--push` and `--pull` together.

## What actually happens on push

The current push flow is:

1. load `raccoon.project.yml`
2. resolve the project UUID and remote path
3. auto-connect to the Pi if needed
4. optionally create a pre-sync git checkpoint
5. validate the project unless `--no-validate` was used
6. transfer files with the selected backend
7. recompute fingerprints on both sides
8. compare hashes
9. if hashes match, bump the remote sync counter and persist sync state locally

That final verification step is the important difference from a plain rsync wrapper.

## Remote path

Projects sync to:

```text
/home/<pi-user>/programs/<project-uuid>
```

So the UUID is the real remote identity, not just the local folder name.

## Transfer backend selection

The sync transport is platform-dependent:

- Linux/macOS: `rsync` over SSH
- Windows: SFTP copy via Paramiko

Why:

- `rsync` gives efficient delta transfer where it is reliable
- Windows uses SFTP because cwRsync was judged too fragile to support

## Ignore rules

Sync exclusion comes from two places:

- built-in default exclude patterns
- optional `.raccoonignore` in the project root

`.raccoonignore` supports:

- one pattern per line
- `#` comments
- glob-style patterns

Examples:

```text
*.csv
tmp/
recordings/
```

These ignore rules affect both transfer and fingerprint verification.

## Delete behavior

By default, sync deletes extraneous files on the destination:

```bash
raccoon sync --no-delete
```

turns that off.

This matters especially on pull. A pull with delete enabled can remove local files that do not exist on the robot.

## Validation before push

Push sync runs project validation by default. That is deliberate: it is cheaper to fail on the laptop than to push broken project state to the Pi.

Skip only when you know why:

```bash
raccoon sync --no-validate
```

## Git checkpoints

If `auto_checkpoints` is enabled in project config, sync attempts to create a pre-sync git snapshot.

Current behavior:

- if the repo is not a git repository, checkpointing is skipped
- if git is unavailable, checkpointing is skipped
- failures are reported as warnings, not fatal sync errors

Treat checkpoints as recovery help, not as the core sync guarantee.

## Verification: the important part

After transfer, `raccoon sync` computes a local fingerprint and asks the Pi for the remote fingerprint.

If the root hashes differ:

- the sync is treated as untrustworthy
- the command prints a diff summary
- the sync counter is not bumped
- the overall sync is treated as failed

This is exactly what prevents a "transfer said success, but the project state still diverged" class of bugs.

## Sync state and version counter

On successful verified sync, the CLI persists:

- fingerprint hash
- sync version
- sync timestamp
- who synced it

Push behavior:

- reads the current remote sync state
- sends `expected_prev_version`
- server bumps the counter only if state still matches expectations

Pull behavior:

- does not bump the remote counter
- snapshots the server's current sync state locally

This makes push and pull semantically different.

## Counter conflicts

A counter conflict means someone else changed the remote sync state between the time you read it and the time you tried to commit your verified push.

The CLI surfaces this as a conflict instead of silently overwriting the state.

Practical meaning:

- another machine may have synced the same project
- or the server's view of the project changed unexpectedly

Recovery:

```bash
raccoon sync
```

again, after checking which machine or copy owns the latest truth.

## Useful flags

```bash
raccoon sync --verbose
```

Print backend, paths, excludes, and detailed transfer behavior.

```bash
raccoon sync --pull
```

Download remote project state.

```bash
raccoon sync --no-delete
```

Preserve extra files on the destination.

```bash
raccoon sync --no-validate
```

Skip push validation.

## Practical failure modes

### No API token

If transfer succeeds but the CLI has no API token, verification cannot run.

Current behavior:

- sync succeeds
- verification is skipped with a warning

Recovery:

```bash
raccoon connect <pi-address>
```

again, to restore authenticated API access.

### Fingerprint mismatch

This means transfer succeeded but the final content hash did not.

Typical causes:

- ignored files not matching expectations
- transfer backend edge cases
- remote side mutated files during or immediately after sync

Recovery:

```bash
raccoon sync --verbose
```

and inspect the printed diff.

### Not in a project

`raccoon sync` requires a project root containing `raccoon.project.yml`.

### Not connected

The command tries auto-connect from:

1. current project connection config
2. first known Pi

If both fail, it stops and tells you to run `raccoon connect`.

## How this relates to `raccoon run`

`raccoon run` uses the same sync machinery under the hood:

- push before run
- pull after run

So when run behavior feels flaky, `raccoon sync --verbose` is often the fastest way to isolate whether the issue is project transfer, codegen, or runtime execution.
