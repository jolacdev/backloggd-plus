import { getTotalGamesCount } from './dom';
import { getFilename } from './filename';
import { getPageNumbers, getTotalPages } from './pagination';
import {
  getListPath,
  getListRouteParams,
  getListSlug,
  isCurrentPathname,
} from './url';

describe('isCurrentPathname', () => {
  it('matches only an exact pathname', () => {
    window.history.pushState({}, '', '/settings/data/');

    expect(isCurrentPathname('/settings/data/')).toBe(true);
    expect(isCurrentPathname('/settings/')).toBe(false);
  });
});

describe('getListRouteParams', () => {
  it.each([
    // Pathname, expected slug, expected sort.
    ['/u/forefo8216/list/my-list/', 'my-list', 'user'],
    ['/u/forefo8216/list/my-list', 'my-list', 'user'],
    ['/u/forefo8216/list/my-list/user/detail/', 'my-list', 'user'],
    ['/u/forefo8216/list/my-list/title/grid/', 'my-list', 'title'],
    ['/u/forefo8216/list/my-list/popularity/grid/', 'my-list', 'popularity'],
    // Sort direction rides along in the same segment.
    ['/u/forefo8216/list/my-list/user:asc/grid/', 'my-list', 'user:asc'],
    // A bare display segment is not a sort.
    ['/u/forefo8216/list/my-list/grid/', 'my-list', 'user'],
    ['/u/forefo8216/list/goty-2024/', 'goty-2024', 'user'],
  ])('parses standard list %s', (pathname, slug, sort) => {
    window.history.pushState({}, '', pathname);

    expect(getListRouteParams()).toEqual({
      kind: 'standard',
      slug,
      sort,
      username: 'forefo8216',
    });
  });

  it.each([
    ['/u/forefo8216/list/goty/2025'],
    ['/u/forefo8216/list/goty/2025/'],
  ])('parses GOTY list %s', (pathname) => {
    window.history.pushState({}, '', pathname);

    expect(getListRouteParams()).toEqual({
      kind: 'goty',
      username: 'forefo8216',
      year: '2025',
    });
  });

  it.each([
    ['/u/forefo8216/list/my-list/edit/'],
    ['/u/forefo8216/list/my-list/likes/'],
    ['/u/forefo8216/list/goty/2025/edit/'],
    ['/u/forefo8216/list/goty/'], // The GOTY index needs a year to be a list.
    ['/u/forefo8216/lists/goty/'],
    ['/u/forefo8216/lists/'],
    ['/u/forefo8216/games/'],
    ['/settings/data/'],
    ['/'],
  ])('returns null for %s', (pathname) => {
    window.history.pushState({}, '', pathname);

    expect(getListRouteParams()).toBeNull();
  });
});

describe('getListPath and getListSlug', () => {
  it('addresses a standard list by slug', () => {
    const params = {
      kind: 'standard',
      slug: 'my-list',
      sort: 'user',
      username: 'me',
    } as const;

    expect(getListPath(params)).toBe('/u/me/list/my-list/');
    expect(getListSlug(params)).toBe('my-list');
  });

  it('addresses a GOTY list by year', () => {
    const params = { kind: 'goty', username: 'me', year: '2025' } as const;

    expect(getListPath(params)).toBe('/u/me/list/goty/2025/');
    expect(getListSlug(params)).toBe('goty-2025');
  });
});

describe('getFilename', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 8)); // Local time: 2026-09-08
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the single-part shape used by the game export', () => {
    expect(getFilename('csv', 'forefo8216')).toBe(
      'backloggd-forefo8216-2026-09-08.csv',
    );
    expect(getFilename('json', 'forefo8216')).toBe(
      'backloggd-forefo8216-2026-09-08.json',
    );
  });

  it('joins several parts in order', () => {
    expect(getFilename('csv', 'forefo8216', 'my-unranked-list')).toBe(
      'backloggd-forefo8216-my-unranked-list-2026-09-08.csv',
    );
  });

  it('drops absent and empty parts', () => {
    expect(getFilename('csv')).toBe('backloggd-2026-09-08.csv');
    expect(getFilename('csv', undefined, 'my-list')).toBe(
      'backloggd-my-list-2026-09-08.csv',
    );
  });

  it('strips characters that are invalid in filenames', () => {
    expect(getFilename('csv', 'us er/name', 'a:list*')).toBe(
      'backloggd-username-alist-2026-09-08.csv',
    );
  });
});

describe('getTotalGamesCount', () => {
  const parse = (html: string) =>
    getTotalGamesCount(new DOMParser().parseFromString(html, 'text/html'));

  it('reads the first "N Games" counter on the page', () => {
    expect(parse('<p class="subtitle-text">21 Games •</p>')).toBe(21);
  });

  it('ignores unrelated subtitles', () => {
    expect(
      parse(
        '<p class="subtitle-text">Updated 1 min ago</p><p class="subtitle-text">3 Games</p>',
      ),
    ).toBe(3);
  });

  it('returns 0 when the counter is missing', () => {
    expect(parse('<p class="subtitle-text">No counter</p>')).toBe(0);
  });
});

describe('getTotalPages', () => {
  it('divides the total by the page size, rounding up', () => {
    expect(getTotalPages(100, 75)).toBe(2);
    expect(getTotalPages(21, 21)).toBe(1);
  });

  it('returns 0 when either input is empty', () => {
    // Regression: an empty library used to resolve to 1 page and hang the export.
    expect(getTotalPages(0, 75)).toBe(0);
    expect(getTotalPages(100, 0)).toBe(0);
  });
});

describe('getPageNumbers', () => {
  it('builds a 1-based sequence', () => {
    expect(getPageNumbers(3)).toEqual([1, 2, 3]);
    expect(getPageNumbers(0)).toEqual([]);
  });
});
