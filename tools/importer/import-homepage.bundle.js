/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/carousel-hero.js
  function parse(element, { document: document2 }) {
    const slides = Array.from(
      element.querySelectorAll(".cmp-carousel__item")
    );
    const cells = [];
    slides.forEach((slide) => {
      const img = slide.querySelector(".cmp-teaser__image img, .cmp-image img, img");
      const textCell = [];
      const title = slide.querySelector(".cmp-teaser__title, h1, h2, h3");
      if (title && title.textContent.trim()) {
        const heading = document2.createElement("h2");
        heading.textContent = title.textContent.trim();
        textCell.push(heading);
      }
      const desc = slide.querySelector(".cmp-teaser__description");
      if (desc && desc.textContent.trim()) {
        if (desc.querySelector("p, ul, ol")) {
          textCell.push(...Array.from(desc.children).map((c) => c.cloneNode(true)));
        } else {
          const p = document2.createElement("p");
          p.append(...Array.from(desc.childNodes).map((n) => n.cloneNode(true)));
          textCell.push(p);
        }
      }
      const ctas = Array.from(slide.querySelectorAll(".cmp-teaser__action-link"));
      ctas.forEach((cta) => {
        if (cta.textContent.trim()) textCell.push(cta);
      });
      if (!img && textCell.length === 0) return;
      cells.push([img || "", textCell.length ? textCell : ""]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel-hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-featured.js
  function parse2(element, { document: document2 }) {
    const textCol = [];
    const pretitle = element.querySelector(".cmp-teaser__pretitle");
    if (pretitle && pretitle.textContent.trim()) {
      const p = document2.createElement("p");
      const em = document2.createElement("em");
      em.textContent = pretitle.textContent.trim();
      p.append(em);
      textCol.push(p);
    }
    const title = element.querySelector(".cmp-teaser__title, h1, h2, h3");
    if (title && title.textContent.trim()) {
      const heading = document2.createElement("h2");
      heading.textContent = title.textContent.trim();
      textCol.push(heading);
    }
    const desc = element.querySelector(".cmp-teaser__description");
    if (desc && desc.textContent.trim()) {
      if (desc.querySelector("p, ul, ol")) {
        textCol.push(...Array.from(desc.children).map((c) => c.cloneNode(true)));
      } else {
        const p = document2.createElement("p");
        p.append(...Array.from(desc.childNodes).map((n) => n.cloneNode(true)));
        textCol.push(p);
      }
    }
    const ctas = Array.from(element.querySelectorAll(".cmp-teaser__action-link"));
    ctas.forEach((cta) => {
      if (cta.textContent.trim()) textCol.push(cta);
    });
    const img = element.querySelector(".cmp-teaser__image img, .cmp-image img, img");
    if (textCol.length === 0 && !img) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[textCol.length ? textCol : "", img || ""]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-featured", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/dynamic-list.js
  function normalizeRoot(href) {
    if (!href) return "";
    let path = href.trim();
    try {
      path = new URL(path, "https://wknd.site").pathname;
    } catch (e) {
    }
    path = path.replace(/\.html?$/, "").replace(/\/+$/, "");
    const idx = path.lastIndexOf("/");
    return idx > 0 ? path.slice(0, idx) : path;
  }
  function deriveRoot(items) {
    const counts = /* @__PURE__ */ new Map();
    items.forEach((item) => {
      var _a, _b, _c;
      const href = ((_a = item.querySelector("a.cmp-image-list__item-title-link")) == null ? void 0 : _a.getAttribute("href")) || ((_b = item.querySelector("a.cmp-image-list__item-image-link")) == null ? void 0 : _b.getAttribute("href")) || ((_c = item.querySelector("a[href]")) == null ? void 0 : _c.getAttribute("href"));
      const root = normalizeRoot(href);
      if (root) counts.set(root, (counts.get(root) || 0) + 1);
    });
    let best = "";
    let max = 0;
    counts.forEach((n, root) => {
      if (n > max) {
        max = n;
        best = root;
      }
    });
    return best;
  }
  function extractCategories(tabsRoot) {
    if (!tabsRoot) return [];
    const tabs = Array.from(tabsRoot.querySelectorAll('.cmp-tabs__tab, [role="tab"]'));
    return tabs.map((t) => t.textContent.trim()).filter(Boolean);
  }
  function parse3(element, { document: document2 }, options = {}) {
    const { limit = 0 } = options;
    const tabsRoot = element.closest(".cmp-tabs, .tabs.panelcontainer");
    if (tabsRoot) {
      if (tabsRoot.hasAttribute("data-dynamic-list-emitted")) {
        element.remove();
        return;
      }
      tabsRoot.setAttribute("data-dynamic-list-emitted", "true");
    }
    const items = Array.from(
      element.querySelectorAll("li.cmp-image-list__item, .cmp-image-list__item")
    );
    const root = deriveRoot(items);
    if (!root) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const categories = extractCategories(tabsRoot);
    const cells = [];
    cells.push(["root", root]);
    cells.push(["limit", String(limit)]);
    if (categories.length >= 2) cells.push(["categories", categories.join(", ")]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "dynamic-list", cells });
    const target = tabsRoot || element;
    target.replaceWith(block);
  }

  // tools/importer/parsers/hero-banner.js
  function parse4(element, { document: document2 }) {
    const cells = [];
    const img = element.querySelector(".cmp-teaser__image img, .cmp-image img, img");
    if (img) {
      cells.push([img]);
    }
    const contentCell = [];
    const title = element.querySelector(".cmp-teaser__title, h1, h2, h3");
    if (title && title.textContent.trim()) {
      const heading = document2.createElement("h2");
      heading.textContent = title.textContent.trim();
      contentCell.push(heading);
    }
    const desc = element.querySelector(".cmp-teaser__description");
    if (desc && desc.textContent.trim()) {
      if (desc.querySelector("p, ul, ol")) {
        contentCell.push(...Array.from(desc.children).map((c) => c.cloneNode(true)));
      } else {
        const p = document2.createElement("p");
        p.append(...Array.from(desc.childNodes).map((n) => n.cloneNode(true)));
        contentCell.push(p);
      }
    }
    const ctas = Array.from(element.querySelectorAll(".cmp-teaser__action-link"));
    ctas.forEach((cta) => {
      if (cta.textContent.trim()) contentCell.push(cta);
    });
    if (!img && contentCell.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    cells.push([contentCell.length ? contentCell : ""]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/wknd-cleanup.js
  var TransformHook = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "iframe#destination_publishing_iframe_wkndsite_0",
        "#toggleNav",
        "#mobileNav"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header.experiencefragment.cmp-experiencefragment--header",
        "footer.experiencefragment.cmp-experiencefragment--footer"
      ]);
      WebImporter.DOMUtils.remove(element, ["meta"]);
      WebImporter.DOMUtils.remove(element, ["h3.cmp-contentfragment__title"]);
      element.querySelectorAll("blockquote").forEach((bq) => {
        if (bq.closest(".cmp-text--quote")) return;
        const p = document.createElement("p");
        while (bq.firstChild) p.append(bq.firstChild);
        bq.replaceWith(p);
      });
      element.querySelectorAll("a.cmp-list__item-link").forEach((link) => {
        const titleSpan = link.querySelector(".cmp-list__item-title");
        const dateSpan = link.querySelector(".cmp-list__item-date");
        if (dateSpan) {
          const em = document.createElement("em");
          em.textContent = dateSpan.textContent.trim();
          dateSpan.replaceWith(em);
        }
        if (titleSpan) {
          titleSpan.replaceWith(document.createTextNode(`${titleSpan.textContent.trim()} `));
        }
      });
    }
  }

  // tools/importer/transformers/wknd-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function resolveSectionElement(element, selector) {
    const selectors = Array.isArray(selector) ? selector : [selector];
    for (let s = 0; s < selectors.length; s += 1) {
      if (!selectors[s]) continue;
      try {
        const el = element.querySelector(selectors[s]);
        if (el) return el;
      } catch (e) {
      }
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload.template && payload.template.sections || [];
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = resolveSectionElement(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || resolveSectionElement(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-homepage.js
  var parsers = {
    "carousel-hero": parse,
    "columns-featured": parse2,
    "cards-teaser": (element, ctx) => parse3(element, ctx, { limit: 4 }),
    "hero-banner": parse4
  };
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Locale landing page: full-width hero carousel, featured-article split panel, horizontal teaser card row, and alternating full-bleed callout sections with teaser grids",
    urls: [
      "https://wknd.site/us/en.html"
    ],
    blocks: [
      {
        name: "carousel-hero",
        instances: [".carousel.panelcontainer.cmp-carousel--hero", ".cmp-carousel--hero"]
      },
      {
        name: "columns-featured",
        instances: [".teaser.cmp-teaser--featured"]
      },
      {
        name: "cards-teaser",
        instances: [".image-list.list"]
      },
      {
        name: "hero-banner",
        instances: [".teaser.cmp-teaser--hero.cmp-teaser--imagebottom"]
      }
    ],
    sections: [
      {
        id: "section-1-hero-carousel",
        name: "Hero Carousel",
        selector: [".carousel.panelcontainer.cmp-carousel--hero"],
        style: null,
        blocks: ["carousel-hero"],
        defaultContent: []
      },
      {
        id: "section-2-featured-article",
        name: "Featured Article",
        selector: [".teaser.cmp-teaser--featured"],
        style: "grey",
        blocks: ["columns-featured"],
        defaultContent: []
      },
      {
        id: "section-3-recent-articles",
        name: "Recent Articles",
        selector: ["body > div.root.container.responsivegrid > div.cmp-container > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > main.container.responsivegrid.aem-GridColumn.aem-GridColumn--default--12 > div.cmp-container > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > main.container.responsivegrid.cmp-layout-container--fixed.aem-GridColumn.aem-GridColumn--default--12:nth-of-type(1) > div.cmp-container > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > div.image-list.list.aem-GridColumn.aem-GridColumn--default--12"],
        style: null,
        blocks: ["cards-teaser"],
        defaultContent: [".title.cmp-title--underline"]
      },
      {
        id: "section-4-next-adventures",
        name: "Next Adventures / Climbing New Zealand",
        selector: [".teaser.cmp-teaser--hero.cmp-teaser--imagebottom"],
        style: null,
        blocks: ["hero-banner"],
        defaultContent: [".title"]
      },
      {
        id: "section-5-where-to-go",
        name: "Where do you want to go?",
        selector: ["body > div.root.container.responsivegrid > div.cmp-container > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > main.container.responsivegrid.aem-GridColumn.aem-GridColumn--default--12 > div.cmp-container > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > main.container.responsivegrid.cmp-layout-container--fixed.aem-GridColumn.aem-GridColumn--default--12:nth-of-type(2) > div.cmp-container > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > div.image-list.list.aem-GridColumn.aem-GridColumn--default--12"],
        style: null,
        blocks: ["cards-teaser"],
        defaultContent: [".title"]
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    const seen = /* @__PURE__ */ new Set();
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          if (seen.has(element)) return;
          seen.add(element);
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const {
        document: document2,
        url,
        html,
        params
      } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
