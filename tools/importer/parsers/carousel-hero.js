/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-hero. Base block: carousel.
 * Source: https://wknd.site/us/en.html (.carousel.panelcontainer.cmp-carousel--hero)
 * Generated: 2026-09-03
 *
 * Structure (from library-description.txt — "Carousel"):
 *   2 columns, multiple rows. Row 1 = block name.
 *   Each subsequent row = one slide: [image cell, text cell].
 *   Image cell: image only. Text cell: Title (heading), Description, CTA.
 *
 * Source: <div.cmp-carousel__item> per slide, each containing a
 *   .cmp-teaser with __title, __description, __action-link, and __image.
 */
export default function parse(element, { document }) {
  // One row per carousel slide.
  const slides = Array.from(
    element.querySelectorAll('.cmp-carousel__item'),
  );

  const cells = [];

  slides.forEach((slide) => {
    // --- Image cell (image only) ---
    const img = slide.querySelector('.cmp-teaser__image img, .cmp-image img, img');

    // --- Text cell ---
    const textCell = [];

    const title = slide.querySelector('.cmp-teaser__title, h1, h2, h3');
    if (title && title.textContent.trim()) {
      const heading = document.createElement('h2');
      heading.textContent = title.textContent.trim();
      textCell.push(heading);
    }

    const desc = slide.querySelector('.cmp-teaser__description');
    if (desc && desc.textContent.trim()) {
      // Preserve block-level markup if present (e.g. <p>), else wrap the
      // description's own child nodes in a <p> so inline formatting
      // (<a>, <em>, <strong>, <br>) survives instead of being flattened.
      if (desc.querySelector('p, ul, ol')) {
        textCell.push(...Array.from(desc.children).map((c) => c.cloneNode(true)));
      } else {
        const p = document.createElement('p');
        p.append(...Array.from(desc.childNodes).map((n) => n.cloneNode(true)));
        textCell.push(p);
      }
    }

    // CTA links (may be multiple)
    const ctas = Array.from(slide.querySelectorAll('.cmp-teaser__action-link'));
    ctas.forEach((cta) => {
      if (cta.textContent.trim()) textCell.push(cta);
    });

    // Skip empty slides
    if (!img && textCell.length === 0) return;

    cells.push([img || '', textCell.length ? textCell : '']);
  });

  // Empty-block guard
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-hero', cells });
  element.replaceWith(block);
}
