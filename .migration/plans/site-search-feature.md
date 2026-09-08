# Working Site Search Plan — Index-Driven Results + Dynamic List Block

## Goal
Two related, index-driven capabilities for the WKND EDS project, both reading the same published `query-index.json`:

1. **Working site search** — re-enable the header search (`blocks/header/header.js` → `buildSearch`, currently `preventDefault()`) to a dedicated results page `/us/en/search?q=…` rendered by a new `search` block. Scope: all migrated pages.
2. **Dynamic list block** — a new `dynamic-list` block that takes a **root path** + **limit** and renders the child pages under that path as cards, replacing the currently hardcoded `cards-teaser` grids on the homepage, adventures, and magazine pages.

## Dynamic list — decisions (confirmed)
- **Replace:** all `cards-teaser` grids **except** the `cards-teaser members` ("Members Only") variant. Leave `columns-featured` (single Featured Article), `hero-banner`, `carousel-hero`, and the Members-Only teaser as authored content.
- **Order:** natural **index order** from `query-index.json` (roughly path order), truncated to `limit`. (No date/alpha sort — so no hard dependency on `lastModified` for ordering.)
- **Card look:** **match the existing `cards-teaser`** design exactly (image top, dark uppercase title, description) so the pages look unchanged — only the data source becomes dynamic.

### `cards-teaser` grids to replace (verified in repo)
| Page | File | Grid heading | Root path for dynamic-list | Limit |
|---|---|---|---|---|
| Homepage | `content/us/en.plain.html` | "Recent Articles" | `/us/en/magazine` | 4 |
| Homepage | `content/us/en.plain.html` | "Next Adventures" | `/us/en/adventures` | 4 |
| Adventures index | `content/us/en/adventures.plain.html` | "Current Adventures" | `/us/en/adventures` | 16 (all) |
| Magazine index | `content/us/en/magazine.plain.html` | "All Articles" | `/us/en/magazine` | 0 = no limit (all) |

Kept as-is (NOT replaced): homepage `carousel-hero` / `columns-featured` / `hero-banner`; adventures `hero-banner` + static category `<ol>` filter; magazine `columns-featured` (Featured Article) + `cards-teaser members` (Members Only).

Normalization note: current listing hrefs use `.html` (e.g. `/us/en/magazine/ski-touring.html`); query-index paths are extensionless. Both the search and dynamic-list blocks must normalize.

## Context (verified in repo)
- Project type is **`da`** (Document Authoring), preview org/site `akki761/wknd`, locale-scoped content under `content/us/en/…`. See [[wknd-project-setup]].
- `blocks/header/header.js`: `buildSearch()` builds a real `<form role="search" action="/us/en/search">` with `input[name="q"]`, always rendered, submit blocked (~line 60–61) — the single point to re-enable.
- **No `search` or `dynamic-list` block exists yet.** Existing card design lives in `blocks/cards-teaser/` (reuse its CSS/markup pattern).
- **No index config in repo** — per AGENTS.md, `helix-query.yaml`/`paths.json` are retired; indexing config lives at **tools.aem.live** (admin UI), not the repo.
- 28 `.plain.html` pages exist locally; the published site is what gets indexed.
- Nav/footer are fragments under `content/us/`; content images use root-relative `/images/…`.

## Approach

### 1. Index configuration (tools.aem.live — admin UI, not repo)
- Define a query-index emitting `query-index.json` covering all published pages under `/us/en/`.
- Fields per row: `path`, `title`, `description`, `image`, `lastModified`, `template` (the `template`/section value lets both blocks filter by root and lets search group results).
- Confirm `/us/en/query-index.json` (and/or `/query-index.json`) returns rows after publish. **Admin-UI step, cannot be committed** — plan records exact field list for reproducibility.

### 2. `dynamic-list` block (new: `blocks/dynamic-list/dynamic-list.js` + `.css`)
- Authored as a simple block table with two rows: `root` (e.g. `/us/en/magazine`) and `limit` (e.g. `4`; empty/0 = all).
- On decorate: fetch + cache `query-index.json`; filter rows whose `path` is a **direct child** of `root` (exclude the root/index page itself and deeper grandchildren); keep index order; slice to `limit`.
- Render cards **reusing the `cards-teaser` markup + classes** (or shared CSS) so styling matches: image, linked dark-uppercase title, description. Normalize `.html`/extensionless links.
- Graceful empty state if the index is unavailable or the root has no children.
- CSS reuses/extends `cards-teaser` styles, scoped per AGENTS.md; responsive 390/768/1920, no horizontal overflow.

### 3. Update the three content pages
- In `content/us/en.plain.html`, `adventures.plain.html`, `magazine.plain.html`: replace the four target `cards-teaser` grids with `dynamic-list` blocks (root + limit rows) per the table above; keep surrounding headings ("Recent Articles", etc.) and all non-replaced blocks.
- Follow the project content rule: **do not hand-write** final content HTML — regenerate via the bundled import script / DA upload path used in this repo.

