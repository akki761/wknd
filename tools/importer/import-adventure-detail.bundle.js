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

  // tools/importer/import-adventure-detail.js
  var import_adventure_detail_exports = {};
  __export(import_adventure_detail_exports, {
    default: () => import_adventure_detail_default
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

  // tools/importer/parsers/columns-meta.js
  function parse2(element, { document: document2 }) {
    const pairs = Array.from(
      element.querySelectorAll(".cmp-contentfragment__element")
    );
    const cells = [];
    pairs.forEach((pair) => {
      const labelEl = pair.querySelector(".cmp-contentfragment__element-title, dt");
      const valueEl = pair.querySelector(".cmp-contentfragment__element-value, dd");
      const label = labelEl ? labelEl.textContent.trim() : "";
      let valueCell = "";
      if (valueEl) {
        if (valueEl.querySelector("a, ul, ol, p, strong, em, b, i, br")) {
          valueCell = Array.from(valueEl.childNodes).map((n) => n.cloneNode(true));
        } else {
          valueCell = valueEl.textContent.trim();
        }
      }
      if (!label && (!valueCell || Array.isArray(valueCell) && valueCell.length === 0)) return;
      cells.push([label, valueCell]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-meta", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-detail.js
  function parse3(element, { document: document2 }) {
    const tabs = Array.from(
      element.querySelectorAll(".cmp-tabs__tablist .cmp-tabs__tab, .cmp-tabs__tab")
    );
    let panels = Array.from(
      element.querySelectorAll(":scope > .cmp-tabs__tabpanel")
    );
    if (panels.length === 0) {
      panels = Array.from(element.querySelectorAll(".cmp-tabs__tabpanel"));
    }
    const cells = [];
    tabs.forEach((tab, i) => {
      const label = tab.textContent.trim();
      const panel = panels[i];
      const contentCell = [];
      if (panel) {
        const source = panel.querySelector(".cmp-contentfragment__elements") || panel;
        Array.from(source.childNodes).forEach((n) => {
          contentCell.push(n.cloneNode(true));
        });
      }
      if (!label && contentCell.length === 0) return;
      cells.push([label, contentCell.length ? contentCell : ""]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "tabs-detail", cells });
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

  // tools/importer/import-adventure-detail.js
  var parsers = {
    "carousel-hero": parse,
    "columns-meta": parse2,
    "tabs-detail": parse3
  };
  var PAGE_TEMPLATE = {
    name: "adventure-detail",
    description: "Detail page with breadcrumb, full-width hero image carousel, title, left metadata sidebar (label/value pairs), tabbed content area, and inline body copy with images",
    urls: [
      "https://wknd.site/us/en/adventures/bali-surf-camp.html"
    ],
    blocks: [
      {
        name: "carousel-hero",
        instances: [".carousel.panelcontainer.cmp-carousel--mini", ".cmp-carousel--mini"]
      },
      {
        name: "columns-meta",
        instances: [".cmp-contentfragment", ".contentfragment"]
      },
      {
        name: "tabs-detail",
        instances: [".tabs.panelcontainer", ".cmp-tabs"]
      }
    ],
    sections: [
      {
        id: "section-1-breadcrumb",
        name: "Breadcrumb",
        selector: [".breadcrumb.cmp-breadcrumb--fixed"],
        style: null,
        blocks: [],
        defaultContent: [".cmp-breadcrumb"]
      },
      {
        id: "section-2-hero-carousel",
        name: "Hero Image Carousel",
        selector: [".carousel.panelcontainer.cmp-carousel--mini"],
        style: null,
        blocks: ["carousel-hero"],
        defaultContent: []
      },
      {
        id: "section-3-title",
        name: "Adventure Title",
        selector: [".title.cmp-title--underline"],
        style: null,
        blocks: [],
        defaultContent: [".cmp-title"]
      },
      {
        id: "section-4-body",
        name: "Adventure Body",
        selector: ["body > div.root.container.responsivegrid > div.cmp-container > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > main.container.responsivegrid.aem-GridColumn.aem-GridColumn--default--12 > div.cmp-container > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > main.container.responsivegrid.cmp-layout-container--fixed.aem-GridColumn.aem-GridColumn--default--12"],
        style: "sidebar",
        blocks: ["columns-meta", "tabs-detail"],
        defaultContent: []
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
  var import_adventure_detail_default = {
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
  return __toCommonJS(import_adventure_detail_exports);
})();
