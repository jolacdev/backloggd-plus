/* eslint-disable perfectionist/sort-objects -- Wire payloads mirror HowLongToBeat's own key order. */
import { hltbEndpointStorageItem } from '@globalShared/storage';
import { HltbGame } from '@globalShared/types/hltb';
import { debugLog } from '@globalShared/utils/debug';

/**
 * Everything that knows HowLongToBeat's undocumented wire format — the search path alone
 * rotated four times in 2026, so isolating it here keeps a fifth rotation a one-file change.
 *
 * Three measured requirements drive the shape below:
 *
 * 1. `Referer: https://howlongtobeat.com` is the gate (`Origin` alone gets a 403). It is a
 *    forbidden header for `fetch()`, so `background/index.ts` sets it at the network layer.
 * 2. A two-step token handshake, the token bound to the caller's IP and User-Agent.
 * 3. The honeypot value repeated in the request body under its own name. Omitting that
 *    body copy answers 404, not 403.
 */

const HLTB_ORIGIN = 'https://howlongtobeat.com';
const REQUEST_TIMEOUT_MS = 10_000;
const RESULT_PAGE_SIZE = 20;

/**
 * Paths known to have worked, newest first. Purely a **fast path**: a 404 walks the list
 * and the survivor is persisted, so the common case costs one request and no scraping.
 *
 * NOTE: The list is not the mechanism that keeps this working — {@link discoverSearchPath}
 * is. HowLongToBeat rotates the path without notice and not always to a single segment
 * (`bleed` → `search/site`), so anything hardcoded is a snapshot, not a guarantee.
 */
const SEARCH_PATHS = ['search/site', 'bleed', 'find', 'finder', 'search'];

const DISCOVERY_COOLDOWN_MS = 10 * 60 * 1000;
const MAX_BUNDLES_TO_SCAN = 12;

/**
 * Matches the site's own search call, e.g. `fetch("/api/search/site",{method:"POST",…})`.
 * Keying on `method:"POST"` is what separates it from the `GET /api/<path>/init` call, and
 * the path class includes `/` because the path can carry several segments.
 */
