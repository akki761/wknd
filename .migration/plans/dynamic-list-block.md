# Dynamic List Block Plan (Homepage, Adventures, Magazine)

## Goal
Replace the hardcoded `cards-teaser` listing grids on the homepage, adventures, and magazine pages with a new, reusable **`dynamic-list`** block that takes a **root path** + **limit** and renders the child pages under that path as cards — matching the current design and responsiveness exactly, with the adventures category filter preserved.

## Decisions (confirmed with user)
1. **Adventures filter:** Convert "Current Adventures" to `dynamic-list` **and keep the category filter.** Approach: add a **Category** page-metadata value to each adventure detail page, surface it as a `category` column in the index, and have `dynamic-list` build the tab bar (All / Climbing / Cycling / Skiing / Surfing / Travel) and filter client-side on that field.
2. **Index:** **One** site-wide `query-index.json` is sufficient for all three pages (each listing filters it by root path + optional category). User will create/publish the index. Required columns: `path`, `title`, `description`, `image`, `category` (optional: `lastModified` for future recency sorting).
3. **Content edits:** Modify the import pipeline and **regenerate** the three pages (no hand-editing `content/`). **Styling and responsiveness must not change** — the new block reuses the `cards-teaser` design values so the pages look and reflow identically at 390/768/1920.

## Only one index is required
Edge Delivery has no directory-listing API, so dynamic child enumeration needs an index feed. A single `query-index.json` covering `/us/en/**` serves all three pages:
- Homepage "Recent Articles" → rows whose path is a direct child of `/us/en/magazine`, limit 4.
- Homepage adventures grid → direct children of `/us/en/adventures`, limit 4.
- Adventures "Current Adventures" → direct children of `/us/en/adventures`, all, with category tabs.
- Magazine "All Articles" → direct children of `/us/en/magazine`, all.

Note: `query-index.json` does not exist in the repo yet (404 locally, on the preview branch, and on `main`). It is configured at **tools.aem.live** and generated on publish — outside the repo, not committable. User will create it.

## Current state (verified in repo)
Grids to convert (all `cards-teaser`):

| Page | File | Grid heading | Root path | Limit |
|---|---|---|---|---|
| Homepage | `content/us/en.plain.html` | "Recent Articles" | `/us/en/magazine` | 4 |
| Homepage | `content/us/en.plain.html` | adventures grid ("Where do you want to go?") | `/us/en/adventures` | 4 |
| Adventures | `content/us/en/adventures.plain.html` | "Current Adventures" | `/us/en/adventures` | all |
| Magazine | `content/us/en/magazine.plain.html` | "All Articles" | `/us/en/magazine` | all |

Kept static (NOT converted): homepage `carousel-hero`, `columns-featured`, `hero-banner`; adventures `hero-banner`; magazine `columns-featured` (Featured Article) and `cards-teaser members` (Members Only — non-migrated targets, cannot be index-driven).

## Category model (adventures filter)
- Existing filter logic (`cards-teaser.js`) reads each card's *Activity* from its detail page's `columns-meta` and maps it to a tab; the catch-all tab is "Travel".
- New model: add a **Category** metadata field to each adventure detail page (page metadata block), value = the mapped tab (Climbing / Cycling / Skiing / Surfing / Travel). Mapping from Activity: `Rock Climbing`→Climbing, `Cycling`→Cycling, `Skiing`→Skiing, `Surfing`→Surfing, others (Social, Camping, Wine, Food…)→Travel.
- The index exposes this as a `category` column. `dynamic-list` reads the authored tab labels (an `<ol>` in the same section, as today) or a default set, builds the tab bar, tags each card by its `category`, and filters — no per-card detail-page fetch needed (faster than today).
- Magazine and other pages leave `category` blank; their `dynamic-list` blocks render no tab bar.

## Ordering
Index natural order ≈ path order. Limited grids ("Recent Articles", homepage adventures) show first N in index order, not by recency, unless a date sort is added later (needs `lastModified` in the index).

