/* eslint-disable perfectionist/sort-objects -- Wire payloads mirror HowLongToBeat's own key order. */
import { HltbGame, isRecord } from '@globalShared/hltb';
import { hltbEndpointStorageItem } from '@globalShared/storage';

const HLTB_ORIGIN = 'https://howlongtobeat.com';
const REQUEST_TIMEOUT_MS = 10_000;
const RESULT_PAGE_SIZE = 20;

/** Known paths are a fast path; live bundle discovery handles future endpoint rotations. */
const SEARCH_PATHS = ['search/site', 'bleed', 'find', 'finder', 'search'];

const DISCOVERY_COOLDOWN_MS = 10 * 60 * 1000;
const MAX_BUNDLES_TO_SCAN = 12;

const SEARCH_FETCH_PATTERN =
  /fetch\s*\(\s*["'`]\/api\/([a-zA-Z0-9_/-]+?)["'`]\s*,\s*\{[\s\S]{0,200}?method\s*:\s*["'`]POST["'`]/i;

const BUNDLE_PATTERN = /\/_next\/static\/[^"'\s]+?\.js/g;

type HltbSearchResultItem = {
  comp_100: null | number;
  comp_all: null | number;
  comp_main: null | number;
  comp_plus: null | number;
  game_id: number;
  game_name: string;
  game_type: string;
  game_alias?: string;
  release_world?: number;
};

export type HltbClientResult =
  | { games: HltbGame[]; status: 'ok' }
  | { status: 'auth-expired' }
  | { status: 'failed' }
  | { status: 'not-found' }
  | { status: 'rate-limited'; retryAt?: number };

type HltbToken = { honeypotKey: string; honeypotValue: string; token: string };

type TokenResult =
  | { status: 'failed' }
  | { status: 'not-found' }
  | { status: 'ok'; token: HltbToken }
  | { status: 'rate-limited'; retryAt?: number };

const cachedTokens = new Map<string, HltbToken>();
const inFlightTokens = new Map<string, Promise<TokenResult>>();
let lastDiscoveryAt = 0;
let inFlightDiscovery: null | Promise<null | string> = null;

// --- Endpoint discovery ----------------------------------------------------

const fetchText = async (url: string): Promise<string> => {
  const response = await fetch(url, {
    credentials: 'omit',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.text();
};

const scanBundlesForSearchPath = async (): Promise<null | string> => {
  const html = await fetchText(`${HLTB_ORIGIN}/`);
  const bundlePaths = [...new Set(html.match(BUNDLE_PATTERN) ?? [])].slice(
    0,
    MAX_BUNDLES_TO_SCAN,
  );

  // Fetched in parallel but scanned in document order, so the likeliest chunk wins.
  const sources = await Promise.allSettled(
    bundlePaths.map(async (path) => await fetchText(`${HLTB_ORIGIN}${path}`)),
  );

  for (const source of sources) {
    if (source.status !== 'fulfilled') continue;

    const path = source.value.match(SEARCH_FETCH_PATTERN)?.[1];
    if (path) return path.replace(/\/init$/, '');
  }

  return null;
};

const discoverSearchPath = async (): Promise<null | string> => {
  if (inFlightDiscovery) return await inFlightDiscovery;
  if (Date.now() - lastDiscoveryAt < DISCOVERY_COOLDOWN_MS) return null;

  lastDiscoveryAt = Date.now();

  inFlightDiscovery = (async () => {
    try {
      return await scanBundlesForSearchPath();
    } catch {
      return null;
    } finally {
      inFlightDiscovery = null;
    }
  })();

  return await inFlightDiscovery;
};

// --- Transport -------------------------------------------------------------

const parseInitPayload = (payload: unknown) => {
  if (!isRecord(payload)) return null;
  const { token } = payload;
  if (typeof token !== 'string' || !token) return null;

  const entries = Object.entries(payload).filter(
    (entry): entry is [string, string] =>
      entry[0] !== 'token' && typeof entry[1] === 'string',
  );

  // Optional legacy honeypot fields; the current live handshake returns only a token.
  return {
    honeypotKey: entries.find(([key]) => /key/i.test(key))?.[1] ?? '',
    honeypotValue: entries.find(([key]) => /val/i.test(key))?.[1] ?? '',
    token,
  };
};

/** Retry-After can be seconds or an HTTP date, on either the handshake or the search. */
const rateLimited = (
  response: Response,
): { status: 'rate-limited'; retryAt?: number } => {
  const header = response.headers.get('Retry-After');
  const seconds = header === null ? NaN : Number(header);
  const retryAt =
    Number.isFinite(seconds) && seconds >= 0
      ? Date.now() + seconds * 1000
      : Date.parse(header ?? '');
  return {
    status: 'rate-limited',
    ...(Number.isFinite(retryAt) ? { retryAt } : {}),
  };
};

const fetchToken = async (searchPath: string): Promise<TokenResult> => {
  try {
    const response = await fetch(
      `${HLTB_ORIGIN}/api/${searchPath}/init?t=${Date.now()}`,
      { credentials: 'omit', signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
    );

    // A 404 here means the path moved, not that the handshake is broken.
    if (response.status === 404) return { status: 'not-found' };
    if (response.status === 429) return rateLimited(response);
    if (!response.ok) return { status: 'failed' };

    const token = parseInitPayload(await response.json());
    return token ? { status: 'ok', token } : { status: 'failed' };
  } catch {
    return { status: 'failed' };
  }
};

/** A shared handshake per path prevents concurrent token-refresh races. */
const getToken = async (searchPath: string): Promise<TokenResult> => {
  const token = cachedTokens.get(searchPath);
  if (token) return { status: 'ok', token };
  const inFlight = inFlightTokens.get(searchPath);
  if (inFlight) return await inFlight;
  const request = fetchToken(searchPath);
  inFlightTokens.set(searchPath, request);
  try {
    const result = await request;
    if (result.status === 'ok') cachedTokens.set(searchPath, result.token);
    return result;
  } finally {
    inFlightTokens.delete(searchPath);
  }
};

const requestSearch = async (
  searchTerms: string[],
  searchPath: string,
  token: HltbToken,
) => {
  const body: Record<string, unknown> = {
    searchType: 'games',
    searchTerms,
    searchPage: 1,
    size: RESULT_PAGE_SIZE,
    searchOptions: {
      games: {
        userId: 0,
        platform: '',
        sortCategory: 'popular',
        rangeCategory: 'main',
        rangeTime: { min: null, max: null },
        gameplay: { perspective: '', flow: '', genre: '', difficulty: '' },
        year: '',
        modifier: '',
      },
      users: { sortCategory: 'postcount' },
      lists: { sortCategory: 'follows' },
      filter: '',
      sort: 0,
      randomizer: 0,
    },
    useCache: true,
  };

  if (token.honeypotKey) body[token.honeypotKey] = token.honeypotValue;

  // NOTE: `Referer` and `Origin` cannot be set here — they are forbidden header names for
  // `fetch()`. installHltbHeaders applies them at the network layer.
  return await fetch(`${HLTB_ORIGIN}/api/${searchPath}`, {
    method: 'POST',
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token.token,
      ...(token.honeypotKey
        ? { 'x-hp-key': token.honeypotKey, 'x-hp-val': token.honeypotValue }
        : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
};

// --- Normalization ---------------------------------------------------------

const toSeconds = (value: null | number | undefined): null | number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : null;

/** Normalize seconds and retain DLC, co-op, and other playable collection entries. */
export const normalizeSearchResults = (
  items: HltbSearchResultItem[],
): HltbGame[] =>
  items
    .filter(
      (item) =>
        Number.isSafeInteger(item?.game_id) &&
        item.game_id > 0 &&
        typeof item.game_name === 'string',
    )
    .map((item) => ({
      hltbId: item.game_id,
      name: item.game_name,
      times: {
        all: toSeconds(item.comp_all),
        hundred: toSeconds(item.comp_100),
        main: toSeconds(item.comp_main),
        plus: toSeconds(item.comp_plus),
      },
      ...(typeof item.game_alias === 'string' && item.game_alias
        ? { alias: item.game_alias }
        : {}),
      ...(typeof item.release_world === 'number' &&
      Number.isFinite(item.release_world) &&
      item.release_world > 0
        ? { year: item.release_world }
        : {}),
    }))
    .filter(
      (game) =>
        game.name.length > 0 &&
        Object.values(game.times).some((time) => time !== null),
    );

// --- Public API ------------------------------------------------------------

const attemptSearch = async (
  searchTerms: string[],
  searchPath: string,
): Promise<HltbClientResult> => {
  try {
    const tokenResult = await getToken(searchPath);
    if (tokenResult.status !== 'ok') return tokenResult;

    // The token is read from the result, not from `cachedToken`, which a concurrent
    // refresh can replace mid-request.
    const response = await requestSearch(
      searchTerms,
      searchPath,
      tokenResult.token,
    );

    if (response.status === 403) {
      if (cachedTokens.get(searchPath) === tokenResult.token) {
        cachedTokens.delete(searchPath);
      }
      return { status: 'auth-expired' };
    }
    if (response.status === 404) return { status: 'not-found' };
    if (response.status === 429) return rateLimited(response);
    if (!response.ok) return { status: 'failed' };

    const payload = await response.json();
    if (!isRecord(payload) || !Array.isArray(payload.data)) {
      return { status: 'failed' };
    }

    return {
      games: normalizeSearchResults(payload.data),
      status: 'ok',
    };
  } catch {
    // Timeouts, aborts, network errors and malformed JSON all land here.
    return { status: 'failed' };
  }
};

const attemptPath = async (
  searchTerms: string[],
  searchPath: string,
  knownPath: null | string,
): Promise<HltbClientResult | null> => {
  let attempt = await attemptSearch(searchTerms, searchPath);

  if (attempt.status === 'auth-expired') {
    attempt = await attemptSearch(searchTerms, searchPath);
  }

  if (attempt.status === 'not-found') {
    // Tokens are issued per path, so the cached one is worthless for the next candidate.
    cachedTokens.delete(searchPath);
    return null;
  }

  if (attempt.status === 'ok' && searchPath !== knownPath) {
    await hltbEndpointStorageItem.setValue(searchPath).catch(() => undefined);
  }

  return attempt;
};

/** Uses a cached path, one token refresh, then bounded endpoint discovery on 404. */
export const searchHltb = async (
  searchTerms: string[],
): Promise<HltbClientResult> => {
  const knownPath = await hltbEndpointStorageItem.getValue().catch(() => null);
  const paths = [
    ...new Set([
      ...(knownPath && /^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(knownPath)
        ? [knownPath]
        : []),
      ...SEARCH_PATHS,
    ]),
  ];

  for (const searchPath of paths) {
    const attempt = await attemptPath(searchTerms, searchPath, knownPath);
    if (attempt) return attempt;
  }

  const discovered = await discoverSearchPath();
  if (!discovered || paths.includes(discovered)) return { status: 'failed' };

  return (
    (await attemptPath(searchTerms, discovered, knownPath)) ?? {
      status: 'failed',
    }
  );
};

export const resetHltbClient = () => {
  cachedTokens.clear();
  inFlightTokens.clear();
  lastDiscoveryAt = 0;
  inFlightDiscovery = null;
};

const REFERER_RULE_ID = 1;

/** HLTB requires its own Referer; affect only this extension's API requests. */
export const installHltbHeaders = async () => {
  if (import.meta.env.MANIFEST_VERSION === 3) {
    await browser.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [REFERER_RULE_ID],
      addRules: [
        {
          id: REFERER_RULE_ID,
          priority: 1,
          action: {
            type: 'modifyHeaders',
            requestHeaders: [
              { header: 'Referer', operation: 'set', value: HLTB_ORIGIN },
              { header: 'Origin', operation: 'set', value: HLTB_ORIGIN },
            ],
          },
          condition: {
            initiatorDomains: [browser.runtime.id],
            resourceTypes: ['xmlhttprequest'],
            urlFilter: '|https://howlongtobeat.com/api/',
          },
        },
      ],
    });
    return;
  }

  browser.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
      const { requestHeaders } = details;
      // Firefox provides originUrl, while WXT's shared Chrome types omit it.
      const originUrl =
        'originUrl' in details && typeof details.originUrl === 'string'
          ? details.originUrl
          : undefined;
      if (!originUrl?.startsWith(browser.runtime.getURL(''))) return {};
      return {
        requestHeaders: [
          ...(requestHeaders ?? []).filter(
            ({ name }) => !/^(referer|origin)$/i.test(name),
          ),
          { name: 'Referer', value: HLTB_ORIGIN },
          { name: 'Origin', value: HLTB_ORIGIN },
        ],
      };
    },
    { types: ['xmlhttprequest'], urls: [`${HLTB_ORIGIN}/api/*`] },
    ['blocking', 'requestHeaders'],
  );
};
