import { HltbSearchResponse } from '@globalShared/types/hltb';
import { debugLog } from '@globalShared/utils/debug';

import { searchHltb } from './client';

/**
 * The single operation the background worker exposes, plus the two guards that make it
 * safe to call once per game card on a page holding hundreds of them:
 *
 * - a **slot semaphore** capping concurrency and deduplicating identical in-flight titles;
 * - a **circuit breaker** that stops calling HowLongToBeat at all once it is clearly down.
 *
 * It never throws. Every outcome is a settled, typed response, so no badge can be left
 * waiting on a promise that never resolves.
 */

const MAX_CONCURRENT_REQUESTS = 3;
const MIN_DISPATCH_INTERVAL_MS = 150;

const FAILURE_THRESHOLD = 3;
const BASE_COOLDOWN_MS = 5 * 60 * 1000;
const MAX_COOLDOWN_MS = 60 * 60 * 1000;

const waiting: (() => void)[] = [];
const inFlightByTitle = new Map<string, Promise<HltbSearchResponse>>();

let activeCount = 0;
let nextDispatchAt = 0;

let consecutiveFailures = 0;
let cooldownMs = BASE_COOLDOWN_MS;
let openUntil = 0;

const delay = async (ms: number) =>
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Takes one of {@link MAX_CONCURRENT_REQUESTS} slots, then staggers the dispatch. The next
 * instant is reserved up front, so callers starting together each claim a distinct one
 * instead of all computing the same gap and firing at once.
 */
const acquireSlot = async () => {
  if (activeCount >= MAX_CONCURRENT_REQUESTS) {
    await new Promise<void>((resolve) => waiting.push(resolve));
  } else {
    activeCount += 1;
  }

  const waitMs = Math.max(nextDispatchAt - Date.now(), 0);
  nextDispatchAt = Date.now() + waitMs + MIN_DISPATCH_INTERVAL_MS;

  if (waitMs > 0) await delay(waitMs);
};

/** Hands the slot straight to the next waiter, so the cap can never be exceeded. */
const releaseSlot = () => {
  const next = waiting.shift();

  if (next) next();
  else activeCount -= 1;
};

/**
 * Opens after {@link FAILURE_THRESHOLD} consecutive failures and backs off exponentially
 * while the service stays down. The first request after a cooldown is the half-open probe.
 */
const recordFailure = () => {
  consecutiveFailures += 1;
  if (consecutiveFailures < FAILURE_THRESHOLD) return;

  debugLog('service', 'circuit opening', { cooldownMs });
  openUntil = Date.now() + cooldownMs;
  cooldownMs = Math.min(cooldownMs * 2, MAX_COOLDOWN_MS);
  consecutiveFailures = 0;
};

const recordSuccess = () => {
  consecutiveFailures = 0;
  cooldownMs = BASE_COOLDOWN_MS;
  openUntil = 0;
};

/** HowLongToBeat's own client splits the query on whitespace; mirror that exactly. */
const toSearchTerms = (title: string) =>
  title.normalize('NFKC').trim().split(/\s+/).filter(Boolean);

/**
 * Never rejects: a badge awaiting a rejected promise would wait forever, which is exactly
 * the permanent "Loading..." the reference extension is criticised for.
 */
const runQueued = async (
  searchTerms: string[],
): Promise<HltbSearchResponse> => {
  await acquireSlot();

  try {
    const result = await searchHltb(searchTerms);

    if (result.status !== 'ok') {
      recordFailure();
      debugLog('service', 'search failed', { reason: result.status });
      return { reason: 'network', status: 'unavailable' };
    }

    recordSuccess();
    return { games: result.games, status: 'ok' };
  } catch {
    recordFailure();
    return { reason: 'network', status: 'unavailable' };
  } finally {
    releaseSlot();
  }
};

export const searchGames = async (
  title: string,
): Promise<HltbSearchResponse> => {
  const searchTerms = toSearchTerms(title);
  if (searchTerms.length === 0) return { games: [], status: 'ok' };

  if (Date.now() < openUntil) {
    debugLog('service', 'circuit open, refusing without a request', { title });
    return { reason: 'service-unavailable', status: 'unavailable' };
  }

  // The same game can appear several times on one page; the later callers await the first.
  const key = searchTerms.join(' ').toLowerCase();
  const inFlight = inFlightByTitle.get(key);
  if (inFlight) return await inFlight;

  const request = runQueued(searchTerms);
  inFlightByTitle.set(key, request);

  try {
    return await request;
  } finally {
    inFlightByTitle.delete(key);
  }
};

/** Test-only: returns the queue and the breaker to their initial state. */
export const resetHltbService = () => {
  waiting.length = 0;
  inFlightByTitle.clear();
  activeCount = 0;
  nextDispatchAt = 0;
  consecutiveFailures = 0;
  cooldownMs = BASE_COOLDOWN_MS;
  openUntil = 0;
};
