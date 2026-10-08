import { test as base, expect } from '@playwright/test';
import { resolve } from 'node:path';
import type { BrowserContext, Worker } from '@playwright/test';

import { HltbCacheState } from '@globalShared/hltb';

const card = (id: number, title: string) => `
  <div class="card game-cover" game_id="${id}">
    <a class="cover-link" href="/games/${title.toLowerCase().replace(/ /g, '-')}/">${title}</a>
    <div class="overflow-wrapper"><img class="card-img" alt="${title}"></div>
    <div class="game-text-centered">${title}</div>
  </div>`;

const collectionHtml = `<!doctype html><html><head><style>
  body { background:#16181c; color:#badefc; font:16px system-ui; padding:32px }
  #user-games-library-container { display:flex; gap:20px }
  .game-cover { width:150px; height:220px; position:relative }
  .overflow-wrapper { position:relative; overflow:hidden; height:200px; background:#303642; border-radius:8px }
  .cover-link { position:absolute; inset:0; z-index:5; color:transparent }
</style></head><body><h1>Game collection</h1><div id="user-games-library-container">${card(42, 'Braid')}${card(43, 'Celeste')}</div></body></html>`;

const test = base.extend<{
  extension: {
    context: BrowserContext;
    popupUrl: string;
    searches: string[];
    worker: Worker;
  };
}>({
  extension: async ({ playwright }, runTest) => {
    const extensionPath = resolve('.output/chrome-mv3');
    const context = await playwright.chromium.launchPersistentContext('', {
      channel: 'chromium',
      headless: true,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
    const searches: string[] = [];
    try {
      await context.route('https://backloggd.com/**', async (route) => {
        if (route.request().resourceType() === 'document') {
          await route.fulfill({
            body: collectionHtml,
            contentType: 'text/html',
          });
        } else {
          await route.abort();
        }
      });
      await context.route('https://howlongtobeat.com/**', async (route) => {
        if (route.request().url().includes('/init')) {
          await route.fulfill({ json: { token: 'fixture-token' } });
          return;
        }
        const title = (
          route.request().postDataJSON().searchTerms as string[]
        ).join(' ');
        searches.push(title);
        const paired =
          title === 'Pokémon Scarlet'
            ? { id: 104683, name: 'Pokémon Scarlet and Violet' }
            : title === 'Pokémon Y'
              ? { id: 13937, name: 'Pokémon X and Y' }
              : null;
        await route.fulfill({
          json: {
            data: [
              {
                comp_100: title === 'Braid' ? 12600 : 36000,
                comp_all: 7200,
                comp_main: title === 'Braid' ? 3600 : 18000,
                comp_plus: 7200,
                game_id: paired?.id ?? (title === 'Braid' ? 1 : 2),
                game_name: paired?.name ?? title,
                game_type: 'game',
                release_world: 2008,
              },
            ],
          },
        });
      });
      const worker =
        context.serviceWorkers()[0] ??
        (await context.waitForEvent('serviceworker'));
      await runTest({
        context,
        popupUrl: `chrome-extension://${new URL(worker.url()).host}/popup.html`,
        searches,
        worker,
      });
    } finally {
      await context.close();
    }
  },
});

test('real Turbo lazy streams recover after cooldown and work when switched to pagination', async ({
  extension,
}) => {
  const now = Date.now();
  await extension.worker.evaluate(async (time) => {
    Date.now = () => time;
    const chromeApi = (self as typeof self & { chrome: typeof browser }).chrome;
    const entry = (name: string, id: number) => ({
      kind: 'resolution',
      entry: {
        hltbId: id,
        name,
        status: 'matched',
        times: { all: null, hundred: null, main: 3600, plus: null },
      },
    });
    await chromeApi.storage.local.set({
      hltbCache: {
        blockedUntil: time + 2000,
        revision: 0,
        entries: {
          'resolution:42': entry('Braid', 1),
          'resolution:43': entry('Celeste', 2),
        },
      },
    });
    const requests: string[] = [];
    Reflect.set(self, 'fixtureRequests', requests);
    chromeApi.runtime.onMessage.addListener(
      (message: { title?: string; type?: string }) => {
        if (message.type === 'hltb:search') requests.push(message.title ?? '');
      },
    );
  }, now);

  const page = await extension.context.newPage();
  const initialCards = card(42, 'Braid') + card(43, 'Celeste');
  const nextCards = card(194998, 'Pokémon Scarlet') + card(2287, 'Pokémon Y');
  const pagination =
    '<turbo-frame loading="lazy" id="games_pagination" src="/u/fixture-user/games/?format=turbo_stream&amp;page=2"><div class="card game-cover empty-card shimmer-bg"></div></turbo-frame>';
  const collection = (infinite: boolean) =>
    `<turbo-frame id="user_collection"><div id="user_games" style="display:flex;gap:20px">${infinite ? initialCards : nextCards}</div>${infinite ? pagination : '<a href="?page=2" data-turbo-frame="user_collection">Next page</a>'}</turbo-frame>`;
  let lazyLoads = 0;
  await page.route('https://backloggd.com/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('format') === 'turbo_stream') {
      lazyLoads += 1;
      await route.fulfill({
        body: `<turbo-stream action="append" target="user_games"><template>${nextCards}</template></turbo-stream><turbo-stream action="replace" target="games_pagination"><template><turbo-frame id="games_pagination">End of collection</turbo-frame></template></turbo-stream>`,
        contentType: 'text/vnd.turbo-stream.html',
      });
    } else if (url.searchParams.has('infinite')) {
      await route.fulfill({
        body: collection(url.searchParams.get('infinite') === 'true'),
        contentType: 'text/html',
      });
    } else {
      await route.fulfill({
        contentType: 'text/html',
        body: collectionHtml.replace(
          `<div id="user-games-library-container">${initialCards}</div>`,
          `<label><input type="checkbox" id="toggleInfiniteScroll" checked>Infinite scroll</label>${collection(true)}`,
        ),
      });
    }
  });
  await page.goto('https://backloggd.com/u/fixture-user/games/');
  await expect(page.locator('toolkittd-hltb-badge')).toHaveCount(2, {
    timeout: 10000,
  });
  // Use Turbo itself, rather than manually dispatching a navigation event after an append.
  await page.addScriptTag({
    path: resolve('node_modules/@hotwired/turbo/dist/turbo.es2017-umd.js'),
  });
  await expect(page.locator('.game-cover[game_id]')).toHaveCount(4);
  await expect.poll(() => lazyLoads).toBe(1);
  await expect
    .poll(
      async () =>
        await extension.worker.evaluate(() =>
          [...(Reflect.get(self, 'fixtureRequests') as string[])].sort(),
        ),
    )
    .toEqual(['Pokémon Scarlet', 'Pokémon Y']);
  expect(extension.searches).toEqual([]);
  await expect(page.locator('toolkittd-hltb-badge')).toHaveCount(2);

  await extension.worker.evaluate((time) => {
    Date.now = () => time;
  }, now + 3000);
  await expect(page.locator('toolkittd-hltb-badge')).toHaveCount(4);
  await expect(
    page.locator('[game_id="194998"]').getByRole('button'),
  ).toHaveAttribute('aria-label', /Pokémon Scarlet and Violet/);
  await expect(
    page.locator('[game_id="2287"]').getByRole('button'),
  ).toHaveAttribute('aria-label', /Pokémon X and Y/);
  expect([...extension.searches].sort()).toEqual([
    'Pokémon Scarlet',
    'Pokémon Y',
  ]);

  await page.evaluate(() => {
    const toggle = document.getElementById(
      'toggleInfiniteScroll',
    ) as HTMLInputElement;
    toggle.addEventListener('change', () => {
      document
        .getElementById('user_collection')!
        .setAttribute(
          'src',
          `/u/fixture-user/games/?infinite=${toggle.checked}`,
        );
    });
  });
  await page.getByRole('checkbox', { name: 'Infinite scroll' }).uncheck();
  await expect(page.getByRole('link', { name: 'Next page' })).toBeVisible();
  await expect(page.locator('toolkittd-hltb-badge')).toHaveCount(2);
  await page.getByRole('checkbox', { name: 'Infinite scroll' }).check();
  await expect(page.locator('.game-cover[game_id]')).toHaveCount(4);
  await expect(page.locator('toolkittd-hltb-badge')).toHaveCount(4);
  await expect.poll(() => lazyLoads).toBe(2);
  expect([...extension.searches].sort()).toEqual([
    'Pokémon Scarlet',
    'Pokémon Y',
  ]);
});

