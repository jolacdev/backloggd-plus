import { QueryClient } from '@tanstack/react-query';

import { api } from '@content/lib/axios';
import { HltbRequest } from '@globalShared/hltb';

import { resolveHltbGame } from '../api';

const mocks = vi.hoisted(() => ({
  log: vi.fn(),
  read: vi.fn(),
  search: vi.fn(),
  send: vi.fn(),
  write: vi.fn(),
  year: vi.fn(),
}));
vi.mock('@globalShared/logger', () => ({ logger: { error: mocks.log } }));

vi.mock('wxt/browser', () => ({
  browser: { runtime: { sendMessage: mocks.send } },
}));

const meta = { igdbId: '123', slug: 'god-of-war', title: 'God of War' };
const game = (hltbId: number, year: number) => ({
  hltbId,
  name: 'God of War',
  times: { all: null, hundred: null, main: 3600, plus: null },
  year,
});

describe('HLTB resolution', () => {
  beforeEach(() => {
    mocks.send.mockImplementation(async (request: HltbRequest) => {
      if (request.type === 'hltb:search') {
        return await mocks.search(request.title);
      }
      if (request.type === 'hltb:cache:get') {
        return await mocks.read(request.key);
      }
      if (request.type === 'hltb:cache:set') {
        return await mocks.write(request.key, request.value, request.revision);
      }
    });
    vi.spyOn(api, 'get').mockImplementation(mocks.year);
    mocks.read.mockResolvedValue({ revision: 7, value: null });
    mocks.write.mockResolvedValue(undefined);
    mocks.search.mockResolvedValue({
      games: [game(1, 2005), game(2, 2018)],
      status: 'ok',
    });
  });

  it('does not save a negative match when release-year lookup fails', async () => {
    mocks.year.mockResolvedValue(undefined);
    expect(await resolveHltbGame(meta, new QueryClient())).toMatchObject({
      status: 'unavailable',
    });
    expect(mocks.write).not.toHaveBeenCalled();
  });

  it('saves a uniquely year-matched game under its IGDB id and current revision', async () => {
    mocks.year.mockResolvedValue(
      '<h1>God of War</h1><a class="game-year">2018</a>',
    );
    expect(await resolveHltbGame(meta, new QueryClient())).toMatchObject({
      hltbId: 2,
      status: 'matched',
    });
    expect(mocks.write).toHaveBeenCalledWith(
      'resolution:123',
      expect.objectContaining({ kind: 'resolution' }),
      7,
    );
  });

  it('returns cached matches without searching', async () => {
    const entry = {
      ...game(1, 2005),
      status: 'matched',
    };
    mocks.read.mockResolvedValue({
      revision: 7,
      value: { entry, kind: 'resolution' },
    });
    expect(await resolveHltbGame(meta, new QueryClient())).toEqual(entry);
    expect(mocks.search).not.toHaveBeenCalled();
    expect(mocks.log).not.toHaveBeenCalled();
  });

  it('leaves transport failures unresolved and uncached', async () => {
    const retryAt = Date.now() + 300000;
    mocks.search.mockResolvedValue({
      reason: 'network',
      retryAt,
      status: 'unavailable',
    });
    expect(await resolveHltbGame(meta, new QueryClient())).toEqual({
      retryAt,
      status: 'unavailable',
    });
    expect(mocks.write).not.toHaveBeenCalled();
    expect(mocks.log).toHaveBeenCalledWith(
      expect.stringContaining(meta.title),
      expect.objectContaining({ ...meta, retryAt, status: 'unavailable' }),
    );
  });

  it('matches a paired Pokémon title and saves its resolution', async () => {
    mocks.search.mockResolvedValue({
      status: 'ok',
      games: [
        {
          ...game(13937, 2013),
          alias: 'Pokemon X and Y',
          name: 'Pokémon X and Y',
        },
      ],
    });
    expect(
      await resolveHltbGame(
        { igdbId: '2287', slug: 'pokemon-y', title: 'Pokémon Y' },
        new QueryClient(),
      ),
    ).toMatchObject({ hltbId: 13937, status: 'matched' });
    expect(mocks.write).toHaveBeenCalledWith(
      'resolution:2287',
      expect.objectContaining({ kind: 'resolution' }),
      7,
    );
  });

  it('keeps a saved negative decision without repeated searches', async () => {
    const entry = {
      status: 'no-match',
    };
    mocks.read.mockResolvedValue({
      revision: 7,
      value: { entry, kind: 'resolution' },
    });
    expect(await resolveHltbGame(meta, new QueryClient())).toEqual(entry);
    expect(mocks.search).not.toHaveBeenCalled();
    expect(mocks.log).toHaveBeenCalledWith(
      expect.stringContaining(meta.title),
      expect.objectContaining({ ...meta, status: 'no-match' }),
    );
  });

  it('tries one punctuation-normalized search before saving a negative', async () => {
    const title =
      "Layton's Mystery Journey: Katrielle and the Millionaire's Conspiracy";
    const candidate = {
      ...game(48876, 2017),
      name: "Layton's Mystery Journey: Katrielle and the Millionaires' Conspiracy",
    };
    mocks.search
      .mockResolvedValueOnce({ games: [], status: 'ok' })
      .mockResolvedValueOnce({ games: [candidate], status: 'ok' });
    expect(
      await resolveHltbGame({ ...meta, title }, new QueryClient()),
    ).toMatchObject({ hltbId: 48876, status: 'matched' });
    expect(mocks.search.mock.calls.map(([query]) => query)).toEqual([
      title,
      'laytons mystery journey katrielle and the millionaires conspiracy',
    ]);
  });

  it('does not save a negative when the fallback search is cooling down', async () => {
    const retryAt = Date.now() + 300000;
    mocks.search
      .mockResolvedValueOnce({ games: [], status: 'ok' })
      .mockResolvedValueOnce({
        reason: 'service-unavailable',
        retryAt,
        status: 'unavailable',
      });
    expect(
      await resolveHltbGame(
        { ...meta, title: 'Pokémon Unknown' },
        new QueryClient(),
      ),
    ).toEqual({ retryAt, status: 'unavailable' });
    expect(mocks.write).not.toHaveBeenCalled();
  });

  it.each(['unreachable', 'no-reply'])(
    'keeps a game retryable when the worker is %s',
    async (failure) => {
      if (failure === 'unreachable') {
        mocks.send.mockRejectedValue(new Error('Worker stopped'));
      } else mocks.send.mockResolvedValue(undefined);
      expect(await resolveHltbGame(meta, new QueryClient())).toMatchObject({
        status: 'unavailable',
      });
      expect(mocks.write).not.toHaveBeenCalled();
    },
  );

  it('uses a cached release year without fetching the game page', async () => {
    mocks.read.mockImplementation(async (key: string) => ({
      revision: 7,
      value: key.startsWith('year:') ? { kind: 'year', year: 2018 } : null,
    }));
    expect(await resolveHltbGame(meta, new QueryClient())).toMatchObject({
      hltbId: 2,
      status: 'matched',
    });
    expect(mocks.year).not.toHaveBeenCalled();
  });

  it.each(['<h1>Sign in</h1>', '<h1>God of War</h1><a class="game-year"></a>'])(
    'does not persist a negative resolution for a page without a usable year: %s',
    async (html) => {
      mocks.year.mockResolvedValue(html);
      expect(await resolveHltbGame(meta, new QueryClient())).toMatchObject({
        status: 'unavailable',
      });
      expect(
        mocks.write.mock.calls.some(([, value]) => value.kind === 'resolution'),
      ).toBe(false);
    },
  );

  it('still returns a matched estimate when persistence fails', async () => {
    mocks.search.mockResolvedValue({ games: [game(2, 2018)], status: 'ok' });
    mocks.write.mockRejectedValue(new Error('Storage full'));
    expect(await resolveHltbGame(meta, new QueryClient())).toMatchObject({
      hltbId: 2,
      status: 'matched',
    });
  });
});
