# RaccoonOS Design Guidelines

Design language for the RaccoonOS docs site, the `raccoon-cli`, and any
presentation or asset that carries the raccoon mark. The source of truth for
tokens is `static/css/style.css` — if a token here ever drifts from that file,
the CSS wins and this doc should be updated.

---

## 1. Brand

**Name.** The platform is **RaccoonOS**. The command-line tool is
**`raccoon-cli`**, and its binary is **`raccoon`**. Use the exact casing
every time — not *Raccoon OS*, not *RaccoonCLI*, not *Raccoon*.

**Tagline.** *Open-Source Robotics Platform.*

**Sub-line.** *Raise the floor, don't lower the ceiling.* — use when there is
room for one more line (hero, cover slide, repo banner). Do not paraphrase.

**Personality.** Friendly but technical. The raccoon is mascot and watermark,
never a cartoon stand-in for a person. Copy stays close to what the reader is
about to do: verbs, file paths, concrete outcomes. No exclamation marks, no
emoji, no "🚀 let's go".

---

## 2. Colour

All colours live as CSS custom properties on `:root` in `style.css`. Reference
them by token name — never hard-code hexes in new components.

### Core palette

| Token        | Hex       | Role                                                    |
|--------------|-----------|---------------------------------------------------------|
| `--bg-deeper`| `#1E1A17` | Darkest surface — header, sidebar, code blocks, hero    |
| `--bg-dark`  | `#2A2421` | Page background                                         |
| `--bg-med`   | `#3A322C` | Raised surfaces — search results, blockquote cards      |
| `--bg-warm`  | `#4A4038` | Borders, hover states                                   |
| `--cream`    | `#F5EBDC` | Body text on dark                                       |
| `--dim`      | `#C8B9A5` | Secondary text, captions, quoted text                   |
| `--amber`    | `#DAA03E` | **Primary accent** — CTAs, active nav, links, rules     |

### Accent palette

Reserve these for semantic roles. Do not use them decoratively.

| Token     | Hex       | Use for                                          |
|-----------|-----------|--------------------------------------------------|
| `--green` | `#6A994E` | Success, "ready" states, passing checks          |
| `--rust`  | `#BA643C` | Warnings, destructive-but-expected actions       |
| `--sky`   | `#78A0BE` | Informational callouts, diagnostic output        |
| `--berry` | `#945A78` | Rare — highlight one item in a group, never bulk |

### Rules

- **Dark mode is the only mode.** There is no light theme. Do not introduce
  one without discussion — it would require a second full palette.
- **Amber is the one hero colour.** A page should have one amber CTA and a few
  amber accents (active nav, link underlines, a left rule on code and
  blockquotes). Amber loses its meaning the moment it is used for decoration.
- **Text on amber is `--bg-deeper`**, never cream. Contrast is the reason
  amber works as a button.
- **Borders and dividers use `--bg-warm`** at full opacity or amber at ~50%
  (`rgba(218, 160, 62, 0.5)`, as in `.hero-divider`).

---

## 3. Typography

Two families, both loaded from the site's font stack. Do not introduce a third.

| Family            | Role                                                    |
|-------------------|---------------------------------------------------------|
| **Space Grotesk** | Body copy, headings, UI chrome                          |
| **JetBrains Mono**| Code, file paths, CLI output, eyebrows, hero tagline    |

### Sizing anchors

These are the sizes already in use. New components should land on one of them
rather than inventing a new scale.

- Hero title: `3.8rem` / line-height `1.0` (desktop). `2.6rem` at ≤768px, `2.1rem` at ≤480px.
- Hero eyebrow: `0.75rem`, mono, `letter-spacing: 0.08em`, `--dim`.
- Hero tagline: `1rem`, mono, `--amber`.
- Body: `1rem` / `line-height: 1.6`, `--cream`.
- Captions / secondary: `0.8–0.9rem`, `--dim`.

### Rules

- **Mono for anything the user will type or see verbatim.** Commands, paths,
  config keys, CLI output, YAML snippets. Never mono for emphasis.
- **Letter-spacing only on mono eyebrows and buttons** (`0.02–0.08em`). Never
  track body copy.
- **No bold inside headings.** Headings are already heavy enough.

---

## 4. The raccoon mark

The raccoon is an asset, not a character. It appears as:

1. **Header icon** — `static/images/raccoon.svg`, 26×26, tinted to cream,
   opacity `0.85`. Small, pinned left of the site title.
2. **Hero watermark** — same SVG, 340×340 on desktop, opacity `0.12`, masked to
   fade into the background from the left (`linear-gradient(to right, transparent 0%, black 35%)`).
3. **Logo** — `static/images/raccoon-logo.svg`, full wordmark. Use where a
   textual site title is not present (social preview, slide cover, README).

### Usage rules

- **Never a full-opacity raccoon inside content.** The watermark opacity exists
  because the raccoon is a background presence. A 100%-opacity raccoon competes
  with copy.
- **Never recolour the raccoon outside the cream tint.** The CSS filter that
  produces the cream tone is:
  `invert(95%) sepia(10%) saturate(300%) hue-rotate(330deg) brightness(105%)`.
  If you need a different surface, mask or fade — do not re-hue.
- **Minimum clear space around the logo is the height of the raccoon's ear.**
  Eyeball it; do not crowd.
