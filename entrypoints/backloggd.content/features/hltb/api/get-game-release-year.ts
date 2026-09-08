import { QueryClient, queryOptions } from '@tanstack/react-query';

import { api } from '@content/lib/axios';

import { parseGamePageReleaseYear } from '../utils/cards';
import { queryKeys } from './keys';

/**
 * Reads a game's release year from its own Backloggd page — a same-origin request that
 * rides the page's existing session, cached forever for the page's lifetime. Only reached
 * when the title cannot decide on its own, because library cards carry no year at all.
 */
const createGameReleaseYearQueryOptions = (slug: string) =>
  queryOptions({
    gcTime: Infinity,
    queryKey: queryKeys.gameReleaseYear(slug),
    // A release year does not change, and a failed lookup should not be retried per card.
    retry: false,
    staleTime: Infinity,
    queryFn: async () => {
      const html = await api.get<string>(`/games/${slug}/`);
      const doc = new DOMParser().parseFromString(html, 'text/html');

      return parseGamePageReleaseYear(doc) ?? null;
    },
  });

/** Resolves to `undefined` on any failure: without a year the match stays unresolved. */
export const getGameReleaseYear = async (
  queryClient: QueryClient,
  slug: string,
) => {
  if (!slug) return undefined;

  try {
    return (
      (await queryClient.fetchQuery(createGameReleaseYearQueryOptions(slug))) ??
      undefined
    );
  } catch {
    return undefined;
  }
};
