import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
} from './aem.js';

if (window.trustedTypes && window.trustedTypes.createPolicy) {
  const innerTT = window.trustedTypes.createPolicy('tt-inner', {
    createHTML: (s) => s, // avoid stack overflow
  });

  window.trustedTypes.createPolicy('default', {
    createHTML: (input, type, sink) => {
      let processedInput = input;
      if (/srcdoc\s*=/i.test(processedInput)) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('iframe[srcdoc]').forEach((el) => el.removeAttribute('srcdoc'));
        processedInput = doc.body.innerHTML;
      }
      if (sink.includes('createContextualFragment') || sink.includes('Document write')) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('script').forEach((el) => el.remove());
        processedInput = doc.body.innerHTML;
      }
      return processedInput;
    },
    createScriptURL: (input) => input,
    createScript: (input) => input,
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p
      && p.querySelectorAll('a').length === 1
      && p.querySelector('a') === link
      && p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildWidgetAutoBlocks(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Applies section-metadata as classes on the section, then removes the block.
 * The vendored aem.js decorateSections does not process section metadata, so we
 * handle it here: each `.section-metadata` block holds key/value rows (e.g.
 * style / grey). We add the style token(s) as classes to the section's
 * top-level wrapper div and drop the block so it never loads as JS.
 * @param {Element} main The main element
 */
function processSectionMetadata(main) {
  main.querySelectorAll(':scope > div > div.section-metadata').forEach((meta) => {
    const section = meta.parentElement;
    [...meta.children].forEach((row) => {
      const cells = [...row.children];
      if (cells.length >= 2) {
        const key = cells[0].textContent.trim().toLowerCase();
        const value = cells[1].textContent.trim();
        if (key === 'style' && value) {
          value.split(',').forEach((s) => {
            const cls = s.trim().toLowerCase().replace(/\s+/g, '-');
            if (cls) section.classList.add(cls);
          });
        } else if (value) {
          section.dataset[key] = value;
        }
      }
    });
    meta.remove();
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  processSectionMetadata(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('body > header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('body > footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  import('./consent-check.js');
  // load anything that can be postponed to the latest here
}

/**
 * Redirects the site root to the WKND homepage (/us/en).
 * WKND's homepage is a locale landing page, not the bare root, so requests to
 * `/` or `/index` are sent to `/us/en`. Scoped to the exact root paths only,
 * so every other page renders normally. Returns true if a redirect was issued.
 */
function redirectRootToHome() {
  const { pathname } = window.location;
  // Production/preview serves content at the root; the local dev server mounts
  // it under /content. Handle the bare root in both, preserving the prefix.
  const roots = {
    '/': '/us/en',
    '/index': '/us/en',
    '/index.html': '/us/en',
    '/content': '/content/us/en',
    '/content/': '/content/us/en',
    '/content/index': '/content/us/en',
    '/content/index.html': '/content/us/en',
  };
  if (roots[pathname]) {
    window.location.replace(roots[pathname]);
    return true;
  }
  return false;
}

/**
 * Adds a template class to <body> based on the URL path so template-specific
 * CSS (e.g. the article reading-column width, adventure-detail two-column
 * layout) can be scoped without affecting other templates like the homepage.
 * - /us/en/magazine/<slug>  -> tpl-article
 * - /us/en/adventures/<slug> -> tpl-adventure-detail
 * Listing pages (/magazine, /adventures with no trailing slug) are NOT tagged.
 */
function decorateTemplateFromPath() {
  const path = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
  // strip the optional local /content prefix, then the /us/en locale prefix
  const rel = path.replace(/^\/content/, '').replace(/^\/us\/en/, '');
  const parts = rel.split('/').filter(Boolean); // e.g. ['magazine','arctic-surfing']
  if (parts.length === 2 && parts[0] === 'magazine') {
    document.body.classList.add('tpl-article');
  } else if (parts.length === 2 && parts[0] === 'adventures') {
    document.body.classList.add('tpl-adventure-detail');
  } else if (parts.length === 1 && parts[0] === 'faqs') {
    document.body.classList.add('tpl-faqs');
  }
}

async function loadPage() {
  if (redirectRootToHome()) return;
  decorateTemplateFromPath();
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
