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

const combineProfileGameResults = (
  results: UseQueryResult<ProfileGamesPageScrapeResponse, Error>[],
) => ({
  data: results.flatMap(({ data }) => (data ? data.games : [])),
  isFetching: results.some((result) => result.isFetching),
  isStale: results.some((result) => result.isStale),
  isSuccess: !!results.length && results.every((result) => result.isSuccess),
  refetch: () => results.forEach((result) => result.refetch()),
});

const combineGamesDetails = (
  results: UseQueryResult<GameDetails | undefined, Error>[],
) => ({
  data: results.flatMap(({ data }) => (data ? [data] : [])),
  isFetching: results.some((result) => result.isFetching),
  isStale: results.some((result) => result.isStale),
  isSuccess: !!results.length && results.every((result) => result.isSuccess),
  refetch: () => results.forEach((result) => result.refetch()),
});

const useExport = ({ username }: UseExportProps) => {
  const [isExportEnabled, setIsExportEnabled] = useState(false);
  const [selectedStatuses, setSelectedStatuses] =
    useState<StatusFiltersState>(); // Default `undefined` to rely on the truthiness of the object to check if the filters have been set.

  const {
    data: firstPageGamesData,
    refetch: refetchFirstPage,
    isFetching: isFirstPageFetching,
    isSuccess: isFirstPageSuccess,
    isStale: isFirstPageStale,
  } = useQuery(
    createProfileGamesPageQueryOptions(
      { pageNumber: 1, username, selectedStatuses: selectedStatuses! },
      { enabled: isExportEnabled && !!selectedStatuses },
    ),
  );

  // 2. Calculate total pages and generate an array of page numbers.
  const totalPages = getTotalPages(firstPageGamesData);
  const pageNumbers = getPageNumbers(totalPages);

  // 3. Fetch all pages available.
  // The first page could be skipped, but is requested (from cache) for simplicity and consistency with the combine logic.
  const canQueryPages =
    !isFirstPageStale &&
    !!pageNumbers.length &&
    isFirstPageSuccess &&
    !isFirstPageFetching;

  const {
    data: pagesGamesData,
    isFetching: arePagesFetching,
    refetch: refetchPages,
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
        { enabled: canQueryPages && !!selectedStatuses },
      ),
    ),
  });

  const canQueryGamesDetails =
    !arePagesStale &&
    !!pagesGamesData.length &&
    arePagesSuccess &&
    !arePagesFetching;

  // Wait for the previous queries to finish before creating the game data to query details.
  const filteredPagesGamesData = canQueryGamesDetails ? pagesGamesData : [];

  const {
    data: gamesDetailsData,
    isFetching: areDetailsFetching,
    refetch: refetchDetails,
    isSuccess: areDetailsSuccess,
    isStale: areDetailsStale,
  } = useQueries({
    combine: combineGamesDetails,
    queries: filteredPagesGamesData.map((profileGame) =>
      createGameDetailsQueryOptions(profileGame, {
        enabled: canQueryGamesDetails,
      }),
    ),
  });

  const fetchData = (selectedFilters: StatusFiltersState) => {
    // Prevent fetching if username has no value.
    if (!username) return;

    if (!isExportEnabled) {
      setSelectedStatuses(selectedFilters);
      setIsExportEnabled(true);
    }

    const isStale = isFirstPageStale || arePagesStale || areDetailsStale;

    if (isStale) {
      refetchFirstPage();
      refetchPages();
      refetchDetails();
    }
  };

  return {
    fetchData,
    gameDetails: gamesDetailsData,
    isExportEnabled,
    isFetching: isFirstPageFetching || arePagesFetching || areDetailsFetching,
    isSuccess: isFirstPageSuccess && arePagesSuccess && areDetailsSuccess,
  };
};

export default useExport;
