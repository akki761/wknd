/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import carouselHeroParser from './parsers/carousel-hero.js';
import columnsMetaParser from './parsers/columns-meta.js';
import tabsDetailParser from './parsers/tabs-detail.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'carousel-hero': carouselHeroParser,
  'columns-meta': columnsMetaParser,
  'tabs-detail': tabsDetailParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json (adventure-detail, US EN)
const PAGE_TEMPLATE = {
  name: 'adventure-detail',
  description: 'Detail page with breadcrumb, full-width hero image carousel, title, left metadata sidebar (label/value pairs), tabbed content area, and inline body copy with images',
  urls: [
    'https://wknd.site/us/en/adventures/bali-surf-camp.html',
  ],
  blocks: [
    {
      name: 'carousel-hero',
      instances: ['.carousel.panelcontainer.cmp-carousel--mini', '.cmp-carousel--mini'],
    },
    {
      name: 'columns-meta',
      instances: ['.cmp-contentfragment', '.contentfragment'],
    },
    {
      name: 'tabs-detail',
      instances: ['.tabs.panelcontainer', '.cmp-tabs'],
    },
  ],
  sections: [
    {
      id: 'section-1-breadcrumb',
      name: 'Breadcrumb',
      selector: ['.breadcrumb.cmp-breadcrumb--fixed'],
      style: null,
      blocks: [],
      defaultContent: ['.cmp-breadcrumb'],
    },
    {
      id: 'section-2-hero-carousel',
      name: 'Hero Image Carousel',
      selector: ['.carousel.panelcontainer.cmp-carousel--mini'],
      style: null,
      blocks: ['carousel-hero'],
      defaultContent: [],
    },
    {
      id: 'section-3-title',
      name: 'Adventure Title',
      selector: ['.title.cmp-title--underline'],
      style: null,
      blocks: [],
      defaultContent: ['.cmp-title'],
    },
    {
      id: 'section-4-body',
      name: 'Adventure Body',
      selector: ['body > div.root.container.responsivegrid > div.cmp-container > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > main.container.responsivegrid.aem-GridColumn.aem-GridColumn--default--12 > div.cmp-container > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > main.container.responsivegrid.cmp-layout-container--fixed.aem-GridColumn.aem-GridColumn--default--12'],
      style: 'sidebar',
      blocks: ['columns-meta', 'tabs-detail'],
      defaultContent: [],
    },
  ],
};

// TRANSFORMER REGISTRY - cleanup first, section breaks/metadata after (template has 4 sections)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook.
 */
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

/**
 * Find all blocks on the page based on the embedded template configuration.
 * De-duplicates elements so the same node isn't parsed twice.
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({
          name: blockDef.name, selector, element, section: blockDef.section || null,
        });
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

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block; skip elements already replaced by an earlier parser.
    //    columns-meta must run before tabs-detail is unaffected (distinct selectors),
    //    but the de-dupe + parentNode guard keep nested content fragments safe.
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path; map root to /index (guards the bundled importer's empty-path crash).
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
