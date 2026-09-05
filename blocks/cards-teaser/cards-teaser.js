import { createOptimizedPicture } from '../../scripts/aem.js';

/* The adventures listing renders a "Current Adventures" filter: a set of tab
 * labels (All, Climbing, Cycling, Skiing, Surfing, Travel) authored as a plain
 * list in the same section as this teaser row. Each card links to an adventure
 * detail page that carries an authoritative "Activity" value in its columns-meta
 * (e.g. Surfing, Rock Climbing, Cycling, Skiing, Social, Camping). We read that
 * Activity per card, tag the card, and filter the row by the selected tab.
 * Activities that don't match a specific tab fall into the catch-all tab
 * (the last one — "Travel"). Pages without such a list (home, magazine) are
 * left untouched. */

function normalize(str) {
  return (str || '').trim().toLowerCase();
}

async function fetchActivity(href) {
  try {
    const url = new URL(href, window.location.href);
    const resp = await fetch(`${url.pathname}.plain.html`);
    if (!resp.ok) return '';
    const html = await resp.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const rows = doc.querySelectorAll('.columns-meta > div');
    let activity = '';
    rows.forEach((row) => {
      const cells = row.children;
      if (cells.length >= 2 && normalize(cells[0].textContent) === 'activity') {
        activity = cells[1].textContent.trim();
      }
    });
    return activity;
  } catch (e) {
    return '';
  }
}

async function decorateTabs(block, ul) {
  const section = block.closest('.section');
  if (!section) return;
  const ol = section.querySelector('.default-content-wrapper ol');
  if (!ol) return;

  const labels = [...ol.children].map((li) => li.textContent.trim()).filter(Boolean);
  if (labels.length < 2) return;

  // The catch-all tab (anything not matched by a specific tab) is the last one.
  const catchAll = labels[labels.length - 1];
  // Specific tabs = everything except "All" (first) and the catch-all (last).
  const allTab = labels[0];
  const specificTabs = labels.slice(1, -1);

  const cards = [...ul.children];

  // Resolve each card's Activity from its linked adventure page, then derive
  // which tab it belongs to.
  await Promise.all(cards.map(async (li) => {
    const href = li.querySelector('a[href]')?.getAttribute('href');
    const activity = href ? await fetchActivity(href) : '';
    const act = normalize(activity);
    // A card belongs to a specific tab when its activity contains the tab label
    // (so "Rock Climbing" -> "Climbing"). Otherwise it lands in the catch-all.
    const match = specificTabs.find((tab) => act && act.includes(normalize(tab)));
    li.dataset.category = match || catchAll;
  }));

  // Build the tab bar in place of the authored list.
  const nav = document.createElement('div');
  nav.className = 'cards-teaser-tabs';
  nav.setAttribute('role', 'tablist');

  function applyFilter(label) {
    const showAll = normalize(label) === normalize(allTab);
    cards.forEach((li) => {
      const visible = showAll || li.dataset.category === label;
      li.hidden = !visible;
    });
  }

  labels.forEach((label, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cards-teaser-tab';
    btn.textContent = label;
    btn.setAttribute('role', 'tab');
    const selected = i === 0;
    btn.setAttribute('aria-selected', String(selected));
    if (selected) btn.classList.add('is-active');
    btn.addEventListener('click', () => {
      nav.querySelectorAll('.cards-teaser-tab').forEach((b) => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');
      applyFilter(label);
    });
    nav.append(btn);
  });

  ol.replaceWith(nav);
  applyFilter(allTab);
}

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-teaser-card-image';
      else div.className = 'cards-teaser-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    img.closest('picture').replaceWith(optimizedPic);
  });

  // Make each card image link to the same target as its title (source wraps the
  // card image in an <a> to the article). Markdown can't carry a link that wraps
  // only an image, so we recreate it here from the title link's href.
  [...ul.children].forEach((li) => {
    const picture = li.querySelector('.cards-teaser-card-image picture');
    const href = li.querySelector('.cards-teaser-card-body a[href]')?.getAttribute('href');
    if (picture && href && !picture.closest('a')) {
      const a = document.createElement('a');
      a.setAttribute('href', href);
      a.setAttribute('aria-label', li.querySelector('.cards-teaser-card-body a[href]').textContent.trim());
      picture.replaceWith(a);
      a.append(picture);
    }
  });

  block.textContent = '';
  block.append(ul);

  // Wire up the "Current Adventures" tab filter when a sibling label list is
  // present (adventures listing only). Runs async; no-op elsewhere.
  decorateTabs(block, ul);
}
