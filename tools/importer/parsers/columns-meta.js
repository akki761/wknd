/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-meta. Base block: columns.
 * Source: https://wknd.site/us/en/adventures/bali-surf-camp.html
 *   (.cmp-contentfragment / .contentfragment — adventure metadata sidebar)
 * Generated: 2026-09-03
 *
 * Structure (columns block — from library convention "Columns"):
 *   Multiple columns and rows. Row 1 = block name only.
 *   Each subsequent row = one label/value pair rendered side by side:
 *   2 cells [label cell, value cell]. Every content row has 2 cells.
 *
 * Source: an AEM content fragment. Each label/value pair is a
 *   <div class="cmp-contentfragment__element"> containing:
 *     - <dt class="cmp-contentfragment__element-title"> — label (e.g. "Activity")
 *     - <dd class="cmp-contentfragment__element-value"> — value (e.g. "Surfing")
 */
export default function parse(element, { document }) {
  // One row per label/value pair.
  const pairs = Array.from(
    element.querySelectorAll('.cmp-contentfragment__element'),
  );

  const cells = [];

  pairs.forEach((pair) => {
    const labelEl = pair.querySelector('.cmp-contentfragment__element-title, dt');
    const valueEl = pair.querySelector('.cmp-contentfragment__element-value, dd');

    const label = labelEl ? labelEl.textContent.trim() : '';

    // Value cell — preserve inline markup (links, emphasis, lists) if present,
    // otherwise fall back to trimmed text.
    let valueCell = '';
    if (valueEl) {
      if (valueEl.querySelector('a, ul, ol, p, strong, em, b, i, br')) {
        valueCell = Array.from(valueEl.childNodes).map((n) => n.cloneNode(true));
      } else {
        valueCell = valueEl.textContent.trim();
      }
    }

    // Skip fully empty pairs.
    if (!label && (!valueCell || (Array.isArray(valueCell) && valueCell.length === 0))) return;

    // Every content row has 2 cells to match the columns convention.
    cells.push([label, valueCell]);
  });

  // Empty-block guard: not a metadata content fragment (e.g. a tab-embedded
  // content fragment without label/value elements) — leave content in place.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-meta', cells });
  element.replaceWith(block);
}
