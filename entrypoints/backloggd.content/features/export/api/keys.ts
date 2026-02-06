export const queryKeys = {
  gameLogDetails: (gameId: string) => ['gameLogDetails', gameId] as const,
  profileGamesPage: (username: string, pageNumber: number) =>
    ['profileGamesPage', username, pageNumber] as const,
};
