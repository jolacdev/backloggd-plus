/**
 * Matches every variant of a user's library page — `/u/:username/games/` plus any sort or
 * filter segments, which are freeform and grow over time, so this matches on the route
 * prefix rather than enumerating them. Works for any profile, logged in or not.
 */
const PROFILE_GAMES_PATHNAME_PATTERN = /^\/u\/[^/]+\/games(?:\/.*)?$/;

export const isCurrentPathname = (pathname: string) =>
  location.pathname === pathname;

export const isProfileGamesPage = () =>
  PROFILE_GAMES_PATHNAME_PATTERN.test(location.pathname);
