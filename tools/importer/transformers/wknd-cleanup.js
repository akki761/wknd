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
  }
}
