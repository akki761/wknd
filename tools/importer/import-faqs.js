/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import accordionFaqParser from './parsers/accordion-faq.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'accordion-faq': accordionFaqParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json (faqs, US EN)
const PAGE_TEMPLATE = {
  name: 'faqs',
  description: 'FAQ page: page title, intro image + paragraph, a collapsible Q&A accordion, and a "Need more help?" contact block',
  urls: [
    'https://wknd.site/us/en/faqs.html',
  ],
  blocks: [
    { name: 'accordion-faq', instances: ['.accordion.panelcontainer', '.cmp-accordion'] },
  ],
  sections: [
    {
      id: 'section-1-title', name: 'Page Title', selector: ['.title.cmp-title--underline'], style: null, blocks: [], defaultContent: ['.cmp-title'],
    },
    {
      id: 'section-2-intro', name: 'Intro Image + Paragraph', selector: ['div.container.aem-GridColumn--default--8 > div.cmp-container'], style: null, blocks: [], defaultContent: ['.cmp-image', '.cmp-text'],
    },
    {
      id: 'section-3-accordion', name: 'FAQ Accordion', selector: ['.accordion.panelcontainer', '.cmp-accordion'], style: null, blocks: ['accordion-faq'], defaultContent: [],
    },
    {
      id: 'section-4-help', name: 'Need More Help', selector: ['div.container.aem-GridColumn--default--3'], style: null, blocks: [], defaultContent: ['.cmp-title', '.cmp-text', '.cmp-separator'],
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
