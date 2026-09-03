/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-faq. Base block: accordion.
 * Source: https://wknd.site/us/en/faqs.html
 *   (.accordion.panelcontainer / .cmp-accordion — FAQ accordion)
 * Generated: 2026-09-03
 *
 * Structure (accordion block — from library convention "Accordion"):
 *   2 columns, multiple rows. Row 1 = block name only.
 *   Each subsequent row = one accordion item:
 *     - cell 1: Title (mandatory) — the clickable question label.
 *     - cell 2: Content (mandatory) — the answer body (paragraphs, links, lists).
 *
 * Source: <div class="cmp-accordion"> with repeated
 *   <div class="cmp-accordion__item">, each containing:
 *   - <span class="cmp-accordion__title"> (inside the header button) — the question.
 *   - <div class="cmp-accordion__panel"> — the answer content
 *     (rich text under .cmp-text). Inline markup is preserved by cloning
 *     child nodes rather than flattening to textContent.
 */
export default function parse(element, { document }) {
  // Accordion items, in document order. :scope keeps us to this accordion's own
  // items; fall back to a plain descendant query for varied nesting.
  let items = Array.from(element.querySelectorAll(':scope > .cmp-accordion__item'));
  if (items.length === 0) {
    items = Array.from(element.querySelectorAll('.cmp-accordion__item'));
  }

  const cells = [];

  items.forEach((item) => {
    // Title / question label. The source renders each question as an <h3>
    // heading, so emit it as an <h3> element (not plain text/<p>) in cell 1.
    const titleEl = item.querySelector(
      '.cmp-accordion__title, .cmp-accordion__header, .cmp-accordion__button',
    );
    const titleText = titleEl ? titleEl.textContent.trim() : '';
    let titleCell = '';
    if (titleText) {
      const h3 = document.createElement('h3');
      h3.textContent = titleText;
      titleCell = h3;
    }

    // Answer content — the panel body. Prefer the inner rich-text container so
    // we skip AEM wrapper divs, else fall back to the panel itself.
    const panel = item.querySelector('.cmp-accordion__panel');
    const contentCell = [];
    if (panel) {
      const source = panel.querySelector('.cmp-text') || panel;
      // Preserve inline markup (paragraphs, links, lists) by cloning children.
      Array.from(source.childNodes).forEach((n) => {
        const clone = n.cloneNode(true);
        // Strip stray empty headings carried from the source
        // (e.g. <h3>&nbsp;</h3>): heading elements whose text trims to empty
        // or is just a non-breaking space add nothing to the answer.
        if (clone.nodeType === 1 && /^H[1-6]$/.test(clone.tagName)) {
          const t = clone.textContent.replace(/ /g, ' ').trim();
          if (t === '') return;
        }
        contentCell.push(clone);
      });
    }

    // Skip items with neither a title nor content.
    if (!titleText && contentCell.length === 0) return;

    // Every content row has 2 cells: [title, content].
    cells.push([titleCell, contentCell.length ? contentCell : '']);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  element.replaceWith(block);
}
