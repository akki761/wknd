/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the magazine "Members Only" locked teasers.
 * Base block: cards-teaser, variant "members" (Cards convention: 2 columns,
 * first row = block name + variant; each following row = [image cell, text cell]
 * where the text cell holds Title (heading), Description, and CTA).
 * Source: https://wknd.site/us/en/magazine.html (.teaser.cmp-teaser--secure)
 * Generated: 2026-09-03
 *
 * Source structure: two `.cmp-teaser--secure` teasers in a 2-up grid, each with
 *   a .cmp-teaser__content (title h2, description, "Read More" action) and a
 *   .cmp-teaser__image below. The teasers are locked (anonymous users): title +
 *   description render small/uppercase/grey, "Read More" is a disabled grey
 *   button, and a yellow padlock flag overlays the top-left. The padlock badge
 *   and greying are pure CSS (handled by the cards-teaser members variant), so
 *   this parser only needs to emit the content in cards-teaser row shape.
 *
 * Emitted once for the whole group (invoked per matched teaser, but the first
 * call collects all sibling secure teasers and removes the rest).
 */
export default function parse(element, { document }) {
  // Invoked per matched element; emit the whole block on the first call only.
  if (document.body.hasAttribute('data-cards-members-emitted')) {
    element.remove();
    return;
  }
  document.body.setAttribute('data-cards-members-emitted', 'true');

  const teasers = Array.from(document.querySelectorAll('.teaser.cmp-teaser--secure'));
  const cells = [];

  teasers.forEach((teaser) => {
    // --- Image cell (mandatory, first cell) ---
    const img = teaser.querySelector('.cmp-teaser__image img, .cmp-image img, img');

    // --- Text cell (second cell): Title, Description, CTA ---
    const textCell = [];

    const title = teaser.querySelector('.cmp-teaser__title, h2, h3');
    if (title && title.textContent.trim()) {
      const heading = document.createElement('h3');
      heading.textContent = title.textContent.trim();
      textCell.push(heading);
    }

    const desc = teaser.querySelector('.cmp-teaser__description');
    if (desc && desc.textContent.trim()) {
      // Preserve inline markup: clone child nodes rather than flatten.
      if (desc.querySelector('p, ul, ol')) {
        textCell.push(...Array.from(desc.children).map((c) => c.cloneNode(true)));
      } else {
        const p = document.createElement('p');
        p.append(...Array.from(desc.childNodes).map((n) => n.cloneNode(true)));
        textCell.push(p);
      }
    }

    // "Read More" action — locked teasers have no href, it's a disabled label.
    // Emit as an <em> paragraph so the variant CSS renders the grey button.
    const action = teaser.querySelector('.cmp-teaser__action-container');
    const actionText = action && action.textContent.trim();
    if (actionText) {
      const p = document.createElement('p');
      const em = document.createElement('em');
      em.textContent = actionText;
      p.append(em);
      textCell.push(p);
    }

    if (!img && textCell.length === 0) return;
    cells.push([img || '', textCell.length ? textCell : '']);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-teaser (members)', cells });

  // Source has a medium-space separator (.cmp-separator--space-medium) between
  // the "Sign in ..." text and the locked teasers. An <hr> here would be read as
  // an EDS section break, so instead the separator rule is drawn by the
  // cards-teaser members variant CSS (border-top + 2em spacing) — see
  // blocks/cards-teaser/cards-teaser.css.

  // Insert the block where the first secure teaser was; remove originals.
  const first = teasers[0] || element;
  first.replaceWith(block);
  teasers.forEach((t) => {
    if (t.parentNode) t.remove();
  });
}