## Block authoring model
Authored as a simple block table:
```
| dynamic-list        |                  |
| root                | /us/en/adventures |
| limit               | 4                |
| categories          | All, Climbing, Cycling, Skiing, Surfing, Travel |  (optional; enables the filter)
```
`limit` empty/0 = all. `categories` omitted = no filter (plain grid).

## Implementation steps
1. **`blocks/dynamic-list/dynamic-list.js`** — parse `root`/`limit`/`categories`; fetch + cache `query-index.json` (try `/us/en/query-index.json` then `/query-index.json`); filter direct children of `root` (exclude root/index page + grandchildren); keep index order; slice to `limit`; build cards; normalize `.html`/extensionless links; if `categories` present, render the tab bar and filter by each card's `category`; graceful empty state.
2. **`blocks/dynamic-list/dynamic-list.css`** — reuse the exact `cards-teaser` values (image top 13/10 cover, dark uppercase linked title 18/27, uppercase grey truncated description 14/21, flex 1 1 260px → 0 1 260px ≥900px, 32px row gap) plus the tab-bar styles from `cards-teaser.css`. Scoped to `.dynamic-list`. **No visual/responsive change vs today.**
3. **Import pipeline** — update parser/transformer so the four target grids emit a `dynamic-list` block table (root, limit, categories) instead of `cards-teaser`; add the **Category** metadata to adventure detail pages (parser/transformer step or DA metadata). Keep all non-target blocks intact.
4. **Regenerate** the three listing pages (and adventure detail pages for Category metadata) via the bundled import script — not hand-written.
5. **Local verification fixture** — seed an uncommitted `query-index.json` from existing content (incl. `category`) so preview renders during dev.
6. **Verify** in preview: four grids render from the index, match old card look pixel-for-pixel, respect limits, link correctly; adventures tabs filter correctly; direct-child filtering excludes index page + grandchildren; responsive 390/768/1920 with no overflow regression. Run `npm run lint:css` + JS lint.
7. **Document** the tools.aem.live index config (columns incl. `category`) and publish step for live data; publishing/DA upload may need Settings → LLM Permissions opt-in (no token in chat).

## Checklist
- [ ] Create `blocks/dynamic-list/dynamic-list.js` (root/limit/categories parse, index fetch+cache, direct-child filter, limit slice, link normalize, category tab filter, empty state)
- [ ] Create `blocks/dynamic-list/dynamic-list.css` (reuse exact cards-teaser design + tab-bar styles; responsive 390/768/1920 unchanged)
- [ ] Define Category mapping (Activity→tab) and add Category metadata to adventure detail pages via import pipeline
- [ ] Update import parser/transformer so target grids emit `dynamic-list` (root+limit+categories) not `cards-teaser`
- [ ] Regenerate `content/us/en.plain.html` — "Recent Articles" (root `/us/en/magazine`, limit 4) and adventures grid (root `/us/en/adventures`, limit 4)
- [ ] Regenerate `content/us/en/adventures.plain.html` — "Current Adventures" (root `/us/en/adventures`, all, categories on)
- [ ] Regenerate `content/us/en/magazine.plain.html` — "All Articles" (root `/us/en/magazine`, all); keep Featured Article + Members Only
- [ ] Seed uncommitted local `query-index.json` fixture (with `category`) for preview verification
- [ ] Verify all four grids in preview (look, children, limits, links, adventures tab filter, direct-child filtering, responsive/overflow) — no style/responsiveness regression
- [ ] Run `npm run lint:css` and JS lint; fix issues
- [ ] Document tools.aem.live query-index config (columns incl. `category`) + publish/DA credential step for live data
- [ ] Update project memory with the dynamic-list architecture (one index, columns, root/limit/category + direct-child semantics, converted vs kept-static grids)

> Plan is ready. On your go-ahead I'll execute starting with the block (JS + CSS), since it's the safe, reversible first step.
