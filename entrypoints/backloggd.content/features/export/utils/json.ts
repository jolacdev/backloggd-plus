import { GameDetails, GameDetailsJSON } from '../types';
import { triggerBlobDownload } from './download';

/**
 * Transforms a {@link GameDetails} object into a {@link GameDetailsJSON}.
 */
export const parseToGameDetailsJSON = ({
  rating,
  url,
  ...rest
}: GameDetails): GameDetailsJSON => rest;

/**
 * Serialises the raw game log detail responses to JSON and triggers a browser download.
 * @param data - Array of raw game log detail responses (unmerged/untransformed).
 * @param filename - The filename for the downloaded JSON file.
 */
export const downloadGameDetailsJSON = (
  data: GameDetailsJSON[],
  filename: string = 'games.json',
): void => {
  const jsonString = JSON.stringify(data, null, 2);
  triggerBlobDownload(jsonString, filename, 'application/json;charset=utf-8;');
};
