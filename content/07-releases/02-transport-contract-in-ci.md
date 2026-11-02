---
title: "Transport contract in CI"
author: "Tobias Madlberger"
date: 2026-11-02
draft: false
weight: 3
description: "How the contract hash is computed, what changes it, where it is embedded, the shared check specification and the image build gates."
---

# Transport contract in CI

The user-facing description is [Transport contract]({{< ref "/04-raccoon-cli/20-transport-contract" >}}). This page is for the people who change the transport or the build.

## The hash

`scripts/contract.py` in `raccoon-transport` reads the **C++ sources** and writes `contract/contract.json` plus generated constants for each language. The transport no longer uses LCM (there are no `.lcm` files or fingerprints; the messages are written by hand in each language), so the C++ headers are the single source.

| Goes into the hash | Does **not** |
|--------------------|--------------|
| every message type of `messages/include/raccoon/*_t.hpp`: name, fields **in order** (the wire order), field types | comments, whitespace, default values |
| every channel name from `Channels.h` (port-indexed ones as a pattern like `raccoon/motor/{port}/done`), sorted | the order channels are declared in |
| the shared-memory ring magic and `RRB_VERSION` | the transport version number (display only) |

The hash is the first 16 hex characters of the SHA-256 of the canonical JSON. The mapping from channel to message type is not part of it: the transport has no such table, the type is chosen at the call site.

**After changing a message struct, a channel or the ring layout:**

```bash
python3 scripts/contract.py --write     # regenerate contract.json and the constants
python3 -m unittest scripts/test_contract.py python/tests/test_contract_check.py
```

and commit the result. CI runs `contract.py --check`, which fails when a generated file is stale **or when the Python or Dart messages no longer match the C++ field order** (this found `bemf_offset` missing from the Dart `KinematicsConfigT`).

Generated: `cpp/include/raccoon/Contract.h` (`raccoon::contract::kHash`, `version()`), `python/raccoon_transport/_contract.py` (`CONTRACT_HASH`, `contract_hash()`), `dart/lib/src/contract.dart` (`raccoonContractHash`).

## The marker

Every binary that links the C++ transport contains the string `RACCOON_CONTRACT_V1=<hash>` in read-only data (`used` + `retain`, so `--gc-sections` keeps it). It costs nothing at run time and lets the image build read the hash from a **finished artifact without running it**. In Python it is `CONTRACT_MARKER` in the wheel; in Dart the check derives its own hash from the marker literal so tree shaking keeps it in an AOT build.

## The shared check specification

`contract/CHECK_SPEC.md` in `raccoon-transport` is the one description of the startup check: inputs, the decision table, the exact messages, the status file and the aggregation. `contract/check_vectors.json` holds the test cases. C++ (`ContractCheck.h`), Python (`contract_check.py`) and Dart (`contract_check.dart`) all pass the same vectors. **Change the spec and the vectors first, then all three implementations.** The C++ side parses the bundle file with nlohmann/json, vendored unmodified in `cpp/third_party/nlohmann` (MIT; the license text and `THIRD_PARTY_NOTICES.md` stay with it, and the STM reader's release tarball carries the notice too).

The release publishes `contract-hash.txt` and `contract.json` next to the wheel; Create Bundle and the image build use `contract-hash.txt` to learn the expected hash of a transport version.

> Merging to `main` in `raccoon-transport` **is a release** (CI numbers and publishes it) and sends `transport-released` to the three components that compile it.

## Image build gates (blocking)

In `raccoon-image`, `scripts/download-image-inputs.py`:

1. the bundle's `contract_hash` must equal the published `contract-hash.txt` of the transport release it names;
2. `scripts/scan_artifacts.py` reads the marker out of the `raccoon_sim` aarch64 wheel, the Bot UI `.deb` and the STM reader tarball (zip, `dpkg-deb --fsys-tarfile`, tar; streamed, nothing executed). A different hash, **no marker**, or a missing artifact fails the build with a table. The pure-Python library wheel and the CLI tarball only must not carry a *different* marker. A component type without a readable marker fails loudly; it is never skipped;
3. `dev` as `contract_hash`, an empty one, or a bundle named/marked `dev` never builds;
4. transport is installed `==` the bundle's version and its hash checked on the device.

The lower bounds (`raccoon-transport>=…`) in the components' dependencies stay as a hint; the protection is the scan and the run-time check.

## Not covered

- Processes that do not run the check (your own scripts, third-party tools): they are not protected. A later extension could verify the message type in the ring header per channel.
- The Python library's check uses the Python transport package's hash; the native module's compiled-in transport is covered by the image scan, not at run time.
- No compatibility levels: the hash is equal or not.
