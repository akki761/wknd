/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsProfileParser from './parsers/cards-profile.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'cards-profile': cardsProfileParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json (content-listing, US EN)
const PAGE_TEMPLATE = {
  name: 'content-listing',
  description: 'Multi-section listing page: page title plus repeated titled sections, each with an underlined heading, intro text, and a grid of profile/teaser cards',
  urls: [
    'https://wknd.site/us/en/about-us.html',
  ],
  blocks: [
    {
      name: 'cards-profile',
      instances: ['.experiencefragment.cmp-experience-fragment--contributor', '.cmp-experience-fragment--contributor'],
    },
  ],
  sections: [
    {
      id: 'section-1-title', name: 'Page Title', selector: ['.title.aem-GridColumn--default--12:nth-of-type(1)'], style: null, blocks: [], defaultContent: ['.cmp-title'],
    },
    {
      id: 'section-2-contributors', name: 'Our Contributors', selector: ['.title.cmp-title--underline:nth-of-type(2)'], style: null, blocks: ['cards-profile'], defaultContent: ['.cmp-title--underline', '.cmp-text'],
    },
    {
      id: 'section-3-guides', name: 'WKND Guides', selector: ['.title.cmp-title--underline:nth-of-type(4)'], style: null, blocks: ['cards-profile'], defaultContent: ['.cmp-title--underline', '.cmp-text'],
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
