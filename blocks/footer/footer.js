// Inline SVG icons for the social links (keyed by the network in the href).
const SOCIAL_ICONS = {
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.5V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z"/></svg>',
  twitter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 7.3c.01.17.01.35.01.52 0 5.3-4 11.4-11.3 11.4A11.2 11.2 0 0 1 1.5 17.4c.31.04.62.05.94.05 1.86 0 3.57-.63 4.93-1.7a3.98 3.98 0 0 1-3.71-2.76c.6.09 1.14.09 1.76-.07a3.97 3.97 0 0 1-3.18-3.9v-.05c.53.3 1.15.48 1.8.5A3.97 3.97 0 0 1 2.4 5.9c0-.75.2-1.44.55-2.04a11.28 11.28 0 0 0 8.18 4.15 4.48 4.48 0 0 1-.1-.91 3.97 3.97 0 0 1 6.87-2.72 7.8 7.8 0 0 0 2.52-.96 3.98 3.98 0 0 1-1.74 2.19 7.95 7.95 0 0 0 2.28-.62 8.53 8.53 0 0 1-1.98 2.04Z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.86s0 3.6-.07 4.86c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.86.07s-3.6 0-4.86-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.86c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.15 0-3.52.01-4.76.07-.9.04-1.38.19-1.7.32-.43.16-.74.36-1.06.68-.32.32-.52.63-.68 1.06-.13.32-.28.8-.32 1.7C3.42 8.48 3.4 8.85 3.4 12s.02 3.52.08 4.76c.04.9.19 1.38.32 1.7.16.43.36.74.68 1.06.32.32.63.52 1.06.68.32.13.8.28 1.7.32 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c.9-.04 1.38-.19 1.7-.32.43-.16.74-.36 1.06-.68.32-.32.52-.63.68-1.06.13-.32.28-.8.32-1.7.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.04-.9-.19-1.38-.32-1.7a2.85 2.85 0 0 0-.68-1.06 2.85 2.85 0 0 0-1.06-.68c-.32-.13-.8-.28-1.7-.32C15.52 4.01 15.15 4 12 4Zm0 3.06A4.94 4.94 0 1 1 12 17a4.94 4.94 0 0 1 0-9.88Zm0 8.15A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4Zm6.3-8.35a1.15 1.15 0 1 1-2.3 0 1.15 1.15 0 0 1 2.3 0Z"/></svg>',
};

/**
 * Returns the social network key from a link (via href or text), or null.
 */
function socialKey(a) {
  const hint = `${a.getAttribute('href') || ''} ${a.textContent}`.toLowerCase();
  return Object.keys(SOCIAL_ICONS).find((k) => hint.includes(k)) || null;
}

/**
 * Decorate the footer block.
 * Content-first: all copy/links/images come from content/us/footer.plain.html.
 * Metadata-independent dual-fetch: /content first (localhost), then root (prod).
 * @param {Element} block
 */
export default async function decorate(block) {
  let resp = await fetch('/content/us/footer.plain.html');
  if (!resp.ok) resp = await fetch('/us/footer.plain.html');
  block.textContent = '';
  if (!resp.ok) return;

  const html = await resp.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const sections = [...doc.body.children].filter((el) => el.tagName === 'DIV');
  // 0: brand + footer nav, 1: Follow Us + social, 2: legal text
  const [brand, social, legal] = sections;

  const footer = document.createElement('div');
  footer.className = 'footer-inner';

  // --- Top row: brand + nav (left), social (right) ---
  const top = document.createElement('div');
  top.className = 'footer-top';

  if (brand) {
    const brandCol = document.createElement('div');
    brandCol.className = 'footer-brand';
    const logo = brand.querySelector('a img');
    if (logo) {
      const a = document.createElement('a');
      a.href = brand.querySelector('a').getAttribute('href');
      a.setAttribute('aria-label', 'WKND Home');
      const img = document.createElement('img');
      img.src = logo.getAttribute('src');
      img.alt = logo.getAttribute('alt') || 'WKND Logo';
      a.append(img);
      brandCol.append(a);
      // The source footer renders the logo as two stacked anchors (AEM XF quirk).
      // Mirror that with a visually-hidden duplicate so the structure matches;
      // tagged with its own class (never a positional selector).
      const dup = a.cloneNode(true);
      dup.classList.add('footer-logo-dup');
      dup.setAttribute('aria-hidden', 'true');
      dup.setAttribute('tabindex', '-1');
      brandCol.append(dup);
    }
    const navList = brand.querySelector('ul');
    if (navList) {
      const nav = document.createElement('nav');
      nav.setAttribute('aria-label', 'Footer navigation');
      const ul = document.createElement('ul');
      [...navList.querySelectorAll('a')].forEach((a) => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = a.getAttribute('href');
        link.textContent = a.textContent.trim();
        li.append(link);
        ul.append(li);
      });
      nav.append(ul);
      brandCol.append(nav);
    }
    top.append(brandCol);
  }

  if (social) {
    const socialCol = document.createElement('div');
    socialCol.className = 'footer-social';
    const heading = social.querySelector('h1,h2,h3,h4,h5,h6');
    if (heading) {
      const h = document.createElement('h4');
      h.textContent = heading.textContent.trim();
      socialCol.append(h);
    }
    const icons = document.createElement('div');
    icons.className = 'footer-social-icons';
    [...social.querySelectorAll('a')].forEach((a) => {
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      link.setAttribute('aria-label', `${a.textContent.trim()} WKND`);
      const key = socialKey(a);
      link.innerHTML = key ? SOCIAL_ICONS[key] : a.textContent.trim();
      icons.append(link);
    });
    socialCol.append(icons);
    top.append(socialCol);
  }

  footer.append(top);

  // --- Divider ---
  const hr = document.createElement('hr');
  footer.append(hr);

  // --- Legal block ---
  if (legal) {
    const legalCol = document.createElement('div');
    legalCol.className = 'footer-legal';
    [...legal.children].forEach((node) => legalCol.append(node.cloneNode(true)));
    footer.append(legalCol);
  }

  block.append(footer);
}
