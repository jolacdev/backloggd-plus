/* eslint-disable perfectionist/sort-objects */
import { useQueries, UseQueryResult } from '@tanstack/react-query';

import { ProfileGameScrapeResponse } from '@content/shared/types/api';

import { createGameDetailsQueryOptions } from '../api/get-game-log-details';
import { GameDetails } from '../types';

type UseGameDetailsProps = {
  enabled: boolean;
  profileGames: ProfileGameScrapeResponse[];
};

const SEQUENTIAL_DELAY_MS = 100; // MS to wait between requests to avoid 429.

const combineGamesDetails = (
  results: UseQueryResult<GameDetails | undefined, Error>[],
) => ({
  data: results.flatMap(({ data }) => (data ? [data] : [])),
  rawResults: results,
  isFetching: results.some((result) => result.isFetching),
});

/**
 * Stage 3 of the export pipeline: fetch the game-log details for every game,
 * one at a time (rate-limited) to avoid 429s.
 *
 * Errors on individual games are tolerated, they count as "settled" so the run can still complete; the failed
 * game is simply omitted from {@link details}.
 */
const useGameDetails = ({ profileGames, enabled }: UseGameDetailsProps) => {
  // Sequential index tracker for rate-limited fetching.
  const [activeDetailIndex, setActiveDetailIndex] = useState(0);

  // Only build queries once the previous stage has handed off its games.
  const games = enabled ? profileGames : [];

  const {
    data: details,
    rawResults,
    isFetching,
  } = useQueries({
    combine: combineGamesDetails,
    queries: games.map((profileGame, index) =>
      createGameDetailsQueryOptions(profileGame, {
        // Only enable the next query once the previous one has settled.
        enabled: enabled && index <= activeDetailIndex,
      }),
    ),
  });

  // Advance to the next detail query after a delay once the current one settles.
  const currentResult = rawResults?.[activeDetailIndex];
  const isCurrentSettled =
    Boolean(currentResult) &&
    (currentResult.isSuccess || currentResult.isError);

  useEffect(() => {
    if (!enabled || !isCurrentSettled) return;

    // Avoid advancing past the last query.
    if (activeDetailIndex >= games.length - 1) return;

    const timer = setTimeout(() => {
      setActiveDetailIndex((prev) => prev + 1);
    }, SEQUENTIAL_DELAY_MS);

    return () => clearTimeout(timer);
  }, [enabled, isCurrentSettled, activeDetailIndex, games.length]);

  // Count queries that have finished processing (settled = success or error).
  const settledCount = rawResults.filter(
    ({ isSuccess, isError }) => isSuccess || isError,
  ).length;
  const total = games.length;

  return {
    details,
    settledCount,
    total,
    isFetching,
    isComplete: total > 0 && settledCount === total,
    reset: () => setActiveDetailIndex(0),
  };
};

export default useGameDetails;
