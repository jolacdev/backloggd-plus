// Matches /u/:username/list/:slug/ plus its optional trailing segments.
const LIST_PATHNAME_PATTERN = /^\/u\/([^/]+)\/list\/([^/]+)(\/.*)?$/;

// GOTY lists live under a reserved slug and are addressed by year:
// /u/:username/list/goty/:year/
const GOTY_SLUG = 'goty';
const GOTY_YEAR_PATTERN = /^\d{4}$/;

// Sub-routes that live under a list path but are not the list view itself.
const NON_VIEW_LIST_SEGMENTS = ['edit', 'likes'];

// A standard list view is /<sort>/<display>/. The sort may carry a direction
// (e.g. `user:asc`), so it is kept verbatim.
const LIST_DISPLAY_SEGMENTS = ['detail', 'grid'];
const DEFAULT_LIST_SORT = 'user'; // The author's own ordering.

/**
 * The two kinds of list page Backloggd serves. They share almost no markup, so
 * the kind decides both how the page is parsed and where the UI is anchored.
 */
export type ListRouteParams =
  | { kind: 'goty'; username: string; year: string }
  | { kind: 'standard'; slug: string; sort: string; username: string };

export const isCurrentPathname = (pathname: string) =>
  location.pathname === pathname;

/**
 * Identifies the list on the current page.
 *
 * @returns The route params, or `null` when the current page is not a list view.
 */
export const getListRouteParams = (): ListRouteParams | null => {
  const match = LIST_PATHNAME_PATTERN.exec(location.pathname);
  if (!match) return null;

  const [, username, slug, trailingPath = ''] = match;
  const segments = trailingPath.split('/').filter(Boolean);

  const isListView = !segments.some((segment) =>
    NON_VIEW_LIST_SEGMENTS.includes(segment),
  );
  if (!isListView) return null;

  if (slug === GOTY_SLUG) {
    const [year] = segments;
    return year && GOTY_YEAR_PATTERN.test(year)
      ? { kind: 'goty', username, year }
      : null;
  }

  // Keep whichever sort the user is looking at, so the export matches the page.
  const [firstSegment] = segments;
  const sort =
    firstSegment && !LIST_DISPLAY_SEGMENTS.includes(firstSegment)
      ? firstSegment
      : DEFAULT_LIST_SORT;

  return { kind: 'standard', slug, sort, username };
};

/** The list's own page, which is also the base for every page request. */
export const getListPath = (params: ListRouteParams): string =>
  params.kind === 'goty'
    ? `/u/${params.username}/list/${GOTY_SLUG}/${params.year}/`
    : `/u/${params.username}/list/${params.slug}/`;

/** Identifies the list within a filename. */
export const getListSlug = (params: ListRouteParams): string =>
  params.kind === 'goty' ? `${GOTY_SLUG}-${params.year}` : params.slug;
