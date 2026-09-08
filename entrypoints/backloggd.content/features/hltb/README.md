# HowLongToBeat Badges (`features/hltb`)

> Completion times on every game card in a user's Backloggd library
> (`/u/:username/games/*`, any sort or filter), as a small badge on the cover with a
> hover/focus breakdown.

## Design principle

**Showing nothing beats showing the wrong game's times.**

The reference extension this replaces takes `data[0]` from a title search, which is how it
ends up putting God of War (2018)'s times on God of War (2005). Every decision here refuses
rather than guesses.

There are only ever **two visual outcomes**: a badge with a real number, or an untouched
card. No spinner, no placeholder, no "unknown" pill — which makes the two most-reported
failures of the reference extension (a grey badge with no number, a tooltip stuck on
"Loading…") unrepresentable.

## Architecture

```
Backloggd DOM ──► utils/cards ──► api/resolve ──► api/cache ──► components (React portals)
                                       │
                                       ▼ runtime message
                              @background/hltb (transport)
```

The split is strict: this feature knows nothing about HowLongToBeat's wire format, and the
background worker knows nothing about Backloggd. The contract is
[`@globalShared/types/hltb`](../../../shared/types/hltb.ts). If HowLongToBeat rotates its
API again — it has done so four times — only `entrypoints/background/hltb/client.ts`
changes.

| Path | Responsibility |
| --- | --- |
| `api/cache.ts` | Persistent cache keyed by IGDB id, with batched writes. |
| `api/resolve-hltb-game.ts` | The pipeline: search → match → year tiebreak → cache. |
| `api/search-hltb-games.ts` | The runtime message to the background worker. |
| `api/get-game-release-year.ts` | Same-origin lookup of a game's release year. |
| `api/keys.ts` | React Query keys. |
| `components/` | `HltbLayer` (root), `HltbCardBadge` (portal), `HltbTooltip`, `badge.css`. |
| `hooks/useGameCards.ts` | The `MutationObserver` card registry. |
| `hooks/useIsProfileGamesPage.ts` | Route tracking across Turbo navigation. |
| `hooks/useIsNearViewport.ts` | Per-card viewport gate — the main performance lever. |
| `hooks/useTooltipAnchor.ts` | Shared tooltip state and its deferred dismissal. |
| `hooks/useBadgeStylesheet.ts` | Injects the light-DOM badge styles once per page. |
| `utils/cards.ts` | **Every Backloggd selector** and the DOM reads built on them. |
| `utils/match.ts` | Pure matching and scoring. The most heavily tested file. |
| `utils/format.ts` | Seconds → `12h` / `12½h` / `45m`, and default-category fallback. |
| `utils/tooltip.ts` | Tooltip placement: viewport clamping and flip direction. |
| `types.ts` | Feature-local types. |

Tests live in a `__tests__/` folder inside the directory they cover.

Each module's own header carries the reasoning behind its trickier decisions; this file is
the map, not a duplicate of them.

## Game matching

Backloggd's `game_id` attribute **is the IGDB game id**, which makes a stable cache key —
but it does not solve matching, because HowLongToBeat has no IGDB ids. So:

1. **Cache** — a fresh entry short-circuits everything, with no request at all.
2. **Search** — the background returns normalized candidates, DLC already filtered out.
3. **Title match** — normalize both sides and compare against the entry's name *and* each
   part of its alias list. Exactly one candidate wins; several escalate to the release
   year; none falls back to fuzzy scoring, which accepts only a candidate clearing a high
   threshold **and** leading the runner-up by a clear margin.

### The year escalation

Library cards carry **no release year** — the visible date is the user's play date. The
year is fetched lazily from the game's own Backloggd page (same-origin, cached for the
page's lifetime) and only when the title cannot decide. Two cases trigger it:

- **Identical titles.** `God of War` returns both the 2005 and 2018 entries.
- **A year-suffixed variant beside an exact match.** HowLongToBeat disambiguates remakes
  with a bare year suffix (`Resident Evil 2` vs `Resident Evil 2 (2019)`), so a single
  exact match is not enough — the card may well be the remake.

Numbered sequels (`Portal 2`) and subtitles (`God of War Ragnarök`) deliberately do not
trigger it. If the year cannot settle it, the result is `no-match`. That refusal is the
point.

