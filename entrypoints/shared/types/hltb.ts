/**
 * The contract between the background worker (which talks to HowLongToBeat) and the
 * content script (which renders the badges).
 *
 * HowLongToBeat's raw wire format never crosses this boundary — it stays inside
 * `@background/hltb/client`, so a rotation there never reaches the Backloggd side.
 */

export const HLTB_CATEGORIES = ['main', 'plus', 'hundred', 'all'] as const;

/** `main` Main Story · `plus` Main + Extra · `hundred` Completionist · `all` All Styles. */
export type HltbCategory = (typeof HLTB_CATEGORIES)[number];

/** Completion times in **seconds**. `null` when HowLongToBeat has no data. */
export type HltbTimes = Record<HltbCategory, null | number>;

export type HltbGame = {
  hltbId: number;
  name: string;
  times: HltbTimes;
  /** Alternate title. Sometimes a comma-separated LIST rather than a single name. */
  alias?: string;
  /** Worldwide release year. The only reliable way to separate same-titled games. */
  year?: number;
};

export type HltbMatchedEntry = {
  hltbId: number;
  name: string;
  resolvedAt: number;
  status: 'matched';
  times: HltbTimes;
  year?: number;
};

/**
 * A persisted resolution. Only settled outcomes are stored — a transport failure must
 * never be cached, or a brief HowLongToBeat outage would blank a game for weeks.
 */
export type HltbCacheEntry =
  | HltbMatchedEntry
  | { resolvedAt: number; status: 'no-match' };

/** Keyed by Backloggd's `game_id` attribute, which is the IGDB game id. */
export type HltbCacheMap = Record<string, HltbCacheEntry>;

export type HltbSettings = {
  defaultCategory: HltbCategory;
  isEnabled: boolean;
};

export const HLTB_SEARCH_MESSAGE_TYPE = 'hltb:search';

export type HltbSearchRequest = {
  title: string;
  type: typeof HLTB_SEARCH_MESSAGE_TYPE;
};

/**
 * The background worker never rejects — it always resolves with one of these, so the
 * content script has no unhandled-rejection paths and no way to get stuck loading.
 */
export type HltbSearchResponse =
  | { games: HltbGame[]; status: 'ok' }
  | { reason: 'network' | 'service-unavailable'; status: 'unavailable' };
