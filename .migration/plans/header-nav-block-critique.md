# Header/Nav Block Critique — vs. wknd.site/us/en

A block-level design comparison of the local `header` block against the live reference `https://wknd.site/us/en.html`, measured at 1920px desktop width (per project convention). Structurally the block is a strong match — dark utility bar, white main row, logo left, uppercase nav links + search right, off-canvas mobile drawer. The differences below are refinements, not rebuilds.

## Structural / Content Parity (✓ matches)
- Two-tier layout: dark utility bar (`#202020`) over white main row — matches.
- Utility bar right-aligned with Sign In + language selector — matches.
- Logo left, nav links + search right-aligned on the main row — matches.
- Nav links, colors (`#202020`, hover accent `#ffc700`), 14px uppercase — matches.
- Search input 166×42, translucent grey bg, magnifier icon — matches.
- **Search bar horizontal position** — live right-edge ≈1528px vs local ≈1536px (an ~8px delta caused only by the container's left offset; logo left 392 vs 384). Effectively correct.
- "Home" is mobile-only / hidden on desktop — matches.
- Off-canvas mobile drawer with page-push — matches source behavior.

## Differences Found

| # | Area | Live (wknd.site) | Local block | Severity |
|---|------|------------------|-------------|----------|
| 1 | **Header height / vertical padding** | ~194px tall; logo top ≈82px; main-row padding ≈60px top & bottom — generous, airy | ~115px tall; logo top ≈44px; main-row padding only `22px` | High (most visible) |
| 2 | **Search bar vertical position** | Search top ≈85px (sits lower, centered in the tall row) | Search top ≈47px | High — but a **symptom of #1**, not an independent bug. Fixing the main-bar padding moves it into place. |
| 3 | **Language label casing** | `EN-US` (uppercase) | `en-US` (lowercase, from fragment) | Medium |
| 4 | **Country flag icon** | US flag image shown before `EN-US` | No flag — plain text + `▾` chevron | Medium |
| 5 | **Sign In casing** | `SIGN IN` (uppercase) | `Sign In` | Low |
| 6 | **Search placeholder casing** | Displays `SEARCH` (uppercased) | Displays `Search` | Low |
| 7 | **Utility bar content width** | Sign In sits further left (≈1290px); tighter cluster with flag+lang | Sign In at ≈1414px; slightly different horizontal cluster | Low |

## Recommended Fixes (Checklist)

- [ ] **Increase main-bar vertical padding** — bump `.nav-main-inner` padding from `22px 24px` toward `~60px 24px` (match the measured ~62px) so header height ≈190px. This simultaneously corrects the search bar's vertical position (#2) since the search sits inside this row.
- [ ] **Confirm search bar alignment after padding fix** — verify search top ≈85px and right-edge alignment; the ~8px horizontal delta is from the container offset and needs no separate change.
- [ ] **Uppercase the language label** — apply `text-transform: uppercase` to `.nav-lang-toggle` (keeps fragment content `en-US` but renders `EN-US`).
- [ ] **Add the country flag icon** — render a small US flag before the language label in the utility bar (icon asset or inline SVG), matching the source's flag + label pattern.
- [ ] **Uppercase Sign In** — apply `text-transform: uppercase` to `.nav-signin` (source renders `SIGN IN`).
- [ ] **Uppercase the search placeholder** — apply `text-transform: uppercase` (and matching letter-spacing) to `.nav-search input` / its placeholder so it reads `SEARCH`.
- [ ] **Nudge utility-bar cluster spacing** — verify the Sign In / language gap and alignment against the source cluster; adjust `.nav-utility-inner` gap if needed.
- [ ] **Re-verify at 1920px** in preview after each change; capture a final comparison screenshot against the live header.
- [ ] **Confirm mobile drawer unaffected** — re-check the off-canvas push behavior at <900px still works after padding changes.

## Notes / Open Questions
- **On the search bar:** its horizontal placement is essentially correct — only the vertical position reads as "off," and that's driven entirely by the short main-row padding (#1). No dedicated search-repositioning fix is needed; fixing the padding resolves both.
- Items 3–6 are casing changes best handled purely in CSS (`text-transform`) rather than editing the nav fragment content, keeping the content-first approach intact.
- The flag icon (#4) needs a source asset decision — reuse a flag SVG or a small sprite. Flag me if you'd rather skip the flag and keep it text-only.

> This is a plan/critique only. Applying these CSS/JS fixes to `blocks/header/header.css` (and `header.js` for the flag) requires **Execute mode** — switch over and I'll implement the checklist.
