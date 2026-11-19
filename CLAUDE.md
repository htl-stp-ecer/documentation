# Documentation rules (read first)

1. **Only reference what will exist in the final documentation.** No links, `ref`s or mentions of pages, sections, repos or features that are not part of the published docs (e.g. WebIDE internals while they are unfinished, removed APIs, planned work). If a page is not published, do not point to it.
2. **Only write what helps a user or contributor.** No changelogs, history ("was renamed from", "formerly", "no longer"), migration notes for removed things, internal TODOs, or duplicated content. If a fact is already explained on another page, link to it instead of repeating it.
3. **Verify against the source.** Every technical claim (constants, struct layouts, file paths, commands, behavior) must be checked against the code in the sibling repos (`raccoon-lib`, `raccoon-transport`, `stm32-data-reader`, `raccoon-cli`, `botui`). Do not copy from older docs.
4. **Keep front matter current.** When a page changes, set `date:` to the day of the change and make sure `author:` contains every contributor, comma-separated (e.g. `"Tobias Madlberger, Mario Scholze"`).
5. **Links:** use `{{< ref "/path/file.md" >}}` for internal links so Hugo fails on broken ones. Plain `](/path/)` links are not checked, so click-test them.
6. **Build check:** run `./build-and-view.py` (or `hugo`) before finishing and fix every error.

See `CONTRIBUTING.md` for setup and the page format.
