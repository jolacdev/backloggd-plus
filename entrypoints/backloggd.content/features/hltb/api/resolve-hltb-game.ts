import { QueryClient } from '@tanstack/react-query';

import { HltbCacheEntry } from '@globalShared/types/hltb';
import { debugLog } from '@globalShared/utils/debug';

import { GameCardMeta } from '../types';
import { matchByTitle, matchByYear } from '../utils/match';
import { setCachedResolution } from './cache';
import { getGameReleaseYear } from './get-game-release-year';
import { searchHltbGames } from './search-hltb-games';

/**
 * The resolution pipeline for one Backloggd game:
 *
 * ```
 * HowLongToBeat search → title match → (year tiebreak, only if ambiguous) → cache
 * ```
 *
 * Returns `null` when the outcome is not a settled fact — a network failure, an open
 * circuit breaker, an asleep worker. Those are never cached and never rendered, so the
 * failure mode is a plain Backloggd card rather than a broken-looking badge.
 */
export const resolveHltbGame = async (
  meta: GameCardMeta,
  queryClient: QueryClient,
): Promise<HltbCacheEntry | null> => {
  const search = await searchHltbGames(meta.title);

  if (search.status !== 'ok') {
    // Not a fact about the game — never cached, so it retries on the next visit.
    debugLog('resolve', 'unavailable, leaving unresolved', {
      reason: search.reason,
      title: meta.title,
    });
    return null;
  }

  let outcome = matchByTitle(meta.title, search.games);

  if (outcome.status === 'needs-year') {
    const year = await getGameReleaseYear(queryClient, meta.slug);
    outcome = matchByYear(outcome.candidates, year);
  }

  const entry: HltbCacheEntry =
    outcome.status === 'matched'
      ? {
          hltbId: outcome.game.hltbId,
          name: outcome.game.name,
          resolvedAt: Date.now(),
          status: 'matched',
          times: outcome.game.times,
          ...(outcome.game.year === undefined
            ? {}
            : { year: outcome.game.year }),
        }
      : { resolvedAt: Date.now(), status: 'no-match' };

  debugLog('resolve', 'settled', { entry, title: meta.title });
  setCachedResolution(meta.igdbId, entry);

  return entry;
};
