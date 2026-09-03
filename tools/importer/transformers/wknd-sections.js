/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND section breaks + section metadata.
 *
 * Homepage template defines 5 sections (page-templates.json). Only
 * "section-2-featured-article" carries a style ("grey"); the rest are null.
 * Expected output: 4 <hr> breaks (before each non-first section) and 1
 * Section Metadata block (grey) after the featured-article section.
 *
 * Section boundaries come straight from the DOM-verified `selector` field of
 * each section in page-templates.json. Those selectors are stored as arrays
 * (a full descendant path plus a short class selector), so we try each until
 * one matches on the page being imported.
 *
 * Breaks are inserted in beforeTransform (while every section element still
 * exists, before block parsers can replace them), using a marker attribute on
 * each <hr> as a stable anchor. Section Metadata blocks are inserted in
 * afterTransform, anchored to the surviving marker (or the original element
 * for the first section, which gets no leading break).
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

function resolveSectionElement(element, selector) {
  const selectors = Array.isArray(selector) ? selector : [selector];
  for (let s = 0; s < selectors.length; s += 1) {
    if (!selectors[s]) continue;
    try {
      const el = element.querySelector(selectors[s]);
      if (el) return el;
    } catch (e) {
      // Malformed/unsupported selector on this page — try the next candidate.
    }
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const sections = (payload.template && payload.template.sections) || [];

  if (hookName === 'beforeTransform') {
    // Insert section breaks now, before parsers replace any section element.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (i === 0 && !section.style) continue; // first section: no leading break needed
      const sectionEl = resolveSectionElement(element, section.selector);
      if (!sectionEl) continue; // selector didn't match on this page — skip, never guess

      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      sectionEl.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    // Parsers have run and may have replaced section elements. Anchor each
    // styled section's metadata block to its marker <hr>, or the original
    // element if it survived (first section case).
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || resolveSectionElement(element, section.selector);
      if (!anchor) continue; // neither survived — skip, never guess

      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(metadataBlock);

      if (marker) {
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (i === 0) marker.remove(); // section 0 never gets a real leading break
      }
    }
  }
}
