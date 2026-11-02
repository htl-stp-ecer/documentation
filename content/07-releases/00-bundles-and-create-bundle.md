---
title: "Bundles and Create Bundle"
author: "Tobias Madlberger"
date: 2026-11-02
draft: false
weight: 1
description: "What a bundle is, how the manual Create Bundle workflow makes one, and how an image is built from it."
---

# Bundles and Create Bundle

A **bundle** is a file `bundles/<name>.json` in the `raccoon-image` repository. It says which release of every component belongs together, plus the transport release and its [contract hash]({{< ref "02-transport-contract-in-ci" >}}). `raccoon update` installs a bundle, the image build builds one, and the robot keeps a copy as `/etc/raccoon-bundle.json`.

```json
{
  "bundle": "2026.11.02",
  "components": {
    "raccoon-lib": "v155",
    "raccoon-cli": "v173",
    "stm32-data-reader": "v58",
    "raccoon-cam": "",
    "botui": "v73",
    "raccoon-transport": "v69"
  },
  "contract_hash": "93ac36836810c9fe"
}
```

- A **component tag** is the release tag (`v155`). An **empty** field (`raccoon-cam`) means `raccoon update` does not touch that component.
- `raccoon-transport` and `contract_hash` are mandatory for every bundle made now; an empty one is an error everywhere.
- `bundles/latest.json` is `{"ref": "<name>"}` and points to the bundle `raccoon update` and the image use by default. It never points at `dev`.
- `bundles/dev.json` is written automatically by `bundle.yml` after every component release and points to the newest releases. It has no transport field, is never checked, **never becomes an image**, and is only installed by `raccoon update --dev`.

## Names

The first bundle of a day is `YYYY.MM.DD`, the next `YYYY.MM.DD-2`, then `-3` and so on, in **Europe/Vienna** time (so a run just after midnight in Vienna does not get yesterday's date). The counter is the highest suffix of today's files in `bundles/` plus one; a name without suffix counts as 1. Only this pattern counts: `dev` and older names like `2026.5.25.1` are never renamed and never counted. Do not sort names to find the newest, `-10` sorts before `-2` — `latest.json` is the reference. The name is checked against the pattern before it becomes a file name or a tag.

## The Create Bundle workflow

Actions → **Create Bundle** → **Run workflow** in `raccoon-image`. It runs only when started by hand, and it is the **only** place that publishes bundles and moves the pins in `raccoon-example`.

| Input | Empty means |
|-------|-------------|
| `raccoon_cli`, `raccoon_lib`, `botui`, `stm32_data_reader` | newest published release (drafts and pre-releases do not count) |
| `raccoon_transport` | newest release; **this is the version the gate checks against** |
| Build image | on |
| Publish | on. Off is a dry run |

Enter tags as on the release page. A missing leading `v` is tolerated (both spellings are tried).

What it does, in order:

1. **Resolve** the five versions and show them in the job summary.
2. **Check the releases:** the release exists, and for each component exactly one asset matches, with a SHA-256 digest. (The same code the image build uses.)
3. **Gate:** the transport release's `contract-hash.txt` is the target. The marker `RACCOON_CONTRACT_V1=<hash>` is read out of the `raccoon_sim` aarch64 wheel, the Bot UI `.deb` and the STM reader tarball and must equal it. On any difference the run **stops before anything is committed**, with a table naming the artifact, the hash found and the expected one. The gate cannot be switched off.
4. **Name** the bundle, write `bundles/<name>.json`, set `latest.json`.
5. **Commit** both to `main` as the Raccoon OS Bot (only with Publish).
6. **Image:** start `image.yml` with the bundle name (only with Publish and Build image).
7. **Example:** send `bundle-released` to `raccoon-example` so the template pins move (only with Publish).

A **dry run** (Publish off) does 1 to 3 completely, but commits, releases and dispatches nothing. It also builds no image, because `image.yml` reads the bundle from `main`, where a dry run has not put it.

A **concurrency group** stops two runs from choosing the same name or pushing at the same time.

### When the gate fails

After a **transport release** the default "everything newest" fails on purpose: `raccoon-lib`, the Bot UI and the STM reader still contain the old transport. Each of them gets an automatic *bump transport* pull request; merge them, let each one release, then run Create Bundle again. The error table says exactly which artifact has which hash. If you only want the older, consistent set, enter the older transport tag.

A transport release made before the contract hash existed has no `contract-hash.txt` and cannot be bundled.

### When the image dispatch fails

The bundle stays. The run turns red and tells you to start **Build updated image** (`image.yml`) by hand with the bundle name. The example update is still sent.

## The image

`image.yml` ("Build updated image") is independent of Create Bundle and can be started alone with a bundle name (empty means `latest.json`). It builds from exactly the versions in the bundle, refuses `dev` and refuses a bundle whose `contract_hash` is `dev` or empty. The release is titled `RaccoonOS <bundle>`, marked latest, and its notes list every component's tag and the transport contract hash.

Beyond the older behaviour, the build:

- installs `raccoon-transport` **pinned** to the bundle's version (check `python-packages.txt` in the release),
- checks that the installed Python transport has the bundle's hash,
- copies the bundle manifest to `/etc/raccoon-bundle.json` and creates `/run/raccoon` (world-writable, sticky) for the status files,
- writes the transport tag and hash into `manifest.json`.

Older bundles without a contract still build with the old behaviour (no device bundle file), so earlier images can be rebuilt.

## Update order on a robot

Binaries and packages first, then the bundle file, then the restart. A process must never start against a bundle file that names another transport than the one installed. `raccoon update` does this over SSH, the image does it by construction (nothing runs during the build).
