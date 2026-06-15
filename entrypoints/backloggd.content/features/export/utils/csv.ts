/* eslint-disable perfectionist/sort-objects */
import { toCSVString } from '@content/lib/papaparse';

import { GameDetails, GameDetailsCSV } from '../types';
import { triggerBlobDownload } from './download';

/**
 * Transforms a {@link GameDetails} object into a {@link GameDetailsCSV}.
 *
 * If the game log or playthroughs are missing, the function returns `undefined` and the game is skipped from CSV export.
 */
export const parseToGameDetailsCSV = ({
  id,
  name,
  url,
  game_log,
  playthroughs,
}: GameDetails): GameDetailsCSV | undefined => {
  // The attribute game_log is required for games to appear in the user's game log.
  if (!game_log) {
    console.warn(`Skipping game '${name}' (${id}) due to missing game log.`);
    return;
  }

  // Backloggd API returns `playthroughs` as an empty object `{}` for games without playthroughs, so we assign default values.
  const firstPlaythrough: GameDetails['playthroughs'][string] | undefined =
    Object.values(playthroughs)[0];

  return {
    id: Number(id),
    finish_date: firstPlaythrough?.finish_date ?? '',
    game_liked: game_log.game_liked,
    total_hours: game_log.total_hours,
    total_minutes: game_log.total_minutes,
    hours_finished: firstPlaythrough?.hours_finished ?? '',
    hours_mastered: firstPlaythrough?.hours_mastered ?? '',
    hours_played: firstPlaythrough?.hours_played ?? '',
    is_backlog: game_log.is_backlog,
    is_master: firstPlaythrough?.is_master ?? '',
    is_play: game_log.is_play,
    is_playing: game_log.is_playing,
    is_replay: firstPlaythrough?.is_replay ?? '',
    is_wishlist: game_log.is_wishlist,
    mins_finished: firstPlaythrough?.mins_finished ?? '',
    mins_mastered: firstPlaythrough?.mins_mastered ?? '',
    mins_played: firstPlaythrough?.mins_played ?? '',
    name,
    rating: firstPlaythrough?.rating ?? '',
    review: firstPlaythrough?.review ?? '',
    review_spoilers: firstPlaythrough?.review_spoilers ?? '',
    start_date: firstPlaythrough?.start_date ?? '',
    url,
  };
};

const getGameDetailsCSVString = (data: GameDetailsCSV[]): Promise<string> => {
  const csvGameData: Record<string, unknown>[] = data.map((game) => ({
    ID: game.id,
    'Game Name': game.name,
    Played: game.is_play,
    'Currently Playing': game.is_playing,
    'In Backlog': game.is_backlog,
    'In Wishlist': game.is_wishlist,
    Liked: game.game_liked,
    Rating: game.rating,
    Mastered: game.is_master,
    'Start Date': game.start_date,
    'Finish Date': game.finish_date,
    'Total Hours': game.total_hours,
    'Total Minutes': game.total_minutes,
    'Playthrough Hours': game.hours_played,
    'Playthrough Minutes': game.mins_played,
    'Playthrough Hours to Finish': game.hours_finished,
    'Playthrough Minutes to Finish': game.mins_finished,
    'Playthrough Hours to Master': game.hours_mastered,
    'Playthrough Minutes to Master': game.mins_mastered,
    Replay: game.is_replay,
    Review: game.review,
    'Review Contains Spoilers': game.review_spoilers,
    'Backloggd URL': game.url,
  }));

  return toCSVString(csvGameData);
};

/**
 * Generates a CSV from the provided game log details and triggers a download from the browser.
 * @param data - Array of game log details
 * @param filename - The filename for the downloaded CSV file
 */
export const downloadGameDetailsCSV = async (
  data: GameDetailsCSV[],
  filename: string = 'games.csv',
): Promise<void> => {
  const csvString = await getGameDetailsCSVString(data);
  triggerBlobDownload(csvString, filename, 'text/csv;charset=utf-8;');
};
