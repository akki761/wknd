# WKND Site Search Implementation Plan

Implement a working, keyboard-accessible search for the WKND site backed by the existing `query-index.json`. The header already ships a search form pointing at `/us/en/search` (currently `preventDefault`-ed), so this plan wires that form to a real results page powered by a new `search` block. Pages that carry no index metadata are naturally and explicitly excluded from results.

## Current State (verified)
- **Header search exists but is inert.** `blocks/header/header.js` `buildSearch()` builds a `<form role="search" action="/us/en/search">` with an `input[name="q"]`, then calls `e.preventDefault()` with the comment *"No search index in this migration; prevent navigation to a 404."* — so submitting does nothing today.
- **An index is already published.** `content/us/en/query-index.json` holds **21 rows** (16 `/adventures/*` + 5 `/magazine/*`), each with `path, title, description, image, category, lastModified`. `dynamic-list.js` already fetches it via `INDEX_PATHS = ['/us/en/query-index.json', '/query-index.json']`.
- **Pages missing from the index** (e.g. `about-us`, `faqs`, the `/adventures` & `/magazine` listing pages, home) have `.plain.html` files but **no row in `query-index.json`** — i.e. no index metadata. These must not appear in results.
- **No `/us/en/search` page or `search` block exists yet.** Routing (`decorateTemplateFromPath`) already special-cases template classes by path; search results render inside `main` like any other page.
- No build step; CSS must be scoped to `.search`; `scripts/aem.js` is vendored (do not edit).

## Approach
1. **New `search` block** (`blocks/search/search.js` + `search.css`) that:
   - reads the `?q=` query param from the URL,
   - fetches `query-index.json` (reuse the same candidate-path + cache pattern as `dynamic-list.js`),
   - **excludes any row lacking index metadata** — skip rows with no `title` (and treat empty `description`/`image` gracefully). Because the source is the query-index itself, un-indexed pages are already absent; the title guard is the explicit belt-and-suspenders filter the request calls for,
   - scores/filters rows case-insensitively across `title`, `description`, and `category`,
   - renders a results list reusing the site's card look (linked title, description, optimized image via `createOptimizedPicture`), plus a result count and a graceful "no results" / "type to search" empty state,
   - re-runs on input (live filter) and keeps the URL `?q=` in sync.
2. **Search results page content** at `content/us/en/search.plain.html` containing a single `search` block table, plus a heading. (Created via the project's import path — I will not hand-author files in `content/` beyond what the workflow allows; see Open Question.)
3. **Wire the header form**: replace the `preventDefault` stub in `buildSearch()` so submit navigates to `/us/en/search?q=<encoded>` (natural GET form submit is fine since `action` + `name="q"` already produce that URL — remove the blocker and let it submit).
4. **Verify** in the local preview across desktop/mobile.

## Files to touch
- `blocks/search/search.js` — new block (query parsing, index fetch, filter, render).
- `blocks/search/search.css` — new, scoped to `.search`.
- `blocks/header/header.js` — remove/replace the `submit` `preventDefault`; ensure it navigates to the results page.
- `content/us/en/search.plain.html` — new results page hosting the `search` block (via import script per project rules).
- (Optional) memory note documenting the search block conventions.

## Checklist
- [ ] Confirm scope decisions via the questions below (results-page vs dropdown; fields to search)
- [ ] Check `blocks/header/header.css` search styles and Block Collection for a reference `search` block
- [ ] Create `blocks/search/search.js`: parse `?q=`, fetch & cache `query-index.json`, filter across title/description/category
- [ ] Enforce exclusion rule: drop rows with no index metadata (empty `title`); handle missing `description`/`image` gracefully
- [ ] Render results (linked title + description + optimized image), result count, and empty/no-results states; live-filter on input
- [ ] Create `blocks/search/search.css` scoped to `.search`, matching WKND card styling (measure at 1920px, 1680px cap)
- [ ] Update `blocks/header/header.js` `buildSearch()` to submit to `/us/en/search?q=…` instead of `preventDefault`
- [ ] Create `content/us/en/search.plain.html` with the `search` block via the project import script
- [ ] Preview: navigate to `/us/en/search?q=surf` (and via the header box), verify DOM with snapshot/evaluate on desktop + mobile
- [ ] Verify un-indexed pages (about-us, faqs, listing pages) never appear in results
- [ ] Lint (`npm run lint`) and open a PR including the `{branch}--{repo}--{owner}.aem.page/us/en/search?q=…` preview link

## Open Questions / Notes
- **Execution requires Execute mode** — this plan is read-only. On approval I'll implement the above.
- Per project rules I won't hand-edit `content/`; the `search.plain.html` results page will be produced via the bundled import script.
- Default behavior chosen (adjustable): a **dedicated `/us/en/search` results page** (the header form already targets it), searching **title + description + category**, live-filtering as you type, with `?q=` deep-linkable.
