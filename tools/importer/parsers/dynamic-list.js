/* eslint-disable */
/* global WebImporter */
/**
 * Parser for dynamic-list. Emits a small config block that the runtime
 * dynamic-list block (blocks/dynamic-list) expands at render time by reading
 * query-index.json.
 *
 * Instead of enumerating every card (as cards-teaser does), this replaces the
 * source image-list grid with a two-column config table:
 *
 *   | dynamic-list |                    |
 *   | root         | /us/en/adventures  |
 *   | limit        | 4                  |
 *   | categories   | All, Climbing, ... |   (only when the grid is tabbed)
 *
 * - root:       derived from the cards' shared parent path (the folder the
 *               linked detail pages live in), so it is never hardcoded.
 * - limit:      passed per-template via options.limit (homepage = 4;
 *               listings = -1 = all;
 *               full listings = 0 = all).
 * - categories: when the grid lives inside a .cmp-tabs group (adventures
 *               listing), the source tab labels (All / Climbing / ...) are
 *               extracted so the block renders the same filter. Absent
 *               otherwise (homepage, magazine).
 *
 * Tabbed listings repeat the grid once per tab panel; like cards-teaser we
 * emit only once per tab group and remove the later per-category panels.
 */

function normalizeRoot(href) {
  if (!href) return '';
  let path = href.trim();
  try {
    path = new URL(path, 'https://wknd.site').pathname;
  } catch (e) {
    // leave as-is
  }
  path = path.replace(/\.html?$/, '').replace(/\/+$/, '');
  // Drop the last segment (the detail page) to get the containing folder.
  const idx = path.lastIndexOf('/');
  return idx > 0 ? path.slice(0, idx) : path;
}

// Derive the listing root from the most common parent folder across all cards,
// so a stray link can't skew it.
function deriveRoot(items) {
  const counts = new Map();
  items.forEach((item) => {
    const href = item.querySelector('a.cmp-image-list__item-title-link')?.getAttribute('href')
      || item.querySelector('a.cmp-image-list__item-image-link')?.getAttribute('href')
      || item.querySelector('a[href]')?.getAttribute('href');
    const root = normalizeRoot(href);
    if (root) counts.set(root, (counts.get(root) || 0) + 1);
  });
  let best = '';
  let max = 0;
  counts.forEach((n, root) => {
    if (n > max) {
      max = n;
      best = root;
    }
  });
  return best;
}

// Extract the tab labels (All / Climbing / ...) from the enclosing tab group.
function extractCategories(tabsRoot) {
  if (!tabsRoot) return [];
  const tabs = Array.from(tabsRoot.querySelectorAll('.cmp-tabs__tab, [role="tab"]'));
  return tabs.map((t) => t.textContent.trim()).filter(Boolean);
}

export default function parse(element, { document }, options = {}) {
  const { limit = -1 } = options; // -1 = list all children

  // Tabbed listing: emit only once per tab group; remove later per-category
  // panels so they don't produce duplicate blocks.
  const tabsRoot = element.closest('.cmp-tabs, .tabs.panelcontainer');
  if (tabsRoot) {
    if (tabsRoot.hasAttribute('data-dynamic-list-emitted')) {
      element.remove();
      return;
    }
    tabsRoot.setAttribute('data-dynamic-list-emitted', 'true');
  }

  const items = Array.from(
    element.querySelectorAll('li.cmp-image-list__item, .cmp-image-list__item'),
  );

  const root = deriveRoot(items);
  if (!root) {
    // Nothing to anchor on — leave the source untouched rather than guess.
    element.replaceWith(...element.childNodes);
    return;
  }

  const categories = extractCategories(tabsRoot);

  const cells = [];
  cells.push(['root', root]);
  cells.push(['limit', String(limit)]);
  if (categories.length >= 2) cells.push(['categories', categories.join(', ')]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'dynamic-list', cells });

  // For a tabbed listing the grid sits deep inside the tab group; replace the
  // whole tab group so its labels/panels don't linger. Otherwise replace just
  // the grid element.
  const target = tabsRoot || element;
  target.replaceWith(block);
}
