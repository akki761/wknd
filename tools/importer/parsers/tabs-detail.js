/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-detail. Base block: tabs.
 * Source: https://wknd.site/us/en/adventures/bali-surf-camp.html
 *   (.tabs.panelcontainer / .cmp-tabs — tabbed content area)
 * Generated: 2026-09-03
 *
 * Structure (tabs block — from library convention "Tabs"):
 *   2 columns, multiple rows. Row 1 = block name only.
 *   Each subsequent row = one tab:
 *     - cell 1: Tab Label (mandatory)
 *     - cell 2: Tab Content (mandatory)
 *
 * Source: <div class="cmp-tabs"> with:
 *   - <ol class="cmp-tabs__tablist"> containing <li class="cmp-tabs__tab"> labels
 *     (e.g. Overview, Itinerary, What to Bring)
 *   - matching <div class="cmp-tabs__tabpanel"> panels (in document order) holding
 *     the panel content (headings, paragraphs, images, links, lists).
 */
export default function parse(element, { document }) {
  // Tab labels, in order.
  const tabs = Array.from(
    element.querySelectorAll('.cmp-tabs__tablist .cmp-tabs__tab, .cmp-tabs__tab'),
  );

  // Panels, in order. :scope keeps us to this tabs component's own panels.
  let panels = Array.from(
    element.querySelectorAll(':scope > .cmp-tabs__tabpanel'),
  );
  if (panels.length === 0) {
    panels = Array.from(element.querySelectorAll('.cmp-tabs__tabpanel'));
  }

  const cells = [];

  tabs.forEach((tab, i) => {
    const label = tab.textContent.trim();
    const panel = panels[i];

    // Panel content cell — preserve inline markup (headings, paragraphs,
    // images, links, lists) by cloning child nodes rather than flattening.
    const contentCell = [];
    if (panel) {
      // Prefer the content fragment body if present, else the panel itself.
      const source = panel.querySelector('.cmp-contentfragment__elements') || panel;
      Array.from(source.childNodes).forEach((n) => {
        contentCell.push(n.cloneNode(true));
      });
    }

    // Skip tabs with neither a label nor content.
    if (!label && contentCell.length === 0) return;

    // Every content row has 2 cells: [label, content].
    cells.push([label, contentCell.length ? contentCell : '']);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-detail', cells });
  element.replaceWith(block);
}
