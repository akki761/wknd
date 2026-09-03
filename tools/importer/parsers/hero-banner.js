/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-banner. Base block: hero.
 * Source: https://wknd.site/us/en.html (.teaser.cmp-teaser--hero.cmp-teaser--imagebottom)
 * Generated: 2026-09-03
 *
 * Structure (from library-description.txt — "Hero"):
 *   1 column, 3 rows. Row 1 = block name.
 *   Row 2 (single cell): Background Image (optional).
 *   Row 3 (single cell): Title (heading), Subheading, CTA.
 *
 * Source: .cmp-teaser with .cmp-teaser__content (title, description, CTA)
 *   and .cmp-teaser__image.
 */
export default function parse(element, { document }) {
  const cells = [];

  // --- Row 2: Background image (single cell) ---
  const img = element.querySelector('.cmp-teaser__image img, .cmp-image img, img');
  if (img) {
    cells.push([img]);
  }

  // --- Row 3: Title, subheading, CTA (single cell) ---
  const contentCell = [];

  const title = element.querySelector('.cmp-teaser__title, h1, h2, h3');
  if (title && title.textContent.trim()) {
    const heading = document.createElement('h2');
    heading.textContent = title.textContent.trim();
    contentCell.push(heading);
  }

  const desc = element.querySelector('.cmp-teaser__description');
  if (desc && desc.textContent.trim()) {
    // Preserve block-level markup if present (e.g. <p>), else wrap the
    // description's own child nodes in a <p> so inline formatting
    // (<a>, <em>, <strong>, <br>) survives instead of being flattened.
    if (desc.querySelector('p, ul, ol')) {
      contentCell.push(...Array.from(desc.children).map((c) => c.cloneNode(true)));
    } else {
      const p = document.createElement('p');
      p.append(...Array.from(desc.childNodes).map((n) => n.cloneNode(true)));
      contentCell.push(p);
    }
  }

  const ctas = Array.from(element.querySelectorAll('.cmp-teaser__action-link'));
  ctas.forEach((cta) => {
    if (cta.textContent.trim()) contentCell.push(cta);
  });

  // Empty-block guard
  if (!img && contentCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Single-column block: push content cell as its own row (one cell holding all elements).
  cells.push([contentCell.length ? contentCell : '']);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells });
  element.replaceWith(block);
}
