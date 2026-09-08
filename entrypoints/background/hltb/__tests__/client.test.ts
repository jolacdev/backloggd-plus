// @vitest-environment node
// NOTE: `fakeBrowser` loads WXT's test utilities, which pull in esbuild — and esbuild
// refuses to run under jsdom's TextEncoder. This suite exercises the network transport and
// needs no DOM, so it runs in Node instead.
import { hltbEndpointStorageItem } from '@globalShared/storage';

import { normalizeSearchResults, resetHltbClient, searchHltb } from '../client';

const initResponse = () =>
  new Response(
    JSON.stringify({
      hpKey: 'ign_9dbf6ab4',
      hpVal: '9db2f85a80dd54a4',
      token: 'a-token',
    }),
    { status: 200 },
  );

const searchResponse = () =>
  new Response(
    JSON.stringify({
      count: 1,
      data: [
        {
          comp_main: 97204,
          game_id: 26286,
          game_name: 'Hollow Knight',
          game_type: 'game',
        },
      ],
    }),
    { status: 200 },
  );

const statusResponse = (status: number) => new Response('', { status });

const textResponse = (body: string) => new Response(body, { status: 200 });

describe('searchHltb', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fakeBrowser.reset();
    resetHltbClient();

    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('performs the handshake then the search', async () => {
    fetchMock
      .mockResolvedValueOnce(initResponse())
      .mockResolvedValueOnce(searchResponse());

    await expect(searchHltb(['hollow', 'knight'])).resolves.toMatchObject({
      status: 'ok',
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain('/api/search/site/init');
  });

  // The honeypot pair is read by shape, not by name: HowLongToBeat has renamed those
  // properties before, and omitting the body copy answers 404 rather than 403.
  it('echoes the honeypot as both a header and a body property', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            renamedKey: 'hp_name',
            renamedVal: 'hp_value',
            token: 't',
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(searchResponse());

    await searchHltb(['braid']);

    const [, request] = fetchMock.mock.calls[1];
    expect(request.headers).toMatchObject({
      'x-auth-token': 't',
      'x-hp-key': 'hp_name',
      'x-hp-val': 'hp_value',
    });
    expect(JSON.parse(request.body)).toHaveProperty('hp_name', 'hp_value');
  });

  /**
   * Load-bearing, not an optimisation: every `/init` rotates the honeypot pair, so
   * concurrent handshakes could pair one token with another's honeypot value.
   */
  it('performs a single handshake for concurrent searches', async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url.includes('/init') ? initResponse() : searchResponse(),
    );

    await Promise.all([searchHltb(['braid']), searchHltb(['celeste'])]);

    const handshakes = fetchMock.mock.calls.filter((call) =>
      String(call[0]).includes('/init'),
    );
    expect(handshakes).toHaveLength(1);
  });

  // Exactly once. A recursive retry on a header-shaped 403 is what left the reference
  // extension hammering a dead endpoint.
  it('refreshes an expired token and retries exactly once', async () => {
    fetchMock
      .mockResolvedValueOnce(initResponse())
      .mockResolvedValueOnce(statusResponse(403))
      .mockResolvedValueOnce(initResponse())
      .mockResolvedValueOnce(statusResponse(403));

    await expect(searchHltb(['braid'])).resolves.toEqual({
      status: 'auth-expired',
    });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  // A 404 means the path rotated. The walk is bounded by the known-path list.
  it('falls through to the next known path and remembers the one that works', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/api/search/site')) return statusResponse(404);
      return url.includes('/init') ? initResponse() : searchResponse();
    });

    await expect(searchHltb(['braid'])).resolves.toMatchObject({
      status: 'ok',
    });

    resetHltbClient();
    fetchMock.mockClear();
    await searchHltb(['celeste']);

    // The stored path is tried first, so the dead one is never requested again.
    expect(
      fetchMock.mock.calls.every(
        (call) => !String(call[0]).includes('search/site'),
      ),
    ).toBe(true);
  });

  /**
   * The regression that matters: HowLongToBeat rotated `bleed` → `search/site`, a path no
   * hardcoded list contained, and every badge silently vanished. Discovery is the only
   * thing that recovers from a path nobody has seen before.
   */
  it('discovers an unknown path from the live bundle when every known one is gone', async () => {
    const bundle = `x=fetch("/api/brandnew/path",{method:"POST",headers:{}});`;

    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/api/brandnew/path')) {
        return url.includes('/init') ? initResponse() : searchResponse();
      }
      if (url.includes('/api/')) return statusResponse(404);
      if (url.endsWith('/_next/static/chunks/a.js')) {
        return textResponse(bundle);
      }

      return textResponse('<script src="/_next/static/chunks/a.js"></script>');
    });

    await expect(searchHltb(['braid'])).resolves.toMatchObject({
      status: 'ok',
    });
    await expect(hltbEndpointStorageItem.getValue()).resolves.toBe(
      'brandnew/path',
    );
  });

  // A dead site must not turn the bundle scan into a fetch loop.
  it('scans the bundle at most once per cooldown', async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url.includes('/api/')
        ? statusResponse(404)
        : textResponse('<html></html>'),
    );

    await searchHltb(['braid']);
    const afterFirst = fetchMock.mock.calls.filter((call) =>
      String(call[0]).endsWith('howlongtobeat.com/'),
    ).length;

    await searchHltb(['celeste']);
    const afterSecond = fetchMock.mock.calls.filter((call) =>
      String(call[0]).endsWith('howlongtobeat.com/'),
    ).length;

    expect(afterFirst).toBe(1);
    expect(afterSecond).toBe(1);
  });

  it('reports a network error as failed rather than throwing', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(searchHltb(['braid'])).resolves.toEqual({ status: 'failed' });
  });
});

describe('normalizeSearchResults', () => {
  const item = (overrides: Record<string, unknown>) => ({
    comp_100: 236141,
    comp_all: 150549,
    comp_main: 97204,
    comp_plus: 149763,
    game_id: 26286,
    game_name: 'Hollow Knight',
    game_type: 'game',
    ...overrides,
  });

  it('maps the wire shape onto the normalized one, keeping seconds', () => {
    expect(
      normalizeSearchResults([
        item({ game_alias: 'Voidheart Edition', release_world: 2017 }),
      ] as never),
    ).toEqual([
      {
        hltbId: 26286,
        alias: 'Voidheart Edition',
        name: 'Hollow Knight',
        times: { all: 150549, hundred: 236141, main: 97204, plus: 149763 },
        year: 2017,
      },
    ]);
  });

  /**
   * DLC arrives in the same result set as its base game and would otherwise compete with
   * it during matching. `game_type` is an exclusion list on purpose — verified live, It
   * Takes Two is `multi` and Minecraft is `endless`, so an allow-list would blank them.
   */
  it('drops DLC and entries with nothing to show, keeping unknown game types', () => {
    const results = normalizeSearchResults([
      item({
        game_id: 1,
        game_name: 'Hollow Knight: Lifeblood',
        game_type: 'dlc',
      }),
      item({
        comp_100: 0,
        comp_all: 0,
        comp_main: 0,
        comp_plus: null,
        game_id: 2,
        game_name: 'Untimed Game',
      }),
      item({ game_id: 3, game_name: 'Minecraft', game_type: 'endless' }),
    ] as never);

    expect(results.map((game) => game.name)).toEqual(['Minecraft']);
  });
});
