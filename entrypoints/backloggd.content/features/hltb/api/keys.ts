export const queryKeys = {
  gameReleaseYear: (slug: string) => ['hltbGameReleaseYear', slug] as const,
  resolution: (igdbId: string) => ['hltbResolution', igdbId] as const,
};
