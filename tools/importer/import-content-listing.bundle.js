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

  // tools/importer/import-content-listing.js
  var import_content_listing_exports = {};
  __export(import_content_listing_exports, {
    default: () => import_content_listing_default
  });

  // tools/importer/parsers/cards-profile.js
  function parse(element, { document: document2 }) {
    var _a, _b;
    const img = element.querySelector(".cmp-image img, img.cmp-image__image, img");
    const textCell = [];
    const nameEl = element.querySelector(
      ".cmp-title h3.cmp-title__text, .cmp-title h3, h3.cmp-title__text, h3"
    );
    const nameText = (_a = nameEl == null ? void 0 : nameEl.textContent) == null ? void 0 : _a.trim();
    if (nameText) {
      const heading = document2.createElement("h3");
      heading.textContent = nameText;
      textCell.push(heading);
    }
    const roleEl = element.querySelector(
      ".cmp-title h5.cmp-title__text, .cmp-title h5, h5.cmp-title__text, h5"
    );
    const roleText = (_b = roleEl == null ? void 0 : roleEl.textContent) == null ? void 0 : _b.trim();
    if (roleText) {
      const roleHeading = document2.createElement("h5");
      roleHeading.textContent = roleText;
      textCell.push(roleHeading);
    }
    const socialLinks = Array.from(
      element.querySelectorAll(
        ".cmp-buildingblock--btn-list a.cmp-button, .buildingblock a.cmp-button, a.cmp-button"
      )
    );
    if (socialLinks.length) {
      const linksP = document2.createElement("p");
      socialLinks.forEach((link, i) => {
        var _a2, _b2, _c;
        const href = link.getAttribute("href");
        if (!href) return;
        const label = ((_b2 = (_a2 = link.querySelector(".cmp-button__text")) == null ? void 0 : _a2.textContent) == null ? void 0 : _b2.trim()) || ((_c = link.textContent) == null ? void 0 : _c.trim());
        const a = document2.createElement("a");
        a.setAttribute("href", href);
        a.textContent = label || href;
        if (i > 0) linksP.append(" ");
        linksP.append(a);
      });
      if (linksP.childNodes.length) textCell.push(linksP);
    }
    if (!img && textCell.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[img || "", textCell.length ? textCell : ""]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-profile", cells });
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

  // tools/importer/import-content-listing.js
  var parsers = {
    "cards-profile": parse
  };
  var PAGE_TEMPLATE = {
    name: "content-listing",
    description: "Multi-section listing page: page title plus repeated titled sections, each with an underlined heading, intro text, and a grid of profile/teaser cards",
    urls: [
      "https://wknd.site/us/en/about-us.html"
    ],
    blocks: [
      {
        name: "cards-profile",
        instances: [".experiencefragment.cmp-experience-fragment--contributor", ".cmp-experience-fragment--contributor"]
      }
    ],
    sections: [
      {
        id: "section-1-title",
        name: "Page Title",
        selector: [".title.aem-GridColumn--default--12:nth-of-type(1)"],
        style: null,
        blocks: [],
        defaultContent: [".cmp-title"]
      },
      {
        id: "section-2-contributors",
        name: "Our Contributors",
        selector: [".title.cmp-title--underline:nth-of-type(2)"],
        style: null,
        blocks: ["cards-profile"],
        defaultContent: [".cmp-title--underline", ".cmp-text"]
      },
      {
        id: "section-3-guides",
        name: "WKND Guides",
        selector: [".title.cmp-title--underline:nth-of-type(4)"],
        style: null,
        blocks: ["cards-profile"],
        defaultContent: [".cmp-title--underline", ".cmp-text"]
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
        document2.querySelectorAll(selector).forEach((element) => {
          if (seen.has(element)) return;
          seen.add(element);
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_content_listing_default = {
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
        report: { title: document2.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }];
    }
  };
  return __toCommonJS(import_content_listing_exports);
})();
