/* eslint-disable perfectionist/sort-objects */
import {
  queryOptions,
  useQueries,
  useQuery,
  UseQueryResult,
} from '@tanstack/react-query';

import { api } from '@content/lib/axios';
import { ListPageScrapeResponse } from '@content/shared/types/api';
import {
  getPageNumbers,
  getTotalPages,
} from '@content/shared/utils/pagination';
import {
  getListPath,
  getListRouteParams,
  ListRouteParams,
} from '@content/shared/utils/url';

import { BACKLOGGD_ORIGIN, ListDetails, parseListPage } from './list-dom';

// NOTE: Intentional cache to prevent stuck queries due to stale state when there is more than 1 page to fetch.
const CACHE_TIME_MS = 1000 * 60 * 1; // 1 minute cache time for list pages.

/**
 * The lifecycle phase of an export run.
 *
 * - `idle`: no export in progress.
 * - `analyzing`: fetching the first page to learn how many pages the list spans.
 * - `exporting`: fetching the remaining pages.
 * - `complete`: every page has settled. An empty list also resolves here.
 * - `error`: a page could not be fetched, so there is nothing to export.
 */
export type ListExportPhase =
  | 'analyzing'
  | 'complete'
  | 'error'
  | 'exporting'
  | 'idle';

/**
 * Candidate URLs for a list page, in preference order.
 *
 * Standard lists keep whichever sort the user is viewing, so the export matches
 * the page (defaulting to `user`, the author's own ordering). The `grid` display
 * segment renders ranked and unranked lists with identical markup, including
 * entry notes and played-status overlays; the bare list URL is the fallback.
 * GOTY pages have neither sort nor display variants, so they are fetched as-is.
 */
const createListPageUrls = (params: ListRouteParams): string[] => {
  const listPath = getListPath(params);

  return params.kind === 'goty'
    ? [listPath]
    : [`${listPath}${params.sort}/grid/`, listPath];
};

/**
 * Fetches a page of a user's list and returns the parsed HTML document.
 */
const fetchListPage = async (
  params: ListRouteParams,
  pageNumber: number,
): Promise<Document> => {
  let lastError: unknown;

  for (const url of createListPageUrls(params)) {
    try {
      const result = await api.get<string>(url, {
        params: { page: pageNumber },
      });

      const parser = new DOMParser();
      return parser.parseFromString(result, 'text/html');
    } catch (error) {
      lastError = error;
    }
  }

  console.error(`Failed to fetch page ${pageNumber} of ${getListPath(params)}`);
  throw lastError;
};

const createListPageQueryOptions = (
  params: ListRouteParams,
  pageNumber: number,
  { enabled }: { enabled: boolean },
) =>
  queryOptions({
    enabled,
    staleTime: CACHE_TIME_MS,
    gcTime: CACHE_TIME_MS,
    queryKey: ['listPage', params, pageNumber] as const,
    queryFn: () => fetchListPage(params, pageNumber),
    select: (data: Document) => parseListPage(data),
  });

const isStageReady = ({
  isSuccess,
  isFetching,
  isStale,
}: {
  isFetching: boolean;
  isStale: boolean;
  isSuccess: boolean;
}) => isSuccess && !isFetching && !isStale;

const combineListPageResults = (
  results: UseQueryResult<ListPageScrapeResponse, Error>[],
) => ({
  data: results.flatMap(({ data }) => (data ? data.entries : [])),
  settledCount: results.filter(({ isSuccess, isError }) => isSuccess || isError)
    .length,
  isFetching: results.some((result) => result.isFetching),
  isStale: results.some((result) => result.isStale),
  isError: results.some((result) => result.isError),
  isSuccess: !!results.length && results.every((result) => result.isSuccess),
});

/**
 * Resolves a full list on demand: fetch the first page to learn the total entry
 * count, then fetch every page and flatten them into a single ordered list.
 *
 * Pages are requested in ascending order, so the flattened index is the entry's
 * position in the list as the author curated it.
 */
const useListExport = () => {
  // Captured when the export starts rather than when the button mounts: sorting
  // a list is a Turbo frame navigation, which changes the URL underneath a
  // button that is never re-rendered.
  const [routeParams, setRouteParams] = useState<ListRouteParams | null>(null);
  // Incremented on every trigger so a repeat export re-runs even when every page
  // is served from cache and no query state changes.
  const [exportRunId, setExportRunId] = useState(0);

  // 1. Fetch the first page to get the total entry count and the list title.
  const {
    data: firstPage,
    isFetching: isFirstPageFetching,
    isSuccess: isFirstPageSuccess,
    isStale: isFirstPageStale,
    isError: isFirstPageError,
  } = useQuery(
    createListPageQueryOptions(routeParams!, 1, { enabled: !!routeParams }),
  );

  // 2. Fetch every page to collect the full set of entries.
  const totalPages = getTotalPages(
    firstPage?.totalGames ?? 0,
    firstPage?.entries.length ?? 0,
  );
  const pageNumbers = getPageNumbers(totalPages);

  const isFirstPageReady = isStageReady({
    isSuccess: isFirstPageSuccess,
    isFetching: isFirstPageFetching,
    isStale: isFirstPageStale,
  });

  const {
    data: scrapedEntries,
    settledCount,
    isFetching: arePagesFetching,
    isSuccess: arePagesSuccess,
    isStale: arePagesStale,
    isError: arePagesError,
  } = useQueries({
    combine: combineListPageResults,
    queries: pageNumbers.map((pageNumber) =>
      createListPageQueryOptions(routeParams!, pageNumber, {
        enabled: !!routeParams && isFirstPageReady && pageNumbers.length > 0,
      }),
    ),
  });

  const areEntriesReady =
    isStageReady({
      isSuccess: arePagesSuccess,
      isFetching: arePagesFetching,
      isStale: arePagesStale,
    }) && scrapedEntries.length > 0;

  // Single source of truth for the export lifecycle, resolved by priority.
  const resolvePhase = (): ListExportPhase => {
    if (!routeParams) return 'idle';
    if (isFirstPageError || arePagesError) return 'error';
    // An empty list also resolves as complete; the caller surfaces the result.
    if (areEntriesReady || (isFirstPageReady && totalPages === 0)) {
      return 'complete';
    }
    if (isFirstPageReady) return 'exporting'; // First page done -> fetching the rest.
    return 'analyzing';
  };

  const listDetails: ListDetails | undefined =
    routeParams && firstPage
      ? {
          description: firstPage.description,
          entries: scrapedEntries.map((entry, index) => ({
            ...entry,
            position: index + 1,
          })),
          kind: routeParams.kind,
          owner: routeParams.username,
          sort: routeParams.kind === 'standard' ? routeParams.sort : undefined,
          stats: firstPage.stats,
          title: firstPage.title,
          totalGames: firstPage.totalGames,
          url: `${BACKLOGGD_ORIGIN}${getListPath(routeParams)}`,
        }
      : undefined;

  const startExport = () => {
    const params = getListRouteParams();
    if (!params) return;

    setRouteParams(params);
    setExportRunId((previousRunId) => previousRunId + 1);
  };

  return {
    exportRunId,
    listDetails,
    routeParams,
    phase: resolvePhase(),
    settledPages: settledCount,
    startExport,
    totalPages,
  };
};

export default useListExport;
