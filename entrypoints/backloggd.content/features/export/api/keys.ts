import { StatusFiltersState } from '@globalShared/hooks/useStatusFilters';

export const queryKeys = {
  gameLogDetails: (gameId: string) => ['gameLogDetails', gameId] as const,
  profileGamesPage: (
    username: string,
    pageNumber: number,
    selectedStatuses: StatusFiltersState,
  ) => ['profileGamesPage', username, pageNumber, selectedStatuses] as const,
};
