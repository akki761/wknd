/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-featured. Base block: columns.
 * Source: https://wknd.site/us/en.html (.teaser.cmp-teaser--featured)
 * Generated: 2026-09-03
 *
 * Structure (from library-description.txt — "Columns"):
 *   Multiple columns/rows. Row 1 = block name. Column count from visual grouping.
 *   This featured teaser is a two-column split panel: text content column + image column.
 *
 * Source: .cmp-teaser with .cmp-teaser__content (pretitle, title, description, CTA)
 *   and .cmp-teaser__image.
 */
export default function parse(element, { document }) {
  // --- Text content column ---
  const textCol = [];

  const pretitle = element.querySelector('.cmp-teaser__pretitle');
  if (pretitle && pretitle.textContent.trim()) {
    const p = document.createElement('p');
    const em = document.createElement('em');
    em.textContent = pretitle.textContent.trim();
    p.append(em);
    textCol.push(p);
  }

  const title = element.querySelector('.cmp-teaser__title, h1, h2, h3');
  if (title && title.textContent.trim()) {
    const heading = document.createElement('h2');
    heading.textContent = title.textContent.trim();
    textCol.push(heading);
  }

  const desc = element.querySelector('.cmp-teaser__description');
  if (desc && desc.textContent.trim()) {
    // Preserve block-level markup if present (e.g. <p>), else wrap the
    // description's own child nodes in a <p> so inline formatting
    // (<a>, <em>, <strong>, <br>) survives instead of being flattened.
    if (desc.querySelector('p, ul, ol')) {
      textCol.push(...Array.from(desc.children).map((c) => c.cloneNode(true)));
    } else {
      const p = document.createElement('p');
      p.append(...Array.from(desc.childNodes).map((n) => n.cloneNode(true)));
      textCol.push(p);
    }
  }

  const ctas = Array.from(element.querySelectorAll('.cmp-teaser__action-link'));
  ctas.forEach((cta) => {
    if (cta.textContent.trim()) textCol.push(cta);
  });

  // --- Image column ---
  const img = element.querySelector('.cmp-teaser__image img, .cmp-image img, img');

  // Empty-block guard
  if (textCol.length === 0 && !img) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Two-column layout: text | image
  const cells = [[textCol.length ? textCol : '', img || '']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-featured', cells });
  element.replaceWith(block);
}