### 4. Search results page + `search` block
- Create results page `content/us/en/search.plain.html` (title + empty `search` block) via the import/DA path (not hand-written); add page metadata (title "Search", optionally noindex).
- New `blocks/search/search.js` + `.css`: read `q` from the URL, fetch + cache the index, case-insensitive match on `title`+`description`(+path), title-matches-first ordering, render a results list (linked title, snippet, thumbnail, section label), "N results for '…'" heading + empty state, pre-fill the input and reflect new queries in the URL, normalize link extensions. WKND-styled, scoped to `.search`, responsive.

### 5. Re-enable the header search
- In `buildSearch()`: remove the `submit`→`preventDefault()` so the form GETs to `/us/en/search?q=…`. Keep the code-driven control (don't gate on the fragment `:search:` marker). Confirm `input[name="q"]` matches what the search block reads.

### 6. Verify
- **Dynamic list:** homepage "Recent Articles"/"Next Adventures", adventures "Current Adventures", magazine "All Articles" all render from the index, match the old card look, respect limits, and link correctly. Confirm root-child filtering excludes the index page and detail-page grandchildren.
- **Search:** header search on any page → results page; sample queries ("bali", "ski", "surf", magazine term, no-match) behave; works from homepage, an adventure detail page, and an article.
- Responsive 390/768/1920; no horizontal-scroll regression (recent `100vw` overflow fix — stay clear).
- `npm run lint:css` + JS lint clean.
- **Note:** aem-cli `up` proxies remote previewed content, so `query-index.json` and the edited pages must be published/previewed before results appear locally; a static index fixture may be used only for local block dev, not committed.

## Open considerations
- **Index availability gate:** both blocks depend on the published `query-index.json`; until index config (step 1) is published, they show empty states rather than erroring. This is the true unblocker and is done outside the repo.
- **Root-child semantics:** "child pages based on limit" = direct children of `root` only. Detail pages under `/us/en/adventures/*` are direct children (good); ensure the listing root's own index page (`/us/en/adventures`) is excluded from its own list.
- **Members Only stays static** (per decision) — it lists non-migrated teaser pages with no real target, so it can't be index-driven.
- **DA upload / publish** of new/edited pages, blocks, and the header change may need the credential opt-in (Settings → LLM Permissions); a 401/403 means the opt-in is off (no token needed or to be pasted in chat).

## Checklist
- [ ] Configure the EDS query-index at tools.aem.live for all `/us/en/` pages; fields: `path`, `title`, `description`, `image`, `lastModified`, `template`
- [ ] Publish content and confirm `/us/en/query-index.json` (and/or `/query-index.json`) returns populated rows
- [ ] Create `blocks/dynamic-list/dynamic-list.js`: parse `root`+`limit`, fetch+cache index, filter direct children in index order, slice to limit, normalize links, empty state
- [ ] Create `blocks/dynamic-list/dynamic-list.css`: reuse/match `cards-teaser` card design; responsive 390/768/1920
- [ ] Regenerate `content/us/en.plain.html` replacing "Recent Articles" (root `/us/en/magazine`, limit 4) and "Next Adventures" (root `/us/en/adventures`, limit 4) cards-teaser grids with `dynamic-list` — via import/DA path, not hand-written
- [ ] Regenerate `content/us/en/adventures.plain.html` replacing "Current Adventures" (root `/us/en/adventures`, all) with `dynamic-list`
- [ ] Regenerate `content/us/en/magazine.plain.html` replacing "All Articles" (root `/us/en/magazine`, all) with `dynamic-list`; keep Featured Article + Members Only
- [ ] Create `blocks/search/search.js` + `search.css`: read `q`, fetch+cache index, match title+description, normalize links, results list + empty state, WKND-styled, responsive
- [ ] Generate `content/us/en/search.plain.html` (title + empty `search` block) via import/DA path
- [ ] Edit `blocks/header/header.js` `buildSearch()` to remove `preventDefault()` so the form GETs to `/us/en/search?q=…`
- [ ] Verify dynamic-list on all three pages (match old look, correct children, limits, links) and search from homepage/adventure/article for match + no-match queries
- [ ] Responsive + overflow check (390/768/1920); run `npm run lint:css` and JS lint
- [ ] Publish/upload the new blocks, edited pages, search page, and header change (needs credential opt-in; no token in chat) and validate on the preview link
- [ ] Update project memory with the search + dynamic-list architecture (index fields, root/limit semantics, which listings were converted vs kept static)

> **Execution requires Execute mode.** This artifact is the plan only; switch to Execute mode to implement the steps above.
