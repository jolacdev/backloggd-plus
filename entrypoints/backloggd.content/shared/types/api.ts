/**
 * Source: GET /u/:username/games/ (text/html)
 *
 * Parsed data scraped from the HTML profile games page.
 *
 * ⚠️ Internal, undocumented, and subject to breakage.
 */
export type ProfileGamesPageResponseScrape = {
  games: ProfileGameResponseScrape[];
  totalGames: number;
};

type ProfileGameResponseScrape = {
  id: string; // .card[game_id]
  name: string; // .card .game-text-centered || .card img.card-img
  rating?: string; // .card[data-rating]
  // Other fields exist but are unreliable/deprecated like #preloaded-log-<game_id>, status , isLiked, etc.
};

/**
 * Source: GET /log/edit/:gameId (application/json)
 *
 * JSON response from Backloggd internal, undocumented endpoint.
 *
 * ⚠️ Internal, undocumented, and subject to breakage.
 */
export type GameLogDetailsResponse = {
  playthroughs: PlaythroughResponse[];
  game_log?: GameLogResponse;
};

type GameLogResponse = {
  id: number;
  avg_finish_time: null | unknown; // TODO: Check
  avg_master_time: null | unknown; // TODO: Check
  game_liked: boolean;
  is_backlog: boolean;
  is_play: boolean;
  is_playing: boolean;
  is_wishlist: boolean;
  override_cover_id: null | unknown; // unknown = number?
  rating: number; // Defaults to 0.
  status: string; // "completed" || ... // TODO: Check
  time_entries_editions: unknown[]; // TODO: Check
  time_source: number; // TODO: Check if nullable.
  total_hours: number; // Defaults to 0.
  total_minutes: number; // Defaults to 0.
};

type PlaythroughResponse = {
  id: number;
  created_at: string;
  edition_id: null | unknown; // unknown = number?
  finish_date: string;
  hours_finished: number;
  hours_mastered: number;
  hours_played: number;
  is_master: boolean;
  is_replay: boolean;
  medium_id: number;
  mins_finished: number;
  mins_mastered: number;
  mins_played: number;
  platform: number; // TODO: Check if nullable.
  play_dates: PlayDate[];
  played_platform: number; // TODO: Check if nullable.
  rating: number;
  review: string;
  review_spoilers: boolean;
  start_date: string;
  storefront_id: null | unknown; // unknown = number?
  sync_sessions: boolean;
  title: string;
  updated_at: string;
};

type PlayDate = {
  id: number;
  edited: boolean;
  finish_date: null | string;
  hours: number;
  minutes: number;
  note: string;
  privacy: null | unknown; // TODO: Check
  range_end_date: string;
  range_start_date: string;
  start_date: null | string;
  status: null | unknown; // TODO: Check
  tags: unknown[];
};
