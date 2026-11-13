/**
 * Which links are worth prefetching.
 *
 * Next prefetches the data of a linked route — and the client chunks that
 * route needs. The catalogue pages are light and worth having ready, but the
 * form pages carry the validation library (about 140 KB of it), and most
 * visitors do not open a form straight away. Prefetching those would make
 * every first page load heavier for a page that may never be visited.
 */

const NO_PREFETCH = ["/contact", "/checkout", "/order"];

export function shouldPrefetch(href: string) {
  return !NO_PREFETCH.some(
    (path) => href === path || href.startsWith(`${path}/`),
  );
}