test('collection badges share persistent results across reloads and tabs', async ({
  extension,
}) => {
  const page = await extension.context.newPage();
  await page.goto('https://backloggd.com/u/fixture-user/games/');
  await expect(page.locator('toolkittd-hltb-badge')).toHaveCount(2);
  const braid = page.locator('[game_id="42"]').getByRole('button');
  await expect(braid).toHaveText('1h');
  await braid.hover();
  const source = page.getByRole('link', { name: 'View on HowLongToBeat' });
  await expect(source).toHaveAttribute(
    'href',
    'https://howlongtobeat.com/game/1',
  );
  await source.hover();
  await expect(source).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(source).not.toBeVisible();

  await page.reload();
  await expect(page.locator('toolkittd-hltb-badge')).toHaveCount(2);
  const other = await extension.context.newPage();
  await other.goto(
    'https://backloggd.com/u/another-user/games/added/type:backlog/',
  );
  await expect(other.locator('toolkittd-hltb-badge')).toHaveCount(2);
  expect(extension.searches).toEqual(['Braid', 'Celeste']);
});

test('popup settings apply live and cache reset starts a fresh lookup', async ({
  extension,
}) => {
  const page = await extension.context.newPage();
  await page.goto('https://backloggd.com/u/fixture-user/games/');
  await expect(page.locator('toolkittd-hltb-badge')).toHaveCount(2);
  const popup = await extension.context.newPage();
  await popup.goto(extension.popupUrl);
  await popup.getByRole('tab', { name: 'HowLongToBeat' }).click();
  await popup.getByLabel('Time shown on covers').selectOption('hundred');
  await expect(page.locator('[game_id="42"]').getByRole('button')).toHaveText(
    '3½h',
  );
  await popup
    .getByRole('checkbox', { name: /Show completion times/ })
    .uncheck();
  await expect(page.locator('toolkittd-hltb-badge')).toHaveCount(0);
  await popup.getByRole('checkbox', { name: /Show completion times/ }).check();
  await expect(page.locator('toolkittd-hltb-badge')).toHaveCount(2);
  expect(extension.searches).toHaveLength(2);
  await popup.getByRole('button', { name: 'Refresh saved estimates' }).click();
  await expect(
    popup.getByRole('status').filter({ hasText: 'Saved estimates cleared' }),
  ).toBeVisible();
  await expect.poll(() => extension.searches.length).toBe(4);
  await expect(page.locator('[game_id="42"]').getByRole('button')).toHaveText(
    '3½h',
  );
  await popup.reload();
  await popup.getByRole('tab', { name: 'HowLongToBeat' }).click();
  await expect(popup.getByLabel('Time shown on covers')).toHaveValue('hundred');
  await popup.screenshot({ path: '/tmp/toolkittd-hltb-popup.png' });
  await page.locator('[game_id="42"]').getByRole('button').click();
  await expect(
    page.getByRole('link', { name: 'View on HowLongToBeat' }),
  ).toBeVisible();
  await page.screenshot({ path: '/tmp/toolkittd-hltb-collection.png' });
});

