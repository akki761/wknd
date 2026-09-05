/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND site-wide cleanup.
 * Removes non-authorable AEM site chrome (header/nav/search, footer, mobile nav,
 * tracking iframe) and stray elements. All selectors verified against
 * migration-work/cleaned.html for the WKND homepage.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Tracking / ID-syncing iframe (cleaned.html line 566: Adobe demdex iframe).
    // Mobile nav chrome (cleaned.html lines 568-596: #toggleNav toggle + #mobileNav).
    // These are non-authorable and should not participate in block parsing.
    WebImporter.DOMUtils.remove(element, [
      'iframe#destination_publishing_iframe_wkndsite_0',
      '#toggleNav',
      '#mobileNav',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Site shell / non-authorable chrome:
    // - header.cmp-experiencefragment--header (lines 5-161): sign-in, language nav, logo, main nav, search
    // - footer.cmp-experiencefragment--footer (lines 471-562): footer logo, nav, social buttons, copyright
    WebImporter.DOMUtils.remove(element, [
      'header.experiencefragment.cmp-experiencefragment--header',
      'footer.experiencefragment.cmp-experiencefragment--footer',
    ]);

    // Stray empty <meta> tags emitted inside cmp-image wrappers (e.g. lines 183, 204, 227).
    WebImporter.DOMUtils.remove(element, ['meta']);

    // Content-fragment internal title (article template): the CF renders its own
    // <h3 class="cmp-contentfragment__title"> which the source HIDES via CSS. It
    // duplicates the page <h1 class="cmp-title__text">, so drop it — otherwise the
    // migrated article shows the title twice (once as h1, once as h3).
    WebImporter.DOMUtils.remove(element, ['h3.cmp-contentfragment__title']);

    // Pullquote vs. plain quote (article template): on the source, only text
    // components carrying `.cmp-text--quote` render the big Asar serif pullquote
    // (36px). Plain `.cmp-text blockquote` (e.g. arctic-surfing) renders as small
    // 18px body text. The importer flattens both to a bare <blockquote>, so the
    // template CSS (which enlarges every article blockquote) would wrongly enlarge
    // the plain ones. Downgrade non-quote blockquotes to paragraphs here so only
    // the true pullquotes stay <blockquote> and get the large style.
    element.querySelectorAll('blockquote').forEach((bq) => {
      if (bq.closest('.cmp-text--quote')) return; // real pullquote — keep as-is
      const p = document.createElement('p');
      while (bq.firstChild) p.append(bq.firstChild);
      bq.replaceWith(p);
    });
  }
}
