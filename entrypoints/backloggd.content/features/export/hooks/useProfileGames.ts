/* eslint-disable perfectionist/sort-objects */
import { useQueries, useQuery, UseQueryResult } from '@tanstack/react-query';

import { ProfileGamesPageScrapeResponse } from '@content/shared/types/api';
import { StatusFiltersState } from '@globalShared/hooks/useStatusFilters';

import { createProfileGamesPageQueryOptions } from '../api/get-profile-games-page';
import { getPageNumbers, getTotalPages } from '../api/utils';

const isStageReady = ({
  isSuccess,
  isFetching,
  isStale,
}: {
  isFetching: boolean;
  isStale: boolean;
  isSuccess: boolean;
}) => isSuccess && !isFetching && !isStale;

type UseProfileGamesProps = {
  enabled: boolean;
  selectedStatuses: StatusFiltersState | undefined;
  username: string;
};

const combineProfileGameResults = (
  results: UseQueryResult<ProfileGamesPageScrapeResponse, Error>[],
) => ({
  data: results.flatMap(({ data }) => (data ? data.games : [])),
  isFetching: results.some((result) => result.isFetching),
  isStale: results.some((result) => result.isStale),
  isError: results.some((result) => result.isError),
  isSuccess: !!results.length && results.every((result) => result.isSuccess),
});

// NOTE: Intentional cache to prevent stuck queries due to stale state when there is more than 1 page to fetch.
const CACHE_TIME_MS = 20000; // 20s cache time for profile game pages.

/**
 * Stages 1 and 2 of the export pipeline: fetch the first profile games page to
 * learn the total count, then fetch every page. Exposes the flattened game list
 * plus a small status so the next stage (game details) can be gated on it.
 */
const useProfileGames = ({
  username,
  selectedStatuses,
  enabled,
}: UseProfileGamesProps) => {
  // 1. Fetch the first page to get the total games count.
  const {
    data: firstPageData,
    isFetching: isFirstPageFetching,
    isSuccess: isFirstPageSuccess,
    isStale: isFirstPageStale,
    isError: isFirstPageError,
  } = useQuery(
    createProfileGamesPageQueryOptions(
      { pageNumber: 1, username, selectedStatuses: selectedStatuses! },
      {
        enabled: enabled && !!selectedStatuses,
        staleTime: CACHE_TIME_MS,
        gcTime: CACHE_TIME_MS,
      },
    ),
  );

  // 2. Fetch all pages to collect the full list of games to export.
  const totalPages = getTotalPages(firstPageData);
  const pageNumbers = getPageNumbers(totalPages);

  const canQueryPages =
    isStageReady({
      isSuccess: isFirstPageSuccess,
      isFetching: isFirstPageFetching,
      isStale: isFirstPageStale,
    }) && pageNumbers.length > 0;

  const {
    data: games,
    isFetching: arePagesFetching,
    isSuccess: arePagesSuccess,
    isStale: arePagesStale,
    isError: arePagesError,
  } = useQueries({
    combine: combineProfileGameResults,
    queries: pageNumbers.map((pageNumber) =>
      createProfileGamesPageQueryOptions(
        {
          pageNumber,
          username,
          selectedStatuses: selectedStatuses!,
        },
        {
          enabled: canQueryPages && !!selectedStatuses,
          staleTime: CACHE_TIME_MS,
          gcTime: CACHE_TIME_MS,
        },
      ),
    ),
  });

  // Ready to hand off to the details stage once all pages have settled with data.
  const isReady =
    isStageReady({
      isSuccess: arePagesSuccess,
      isFetching: arePagesFetching,
      isStale: arePagesStale,
    }) && games.length > 0;

  return {
    games,
    isFetching: isFirstPageFetching || arePagesFetching,
    isReady,
    isError: isFirstPageError || arePagesError,
  };
};

export default useProfileGames;