test('global console logging is opt-in, applies live, and survives clearing HLTB data', async ({
  extension,
}) => {
  await extension.context.route(
    'https://howlongtobeat.com/api/search/site',
    async (route) => {
      await route.fulfill({ json: { data: [] } });
    },
  );
  const page = await extension.context.newPage();
  const errors: string[] = [];
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      message.text().startsWith('[Toolkittd]')
    ) {
      errors.push(message.text());
    }
  });
  const savedStatus = async (id: number) =>
    await extension.worker.evaluate(async (gameId) => {
      const chromeApi = (self as typeof self & { chrome: typeof browser })
        .chrome;
      const { hltbCache } = await chromeApi.storage.local.get('hltbCache');
      const cache = hltbCache as HltbCacheState | undefined;
      const value = cache?.entries[`resolution:${gameId}`];
      return value?.kind === 'resolution' ? value.entry.status : null;
    }, id);
  await page.goto('https://backloggd.com/u/fixture-user/games/');
  await expect.poll(async () => await savedStatus(43)).toBe('no-match');
  expect(errors).toEqual([]);

  const popup = await extension.context.newPage();
  await popup.goto(extension.popupUrl);
  const logging = popup.getByRole('checkbox', { name: 'Console logging' });
  await expect(logging).toHaveCount(0);
  await popup.getByRole('button', { exact: true, name: 'Settings' }).click();
  await expect(popup.getByRole('tablist')).toHaveCount(0);
  await expect(logging).not.toBeChecked();
  await logging.click();
  await expect(logging).toBeChecked();
  await expect(logging).toBeEnabled();
  await popup.screenshot({ path: '/tmp/toolkittd-general-settings.png' });
  await popup.getByRole('button', { name: 'Back to features' }).click();
  await popup.getByRole('tab', { name: 'HowLongToBeat' }).click();
  await expect(logging).toHaveCount(0);
  await popup.getByRole('button', { name: 'Refresh saved estimates' }).click();
  await expect
    .poll(() =>
      errors.some((message) =>
        message.includes('No HLTB estimate for "Celeste"'),
      ),
    )
    .toBe(true);
  expect(
    errors.some((message) => message.includes('No HLTB estimate for "Braid"')),
  ).toBe(true);

  await popup.reload();
  await popup.getByRole('button', { exact: true, name: 'Settings' }).click();
  await expect(logging).toBeChecked();
  await logging.click();
  await expect(logging).not.toBeChecked();
  await expect(logging).toBeEnabled();
  const count = errors.length;
  await page.evaluate(
    (html) =>
      document
        .getElementById('user-games-library-container')!
        .insertAdjacentHTML('beforeend', html),
    card(44, 'Unknown Game'),
  );
  await expect.poll(async () => await savedStatus(44)).toBe('no-match');
  expect(errors).toHaveLength(count);
});

