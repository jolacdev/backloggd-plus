import { hltbResolutionsStorageItem } from '@globalShared/storage';
import { HltbCacheEntry, HltbCacheMap } from '@globalShared/types/hltb';
import { debugLog } from '@globalShared/utils/debug';

/**
 * Persistent resolution cache, keyed by IGDB game id.
 *
 * Keying on the id rather than the title means two games sharing a name can never share an
 * entry, and the key survives Backloggd renaming a game.
 *
 * The whole map is a single storage value, so writes are batched: persisting per game
 * would re-serialize the entire cache on every match. It is read once into memory at mount
 * and flushed on a debounce.
 */

const MATCHED_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** Shorter, so a game HowLongToBeat adds later is picked up within the week. */
const UNMATCHED_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const MAX_ENTRIES = 5000;
const FLUSH_DEBOUNCE_MS = 2000;
/** A fast scroll can settle more than a debounce window's worth of games at once. */
const FLUSH_THRESHOLD = 25;

let entries: HltbCacheMap = {};
let hasLoaded = false;
let pendingWrites = 0;
let flushTimer: null | ReturnType<typeof setTimeout> = null;

const isEntryFresh = (entry: HltbCacheEntry, now = Date.now()) =>
  now - entry.resolvedAt <
  (entry.status === 'matched' ? MATCHED_TTL_MS : UNMATCHED_TTL_MS);

export const loadResolutionCache = async () => {
  if (hasLoaded) return;

  // NOTE: Copy rather than adopt. When storage holds no value, WXT returns the storage
  // item's `fallback` object *by reference* — the same instance every call — so mutating
  // it in place would corrupt the item's default for the rest of the session and make
  // later reads return data that was never persisted.
  entries = { ...(await hltbResolutionsStorageItem.getValue()) };
  hasLoaded = true;

  debugLog('cache', 'loaded', { entries: Object.keys(entries).length });
};

export const getCachedResolution = (
  igdbId: string,
): HltbCacheEntry | undefined => {
  const entry = entries[igdbId];
  if (!entry) return undefined;
  if (isEntryFresh(entry)) return entry;

  delete entries[igdbId];
  return undefined;
};

const flush = async () => {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = null;

  if (pendingWrites === 0) return;
  pendingWrites = 0;

  // Drop the oldest entries once the cache exceeds its cap.
  const keys = Object.keys(entries);
  if (keys.length > MAX_ENTRIES) {
    keys
      .sort((a, b) => entries[a].resolvedAt - entries[b].resolvedAt)
      .slice(0, keys.length - MAX_ENTRIES)
      .forEach((key) => {
        delete entries[key];
      });
  }

  await hltbResolutionsStorageItem.setValue({ ...entries });
  debugLog('cache', 'flushed', { total: Object.keys(entries).length });
};

/**
 * Records a settled resolution. Only `matched` and `no-match` ever reach here — transport
 * failures are not cached, so a brief outage cannot blank a game for the next 30 days.
 */
export const setCachedResolution = (igdbId: string, entry: HltbCacheEntry) => {
  entries[igdbId] = entry;
  pendingWrites += 1;

  if (pendingWrites >= FLUSH_THRESHOLD) {
    flush();
    return;
  }

  if (!flushTimer) flushTimer = setTimeout(flush, FLUSH_DEBOUNCE_MS);
};

/** Persists anything still buffered. Called when the user leaves the library. */
export const flushResolutionCache = async () => await flush();

/** Test-only: returns the module to its initial state. */
export const resetResolutionCache = () => {
  if (flushTimer) clearTimeout(flushTimer);

  entries = {};
  hasLoaded = false;
  pendingWrites = 0;
  flushTimer = null;
};
