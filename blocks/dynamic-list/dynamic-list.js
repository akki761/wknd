import { createOptimizedPicture } from '../../scripts/aem.js';

/* dynamic-list — data-driven teaser row.
 *
 * Authored as a simple block table:
 *   | dynamic-list |                    |
 *   | root         | /us/en/adventures  |
 *   | limit        | 4                  |  (empty or <= -1 = all; N = first N)
 *   | categories   | All, Climbing, ... |  (optional — enables the tab filter)
 *
 * On decorate it fetches the published query-index.json, keeps the rows whose
 * `path` is a DIRECT child of `root` (the root/index page itself and deeper
 * grandchildren are excluded), preserves index order, slices to `limit`, and
 * renders cards that reuse the cards-teaser look (image on top, dark uppercase
 * linked title, uppercase grey description).
 *
 * When `categories` is authored, a tab bar is rendered and each card is tagged
 * from its index `category` field so the row filters client-side — no per-card
 * page fetch (unlike the old cards-teaser filter). The first tab is the
 * "show all" tab; the last tab is the catch-all for cards whose category
 * doesn't match a specific tab.
 *
 * The index is fetched once per page and cached across every dynamic-list
 * block. If the index is unavailable or the root has no children the block
 * renders nothing (graceful empty state) rather than erroring.
 */

// Candidate index locations, tried in order. The locale-scoped index is
// preferred; the site-root index is the fallback. Both are standard EDS
// query-index endpoints.
const INDEX_PATHS = ['/us/en/query-index.json', '/query-index.json'];

let indexPromise;

async function fetchIndex() {
  if (!indexPromise) {
    indexPromise = (async () => {
      for (let i = 0; i < INDEX_PATHS.length; i += 1) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const resp = await fetch(INDEX_PATHS[i]);
          if (resp.ok) {
            // eslint-disable-next-line no-await-in-loop
            const json = await resp.json();
            if (Array.isArray(json.data)) return json.data;
          }
        } catch (e) {
          // try the next candidate
        }
      }
      return [];
    })();
  }
  return indexPromise;
}

function normalize(str) {
  return (str || '').trim().toLowerCase();
}

// Normalize to an extensionless, no-trailing-slash path so `.html` links and
// index paths compare equal (e.g. /us/en/magazine/ski-touring.html ->
// /us/en/magazine/ski-touring).
function normalizePath(p) {
  if (!p) return '';
  let path = p.trim();
  try {
    path = new URL(path, window.location.origin).pathname;
  } catch (e) {
    // leave as-is
  }
  return path.replace(/\.html?$/, '').replace(/\/+$/, '') || '/';
}

// Fallback: read a page's Activity/Category from its own content when the
// index doesn't carry a `category` column yet. Mirrors the old cards-teaser
// filter (reads the columns-meta "Activity" row), but also accepts a
// "Category" row if one is authored. Returns '' on any failure.
async function fetchCategory(href) {
  try {
    const url = new URL(href, window.location.href);
    const resp = await fetch(`${url.pathname}.plain.html`);
    if (!resp.ok) return '';
    const html = await resp.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    let value = '';
    doc.querySelectorAll('.columns-meta > div, .metadata > div').forEach((row) => {
      const cells = row.children;
      if (cells.length >= 2) {
        const key = normalize(cells[0].textContent);
        if ((key === 'activity' || key === 'category') && !value) {
          value = cells[1].textContent.trim();
        }
      }
    });
    return value;
  } catch (e) {
    return '';
  }
}

// A row is a DIRECT child of root when, after removing the root prefix, exactly
// one path segment remains. The root/index page itself has zero remaining
// segments; grandchildren have two or more.
function isDirectChild(rowPath, root) {
  if (rowPath === root) return false;
  const prefix = root === '/' ? '/' : `${root}/`;
  if (!rowPath.startsWith(prefix)) return false;
  const rest = rowPath.slice(prefix.length);
  return rest.length > 0 && !rest.includes('/');
}

