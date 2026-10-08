import { HltbSearchResponse } from '@globalShared/hltb';
import { hltbSettingsStorageItem } from '@globalShared/storage';

import {
  getBlockedUntil,
  readCache,
  setBlockedUntil,
  writeCache,
} from './cache';
import { searchHltb } from './client';

const MIN_DISPATCH_INTERVAL_MS = 1000;
const BASE_COOLDOWN_MS = 5 * 60 * 1000;
const MAX_COOLDOWN_MS = 60 * 60 * 1000;
const inFlightByTitle = new Map<string, Promise<HltbSearchResponse>>();
let queue = Promise.resolve();
let nextDispatchAt = 0;
let consecutiveFailures = 0;
let cooldownMs = BASE_COOLDOWN_MS;

const unavailable = (
  reason: 'network' | 'service-unavailable',
  retryAt = 0,
): HltbSearchResponse => ({
  reason,
  retryAt: retryAt > Date.now() ? retryAt : Date.now() + 60_000,
  status: 'unavailable',
});

const cannotDispatch = async () => {
  const settings = await hltbSettingsStorageItem.getValue();
  const blockedUntil = await getBlockedUntil();
  return !settings.isEnabled || Date.now() < blockedUntil
    ? unavailable('service-unavailable', blockedUntil)
    : null;
};

/** Open immediately on 429 or a failed recovery probe, otherwise after three failures. */
const recordFailure = async (immediate: boolean, retryAt = 0) => {
  consecutiveFailures += 1;
  if (!immediate && consecutiveFailures < 3) return;
  const deadline = Math.max(Date.now() + cooldownMs, retryAt);
  cooldownMs = Math.min(cooldownMs * 2, MAX_COOLDOWN_MS);
  consecutiveFailures = 0;
  await setBlockedUntil(deadline).catch(() => undefined);
};

/** Cache reset allows another attempt without disturbing running work. */
export const resetHltbFailures = () => {
  consecutiveFailures = 0;
  cooldownMs = BASE_COOLDOWN_MS;
};

const runQueued = async (
  terms: string[],
  key: string,
  revision: number,
): Promise<HltbSearchResponse> => {
  let isProbe = false;
  try {
    const refused = await cannotDispatch();
    if (refused) return refused;
    const wait = Math.max(nextDispatchAt - Date.now(), 0);
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
    // A reset, disabled preference, or cooldown may have arrived during the wait.
    const refusedAfterWait = await cannotDispatch();
    if (refusedAfterWait) return refusedAfterWait;
    nextDispatchAt = Date.now() + MIN_DISPATCH_INTERVAL_MS;
    isProbe = (await getBlockedUntil()) > 0;
    const result = await searchHltb(terms);
    const isCurrent = (await readCache(key)).revision === revision;
    if (result.status !== 'ok') {
      if (isCurrent) {
        await recordFailure(
          isProbe || result.status === 'rate-limited',
          result.status === 'rate-limited' ? result.retryAt : undefined,
        );
      }
      return unavailable('network', await getBlockedUntil());
    }
    if (isCurrent) {
      resetHltbFailures();
      if (isProbe) await setBlockedUntil(0).catch(() => undefined);
    }
    await writeCache(
      key,
      { games: result.games, kind: 'search' },
      revision,
    ).catch(() => undefined);
    return { games: result.games, status: 'ok' };
  } catch {
    if ((await readCache(key)).revision === revision) {
      await recordFailure(isProbe);
    }
    return unavailable('network', await getBlockedUntil());
  }
};

/** Serialize and deduplicate network lookups across tabs; cached searches stay immediate. */
export const searchGames = async (
  title: string,
): Promise<HltbSearchResponse> => {
  const terms = title.normalize('NFKC').trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return { games: [], status: 'ok' };
  const key = `search:${terms.join(' ').toLowerCase()}`;
  const cached = await readCache(key);
  if (cached.value?.kind === 'search') {
    return { games: cached.value.games, status: 'ok' };
  }
  const blockedUntil = await getBlockedUntil();
  if (Date.now() < blockedUntil) {
    return unavailable('service-unavailable', blockedUntil);
  }
  const flightKey = `${cached.revision}:${key}`;
  const existing = inFlightByTitle.get(flightKey);
  if (existing) return await existing;
  const request = queue.then(
    async () => await runQueued(terms, key, cached.revision),
  );
  queue = request.then(
    () => undefined,
    () => undefined,
  );
  inFlightByTitle.set(flightKey, request);
  try {
    return await request;
  } finally {
    inFlightByTitle.delete(flightKey);
  }
};

/** Test helper: reset the queue while leaving persisted values intact. */
export const resetHltbService = () => {
  queue = Promise.resolve();
  inFlightByTitle.clear();
  nextDispatchAt = 0;
  resetHltbFailures();
};
