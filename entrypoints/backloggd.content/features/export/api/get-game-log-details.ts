import { queryOptions, UseQueryOptions } from '@tanstack/react-query';

import { api } from '@content/lib/axios';
import {
  GameLogDetailsResponse,
  ProfileGameScrapeResponse,
} from '@content/shared/types/api';

import { GameDetails } from '../types';
import { queryKeys } from './keys';

/**
 * Fetches user's game log details for a specific game ID.
 */
export const fetchGameLogDetails = async (
  gameId: string,
): Promise<GameLogDetailsResponse> =>
  await api.get<GameLogDetailsResponse>(`/log/edit/${gameId}`);

const parseToGameDetails = (
  profileGame: ProfileGameScrapeResponse,
  gameLogDetails: GameLogDetailsResponse,
): GameDetails => ({
  ...profileGame,
  ...gameLogDetails,
});

/**
 * Creates query options that return the combined {@link ProfileGameScrapeResponse} and {@link GameLogDetailsResponse}
 * as {@link GameDetails}.
 */
export const createGameDetailsQueryOptions = <
  TError = Error,
  TData = GameDetails,
>(
  profileGame: ProfileGameScrapeResponse,
  options?: Omit<
    UseQueryOptions<GameLogDetailsResponse, TError, TData>,
    'queryFn' | 'queryKey' | 'select'
  >,
) =>
  queryOptions({
    ...options,
    queryKey: queryKeys.gameLogDetails(profileGame.id),
    queryFn: () => fetchGameLogDetails(profileGame.id),
    select: (data: GameLogDetailsResponse): GameDetails =>
      parseToGameDetails(profileGame, data),
  });
