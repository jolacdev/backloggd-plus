import { isProfileGamesPage } from './url';

const setPathname = (pathname: string) => {
  window.history.replaceState({}, '', pathname);
};

describe('isProfileGamesPage', () => {
  // Sort and filter segments are freeform and Backloggd adds more over time, so the
  // predicate matches on the route prefix rather than enumerating them.
  it.each([
    '/u/someone/games/',
    '/u/someone/games/added/type:played/',
    '/u/someone/games/added/type:played;played_year:2025/',
    '/u/someone/games/time_finish/',
    '/u/someone/games/time_finish/type:played;played_year:2025/',
  ])('matches %s', (pathname) => {
    setPathname(pathname);

    expect(isProfileGamesPage()).toBe(true);
  });

  it.each([
    '/u/someone/',
    '/u/someone/reviews/',
    '/games/hollow-knight/',
    '/settings/data/',
    '/',
  ])('does not match %s', (pathname) => {
    setPathname(pathname);

    expect(isProfileGamesPage()).toBe(false);
  });
});
