import { queryOptions, useQuery, UseQueryOptions } from '@tanstack/react-query';

import { api } from '@content/lib/axios';
import { GameLogDetailsResponse } from '@content/shared/types/api';

import { queryKeys } from './keys';

/**
 * Fetches user's game log details for a specific game ID.
 */
export const fetchGameLogDetails = async (
  gameId: string,
): Promise<GameLogDetailsResponse> =>
  await api.get<GameLogDetailsResponse>(`/log/edit/${gameId}`);

type GameLogDetailsParams = {
  gameId: string;
};

export const createGameLogDetailsQueryOptions = <
  TError = Error,
  TData = GameLogDetailsResponse,
>(
  { gameId }: GameLogDetailsParams,
  options?: Omit<
    UseQueryOptions<GameLogDetailsResponse, TError, TData>,
    'queryFn' | 'queryKey' | 'select'
  >,
) =>
  queryOptions({
    ...options,
    queryKey: queryKeys.gameLogDetails(gameId),
    queryFn: () => fetchGameLogDetails(gameId),
    select: (data) => data,
  });
