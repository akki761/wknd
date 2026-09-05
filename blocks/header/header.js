// media query match that indicates desktop width
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Fetch the nav fragment. Metadata-independent dual-fetch:
 * /content first (localhost / aem up), then root (DA/EDS production).
 * @returns {Promise<Document|null>}
 */
async function fetchNav() {
  let resp = await fetch('/content/us/nav.plain.html');
  if (!resp.ok) resp = await fetch('/us/nav.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  return new DOMParser().parseFromString(html, 'text/html');
}

/**
 * Collapse the language dropdown and mobile menu.
 */
function closeAll(nav) {
  const langToggle = nav.querySelector('.nav-lang-toggle');
  if (langToggle) langToggle.setAttribute('aria-expanded', 'false');
}

/**
 * Toggles the mobile menu open/closed.
 */
function toggleMenu(nav, forceExpanded) {
  // Resolve the desired final state. With no arg, flip the current state; with
  // forceExpanded given, use it directly (true = open, false = closed).
  const open = forceExpanded !== undefined
    ? forceExpanded
    : nav.getAttribute('aria-expanded') !== 'true';
  nav.setAttribute('aria-expanded', open ? 'true' : 'false');
  const hamburger = nav.querySelector('.nav-hamburger button');
  if (hamburger) {
    hamburger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  }
  // Source mobile behavior: the drawer sits at the viewport's left edge and the
  // whole page (header/main/footer) is PUSHED right to reveal it (not an
  // overlay). The push is driven by a body class so CSS can shift those siblings.
  document.body.classList.toggle('nav-open', open && !isDesktop.matches);
  document.body.style.overflowY = (open && !isDesktop.matches) ? 'hidden' : '';
}

/**
 * Build the search control (a real form/input, not embedded in the fragment).
 */
function buildSearch(container) {
  const form = document.createElement('form');
  form.className = 'nav-search';
  form.setAttribute('role', 'search');
  form.action = '/us/en/search';
  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = 'Search';
  input.setAttribute('aria-label', 'Search');
  form.append(input);
  // No search index in this migration; prevent navigation to a 404.
  form.addEventListener('submit', (e) => e.preventDefault());
  container.replaceChildren(form);
}

/**
 * Decorate the header block.
 * Content-first: all text/links/images come from content/nav.plain.html.
 * @param {Element} block
 */
export default async function decorate(block) {
  const doc = await fetchNav();
  block.textContent = '';

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');

  const sections = doc ? [...doc.body.children].filter((el) => el.tagName === 'DIV') : [];
  // Section order from nav.plain.html:
  // 0: utility (sign-in + locale list), 1: brand (logo), 2: main nav links, 3: search
  const [utility, brand, mainNav] = sections;

  // --- Utility bar (top, dark) ---
  const utilityBar = document.createElement('div');
  utilityBar.className = 'nav-utility';
  if (utility) {
    const signIn = utility.querySelector('a[href="#sign-in"]');
    const localeList = utility.querySelector('ul');
    const labelLink = utility.querySelector('a[href="#langNavToggle"]');
    const currentLabel = labelLink ? labelLink.textContent.trim() : 'en-US';

    const utilityInner = document.createElement('div');
    utilityInner.className = 'nav-utility-inner';

    if (signIn) {
      const link = document.createElement('a');
      link.href = signIn.getAttribute('href');
      link.textContent = signIn.textContent.trim();
      link.className = 'nav-signin';
      utilityInner.append(link);
    }

    if (localeList) {
      const locale = document.createElement('div');
      locale.className = 'nav-locale';
      // Use an anchor (matches the source markup: a[href="#langNavToggle"]).
      const toggle = document.createElement('a');
      toggle.href = '#langNavToggle';
      toggle.className = 'nav-lang-toggle';
      toggle.setAttribute('role', 'button');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-haspopup', 'true');
      toggle.textContent = currentLabel;
      const menu = document.createElement('ul');
      menu.className = 'nav-locale-menu';
      [...localeList.querySelectorAll('a')].forEach((a) => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = a.getAttribute('href');
        link.textContent = a.textContent.trim();
        li.append(link);
        menu.append(li);
      });
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const open = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
      locale.append(toggle, menu);
      utilityInner.append(locale);
    }
    utilityBar.append(utilityInner);
  }

  // --- Main bar (logo + nav links + search) ---
  const mainBar = document.createElement('div');
  mainBar.className = 'nav-main';
  const mainInner = document.createElement('div');
  mainInner.className = 'nav-main-inner';

  // hamburger (mobile)
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  const hamburgerBtn = document.createElement('button');
  hamburgerBtn.type = 'button';
  hamburgerBtn.setAttribute('aria-label', 'Open navigation');
  hamburgerBtn.setAttribute('aria-controls', 'nav');
  hamburgerBtn.innerHTML = '<span class="nav-hamburger-icon"></span>';
  hamburgerBtn.addEventListener('click', () => toggleMenu(nav));
  hamburger.append(hamburgerBtn);

  // brand/logo
  const brandEl = document.createElement('div');
  brandEl.className = 'nav-brand';
  if (brand) {
    const logoLink = brand.querySelector('a');
    const logoImg = brand.querySelector('img');
    if (logoLink && logoImg) {
      const a = document.createElement('a');
      a.href = logoLink.getAttribute('href');
      a.setAttribute('aria-label', 'WKND Home');
      const img = document.createElement('img');
      img.src = logoImg.getAttribute('src');
      img.alt = logoImg.getAttribute('alt') || 'WKND Logo';
      a.append(img);
      brandEl.append(a);
    }
  }

  // nav links
  const navLinks = document.createElement('div');
  navLinks.className = 'nav-sections';
  if (mainNav) {
    const list = document.createElement('ul');
    list.className = 'nav-list';
    const here = window.location.pathname.replace(/\.html$/, '');
    [...mainNav.querySelectorAll('a')].forEach((a) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.className = 'nav-trigger';
      link.href = a.getAttribute('href');
      link.textContent = a.textContent.trim();
      // "Home" is a mobile-only item in the source header (hidden on desktop).
      const isHome = link.textContent.toLowerCase() === 'home';
      if (isHome) li.classList.add('mobile-only');
      // Highlight the active nav item. Match the current page exactly OR any of
      // its ancestors, so child/detail pages (e.g. /magazine/arctic-surfing)
      // highlight their section item (Magazine). Skip "Home"/root-level items so
      // they don't match every page.
      const target = a.getAttribute('href').replace(/\.html$/, '');
      const isSectionRoot = target && target !== '/' && !isHome;
      if (here === target || (isSectionRoot && here.startsWith(`${target}/`))) {
        li.classList.add('active');
      }
      li.append(link);
      list.append(li);
    });
    navLinks.append(list);
  }

  // search — a functional control, always rendered (do NOT gate on a fragment
  // ':search:' marker: the published nav fragment may omit it, which would drop
  // the search box on mobile/tablet/desktop). The control is code-driven, so the
  // fragment's trailing search section is not read at all.
  const searchEl = document.createElement('div');
  searchEl.className = 'nav-tools';
  buildSearch(searchEl);

  mainInner.append(hamburger, brandEl, navLinks, searchEl);
  mainBar.append(mainInner);

  nav.append(utilityBar, mainBar);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  // Reset state when crossing the desktop/mobile breakpoint.
  isDesktop.addEventListener('change', () => {
    closeAll(nav);
    toggleMenu(nav, false);
    document.body.classList.remove('nav-open');
    document.body.style.overflowY = '';
  });

  // Close locale dropdown on outside click.
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closeAll(nav);
  });
}
