/* eslint-disable perfectionist/sort-objects */
import { toCSVString } from '@content/lib/papaparse';

import { GameLogDetailsCSV } from '../types';

const getGameLogDetailsCSVString = (
  data: GameLogDetailsCSV[],
): Promise<string> => {
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
    'Hours Played': game.hours_played,
    'Minutes Played': game.mins_played,
    'Hours to Finish': game.hours_finished,
    'Minutes to Finish': game.mins_finished,
    'Hours to Master': game.hours_mastered,
    'Minutes to Master': game.mins_mastered,
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
export const downloadGameLogDetailsCSV = async (
  data: GameLogDetailsCSV[],
  filename: string = 'games.csv',
): Promise<void> => {
  // 1. Generate CSV string from the game log details
  const csvString = await getGameLogDetailsCSVString(data);

  // 2. Create a Blob with the correct MIME type
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

  // 3. Create a temporary anchor element to trigger the download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();

  // 4. Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
