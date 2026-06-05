/* eslint-disable perfectionist/sort-objects */
import { useQueries, useQuery, UseQueryResult } from '@tanstack/react-query';

import { ProfileGamesPageScrapeResponse } from '@content/shared/types/api';
import { StatusFiltersState } from '@globalShared/hooks/useStatusFilters';

import { createGameDetailsQueryOptions } from '../api/get-game-log-details';
import { createProfileGamesPageQueryOptions } from '../api/get-profile-games-page';
import { getPageNumbers, getTotalPages } from '../api/utils';
import { GameDetails } from '../types';

type UseExportProps = {
  username: string;
};

const SEQUENTIAL_DELAY_MS = 500; // MS to wait between requests to avoid 429.

const combineProfileGameResults = (
  results: UseQueryResult<ProfileGamesPageScrapeResponse, Error>[],
) => ({
  data: results.flatMap(({ data }) => (data ? data.games : [])),
  isFetching: results.some((result) => result.isFetching),
  isStale: results.some((result) => result.isStale),
  isSuccess: !!results.length && results.every((result) => result.isSuccess),
});

const combineGamesDetails = (
  results: UseQueryResult<GameDetails | undefined, Error>[],
) => ({
  data: results.flatMap(({ data }) => (data ? [data] : [])),
  rawResults: results,
  isFetching: results.some((result) => result.isFetching),
  isStale: results.some((result) => result.isStale),
  isSuccess: !!results.length && results.every((result) => result.isSuccess),
});

const useExport = ({ username }: UseExportProps) => {
  const [isExportEnabled, setIsExportEnabled] = useState(false);
  const [selectedStatuses, setSelectedStatuses] =
    useState<StatusFiltersState>(); // Default `undefined` to rely on the truthiness of the object to check if the filters have been set.

  // Sequential index tracker for rate-limited fetching.
  const [activeDetailIndex, setActiveDetailIndex] = useState(0);

  // 1. Fetch the first page to get the total games count.
  const {
    data: firstPageGamesData,
    isFetching: isFirstPageFetching,
    isSuccess: isFirstPageSuccess,
    isStale: isFirstPageStale,
  } = useQuery(
    createProfileGamesPageQueryOptions(
      { pageNumber: 1, username, selectedStatuses: selectedStatuses! },
      {
        enabled: isExportEnabled && !!selectedStatuses,
        staleTime: 0,
        gcTime: 0,
      },
    ),
  );

  // 2. Fetch all pages based on the total games count from the first page.
  const totalPages = getTotalPages(firstPageGamesData);
  const pageNumbers = getPageNumbers(totalPages);

  const canQueryPages =
    !isFirstPageStale &&
    !!pageNumbers.length &&
    isFirstPageSuccess &&
    !isFirstPageFetching;

  const {
    data: pagesGamesData,
    isFetching: arePagesFetching,
    isSuccess: arePagesSuccess,
    isStale: arePagesStale,
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
          staleTime: 0,
          gcTime: 0,
        },
      ),
    ),
  });

  // 3. Fetch game details for all the games retrieved from the previous page fetches. (sequential, rate-limited).
  const canQueryGamesDetails =
    !arePagesStale &&
    !!pagesGamesData.length &&
    arePagesSuccess &&
    !arePagesFetching;

  // Wait for the previous queries to finish before creating the game data to query details.
  const filteredPagesGamesData = canQueryGamesDetails ? pagesGamesData : [];

  const {
    data: gamesDetailsData,
    rawResults: rawDetailQueriesResults,
    isFetching: areDetailsFetching,
    isSuccess: areDetailsSuccess,
  } = useQueries({
    combine: combineGamesDetails,
    queries: filteredPagesGamesData.map((profileGame, index) =>
      createGameDetailsQueryOptions(profileGame, {
        // Only enable next query once the previous one has settled.
        enabled: canQueryGamesDetails && index <= activeDetailIndex,
      }),
    ),
  });

  // Advance to the next detail query after a delay once the current one settles.
  const currentDetailResult = rawDetailQueriesResults?.[activeDetailIndex];
  const isCurrentDetailSettled =
    Boolean(currentDetailResult) &&
    (currentDetailResult.isSuccess || currentDetailResult.isError);

  // TODO: Check if needed.
  useEffect(() => {
    // Check if page requests have completed and if the current detail query has settled before enabling the next one.
    if (!canQueryGamesDetails || !isCurrentDetailSettled) return;

    // Avoid moving to the next query if it is the last query.
    if (activeDetailIndex >= filteredPagesGamesData.length - 1) return;

    const timer = setTimeout(() => {
      setActiveDetailIndex((prev) => prev + 1);
    }, SEQUENTIAL_DELAY_MS);

    return () => clearTimeout(timer);
  }, [
    canQueryGamesDetails,
    isCurrentDetailSettled,
    activeDetailIndex,
    filteredPagesGamesData.length,
  ]);

  const isBatchComplete =
    isExportEnabled && // NOTE: Guard: Only evaluate completeness if an export is actually active
    areDetailsSuccess &&
    !areDetailsFetching &&
    !arePagesFetching &&
    !isFirstPageFetching;

  // Derived: true from the moment the user triggers export until all queries settle.
  const isBatchFetching = isExportEnabled && !isBatchComplete;

  const fetchData = (selectedFilters: StatusFiltersState) => {
    // Prevent fetching if username has no value.
    if (!username) return;

    // TODO: Check if needed.
    setActiveDetailIndex(0); // Reset index at the start of a new fetch.

    if (!isExportEnabled) {
      setSelectedStatuses(selectedFilters);
      setIsExportEnabled(true);
    }
  };

  return {
    fetchData,
    gameDetails: gamesDetailsData,
    isExportEnabled,
    isFetching: isBatchFetching,
    isSuccess: isFirstPageSuccess && arePagesSuccess && areDetailsSuccess,
  };
};

export default useExport;
