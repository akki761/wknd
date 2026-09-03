/* eslint-disable */
/* global WebImporter */

// TRANSFORMER IMPORTS (article is 100% default content — no block parsers)
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY (empty — no blocks on this template)
const parsers = {};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json (article, US EN)
const PAGE_TEMPLATE = {
  name: 'article',
  description: 'Article detail page: title, hero image, and stacked rich-text body sections with inline images and pull quotes',
  urls: [
    'https://wknd.site/us/en/magazine/arctic-surfing.html',
  ],
  blocks: [],
  sections: [
    {
      id: 'section-1-hero', name: 'Lead Hero Image', selector: ['.image'], style: null, blocks: [], defaultContent: ['.image'],
    },
    {
      id: 'section-2-breadcrumb', name: 'Breadcrumb', selector: ['.breadcrumb'], style: null, blocks: [], defaultContent: ['.breadcrumb'],
    },
    {
      id: 'section-3-body', name: 'Article Title & Body', selector: ['main.aem-GridColumn--default--8'], style: null, blocks: [], defaultContent: ['.cmp-title', '.cmp-text'],
    },
  ],
};

// TRANSFORMER REGISTRY — cleanup first, then section breaks (template has 3 sections)
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
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Parse blocks (none on this template)
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name}:`, e);
        }
      }
    });

    // 3. afterTransform (final cleanup + section breaks)
    executeTransformers('afterTransform', main, payload);

    // 4. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 5. Sanitized path; map root to /index.
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
