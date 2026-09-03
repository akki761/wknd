/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsProfileParser from './parsers/cards-profile.js';
import cardsTeaserParser from './parsers/cards-teaser.js';
import cardsMembersParser from './parsers/cards-members.js';
import columnsFeaturedParser from './parsers/columns-featured.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'cards-profile': cardsProfileParser,
  'cards-teaser': cardsTeaserParser,
  'cards-members': cardsMembersParser,
  'columns-featured': columnsFeaturedParser,
};

// PAGE TEMPLATE CONFIGURATIONS (content-listing, US EN)
// The "content-listing" template groups two structurally-different pages:
//   - about-us: profile-card grids (cards-profile)
//   - magazine: a featured-article panel (columns-featured) + an article grid
//     (cards-teaser), plus a Members Only section.
// Each page is instrumented with its own block/section config, selected by URL
// path in resolveTemplate() so neither page regresses the other.

const ABOUT_US_TEMPLATE = {
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

const MAGAZINE_TEMPLATE = {
  name: 'content-listing',
  description: 'Magazine landing page: page title, a featured-article panel (columns-featured), an "All Articles" grid (cards-teaser), and a Members Only section',
  urls: [
    'https://wknd.site/us/en/magazine.html',
  ],
  blocks: [
    {
      name: 'columns-featured',
      instances: ['.teaser.cmp-teaser--featured'],
    },
    {
      name: 'cards-teaser',
      instances: ['.image-list.list .cmp-image-list', '.cmp-image-list'],
    },
    {
      name: 'cards-members',
      instances: ['.teaser.cmp-teaser--secure'],
    },
  ],
  sections: [
    {
      id: 'section-1-title', name: 'Page Title', selector: ['.title.aem-GridColumn--default--12:nth-of-type(1)'], style: null, blocks: [], defaultContent: ['.cmp-title'],
    },
    {
      id: 'section-2-featured', name: 'Featured Article', selector: ['.teaser.cmp-teaser--featured'], style: null, blocks: ['columns-featured'], defaultContent: [],
    },
    {
      id: 'section-3-articles', name: 'All Articles', selector: ['#title-0f80375ce9', '.title.cmp-title--underline'], style: null, blocks: ['cards-teaser'], defaultContent: ['.cmp-title--underline'],
    },
    {
      id: 'section-4-members', name: 'Members Only', selector: ['#title-59d441f861'], style: null, blocks: ['cards-members'], defaultContent: ['.cmp-title--underline', '.cmp-text'],
    },
  ],
};

function resolveTemplate(url) {
  try {
    const path = new URL(url).pathname;
    if (/\/magazine(\.html)?$/.test(path)) return MAGAZINE_TEMPLATE;
  } catch (e) {
    // fall through to default
  }
  return ABOUT_US_TEMPLATE;
}

function buildTransformers(template) {
  return [
    cleanupTransformer,
    ...(template.sections && template.sections.length > 1 ? [sectionsTransformer] : []),
  ];
}

function executeTransformers(transformers, template, hookName, element, payload) {
  const enhancedPayload = { ...payload, template };
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

    const PAGE_TEMPLATE = resolveTemplate(params.originalURL || url);
    const transformers = buildTransformers(PAGE_TEMPLATE);

    executeTransformers(transformers, PAGE_TEMPLATE, 'beforeTransform', main, payload);

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

    executeTransformers(transformers, PAGE_TEMPLATE, 'afterTransform', main, payload);

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