const SEARCH_FETCH_PATTERN =
  /fetch\s*\(\s*["'`]\/api\/([a-zA-Z0-9_/-]+?)["'`]\s*,\s*\{[\s\S]{0,200}?method\s*:\s*["'`]POST["'`]/i;

const BUNDLE_PATTERN = /\/_next\/static\/[^"'\s]+?\.js/g;

/** One entry of `POST /api/<path>` → `data[]`. All `comp_*` values are **seconds**. */
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

/**
 * `auth-expired` (403, expired token) and `not-found` (404, rotated path) are the two
 * recoverable outcomes. Everything else — network error, timeout, malformed payload — is
 * `failed` and is not retried.
 */
export type HltbClientResult =
  | { games: HltbGame[]; status: 'ok' }
  | { status: 'auth-expired' }
  | { status: 'failed' }
  | { status: 'not-found' };

/**
 * Reusable across many searches. The honeypot key holds the *name* of the body property to
 * add and the value its content; both are read by shape, not by name — HowLongToBeat has
 * renamed those properties before.
 */
type HltbToken = { honeypotKey: string; honeypotValue: string; token: string };

type TokenResult =
  | { status: 'failed' }
  | { status: 'not-found' }
  | { status: 'ok'; token: HltbToken };

let cachedToken: HltbToken | null = null;
let inFlightToken: null | Promise<TokenResult> = null;
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

/**
 * Reads the current search path straight off the live bundle — the only thing that
 * survives a rotation to a path nobody has seen before.
 *
 * Rate limited and deduplicated, so a genuinely dead site cannot turn this into a fetch
 * loop: at most one scan per {@link DISCOVERY_COOLDOWN_MS}, however many searches queue up.
 */
const discoverSearchPath = async (): Promise<null | string> => {
  if (inFlightDiscovery) return await inFlightDiscovery;
  if (Date.now() - lastDiscoveryAt < DISCOVERY_COOLDOWN_MS) return null;

  lastDiscoveryAt = Date.now();

  inFlightDiscovery = (async () => {
    try {
      const path = await scanBundlesForSearchPath();
      debugLog('client', 'discovered search path from the live bundle', {
        path,
      });

      return path;
    } catch {
      return null;
    } finally {
      inFlightDiscovery = null;
    }
  })();

  return await inFlightDiscovery;
};

// --- Transport -------------------------------------------------------------

const parseInitPayload = (payload: Record<string, unknown>) => {
  const { token } = payload;
  if (typeof token !== 'string' || !token) return null;

  const entries = Object.entries(payload).filter(
    (entry): entry is [string, string] =>
      entry[0] !== 'token' && typeof entry[1] === 'string',
  );

  // The honeypot pair is optional: earlier revisions returned only a token.
  return {
    honeypotKey: entries.find(([key]) => /key/i.test(key))?.[1] ?? '',
    honeypotValue: entries.find(([key]) => /val/i.test(key))?.[1] ?? '',
    token,
  };
};

const fetchToken = async (searchPath: string): Promise<TokenResult> => {
  try {
    const response = await fetch(
      `${HLTB_ORIGIN}/api/${searchPath}/init?t=${Date.now()}`,
      { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
    );

    // A 404 here means the path moved, not that the handshake is broken.
    if (response.status === 404) return { status: 'not-found' };
    if (!response.ok) return { status: 'failed' };

    const token = parseInitPayload(await response.json());
    return token ? { status: 'ok', token } : { status: 'failed' };
  } catch {
    return { status: 'failed' };
  }
};

/**
 * NOTE: The deduplication is load-bearing, not an optimisation. Every `/init` rotates the
 * honeypot pair, so concurrent handshakes would race to overwrite the shared token and
 * could pair one token with another's honeypot value.
 */
const getToken = async (searchPath: string): Promise<TokenResult> => {
  if (cachedToken) return { status: 'ok', token: cachedToken };
  if (inFlightToken) return await inFlightToken;

  inFlightToken = fetchToken(searchPath);

  try {
    const result = await inFlightToken;
    if (result.status === 'ok') cachedToken = result.token;
    return result;
  } finally {
    inFlightToken = null;
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
        rangeYear: { min: '', max: '' },
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
  // `fetch()`. They are applied at the network layer by the rule in `background/index.ts`.
  return await fetch(`${HLTB_ORIGIN}/api/${searchPath}`, {
    method: 'POST',
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

/**
 * NOTE: An **exclusion** list on purpose. `game_type` has more values than the obvious
 * two — verified live: Hollow Knight is `game`, It Takes Two is `multi`, Minecraft is
 * `endless`. An allow-list of `'game'` silently drops co-op and sandbox titles, so
 * anything unrecognised is kept: a new type should surface a badge, not blank one.
 */
const NON_GAME_ENTRY_TYPES = new Set(['dlc', 'mod', 'hack']);

/** HowLongToBeat sends `0` for "no data"; treat that as absent, not as "zero hours". */
const toSeconds = (value: null | number | undefined): null | number =>
  typeof value === 'number' && value > 0 ? value : null;

/**
 * Drops DLC — it arrives in the same result set as its base game ("Hollow Knight" also
 * returns Lifeblood) and would compete with it during matching — plus entries with no
 * times, which cannot make a badge.
 */
export const normalizeSearchResults = (
  items: HltbSearchResultItem[],
): HltbGame[] =>
  items
    .filter(
      (item) =>
        typeof item?.game_id === 'number' &&
        !NON_GAME_ENTRY_TYPES.has((item.game_type ?? '').toLowerCase()),
    )
    .map((item) => ({
      hltbId: item.game_id,
      name: item.game_name ?? '',
      times: {
        all: toSeconds(item.comp_all),
        hundred: toSeconds(item.comp_100),
        main: toSeconds(item.comp_main),
        plus: toSeconds(item.comp_plus),
      },
      ...(item.game_alias ? { alias: item.game_alias } : {}),
      ...(typeof item.release_world === 'number' && item.release_world > 0
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
    if (tokenResult.status !== 'ok') return { status: tokenResult.status };

    // The token is read from the result, not from `cachedToken`, which a concurrent
    // refresh can replace mid-request.
    const response = await requestSearch(
      searchTerms,
      searchPath,
      tokenResult.token,
    );

    debugLog('client', 'search response', {
      searchPath,
      status: response.status,
    });

    if (response.status === 403) return { status: 'auth-expired' };
    if (response.status === 404) return { status: 'not-found' };
    if (!response.ok) return { status: 'failed' };

    const payload = await response.json();

    return {
      games: normalizeSearchResults(
        Array.isArray(payload?.data) ? payload.data : [],
      ),
      status: 'ok',
    };
  } catch (error) {
    // Timeouts, aborts, network errors and malformed JSON all land here.
    debugLog('client', 'request threw', error);
    return { status: 'failed' };
  }
};

/**
 * Tries one path, refreshing an expired token exactly once. Returns `null` when the path
 * 404s — that is the one outcome meaning "wrong path, keep looking"; everything else is
 * this path's final answer, so an outage returns immediately instead of walking the list.
 */
const attemptPath = async (
  searchTerms: string[],
  searchPath: string,
  knownPath: null | string,
): Promise<HltbClientResult | null> => {
  let attempt = await attemptSearch(searchTerms, searchPath);

  if (attempt.status === 'auth-expired') {
    debugLog('client', '403 — refreshing the token and retrying once');
    cachedToken = null;
    attempt = await attemptSearch(searchTerms, searchPath);
  }

  if (attempt.status === 'not-found') {
    debugLog('client', '404 — path is gone', { searchPath });
    // Tokens are issued per path, so the cached one is worthless for the next candidate.
    cachedToken = null;
    return null;
  }

  if (attempt.status === 'ok' && searchPath !== knownPath) {
    await hltbEndpointStorageItem.setValue(searchPath);
  }

  return attempt;
};

/**
 * Runs one search: the last path known to work, then the remaining known paths, and only
 * if every one of them 404s, the path read live from HowLongToBeat's own bundle.
 *
 * That last step is what makes this survive a rotation — `bleed` → `search/site` killed
 * every hardcoded list in the wild. The scan is rate limited and deduplicated, so the
 * fallback cannot become a request storm.
 */
export const searchHltb = async (
  searchTerms: string[],
): Promise<HltbClientResult> => {
  const knownPath = await hltbEndpointStorageItem.getValue();
  const paths = [
    ...new Set([...(knownPath ? [knownPath] : []), ...SEARCH_PATHS]),
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

/** Test-only: drops the cached token and the discovery throttle. */
export const resetHltbClient = () => {
  cachedToken = null;
  inFlightToken = null;
  lastDiscoveryAt = 0;
  inFlightDiscovery = null;
};
