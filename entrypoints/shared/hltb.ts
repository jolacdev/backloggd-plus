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
  /** Worldwide release year, used to distinguish same-title releases. */
  year?: number;
};

export type HltbMatchedEntry = HltbGame & {
  status: 'matched';
};

/**
 * A persisted resolution. Only settled outcomes are stored — a transport failure must
 * never be cached as a permanent negative match.
 */
export type HltbCacheEntry = HltbMatchedEntry | { status: 'no-match' };

/** Temporary failures carry a deadline so visible cards can recover without a reload. */
export type HltbResolution =
  | HltbCacheEntry
  | { retryAt: number; status: 'unavailable' };

export type HltbCacheValue =
  | { entry: HltbCacheEntry; kind: 'resolution' }
  | { games: HltbGame[]; kind: 'search' }
  | { kind: 'year'; year: null | number };

export type HltbCacheState = {
  blockedUntil: number;
  entries: Record<string, HltbCacheValue>;
  revision: number;
};

export type HltbCacheRead = {
  revision: number;
  value: HltbCacheValue | null;
};

export type HltbRequest =
  | {
      key: string;
      revision: number;
      type: 'hltb:cache:set';
      value: HltbCacheValue;
    }
  | { key: string; type: 'hltb:cache:get' }
  | { title: string; type: 'hltb:search' }
  | { type: 'hltb:cache:clear' };

export type HltbSettings = {
  defaultCategory: HltbCategory;
  isEnabled: boolean;
};

/**
 * The background worker never rejects — it always resolves with one of these, so the
 * content script has no unhandled-rejection paths and no way to get stuck loading.
 */
export type HltbSearchResponse =
  | { games: HltbGame[]; status: 'ok' }
  | {
      reason: 'network' | 'service-unavailable';
      status: 'unavailable';
      retryAt?: number;
    };

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

export const isHltbGame = (value: unknown): value is HltbGame => {
  if (!isRecord(value) || !isRecord(value.times)) return false;
  const { times } = value;
  return (
    Number.isSafeInteger(value.hltbId) &&
    isPositiveNumber(value.hltbId) &&
    typeof value.name === 'string' &&
    value.name.length > 0 &&
    (value.alias === undefined || typeof value.alias === 'string') &&
    (value.year === undefined || isPositiveNumber(value.year)) &&
    HLTB_CATEGORIES.every(
      (category) =>
        times[category] === null || isPositiveNumber(times[category]),
    )
  );
};

/** Reject malformed storage and messages before they reach matching or rendering. */
export const isHltbCacheValue = (value: unknown): value is HltbCacheValue => {
  if (!isRecord(value)) return false;
  if (value.kind === 'year') {
    return value.year === null || isPositiveNumber(value.year);
  }
  if (value.kind === 'search') {
    return (
      Array.isArray(value.games) &&
      value.games.length <= 100 &&
      value.games.every(isHltbGame)
    );
  }
  if (value.kind !== 'resolution' || !isRecord(value.entry)) return false;
  return (
    value.entry.status === 'no-match' ||
    (value.entry.status === 'matched' && isHltbGame(value.entry))
  );
};
