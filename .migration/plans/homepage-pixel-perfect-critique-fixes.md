# WKND Homepage Pixel-Perfect Critique & Fix Plan

## Objective
Run a full page critique plus per-block critique on the WKND homepage (`/content/us/en.html`) against the live source `https://wknd.site/us/en.html`, catalog every UI difference across **all viewports (desktop, tablet, mobile)**, then fix them iteratively until differences are minimal — **with zero regressions** to other templates/pages that share the same blocks and global styles.

## Scope — blocks to critique
Confirmed from `content/us/en.plain.html` plus the shared chrome fragments:
- **header** (nav fragment `content/us/nav.plain.html`) — logo, nav links, search, mobile left slide-in push-drawer
- **footer** (fragment `content/us/footer.plain.html`) — brand row, footer nav, FOLLOW US + social, legal block
- **carousel-hero** (homepage `hero` variant — 640px image, overlapping white card)
- **columns-featured** (the "Camping in Western Australia" featured teaser)
- **cards-teaser** (the "Recent Articles" grid)
- **hero-banner**
- plus **section-metadata** (grey/spacing sections) and global default-content (section headings, underlines)

## Viewports (test every step at all three)
- **Desktop: 1920px** — WKND caps the page at a **1680px centered container** (120px gutters). Measuring narrower gives false full-bleed readings.
- **Tablet: 768px** (and spot-check the 900px breakpoint boundary where nav/footer switch layouts).
- **Mobile: 390px** — mobile nav = left slide-in **push** drawer (280px), hero/hero-banner 16:9 imagery, single-column grids.

## Critical guardrails (from prior learnings — do not relitigate)
- **No full-width grey band** on the featured section — grey is only the ~427px teaser text column inside `columns-featured`.
- Yellow is literal **`#ffea00`** in block CSS (brand token `--accent-color` is `#ffc700`).
- Card titles (cards-teaser) are **dark bold uppercase**, not blue link.
- Section heading yellow underline: `::after`, 84px, scoped to `.default-content-wrapper`.
- **Header:** search box renders at ALL breakpoints (code-driven, not fragment-gated); mobile drawer is a PUSH pattern (header `margin-left`, main/footer `transform:translateX`) — the `@media(≥900px)` block MUST fully reset the drawer or desktop breaks; hamburger 44×44, yellow `#ffc700` border when expanded (no morph to cross). Migrated header is ~89px vs source ~194px — known height gap, evaluate whether to close it.
- **Footer:** NO visible divider (source separator is hidden); logo + footer nav on ONE centered row at ≥900px (66px gap); FOLLOW US/social far-right via `space-between`; legal block `margin-top:24px`.
- **Regression risk:** these blocks + global styles are shared by article, adventure-detail, and listing templates; header/footer render on EVERY page. Any global (`styles.css`), `header.js`/`footer.js`, or shared-block-CSS change must be verified across those templates AND all viewports. Prefer block-scoped / homepage-scoped selectors over global edits.

## Execution note
User approved proceeding. **Steps 5–7 modify files and require Execute mode** (Steps 1–4 are read-only critique/analysis). Once in Execute mode, work the checklist top to bottom.

## Checklist

### Step 1 — Baseline capture (all viewports)
- [ ] Verify local preview (`localhost:3000/content/us/en.html`) and source (`wknd.site/us/en.html`) both render (200).
- [ ] For each viewport (1920 / 768 / 390): resize Playwright, navigate to local + source, snapshot DOM to confirm block/section parity.
- [ ] Take one baseline screenshot per viewport per site for side-by-side reference (screenshots used sparingly).

### Step 2 — Full-page critique (per viewport)
- [ ] Run `excat-visual-critique` full-page mode (local vs source) at 1920, 768, and 390.
- [ ] Record page-level diffs: container width/gutters, section vertical rhythm, header→first-section gap, background bands, typography scale — noting which viewport each diff appears in.

### Step 3 — Per-block critique (each block × each viewport)
- [ ] **header** — desktop: logo height (48px), nav link sizing/spacing, search presence, overall header height vs source (~194px); tablet/mobile: hamburger 44×44 + yellow expanded border, left push-drawer (280px shift, dark bg, uppercase `#ebebeb` links, yellow hover), search still present, scrim.
- [ ] **footer** — desktop: single centered brand row (66px gap), no divider, social far-right, legal `margin-top:24px`; tablet/mobile: stacking order, logo margin reset, social alignment.
- [ ] **carousel-hero** — image height (640px desktop / 16:9 mobile), overlapping white card (`max-width:1192px; margin:-180px auto 0`), dots, `#ffea00` CTA, zero gap to featured; verify card behavior at tablet/mobile.
- [ ] **columns-featured** — grey text column only (not full band), column widths, stacking on mobile, spacing/typography.
- [ ] **cards-teaser** ("Recent Articles") — grid columns/gap (multi-col desktop → single-col mobile), card title dark-uppercase, image ratios, hover, "Read More".
- [ ] **hero-banner** — image ratio (640px desktop / 16:9 mobile), justified paragraphs, CTA.
- [ ] **default-content section headings** — Asar serif h2/h3, 84px yellow underline (all viewports).
- [ ] For each block × viewport, use `playwright_evaluate` to diff computed styles (font, size, weight, color, margin, padding, dimensions) local vs source. Screenshots only where pixel confirmation is essential.

### Step 4 — Consolidate findings into a diff table
- [ ] Produce a table: `block/area | viewport | property | source value | local value | severity | proposed fix | file`.
- [ ] Flag each fix as **block-scoped** (safe) vs **global / header.js / footer.js** (regression risk → note which other templates + viewports to re-verify).
- [ ] Rank by visual severity; group by file to minimize edit churn.

### Step 5 — Implement fixes (Execute mode; iterate)
- [ ] Apply fixes highest-severity first, editing the specific block CSS (`blocks/<block>/<block>.css`), `blocks/header/header.js|css`, `blocks/footer/footer.js|css`, or `styles/styles.css` only where global is unavoidable.
- [ ] Keep selectors scoped: `.blockname`, `body.tpl-*`, or breakpoint-scoped media queries; never widen a global rule that other templates depend on; always fully reset the drawer in the ≥900px block.
- [ ] After each block's fixes: re-navigate (auto-reload), then snapshot + evaluate at ALL affected viewports to confirm the diff closed.

### Step 6 — Regression verification (mandatory, all viewports)
- [ ] For every global / header.js / footer.js / shared-block change, re-render and spot-check other pages at 1920 / 768 / 390:
  - article (`/magazine/<slug>`), adventure-detail (`/adventures/<slug>`), a listing page, faqs.
- [ ] Header/footer render everywhere — confirm no regression to nav links, search, mobile drawer push, footer row on any of those pages.
- [ ] Confirm no layout/typography regression (heading underline, reading column, two-column adventure).

### Step 7 — Final QA & wrap-up
- [ ] Final full-page critique local vs source at 1920 / 768 / 390 — confirm differences are none/minimal.
- [ ] Summarize what changed per file and confirm no regressions across pages and viewports.
- [ ] Update project memory (design-critique learnings) with any new hard-won values (esp. header height, footer, viewport-specific fixes).
- [ ] Note: no re-import needed for CSS/JS-only changes; nav/footer are fragments (CSS/JS-only). Content changes, if any, would require the bundle/import loop.

## Notes
- This plan is CSS/JS/rendering-focused (no content re-import expected). If a diff turns out to be a content/markup problem, it moves to the importer loop (edit parser/transformer → rebundle → `run-bulk-import.js --force`).
