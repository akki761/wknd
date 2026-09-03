/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-teaser. Base block: cards.
 * Source: https://wknd.site/us/en.html (.image-list.list)
 * Generated: 2026-09-03
 *
 * Structure (from library-description.txt — "Cards"):
 *   2 columns, multiple rows. Row 1 = block name.
 *   Each subsequent row = one card: [image cell, text cell].
 *   Text cell: Title (heading, optional), Description (optional), CTA (optional).
 *
 * Source: <ul.cmp-image-list> with <li.cmp-image-list__item> children, each holding
 *   an image link, a title link (span text), and a description span.
 *
 * Tabbed listing (adventures-listing): the adventures page wraps ONE logical card
 *   grid inside category tabs (All / Climbing / Cycling / ...). Each tab panel holds
 *   its own image-list, so a naive per-element parse emits one block per tab with
 *   duplicated cards. To fix: when this image-list lives inside a .cmp-tabs, only the
 *   first image-list in that tab group (the "All"/complete set) is emitted; the
 *   per-category panels are removed so they emit nothing. Cards are also de-duplicated
 *   by link href so each adventure appears once. On pages where the image-list is NOT
 *   inside tabs (homepage), behavior is unchanged.
 */
export default function parse(element, { document }) {
  // Tabbed-listing handling: if this image-list is inside a tab group, only the
  // FIRST image-list processed for that group (document order = the "All"/complete
  // panel) is emitted. The parser is invoked per matched element and elements are
  // processed in document order, so the first call within a given tabs group wins;
  // we mark the group so every later per-category panel bails. The rest are removed
  // entirely (not unwrapped) so their inner .cmp-image-list is not later re-parsed
  // as a duplicate block. On pages without tabs this branch is skipped entirely.
  const tabsRoot = element.closest('.cmp-tabs, .tabs.panelcontainer');
  if (tabsRoot) {
    if (tabsRoot.hasAttribute('data-cards-teaser-emitted')) {
      element.remove();
      return;
    }
    tabsRoot.setAttribute('data-cards-teaser-emitted', 'true');
  }

  // Each list item is one card. Fallback selectors cover cross-page DOM variation.
  const items = Array.from(
    element.querySelectorAll('li.cmp-image-list__item, .cmp-image-list__item'),
  );

  const cells = [];
  const seenHrefs = new Set();

  items.forEach((item) => {
    // De-duplicate cards by their link href so each adventure appears once, even
    // if the same item is repeated (e.g. across tab panels). Cards without a
    // resolvable href are always kept.
    const itemHref = item.querySelector('a.cmp-image-list__item-title-link')?.getAttribute('href')
      || item.querySelector('a.cmp-image-list__item-image-link')?.getAttribute('href')
      || item.querySelector('a[href]')?.getAttribute('href');
    if (itemHref) {
      if (seenHrefs.has(itemHref)) return;
      seenHrefs.add(itemHref);
    }

    // --- Image cell ---
    const img = item.querySelector('img.cmp-image__image, .cmp-image img, img');

    // --- Text cell ---
    const textCell = [];

    // Title: rendered as a linked span. Preserve as a heading wrapping the link.
    const titleLink = item.querySelector('a.cmp-image-list__item-title-link');
    const titleSpan = item.querySelector('.cmp-image-list__item-title');
    const titleText = (titleSpan || titleLink)?.textContent?.trim();
    if (titleText) {
      const heading = document.createElement('h3');
      const href = titleLink?.getAttribute('href')
        || item.querySelector('a.cmp-image-list__item-image-link')?.getAttribute('href');
      if (href) {
        const a = document.createElement('a');
        a.setAttribute('href', href);
        a.textContent = titleText;
        heading.append(a);
      } else {
        heading.textContent = titleText;
      }
      textCell.push(heading);
    }

    // Description — wrap the description's own child nodes in a <p> so inline
    // formatting (<a>, <em>, <strong>, <br>) survives instead of being flattened.
    const desc = item.querySelector('.cmp-image-list__item-description');
    if (desc && desc.textContent.trim()) {
      const p = document.createElement('p');
      p.append(...Array.from(desc.childNodes).map((n) => n.cloneNode(true)));
      textCell.push(p);
    }

    // Skip empty cards
    if (!img && textCell.length === 0) return;

    cells.push([img || '', textCell.length ? textCell : '']);
  });

  // Empty-block guard: nothing extracted
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-teaser', cells });
  element.replaceWith(block);
}
