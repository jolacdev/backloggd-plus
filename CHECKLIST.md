# Checklist

Deferred work, grouped by feature. Items are intentionally out of scope for now,
not bugs.

## List export

Exports **one list at a time**, **only for the logged-in user's own lists**, as
**JSON**. See
[`features/list-export/`](entrypoints/backloggd.content/features/list-export/).

- [ ] **Confirm a ranked list in grid view.** Standard lists are now requested
      as `.../user/grid/` specifically so ranked and unranked render the same
      markup, but only an unranked grid page has been seen. Notes are read by
      trying `.readmore-content`, `.note-content` and `.list-detail-note` in
      turn, which covers both grid and detail markup.
- [ ] **Confirm the played statuses beyond Completed and Shelved.** `status` is
      read from `.fade-played .status-overlay`; Retired, Abandoned and Played
      are assumed to follow the same shape but have not been observed.
- [ ] **Confirm a GOTY list with all six categories.** The parser was written
      against a real four-category page. Categories come from each entry's own
      `.goty-category`, so extra categories should need no change — but a GOTY
      list is also the only place a game can appear twice (once per category),
      which no consumer of the export has been checked against.
- [ ] **Confirm the stats panel on a list you have not played.** The parser was
      written against a panel showing `1 / 21` played. `stats` is `null` when the
      panel is missing entirely, and `averageRating` is `null` when `#avg-rating`
      is empty, but neither case has been seen on the live site.
- [ ] **Confirm the forced Grid view has no side effect.** The fetcher requests
      `/u/:user/list/:slug/user/grid/` (standard lists only; GOTY pages have no
      display variants). If Backloggd persists the Grid/Detail choice per user,
      this would silently change the user's preference — in that case, fetch the
      current URL instead and rely on the detail-view selectors, accepting that
      played status is unavailable there.
- [ ] **Distinguish ranked from unranked lists.** `list.kind` is only
      `standard` or `goty`, taken from the route. Telling a ranked list from an
      unranked one would need the `list-type-*` class, whose location on the page
      could not be confirmed. For a ranked list, `position` already carries the
      rank.
- [ ] **Export GOTY release/company details.** GOTY pages also show developer,
      publisher, release date and genres per pick. They are skipped because the
      primary and supporting entries expose different subsets, and standard lists
      expose none of it.
- [ ] **CSV output alongside JSON.** For people taking a list into Excel or
      Sheets. Would need flattening: entries as rows, stats and list details
      either dropped or repeated per row.
- [ ] **Export the rest of the log per entry.** Grid cards also embed a hidden
      `#preloaded-log-<id>` with backlog/wishlist/playing flags, a rating and a
      log id. It is documented as unreliable in
      [`api.ts`](entrypoints/backloggd.content/shared/types/api.ts), so only the
      played status is exported today.
- [ ] **Export any public list, not just your own.** The ownership gate is the
      username comparison in
      [`index.tsx`](entrypoints/backloggd.content/index.tsx); the scraper itself
      is already owner-agnostic. Note that `stats` are the *viewer's*, so they
      would stay meaningful only for lists the viewer has played through.
- [ ] **Bulk export from Settings → Data.** A second `SettingsActionRow` beside
      "Export games" that enumerates `/u/:user/lists/` and exports every list.
- [ ] **Mobile anchor.** The button is anchored to the desktop sidebar's "Edit
      List" row, so it does not appear on the mobile layout (`.row.d-md-none`).

## Game export

- [ ] No test coverage. The CSV/JSON parsers and the `useExport` phase machine
      are untested, while the utilities they now share are covered.
