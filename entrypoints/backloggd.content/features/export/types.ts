/* eslint-disable perfectionist/sort-object-types */
import {
  GameLogDetailsResponse,
  ProfileGameScrapeResponse,
} from '@content/shared/types/api';

/**
 * This type is used to provide comprehensive details about each game in the user's backlog.
 *
 * It includes all the attributes from both request responses {@link ProfileGameScrapeResponse} and {@link GameLogDetailsResponse}
 */
export type GameDetails = ProfileGameScrapeResponse & GameLogDetailsResponse;

/**
 * This type defines the data for the CSV export format.
 */
export type GameDetailsCSV = {
  // GET - Profile Games Page
  id: number;
  name: string;
  url: string;

  // GET - Game Log Details
  // Attributes from `game_log`
  // --- Status ---
  is_play: boolean;
  is_playing: boolean;
  is_backlog: boolean;
  is_wishlist: boolean;
  // --- Flags ---
  game_liked: boolean;
  // Attributes from `playthroughs[0]`
  // --- Time Played ---
  hours_played: number;
  mins_played: number;
  hours_finished: number;
  mins_finished: number;
  hours_mastered: number;
  mins_mastered: number;
  // --- Dates ---
  start_date: string;
  finish_date: string;
  // --- Flags ---
  is_master: boolean;
  is_replay: boolean;
  // --- Review ---
  rating: number;
  review: string;
  review_spoilers: boolean;
};

/**
 * This type defines the data for the JSON export format.
 */
export type GameDetailsJSON = Pick<ProfileGameScrapeResponse, 'id' | 'name'> &
  GameLogDetailsResponse;
