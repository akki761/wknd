/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroBannerParser from './parsers/hero-banner.js';
import cardsTeaserParser from './parsers/cards-teaser.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-banner': heroBannerParser,
  'cards-teaser': cardsTeaserParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json (adventures-listing, US EN)
const PAGE_TEMPLATE = {
  name: 'adventures-listing',
  description: 'Listing landing page: page title followed by a hero teaser and a responsive grid of teaser cards (image, title, description) linking to detail pages',
  urls: [
    'https://wknd.site/us/en/adventures.html',
  ],
  blocks: [
    { name: 'hero-banner', instances: ['.teaser.cmp-teaser--hero'] },
    { name: 'cards-teaser', instances: ['.image-list.list', '.cmp-image-list'] },
  ],
  sections: [
    {
      id: 'section-1-title', name: 'Page Title', selector: ['main.cmp-layout-container--fixed:nth-of-type(1)'], style: null, blocks: [], defaultContent: ['.cmp-title'],
    },
    {
      id: 'section-2-hero', name: 'Hero Teaser', selector: ['.teaser.cmp-teaser--hero'], style: null, blocks: ['hero-banner'], defaultContent: [],
    },
    {
      id: 'section-3-grid', name: 'Current Adventures', selector: ['main.cmp-layout-container--fixed:nth-of-type(2)'], style: null, blocks: ['cards-teaser'], defaultContent: ['.cmp-title--underline'],
    },
  ],
};

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      }
    });

    executeTransformers('afterTransform', main, payload);

    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