## Caching

`local:hltbResolutions`, keyed by IGDB id. 30 days for matched entries, 7 days for
`no-match` (so a game HowLongToBeat adds later is picked up within the week). Capped at
5000 entries, pruning the oldest on write. Read once into memory and flushed when the user
leaves the library; writes are batched (2s debounce, or every 25 resolutions) because the
whole map is a single storage value.

**Transport failures are never cached** — a brief outage must not blank a game for a month.

## Performance

A library can hold thousands of games. In order of impact:

1. **`IntersectionObserver` gating** (`rootMargin: 200px`) — a 1000-game library issues
   ~20 requests, not 1000.
2. **Persistent cache** — revisiting a library issues zero requests.
3. **Background queue** — concurrency 3, minimum 150ms between dispatches, plus a circuit
   breaker that stops calling a dead API entirely.
4. **Deduplication** at two levels: React Query by IGDB id, the background by title.
5. **One React root** driving every badge via portals, rather than one root per card.

## Rendering: a documented exception

Badges are rendered with `createPortal` into Backloggd's own cards and styled by
`badge.css` in the **light DOM** — not the Shadow DOM the rest of the extension uses. A
shadow root per badge would mean, on a 200-card page, 200 shadow roots, 200 React roots and
200 copies of the Tailwind/DaisyUI stylesheet; badges also need to sit inside Backloggd's
grid to inherit its responsive behaviour. The cost is that they cannot use Tailwind, so
`components/badge.css` uses `bgpl-` prefixed names and resets inherited properties explicitly.

The tooltip stays inside the Shadow DOM and keeps Tailwind. Both sides reference
Backloggd's own CSS custom properties (`--back-text`, …) with hardcoded fallbacks; because
custom properties inherit, they pierce the shadow boundary and track the site's theme for
free.

A **top-right** overlay on the cover art: zero layout shift, and it works on every route
variant — which is why the position is **not** configurable, despite the reference
extension offering it. The corner and the `z-index` are dictated by Backloggd's own layers
(`.cover-link` at 5 is an *invisible* full-card anchor; `.quick-access-bar` at 10 owns the
bottom), documented in `components/badge.css`.

The badge never navigates: it sits on top of the cover link, and hijacking a click meant
for the game would be worse than the small dead zone it costs. Click opens the tooltip too,
so the breakdown is reachable on touch, and the full breakdown is the badge's `aria-label`,
so assistive tech never needs the tooltip at all. **The hover region is the whole card**,
not the badge — see `components/HltbLayer.tsx` for why the dismissal is deferred.

## Dynamic Backloggd

Backloggd changes pages three different ways, and each announces itself differently — see
[`shared/utils/navigation.ts`](../../shared/utils/navigation.ts) for the table. The
library's own sort and filter links are Turbo **frame** navigations, so the URL changes via
`pushState`, only the frame re-renders, and `turbo:load` never fires. Getting this wrong
produces one symptom: loading a filtered URL directly works, navigating to it shows nothing.

Three consequences drive the design:

1. **The layer mounts once per document** and tracks the route itself
   (`useIsProfileGamesPage`), so there is no per-navigation teardown to get wrong. The
   entry point only re-creates the shadow host when a full Drive visit has replaced
   `<body>` and taken it along.
2. **The library container element is replaced**, so the `MutationObserver` watches
   `document.body` rather than the container — an observer bound to the container would be
   left watching a detached node and would never fire again. Records are filtered down to
   card-shaped changes first, so a page-wide observer stays cheap.
3. **The scan is idempotent by construction**: it rebuilds the list from the DOM every time
   rather than tracking which cards it has seen, so a morphed, detached or re-attached node
   can never be processed twice or silently dropped.

## Known limitations

- **No manual correction UI yet.** A confidently wrong match can only be reported, not
  fixed; the game-details feature will add id-based lookup alongside the UI.
- **Ambiguous titles cost one extra same-origin Backloggd request** each (cached).
- **Games absent from HowLongToBeat render nothing.** Intended, not a bug.
- A change to HowLongToBeat's request *schema* (rather than just its path) still needs a
  release, though the isolation boundary keeps the fix to one file.
