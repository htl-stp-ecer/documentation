#!/usr/bin/env python3
"""build-and-view.py — build the Raccoon wiki with Hugo in Docker and open it in the browser.

Nothing is installed on the host. Hugo runs in a container with this repository mounted;
the site is served with live reload, so edits to content/ show up in the open page.

Usage:
    python3 build-and-view.py                 # serve on http://localhost:1313 and open the browser
    python3 build-and-view.py --port 8080     # another port
    python3 build-and-view.py --no-open       # do not open the browser
    python3 build-and-view.py --build-only    # build the static site into ./public (like CI), no server
    python3 build-and-view.py --drafts        # include pages with draft: true

The DSL step catalog (data/dsl_steps.json, git-ignored) is required by the build. It is
downloaded once from the latest raccoon-lib release with the GitHub CLI (`gh`, logged in),
like CI does. Use --refresh-catalog to download it again.

Not available locally: the /api reference. CI downloads it from a release of raccoon-lib
and adds it to the site; this script does not.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import threading
import time
import urllib.request
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
# Latest Hugo, extended: what CI uses. (The old "exts" tag is frozen at 0.154.5 and is too old for the layouts.)
IMAGE = "hugomods/hugo:latest"


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    sys.exit(1)


def ensure_catalog(refresh: bool) -> None:
    """data/dsl_steps.json: the step catalog the build refuses to run without."""
    target = ROOT / "data" / "dsl_steps.json"
    if target.is_file() and not refresh:
        return
    if not shutil.which("gh"):
        fail(f"{target.relative_to(ROOT)} is missing and the GitHub CLI (gh) is not installed. "
             "Download dsl-steps.json from the latest raccoon-lib release into data/dsl_steps.json.")
    print("▶ Downloading the DSL step catalog from the latest raccoon-lib release")
    target.parent.mkdir(exist_ok=True)
    tmp = ROOT / "data" / ".download"
    shutil.rmtree(tmp, ignore_errors=True)
    result = subprocess.run(
        ["gh", "release", "download", "--repo", "htl-stp-ecer/raccoon-lib",
         "--pattern", "dsl-steps.json", "--dir", str(tmp)]
    )
    downloaded = tmp / "dsl-steps.json"
    try:
        if result.returncode != 0 or not downloaded.is_file():
            fail("could not download dsl-steps.json (is `gh auth status` ok, and does the latest release have the asset?)")
        if not json.loads(downloaded.read_text()):
            fail("the downloaded step catalog is empty")
        downloaded.replace(target)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def open_when_up(url: str, timeout: float = 120.0) -> None:
    """Open the browser as soon as the server answers."""
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            urllib.request.urlopen(url, timeout=1).close()
        except OSError:
            time.sleep(0.5)
            continue
        print(f"▶ Opening {url}")
        webbrowser.open(url)
        return
    print(f"The server did not answer within {timeout:.0f} s; open {url} yourself.", file=sys.stderr)


def main() -> None:
    parser = argparse.ArgumentParser(description="Build the Raccoon wiki with Hugo in Docker and open it.")
    parser.add_argument("--port", type=int, default=1313, help="port on this machine (default: %(default)s)")
    parser.add_argument("--no-open", action="store_true", help="do not open the browser")
    parser.add_argument("--build-only", action="store_true", help="build into ./public and exit, no server")
    parser.add_argument("--refresh-catalog", action="store_true", help="download the DSL step catalog again")
    parser.add_argument("--drafts", action="store_true", help="include drafts")
    parser.add_argument("--image", default=IMAGE, help="Docker image with Hugo extended (default: %(default)s)")
    args = parser.parse_args()

    if not shutil.which("docker"):
        fail("docker not found. Hugo runs in a container so the host stays clean.")

    ensure_catalog(args.refresh_catalog)

    docker = [
        "docker", "run", "--rm",
        # Files written into the repo (public/, resources/) belong to you, not to root.
        "--user", f"{os.getuid()}:{os.getgid()}",
        "-e", "HOME=/tmp",
        "-v", f"{ROOT}:/src",
        "-w", "/src",
    ]
    drafts = ["--buildDrafts"] if args.drafts else []

    if args.build_only:
        print("▶ Building into ./public")
        subprocess.run(
            [*docker, args.image, "hugo", "--minify", "--cleanDestinationDir", "--cacheDir", "/tmp/hugo-cache", *drafts],
            check=True,
        )
        print(f"✓ {ROOT / 'public'}")
        return

    url = f"http://localhost:{args.port}/"
    print(f"▶ Serving the wiki at {url} (Ctrl+C stops it)")
    if not args.no_open:
        threading.Thread(target=open_when_up, args=(url,), daemon=True).start()
    try:
        subprocess.run(
            [
                *docker, "-p", f"127.0.0.1:{args.port}:1313", args.image,
                "hugo", "server", "--bind", "0.0.0.0", "--port", "1313",
                # The browser reaches the server through the published port.
                "--baseURL", url, "--appendPort=false",
                "--disableFastRender", "--cacheDir", "/tmp/hugo-cache", *drafts,
            ],
            check=True,
        )
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
