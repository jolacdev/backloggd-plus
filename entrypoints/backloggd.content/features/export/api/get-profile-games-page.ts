import { queryOptions, UseQueryOptions } from '@tanstack/react-query';

import { api } from '@content/lib/axios';
import { ProfileGamesPageScrapeResponse } from '@content/shared/types/api';
import {
  StatusFiltersState,
  StatusKey,
} from '@globalShared/hooks/useStatusFilters';

import { queryKeys } from './keys';

const createFetchProfileGamesPageUrl = (
  username: string,
  selectedStatuses: StatusFiltersState,
) => {
  // Extract keys where the value is true (e.g., ['played', 'backlog'])
  const activeStatuses = Object.keys(selectedStatuses).filter(
    (key) => selectedStatuses[key as StatusKey],
  );

  if (activeStatuses.length === 0) return `/u/${username}/games`;

  return `/u/${username}/games/added/type:${activeStatuses.join(',')}/`;
};

/**
 * Fetches a user's profile games page and returns the parsed HTML document.
 */
const fetchProfileGamesPage = async (
  username: string,
  pageNumber: number,
  selectedStatuses: StatusFiltersState,
): Promise<Document> => {
  try {
    const url = createFetchProfileGamesPageUrl(username, selectedStatuses);
    const result = await api.get<string>(url, {
      params: { page: pageNumber },
    });

    const parser = new DOMParser();
    return parser.parseFromString(result, 'text/html');
  } catch (error) {
    console.error(`Failed to fetch page ${pageNumber} for user ${username}`);
    throw error;
  }
};

const getTotalGamesCount = (doc: Document): number => {
  const totalGamesByStatusElement = [
    ...doc.querySelectorAll('.subtitle-text'),
  ].find((el) => el.textContent?.includes('Games'));

  if (!totalGamesByStatusElement) return 0;

  const match = totalGamesByStatusElement.textContent.match(/(\d+)\s+Games/);
  return match ? parseInt(match[1], 10) : 0;
};

const parseProfileGamesPage = (
  doc: Document,
): ProfileGamesPageScrapeResponse => {
  const gameCards = [
    ...doc.querySelectorAll('#user-games-library-container .card.game-cover'),
  ];

  const scrapedGames: ProfileGamesPageScrapeResponse['games'] = gameCards.map(
    (card) => {
      const id = card.getAttribute('game_id')!; // Attribute game_id should always exist.
      const name =
        card.querySelector('.game-text-centered')?.textContent?.trim() ?? '';
      const path = card.querySelector('a.cover-link')?.getAttribute('href');
      const url = path ? `https://backloggd.com${path}` : '';
      const rating = card.getAttribute('data-rating') || undefined;

      return { id, name, rating, url };
    },
  );
  const totalGames = getTotalGamesCount(doc);

  return {
    games: scrapedGames,
    totalGames,
  };
};

type ProfileGamesPageParams = {
  pageNumber: number;
  selectedStatuses: StatusFiltersState;
  username: string;
};

export const createProfileGamesPageQueryOptions = <
  TError = Error,
  TData = ProfileGamesPageScrapeResponse,
>(
  { pageNumber, selectedStatuses, username }: ProfileGamesPageParams,
  options?: Omit<
    UseQueryOptions<Document, TError, TData>,
    'queryFn' | 'queryKey' | 'select'
  >,
) =>
  queryOptions({
    ...options,
    queryKey: queryKeys.profileGamesPage(username, pageNumber),
    queryFn: () =>
      fetchProfileGamesPage(username, pageNumber, selectedStatuses),
    select: (data) => parseProfileGamesPage(data),
  });
