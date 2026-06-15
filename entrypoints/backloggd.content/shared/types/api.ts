/**
 * Source: GET /u/:username/games/ (text/html)
 *
 * Parsed data scraped from the HTML profile games page.
 *
 * ⚠️ Internal, undocumented, and subject to breakage.
 */
export type ProfileGamesPageScrapeResponse = {
  games: ProfileGameScrapeResponse[];
  totalGames: number;
};

export type ProfileGameScrapeResponse = {
  id: string; // .card[game_id]
  name: string; // .card .game-text-centered || .card img.card-img
  url: string; // https://backloggd.com + .card a.cover-link (href)
  rating?: string; // .card[data-rating]
  // Other fields exist but are unreliable/deprecated like #preloaded-log-<game_id>, status , isLiked, etc.
};

/**
 * Source: GET /log/edit/:gameId (application/json)
 *
 * JSON response from Backloggd internal, undocumented endpoint.
 *
 * ⚠️ Internal, undocumented, and subject to breakage.
 *
 * A non-logged game returns empty defaults (`game_log` is omitted):
 * @example
 * ```json
 * { "most_recent_playthrough_id": null, "playthroughs": {} }
 * ```
 */
export type GameLogDetailsResponse = {
  most_recent_playthrough_id: null | number;
  playthroughs: Record<string, PlaythroughResponse>; // Keyed by playthrough id.
  game_log?: GameLogResponse;
};

type GameLogResponse = {
  id: number; // Default to generated id.
  avg_finish_time: null | number;
  avg_master_time: null | number;
  game_liked: boolean;
  is_backlog: boolean;
  is_play: boolean;
  is_playing: boolean;
  is_wishlist: boolean;
  last_edited_at: null | unknown; // Unable to verify `unknown` type.
  override_cover_id: null | number;
  rating: number;
  status: string; // Appears always as "completed". Can be ignored.
  time_entries_editions: unknown[]; // Unable to verify `unknown` type.
  time_source: number; // Default 1.
  total_hours: number;
  total_minutes: number;
};

type PlaythroughResponse = {
  id: number; // Default to generated id.
  created_at: string; // Defaults to date string.
  edition_id: null | number;
  edition_type: null | unknown; // Unable to verify `unknown` type.
  finish_date: null | string;
  hours_finished: number;
  hours_mastered: number;
  hours_played: number;
  is_master: boolean;
  is_replay: boolean;
  medium_id: null | number;
  mins_finished: number;
  mins_mastered: number;
  mins_played: number;
  platform: null | number;
  play_dates: PlayDate[];
  played_platform: null | number;
  rating: number;
  review: string;
  review_spoilers: boolean;
  start_date: null | string;
  storefront_id: null | unknown; // Unable to verify `unknown` type, probably `number`.
  sync_sessions: boolean; // Default true.
  title: string;
  updated_at: string; // Defaults to date string.
};

type PlayDate = {
  id: number; // Default to generated id.
  edited: boolean;
  finish_date: null | string;
  hours: number;
  minutes: number;
  note: string;
  privacy: null | number;
  range_end_date: string; // Defaults to date string (YYYY-MM-DD).
  range_start_date: string; // Defaults to date string (YYYY-MM-DD).
  start_date: null | string;
  status: null | unknown; // Unable to verify `unknown` type.
  tags: string[];
};