test('Turbo morphs, frame replacements and body swaps refresh without duplicate badges', async ({
  extension,
}) => {
  const page = await extension.context.newPage();
  await page.goto('https://backloggd.com/u/fixture-user/games/');
  await expect(page.locator('toolkittd-hltb-badge')).toHaveCount(2);
  await page.evaluate(() => {
    document.querySelector('toolkittd-hltb-badge')!.remove();
    document.dispatchEvent(new Event('turbo:morph'));
  });
  await expect(page.locator('toolkittd-hltb-badge')).toHaveCount(2);
  await page.evaluate(() => {
    const gameCard = document.querySelector('[game_id="42"]')!;
    gameCard.setAttribute('game_id', '43');
    gameCard.querySelector('img')!.setAttribute('alt', 'Celeste');
    gameCard.querySelector('a')!.setAttribute('href', '/games/celeste/');
    document.dispatchEvent(new Event('turbo:morph'));
  });
  await expect(
    page.locator('toolkittd-hltb-badge button').filter({ hasText: '5h' }),
  ).toHaveCount(2);
  await page.evaluate(() => {
    const container = document.getElementById('user-games-library-container')!;
    container.replaceWith(container.cloneNode(true));
    history.pushState({}, '', '/u/fixture-user/games/added/type:playing/');
    document.dispatchEvent(new Event('turbo:frame-load'));
  });
  await expect(page.locator('toolkittd-hltb-badge button')).toHaveCount(2);
  await expect(page.locator('toolkittd-hltb-badge')).toHaveCount(2);
  await page.evaluate(() => {
    document.dispatchEvent(new Event('turbo:before-cache'));
  });
  await expect(page.locator('toolkittd-hltb-badge')).toHaveCount(0);
  await page.evaluate(() => {
    document.dispatchEvent(new Event('turbo:before-render'));
    document.body.replaceWith(document.body.cloneNode(true));
    document.dispatchEvent(new Event('turbo:render'));
    document.dispatchEvent(new Event('turbo:load'));
  });
  await expect(page.locator('toolkittd-hltb-badge')).toHaveCount(2);
  await expect(page.locator('toolkittd-hltb')).toHaveCount(1);
  expect(extension.searches).toHaveLength(2);
});
