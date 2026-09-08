/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: adventure Category (compute + stash).
 *
 * The dynamic-list block on the adventures listing filters cards by a
 * `category` column in query-index.json, fed by a `Category` page-metadata
 * field. Source adventure pages don't have that field — the activity only
 * lives inside the metadata sidebar content fragment (parsed into a
 * `columns-meta` block with an "Activity" label/value row).
 *
 * This transformer runs in afterTransform (once columns-meta is parsed), reads
 * the Activity value, maps it to a filter category (Climbing / Cycling /
 * Skiing / Surfing / Travel — Travel is the catch-all) and stashes it on the
 * main element's dataset. The adventure-detail import appends it as a
 * `Category` row to the Metadata block AFTER WebImporter.rules.createMetadata
 * has built that block (createMetadata runs after this hook and only emits
 * known fields, so the row must be added downstream, not here).
 *
 * No-op on any page without a columns-meta Activity (magazine, about-us, etc.).
 */

function mapCategory(activity) {
  const a = (activity || '').toLowerCase();
  if (!a) return '';
  if (a.includes('climb')) return 'Climbing';
  if (a.includes('cycl')) return 'Cycling';
  if (a.includes('ski')) return 'Skiing';
  if (a.includes('surf')) return 'Surfing';
  return 'Travel';
}

// Read the Activity value out of the parsed columns-meta block (a table/div
// whose row has "Activity" in the first of two cells).
function findActivity(element) {
  let activity = '';
  element.querySelectorAll('div, tr').forEach((row) => {
    const cells = row.children;
    if (cells.length === 2 && cells[0].textContent.trim().toLowerCase() === 'activity') {
      activity = cells[1].textContent.trim();
    }
  });
  return activity;
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;
  const category = mapCategory(findActivity(element));
  if (category) element.dataset.wkndCategory = category;
}
