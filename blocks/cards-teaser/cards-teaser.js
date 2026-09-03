import { createOptimizedPicture } from '../../scripts/aem.js';

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
}
