import { createOptimizedPicture } from '../../scripts/aem.js';

/* search — query-index-backed site search.
 *
 * Authored as a bare block table (no config needed):
 *   | search |
 *
 * On decorate it reads the `?q=` query param, fetches the published
 * query-index.json (same candidate-path + cache pattern as dynamic-list.js),
 * and filters rows case-insensitively across `title`, `description` and
 * `category`. Matching rows render as cards that reuse the cards-teaser /
 * dynamic-list look (image on top, dark uppercase linked title, uppercase grey
 * description).
 *
 * EXCLUSION RULE: a row with no index metadata (no `title`) is dropped from
 * results. Because the source is the query-index itself, pages that were never
 * indexed are already absent; the title guard is the explicit belt-and-braces
 * filter. Empty `description`/`image` are handled gracefully (the card just
 * omits that part).
 *
 * A search input is rendered at the top (pre-filled from `?q=`) so users can
 * refine on the page — it live-filters as they type and keeps the URL `?q=`
 * in sync (via history.replaceState) so results stay deep-linkable/shareable.
 *
 * The index is fetched once and cached. If it is unavailable the block shows a
 * graceful empty state rather than erroring.
 */

// Candidate index locations, tried in order — site-root first (resolves on
// both localhost/aem up AND production), locale-scoped as the fallback (it
// 404s on production, so trying it first would log a console error). Mirrors
// dynamic-list.js.
const INDEX_PATHS = ['/query-index.json', '/us/en/query-index.json'];

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

// Extensionless, no-trailing-slash path so `.html` links and index paths
// compare/link consistently (mirrors dynamic-list.js).
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

// Read the current query from the URL (?q=...).
function getQuery() {
  try {
    return new URL(window.location.href).searchParams.get('q') || '';
  } catch (e) {
    return '';
  }
}

// A row is searchable only if it carries index metadata — here, a non-empty
// title. This is the explicit exclusion of un-indexed pages.
function isIndexed(row) {
  return !!(row.title && row.title.trim());
}

// Match a row against the query across title, description and category.
// An empty query matches nothing (the block shows the "type to search" prompt).
function matches(row, query) {
  const q = normalize(query);
  if (!q) return false;
  const haystack = [row.title, row.description, row.category]
    .map(normalize)
    .join(' ');
  // AND across whitespace-separated terms so multi-word queries narrow.
  return q.split(/\s+/).filter(Boolean).every((term) => haystack.includes(term));
}

function buildCard(row) {
  const li = document.createElement('li');
  const href = normalizePath(row.path);
  const title = (row.title || '').trim();
  const description = (row.description || '').trim();

  // Image cell
  const imageCell = document.createElement('div');
  imageCell.className = 'search-card-image';
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
  bodyCell.className = 'search-card-body';
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

export default async function decorate(block) {
  block.textContent = '';

  // --- Search form (pre-filled from ?q=) ---
  const form = document.createElement('form');
  form.className = 'search-form';
  form.setAttribute('role', 'search');
  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = 'Search';
  input.setAttribute('aria-label', 'Search');
  input.value = getQuery();
  form.append(input);
  form.addEventListener('submit', (e) => e.preventDefault());
  block.append(form);

  // --- Result count / status line ---
  const status = document.createElement('p');
  status.className = 'search-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  block.append(status);

  // --- Results list ---
  const ul = document.createElement('ul');
  ul.className = 'search-results';
  block.append(ul);

  // Only indexed rows are ever searchable (excludes un-indexed pages).
  const data = (await fetchIndex()).filter(isIndexed);

  function render(query) {
    ul.textContent = '';
    const q = (query || '').trim();
    if (!q) {
      status.textContent = 'Type to search WKND adventures and articles.';
      return;
    }
    const results = data.filter((row) => matches(row, q));
    if (results.length === 0) {
      status.textContent = `No results for “${q}”.`;
      return;
    }
    const label = results.length === 1 ? '1 result' : `${results.length} results`;
    status.textContent = `${label} for “${q}”`;
    results.forEach((row) => ul.append(buildCard(row)));
  }

  // Keep the URL ?q= in sync so results are deep-linkable/shareable.
  function syncUrl(query) {
    try {
      const url = new URL(window.location.href);
      if (query) url.searchParams.set('q', query);
      else url.searchParams.delete('q');
      window.history.replaceState({}, '', url);
    } catch (e) {
      // non-fatal
    }
  }

  input.addEventListener('input', () => {
    const q = input.value;
    syncUrl(q);
    render(q);
  });

  render(input.value);
}