- **The raccoon never speaks.** No speech bubbles, no "Hi, I'm Rocky". It is a
  mark, not a mascot.

---

## 5. Components (already in the stylesheet)

These are the patterns to reuse rather than re-invent. If a new page needs
something, try to express it with these first.

### Hero

- `--bg-deeper` surface, bottom border `2px solid --amber`.
- Structure: eyebrow (mono, dim) → title (cream) → tagline (mono, amber) →
  sub-line (mono, dim, italic) → 80×2 amber divider → CTA.
- Watermark raccoon pinned right, fading into the background.
- Only the home page gets a hero. Sub-pages start at `h1`.

### Buttons / CTA

- Amber fill, `--bg-deeper` text, `700` weight, `0.9rem`, `4px` radius.
- Hover: fill flips to cream, text stays `--bg-deeper`. No shadow, no scale.
- One primary CTA per view. Secondary actions are plain text links.

### Links (in prose)

- Amber, underlined with `border-bottom`. Hover flips both to cream. Do not
  underline with `text-decoration` — it breaks alignment with the existing
  bottom-border treatment.

### Code blocks

- `--bg-deeper` fill, `1px` border in `--border-color`, **`3px` amber left
  rule**, `4px` radius. Cream text. Never put a background tint on inline
  `<code>` inside headings.

### Blockquotes (used as callouts)

- `--bg-med` fill, `4px` amber left border, `6px` right-side radius (flat
  left), dim italic text. This is the default "note" treatment — prefer it
  over inventing a new admonition component.

### Tables

- Plain bordered tables with `--border-color` lines. Left-aligned headers.
  Monospace is *only* for the cells that contain code (command names, keys,
  paths) — not the whole table.

---

## 6. CLI: `raccoon`

The CLI has its own micro-design language because it is the primary surface
most users touch.

### Command grammar

```
raccoon <verb> [object] [name] [flags]
```

The canonical verbs (see `content/04-raccoon-cli/_index.md` for the full list):

> `create`, `connect`, `disconnect`, `run`, `sync`, `codegen`, `wizard`,
> `update`, `status`, `calibrate`, `web`, `list`, `remove`

**Rules for new commands:**

- **One verb, one job.** `raccoon run` always does the same thing — do not
  pile modes onto an existing verb; add a sibling verb instead.
- **Objects are nouns, in the singular.** `project`, `mission`, not
  `projects`. `list` is the only verb that takes plural objects
  (`list projects`, `list missions`) because it is inherently enumerative.
- **`create` / `remove` are the pair** for lifecycle. Not `add`/`delete`,
  not `new`/`rm`.
- **`-h` / `--help` is mandatory on every command.**
- **Long flags are `--kebab-case`** (`--no-wizard`, `--path`). Short flags are
  one letter and reserved for the most common options on that command.

### Output style

- **Use status lines, not progress bars, for multi-step commands.** Each
  completed step prints one line. Bars cause reflow issues inside `raccoon
  run` piping into logs.
- **Success is green (`--green`), warnings rust, errors red (use stderr).**
  Map these to ANSI 32 / 33 / 31 in terminal output.
- **Paths, commands, and filenames are always wrapped in backticks** in any
  message that might be pasted into docs or issues.
- **Quote the robot, not the tool.** Prefer `Connected to 192.168.1.42` over
  `raccoon is now connected to 192.168.1.42`. The reader already knows who is
  talking.

### Naming things the CLI creates

- **Projects**: `PascalCase` display name (`ConeBot`), `kebab-case` on disk if
  the user typed that. Raccoon normalises on input.
- **Missions**: always stored as `PascalCase` class names with the `Mission`
  suffix, file names as `snake_case_mission.py`. The `M##` prefix
  (`M01DriveToZone`) is the recommended ordering convention and `M00` is
  reserved for `SetupMission`.

---

## 7. Docs content voice

The docs site is part of the design surface. These rules are observable in the
existing pages and should stay consistent when new pages are added.

- **Second person, present tense.** "You connect to the robot" — not "the user
  will connect" and not "we connect".
- **Lead with the command, follow with the explanation.** Every
  `raccoon-cli` page starts with a bash block, then "What it does", then
  options. Keep that order.
- **Show the artefact.** If a command generates files, include the directory
  tree. If it generates a class, include the class body.
- **Tables for flags and options, prose for behaviour.** Do not describe flags
  in prose; do not describe behaviour in a table.
- **Links use `{{< ref >}}`** to resolve at build time — never hard-code
  absolute URLs to other doc pages.
- **Absolute dates in frontmatter**, `YYYY-MM-DD`. No "last week".
- **No trailing summaries.** The reader already read the page.

---

## 8. Do / don't

**Do**

- Reach for an existing token before writing a new hex.
- Use amber sparingly enough that it still means "look here".
- Treat mono as a signal of "this is literal" and reserve it for that.
- Let the raccoon fade into the background — that is the whole point.

**Don't**

- Introduce a second accent colour to "balance" amber. The palette is
  intentionally warm-monochrome with amber as the single highlight.
- Add gradients, drop shadows, or glass effects. The site is flat on purpose.
- Ship a page with two primary CTAs. Pick one.
- Rename the CLI or the platform casually. `RaccoonOS` and `raccoon` are
  fixed strings.
