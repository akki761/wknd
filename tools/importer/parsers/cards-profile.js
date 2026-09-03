/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-profile. Base block: cards.
 * Source: https://wknd.site/us/en/about-us.html
 *   (.experiencefragment.cmp-experience-fragment--contributor)
 * Generated: 2026-09-03
 *
 * Structure (Cards block, per library convention): 2 columns, multiple rows.
 *   Row 1 = block name. Each subsequent row = one card: [image cell, text cell].
 *   Image cell (mandatory): the profile photo.
 *   Text cell (mandatory): Title (person name, heading), Description (role line),
 *     Call-to-Action (social links) at the bottom.
 *
 * Invocation: the importer matches each contributor <section> individually
 *   (instances selector resolves to one card element per match), so this
 *   parser handles a SINGLE card element and produces one card row.
 *
 * Source: each card is an AEM experience fragment section containing an image,
 *   an <h3> name, an <h5> role line, and a building-block list of social buttons.
 */
export default function parse(element, { document }) {
  // --- Image cell (mandatory) ---
  const img = element.querySelector('.cmp-image img, img.cmp-image__image, img');

  // --- Text cell (mandatory) ---
  const textCell = [];

  // Title: person name, rendered as the primary title heading (h3).
  const nameEl = element.querySelector(
    '.cmp-title h3.cmp-title__text, .cmp-title h3, h3.cmp-title__text, h3',
  );
  const nameText = nameEl?.textContent?.trim();
  if (nameText) {
    const heading = document.createElement('h3');
    heading.textContent = nameText;
    textCell.push(heading);
  }

  // Description: role / occupation line, rendered as a secondary title heading (h5).
  const roleEl = element.querySelector(
    '.cmp-title h5.cmp-title__text, .cmp-title h5, h5.cmp-title__text, h5',
  );
  const roleText = roleEl?.textContent?.trim();
  if (roleText) {
    // Role/occupation line renders as an <h5> heading (uppercase, semibold) in the
    // source — emit it as <h5>, not <p>, so the heading semantics are preserved.
    const roleHeading = document.createElement('h5');
    roleHeading.textContent = roleText;
    textCell.push(roleHeading);
  }

  // Call-to-Action: social links. Each is an <a.cmp-button> with an icon span
  // and a text span. Rebuild as clean anchors preserving href and visible label.
  const socialLinks = Array.from(
    element.querySelectorAll(
      '.cmp-buildingblock--btn-list a.cmp-button, .buildingblock a.cmp-button, a.cmp-button',
    ),
  );
  if (socialLinks.length) {
    const linksP = document.createElement('p');
    socialLinks.forEach((link, i) => {
      const href = link.getAttribute('href');
      if (!href) return;
      const label = link.querySelector('.cmp-button__text')?.textContent?.trim()
        || link.textContent?.trim();
      const a = document.createElement('a');
      a.setAttribute('href', href);
      a.textContent = label || href;
      if (i > 0) linksP.append(' ');
      linksP.append(a);
    });
    if (linksP.childNodes.length) textCell.push(linksP);
  }

  // Empty-block guard: nothing meaningful extracted.
  if (!img && textCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[img || '', textCell.length ? textCell : '']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-profile', cells });
  element.replaceWith(block);
}
