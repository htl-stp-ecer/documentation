[![Build](https://github.com/htl-stp-ecer/documentation/actions/workflows/hugo.yml/badge.svg)](https://github.com/htl-stp-ecer/documentation/actions/workflows/hugo.yml)

# RaccoonOS Documentation

Source for the [RaccoonOS](https://raccoon-docs.pages.dev) documentation site — an open-source robotics platform for Botball competitions.

Built with [Hugo](https://gohugo.io/) and deployed to Cloudflare Pages on every push to `main`.

---

## Local development

**Prerequisites:** Hugo extended edition. Install it from [gohugo.io/installation](https://gohugo.io/installation/) or via your package manager:

```bash
# macOS
brew install hugo

# Debian/Ubuntu
sudo apt install hugo

# Windows (winget)
winget install Hugo.Hugo.Extended
```

**Run the dev server:**

```bash
git clone https://github.com/htl-stp-ecer/documentation.git
cd documentation
hugo server -D
```

Open `http://localhost:1313`. The server reloads on every file save. The `-D` flag renders draft pages too.

**Build for production:**

```bash
hugo --minify --cleanDestinationDir
```

Output lands in `public/`.

---

## Content structure

```
content/
  00-quick-start/       Getting started guide
  01-botui/             BotUI web interface
  02-programming/       LibSTP SDK and DSL reference
    algorithms/         Algorithm deep-dives (line following, lineup, etc.)
  03-web-ide/           Web IDE usage
  04-raccoon-cli/       raccoon CLI command reference
  05-api-reference/     Auto-generated API reference (from raccoon-lib CI)
  06-firmware/          Firmware internals
  contributors/         Contributor listing
```

Section folders use numeric prefixes to control sidebar order. Within a section, pages use `weight` in their front matter.

---

## Adding a page

1. Create a `.md` file in the right section folder. Use `hugo new` to get the correct front matter:

   ```bash
   hugo new 02-programming/my-new-topic.md
   ```

2. Edit the front matter:

   ```yaml
   ---
   title: "My New Topic"
   author: "Your Name"
   date: 2026-04-12
   draft: false
   weight: 99          # controls order within the section; lower = earlier
   description: "One sentence shown in llms.txt and search results."
   ---
   ```

3. Write content in Markdown. See [CONTRIBUTING.md](CONTRIBUTING.md) for style rules and Hugo shortcodes available on this site.

4. Open a pull request against `main`. CI builds a preview and the change goes live on merge.

---

## AI / LLM access

The site generates two machine-readable files on every build:

| File | Purpose |
|------|---------|
| `/llms.txt` | Index of all pages — title, URL, and description |
| `/llms-full.txt` | Full content of every page in a single file |

These follow the [llms.txt spec](https://llmstxt.org/) so AI assistants can ingest the docs without scraping HTML.

---

## License

Content is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — see [LICENSE](LICENSE).  
Copyright (C) 2026 Tobias Madlberger and contributors.
