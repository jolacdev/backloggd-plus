import { QueryClient } from '@tanstack/react-query';

import { api } from '@content/lib/axios';
import {
  HltbCacheEntry,
  HltbCacheRead,
  HltbRequest,
  HltbResolution,
  HltbSearchResponse,
} from '@globalShared/hltb';
import { logger } from '@globalShared/logger';

import { matchByTitle, matchByYear, normalizeTitle } from './match';
import { GameCardMeta } from './useGameCards';

// Replies come from our worker; raw HLTB data and persisted values are validated there.
const sendRequest = async <T>(
  request: HltbRequest,
  fallback: T,
): Promise<T> => {
  try {
    return (await browser.runtime.sendMessage(request)) ?? fallback;
  } catch {
    return fallback;
  }
};

const readCache = async (key: string) =>
  await sendRequest<HltbCacheRead>(
    { key, type: 'hltb:cache:get' },
    { revision: -1, value: null },
  );

const search = async (title: string) =>
  await sendRequest<HltbSearchResponse>(
    { title, type: 'hltb:search' },
    { reason: 'service-unavailable', status: 'unavailable' },
  );

/** Cards carry play dates, so ambiguous titles need the release year from the game page. */
const getGameReleaseYear = async (queryClient: QueryClient, slug: string) => {
  if (!slug) return undefined;
  try {
    return (
      (await queryClient.fetchQuery({
        gcTime: Infinity,
        queryKey: ['hltbGameReleaseYear', slug],
        retry: false,
        staleTime: Infinity,
        queryFn: async () => {
          const key = `year:${slug}`;
          const cached = await readCache(key);
          if (cached.value?.kind === 'year') return cached.value.year;
          const html = await api.get<string>(
            `/games/${encodeURIComponent(slug)}/`,
            { timeout: 10_000 },
          );
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const date = doc.querySelector('a.game-year');
          // A challenge or sign-in page is not evidence of a missing release year.
          if (!doc.querySelector('h1') || !date) {
            throw new Error('Missing game release date');
          }
          const parsed = Number.parseInt(date.textContent ?? '', 10);
          const year = Number.isFinite(parsed) ? parsed : null;
          await sendRequest(
            {
              key,
              revision: cached.revision,
              type: 'hltb:cache:set',
              value: { kind: 'year', year },
            },
            undefined,
          );
          return year;
        },
      })) ?? undefined
    );
  } catch {
    return undefined;
  }
};

const unavailable = (retryAt = Date.now() + 60_000): HltbResolution => ({
  retryAt,
  status: 'unavailable',
});

/** Title match → release-year tiebreak → saved decision. Temporary failures stay retryable. */
const getHltbResolution = async (
  meta: GameCardMeta,
  queryClient: QueryClient,
): Promise<HltbResolution> => {
  const key = `resolution:${meta.igdbId}`;
  const cached = await readCache(key);
  if (cached.value?.kind === 'resolution') {
    return cached.value.entry;
  }
  const result = await search(meta.title);
  if (result.status !== 'ok') return unavailable(result.retryAt);
  let outcome = matchByTitle(meta.title, result.games);
  const normalized = normalizeTitle(meta.title);
  if (
    outcome.status === 'no-match' &&
    normalized &&
    normalized !== meta.title.toLowerCase().trim().replace(/\s+/g, ' ')
  ) {
    const fallback = await search(normalized);
    if (fallback.status !== 'ok') return unavailable(fallback.retryAt);
    outcome = matchByTitle(meta.title, fallback.games);
  }
  if (outcome.status === 'needs-year') {
    const year = await getGameReleaseYear(queryClient, meta.slug);
    if (year === undefined) return unavailable();
    outcome = matchByYear(outcome.candidates, year);
  }
  const entry: HltbCacheEntry =
    outcome.status === 'matched'
      ? { ...outcome.game, status: 'matched' }
      : { status: 'no-match' };
  await sendRequest(
    {
      key,
      revision: cached.revision,
      type: 'hltb:cache:set',
      value: { entry, kind: 'resolution' },
    },
    undefined,
  );
  return entry;
};

/** Report games without estimates through the extension-wide, opt-in logger. */
export const resolveHltbGame = async (
  meta: GameCardMeta,
  queryClient: QueryClient,
): Promise<HltbResolution> => {
  const resolution = await getHltbResolution(meta, queryClient);
  if (resolution.status !== 'matched') {
    logger.error(`No HLTB estimate for "${meta.title}"`, {
      ...meta,
      ...resolution,
    });
  }
  return resolution;
};
