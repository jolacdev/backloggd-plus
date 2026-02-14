/* eslint-disable perfectionist/sort-object-types */
export type GameLogDetailsCSV = {
  // GET - Profile Games Page
  id: number;
  name: string;
  backloggd_url: string; // https://backloggd.com + `path`

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
