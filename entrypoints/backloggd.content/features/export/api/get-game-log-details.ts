import { queryOptions, UseQueryOptions } from '@tanstack/react-query';

import { api } from '@content/lib/axios';
import {
  GameLogDetailsResponse,
  ProfileGameScrapeResponse,
} from '@content/shared/types/api';

import { ExportType, GameLogDetailsCSV } from '../types';
import { queryKeys } from './keys';

/**
 * Fetches user's game log details for a specific game ID.
 */
export const fetchGameLogDetails = async (
  gameId: string,
): Promise<GameLogDetailsResponse> =>
  await api.get<GameLogDetailsResponse>(`/log/edit/${gameId}`);

const parseToGameLogDetailsCSV = (
  { id, name, url }: ProfileGameScrapeResponse,
  { game_log, playthroughs }: GameLogDetailsResponse,
): GameLogDetailsCSV | undefined => {
  if (!game_log || playthroughs.length === 0) {
    return;
  }

  return {
    id: Number(id),
    finish_date: playthroughs[0].finish_date ?? '',
    game_liked: game_log.game_liked,
    hours_finished: playthroughs[0].hours_finished,
    hours_mastered: playthroughs[0].hours_mastered,
    hours_played: playthroughs[0].hours_played,
    is_backlog: game_log.is_backlog,
    is_master: playthroughs[0].is_master,
    is_play: game_log.is_play,
    is_playing: game_log.is_playing,
    is_replay: playthroughs[0].is_replay,
    is_wishlist: game_log.is_wishlist,
    mins_finished: playthroughs[0].mins_finished,
    mins_mastered: playthroughs[0].mins_mastered,
    mins_played: playthroughs[0].mins_played,
    name,
    rating: playthroughs[0].rating,
    review: playthroughs[0].review,
    review_spoilers: playthroughs[0].review_spoilers,
    start_date: playthroughs[0].start_date ?? '',
    url,
  };
};

type GameLogDetailsParams = {
  exportType: ExportType;
  profileGame: ProfileGameScrapeResponse;
};

export const createGameLogDetailsQueryOptions = <
  TError = Error,
  TData = GameLogDetailsCSV,
>(
  {
    exportType, // TODO: Implement parsing based on export type
    profileGame,
  }: GameLogDetailsParams,
  options?: Omit<
    UseQueryOptions<GameLogDetailsResponse, TError, TData>,
    'queryFn' | 'queryKey' | 'select'
  >,
) =>
  queryOptions({
    ...options,
    queryKey: queryKeys.gameLogDetails(profileGame.id),
    queryFn: () => fetchGameLogDetails(profileGame.id),
    select: (data) => parseToGameLogDetailsCSV(profileGame, data),
  });
