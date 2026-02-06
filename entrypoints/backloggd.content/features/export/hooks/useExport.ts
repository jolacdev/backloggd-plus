import { useQueries, useQuery, UseQueryResult } from '@tanstack/react-query';
import { useState } from 'react';

import { ProfileGamesPageResponseScrape } from '@content/types/api';

import { createProfileGamesPageQueryOptions } from '../api/get-profile-games-page';

type UseExportProps = {
  username: string;
};

// TODO: Move to utils?
const getTotalPages = (profileGamesPage?: ProfileGamesPageResponseScrape) => {
  if (!profileGamesPage) {
    return 0;
  }

  const { games, totalGames } = profileGamesPage;
  return Math.ceil(totalGames / games.length) || 1;
};

const getPageNumbers = (totalPages: number) =>
  Array.from({ length: totalPages }, (_, index) => index + 1);

// TODO: Check if has to be removed.
// const getGameNamesById = (
//   games: ProfileGamesPageResponseScrape['games'],
// ): Record<string, string> =>
//   games.reduce<Record<string, string>>((acc, { id, name }) => {
//     if (id) {
//       acc[id] = name;
//     }
//     return acc;
//   }, {});

const combineProfileGameResults = (
  results: UseQueryResult<ProfileGamesPageResponseScrape, Error>[],
) => ({
  data: results.flatMap(({ data }) => (data ? data.games : [])),
  fetching: results.some((result) => result.isFetching),
  pending: results.some((result) => result.isPending),
  isStale: results.some((result) => result.isStale),
  refetch: () => results.forEach((result) => result.refetch()),
});

// const combineGamesDetails = (
//   results: UseQueryResult<GameLogDetailsResponse, Error>[],
// ) => ({
//   data: results.flatMap(({ data }) => (data?.game_log ? data : [])),
//   fetching: results.some((result) => result.isFetching),
//   pending: results.some((result) => result.isPending),
//   isStale: results.some((result) => result.isStale),
//   refetch: () => results.forEach((result) => result.refetch()),
// });

// TODO: Separate into multiple hooks? useProfileGamesPagesExport, useGameLogDetailsExport, etc.
const useExport = ({ username }: UseExportProps) => {
  const [isExportEnabled, setIsExportEnabled] = useState(false);

  const {
    data: firstProfileGamesPage,
    refetch: refetchFirstPage,
    isFetching: isFirstQueryFetching,
    isStale: isQueryStale,
  } = useQuery(
    createProfileGamesPageQueryOptions(
      { pageNumber: 1, username },
      { enabled: isExportEnabled },
    ),
  );

  // 2. Calculate total pages and generate an array of page numbers.
  const totalPages = getTotalPages(firstProfileGamesPage);
  const pageNumbers = getPageNumbers(totalPages);

  // 3. Fetch all pages available.
  // The first page could be skipped, but is requested (from cache) for simplicity and consistency with the combine logic.
  const {
    data: allProfileGames,
    fetching: areQueriesFetching,
    refetch: refetchAllPages,
    isStale: areQueriesStale,
  } = useQueries({
    combine: combineProfileGameResults,
    queries: pageNumbers.map((pageNumber) =>
      createProfileGamesPageQueryOptions({
        pageNumber,
        username,
      }),
    ),
  });

  // // TODO: Update name and add a combine
  // const queries = useQueries({
  //   combine: combineGamesDetails,
  //   queries: allProfileGames
  //     .slice(0, 3) // TODO: ⚠️ TEMP Remove slice, used only for testing purposes.
  //     .filter(({ id }) => Boolean(id)) // TODO: Check filter logic.
  //     .map(({ id }) =>
  //       createGameLogDetailsQueryOptions({
  //         gameId: id,
  //       }),
  //     ),
  // });

  // console.log({ queries });

  // const gameNamesById = getGameNamesById(allProfileGames);

  const isStale = isQueryStale || areQueriesStale;

  const fetchData = () => {
    // Prevent fetching if username has no value.
    if (!username) {
      return;
    }

    if (!isExportEnabled) {
      setIsExportEnabled(true);
    } else if (isStale) {
      refetchFirstPage();
      refetchAllPages();
    }
  };

  return {
    fetchData,
    profileGames: allProfileGames,
    isExportEnabled,
    isFetching: isFirstQueryFetching || areQueriesFetching,
    isStale,
  };
};

export default useExport;
