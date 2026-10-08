# HowLongToBeat on game collections

Adds completion estimates to `/u/:username/games/` and its sort/filter routes, for signed-in and public collections. Both infinite scrolling and paginated collections are supported.

## Code ownership

The content feature is flat so related behavior can be read together:

| Module | Responsibility |
| --- | --- |
| `Hltb.tsx` | Settings, cache revision, cards, and the shared tooltip |
| `HltbCardBadge.tsx` | Shadow DOM badge and accessible cover button |
| `HltbTooltip.tsx` | Breakdown, positioning, and dismissal |
| `useGameCards.ts` | Backloggd card metadata and Turbo DOM updates |
| `useHltbGame.ts` | Viewport gating and retry scheduling |
| `api.ts` | Worker messages, release-year lookup, and resolution pipeline |
| `match.ts` | Conservative title, alias, and year matching |
| `format.ts` | Duration display and category fallback |

`entrypoints/background/hltb/` owns HTTP transport/header setup (`client.ts`), the serial request queue/cooldown (`service.ts`), and persistent storage (`cache.ts`). The shared contract and boundary validators live in `entrypoints/shared/hltb.ts`. `useHltbSettings` shares preferences between the popup and content UI. Local types live beside the code that owns them.

## UI and matching

Covers show a clock button with a duration such as `45m` or `12½h`. Hover, focus, or a tap opens one shared breakdown with available categories, the matched title/year, and a source link. It closes on Escape, outside interaction, scrolling, resizing, or navigation; delayed dismissal allows moving into the breakdown. Each badge has a Shadow DOM root, with one shared constructed stylesheet and one React tree owning all portals.

The popup enables badges, selects a preferred category, and refreshes saved estimates. Settings apply to open tabs. Missing preferred times fall back to the first available category. Unmatched or unavailable games show no badge.

Resolution starts within 200 px of the viewport:

1. Reuse a saved resolution keyed by Backloggd's `game_id`.
2. Search HLTB through the worker, which shares searches across tabs. If needed, try one punctuation-normalized query before saving a negative decision.
3. Match normalized titles and aliases, including known paired Pokémon base versions such as Scarlet/Violet and X/Y. DLC and arbitrary titles containing “and” are not expanded as base versions.
4. Exact titles take priority. Ambiguous same-title releases and year-suffixed remakes use the release year from `/games/:slug/`: one exact year, otherwise one candidate within a year. A failed year lookup stays retryable.
5. Fuzzy matches require a score of at least 0.85 and a lead of at least 0.15. Different sequel numbers or edition/remaster tokens are rejected.

Cards expose play dates, not release years. Backloggd year requests have a ten-second timeout and reject sign-in/challenge pages. HLTB DLC, co-op, sandbox, and other playable types remain eligible; invalid or zero completion times become missing values.

## Cache and recovery

The worker alone writes `local:hltbCache`, containing `entries`, the request cooldown deadline `blockedUntil`, and the cache-reset counter `revision`. Each entry stores its value directly. Stored values and incoming messages are validated, and writes are serialized. Resolutions, searches (including empty results), and release years stay saved until the user clears them. There is no time-based expiration or automatic eviction. Browser storage errors preserve existing saved data and useful worker memory and are reported through the opt-in logger.

Failures are not persisted as negative matches. Nearby unresolved cards retry at the worker's deadline, or after a minute if no deadline exists. Offscreen cards and hidden tabs pause retries; settled results stop polling and remain fresh indefinitely in React Query.

Uncached searches run sequentially, starting at least one second apart. Three consecutive failures open a five-minute cooldown, increasing up to an hour on repeated outages. HTTP 429 opens it immediately and honors a longer `Retry-After` deadline in seconds or HTTP-date form. The deadline persists across worker restarts. Each queued request rechecks the cooldown and enabled preference before dispatch; refused requests drain immediately. The serial queue naturally allows one recovery probe. Cached searches remain usable during cooldowns.

Refreshing estimates clears search, resolution, year, and outage state. A revision change refreshes nearby covers. Old requests cannot refill the cleared cache or reopen its cooldown. Settings and the known endpoint remain saved. Other keys are `local:hltbSettings`, `local:hltbCacheRevision`, and `local:hltbEndpoint`; tokens stay in worker memory.

## Diagnostics

The popup's **Settings → Console logging** toggle is off by default and saved permanently in `local:preferences`, outside the HLTB panel. `entrypoints/shared/logger.ts` provides `logger.log`, `logger.error`, `logger.debug`, and `logger.warn` for all extension entrypoints; currently only HLTB errors use it. Each call checks the latest saved flag; changing it applies to open tabs and the worker. Unavailable and unmatched resolutions log the game title, IGDB ID, slug, status, and retry deadline when available. Cached negative results are included. Clearing HLTB data does not reset the logging preference.

## Turbo and transport

The content entrypoint owns route checks and mounting. It removes roots before Turbo caches/replaces the body and on WXT invalidation, guarding asynchronous creation against duplicate mounts and stale navigation. The card registry observes `document.documentElement`, so frame replacement cannot disconnect it. It debounces relevant mutations by 100 ms, tracks element/wrapper/metadata identity, restores removed live badges, and replaces cloned orphan hosts. Infinite-scroll shimmers and inert templates are ignored.

HLTB has an undocumented internal interface. The adapter tries the saved endpoint and known paths; on 404 it can inspect up to 12 same-origin bundles, at most once per ten minutes. It shares handshakes, refreshes an expired token once, supports optional legacy honeypot fields, and times out HTTP requests after ten seconds.

Requests omit credentials. Chrome MV3 uses a scoped `declarativeNetRequest` rule; Firefox MV2 uses `webRequest` to set HLTB's required Referer/Origin only for this extension's API requests. Header setup precedes searches. Callback message responses support older Chrome versions. Only queried titles are sent to HLTB; account details and game-log data stay local.

## Validation and limits

Vitest covers matching, formatting, permanent cache retention/reset, transport recovery, queue pacing/cooldowns, visible-card retries, failed year lookup, and Turbo metadata changes. Playwright runs the built extension in isolated headless Chromium with controlled fixtures and the real Turbo library, including lazy stream appends, both pagination modes, cache reuse, cooldown recovery, paired Pokémon matching, and opt-in error logging.

Direct HLTB checks on 2026-10-05 confirmed Scarlet as `104683`, “Pokémon Scarlet and Violet,” and Y as `13937`, “Pokémon X and Y,” behind an unrelated popular result. Selecting the first search result is unsafe. Live Backloggd requests returned a bot-check response, so DOM fixtures follow supplied markup without session data. Firefox builds are checked; its runtime header behavior has not been tested in Firefox.

Future HLTB protocol or Backloggd markup changes, unusual titles, and games outside the first 20 search results can still prevent a match. The source link and cache refresh help inspect and recover estimates; manual per-game overrides are not included.