// Read the authored config. Rows are label/value pairs; accept root, limit and
// categories in any order, tolerant of extra whitespace.
function readConfig(block) {
  // limit defaults to -1 (all) so an omitted/blank limit lists everything.
  const config = { root: '', limit: -1, categories: [] };
  [...block.children].forEach((row) => {
    const cells = row.children;
    if (cells.length < 2) return;
    const key = normalize(cells[0].textContent);
    const value = cells[1].textContent.trim();
    if (key === 'root') config.root = normalizePath(value);
    else if (key === 'limit') {
      const n = parseInt(value, 10);
      config.limit = Number.isNaN(n) ? -1 : n;
    } else if (key === 'categories') {
      config.categories = value.split(',').map((s) => s.trim()).filter(Boolean);
    }
  });
  return config;
}

function buildCard(row) {
  const li = document.createElement('li');
  const href = normalizePath(row.path);
  const title = (row.title || '').trim();
  const description = (row.description || '').trim();

  // Image cell
  const imageCell = document.createElement('div');
  imageCell.className = 'dynamic-list-card-image';
  if (row.image) {
    const pic = createOptimizedPicture(row.image, title, false, [{ width: '750' }]);
    const a = document.createElement('a');
    a.setAttribute('href', href);
    a.setAttribute('aria-label', title);
    a.append(pic);
    imageCell.append(a);
  }

  // Body cell
  const bodyCell = document.createElement('div');
  bodyCell.className = 'dynamic-list-card-body';
  if (title) {
    const h3 = document.createElement('h3');
    const a = document.createElement('a');
    a.setAttribute('href', href);
    a.textContent = title;
    h3.append(a);
    bodyCell.append(h3);
  }
  if (description) {
    const p = document.createElement('p');
    p.textContent = description;
    bodyCell.append(p);
  }

  li.append(imageCell, bodyCell);
  return li;
}

// Build the category tab bar and wire up filtering. Cards are tagged by their
// index `category`; a card whose category doesn't match any specific tab falls
// into the catch-all (the last tab, e.g. "Travel").
async function buildTabs(block, ul, categories) {
  const allTab = categories[0];
  const catchAll = categories[categories.length - 1];
  const specificTabs = categories.slice(1, -1);
  const cards = [...ul.children];

  // Resolve each card's category. Prefer the index value (set as data-category);
  // if it's absent (index not yet emitting a `category` column), fall back to
  // fetching it from the card's page so the filter still works.
  await Promise.all(cards.map(async (li) => {
    if (!li.dataset.category) {
      const href = li.querySelector('a[href]')?.getAttribute('href');
      if (href) {
        const cat = await fetchCategory(href);
        if (cat) li.dataset.category = cat;
      }
    }
  }));

  cards.forEach((li) => {
    const cat = normalize(li.dataset.category);
    const match = specificTabs.find((tab) => cat && cat.includes(normalize(tab)));
    li.dataset.tab = match || catchAll;
  });

  const nav = document.createElement('div');
  nav.className = 'dynamic-list-tabs';
  nav.setAttribute('role', 'tablist');

  function applyFilter(label) {
    const showAll = normalize(label) === normalize(allTab);
    cards.forEach((li) => {
      li.hidden = !(showAll || li.dataset.tab === label);
    });
  }

  categories.forEach((label, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dynamic-list-tab';
    btn.textContent = label;
    btn.setAttribute('role', 'tab');
    const selected = i === 0;
    btn.setAttribute('aria-selected', String(selected));
    if (selected) btn.classList.add('is-active');
    btn.addEventListener('click', () => {
      nav.querySelectorAll('.dynamic-list-tab').forEach((b) => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');
      applyFilter(label);
    });
    nav.append(btn);
  });

  block.prepend(nav);
  applyFilter(allTab);
}

export default async function decorate(block) {
  const { root, limit, categories } = readConfig(block);
  block.textContent = '';
  if (!root) return;

  const data = await fetchIndex();
  const children = data
    .map((row) => ({ ...row, path: normalizePath(row.path) }))
    .filter((row) => isDirectChild(row.path, root));

  // limit <= -1 means "all"; any limit >= 0 slices to that count (0 shows none).
  const rows = limit <= -1 ? children : children.slice(0, limit);
  if (rows.length === 0) return; // graceful empty state

  const ul = document.createElement('ul');
  rows.forEach((row) => {
    const li = buildCard(row);
    if (row.category) li.dataset.category = row.category;
    ul.append(li);
  });
  block.append(ul);

  if (categories.length >= 2) await buildTabs(block, ul, categories);
}
