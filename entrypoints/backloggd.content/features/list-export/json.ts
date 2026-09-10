/* eslint-disable perfectionist/sort-objects */
import { triggerBlobDownload } from '@content/shared/utils/download';

import { ListDetails, ListEntry } from './list-dom';

// Optional fields are normalised to `null` so every entry has the same keys,
// instead of disappearing from the output as `undefined` would.
const toJSONEntry = ({
  category,
  coverUrl,
  id,
  name,
  note,
  position,
  status,
  url,
}: ListEntry) => ({
  position,
  id,
  name,
  status: status ?? null,
  category: category ?? null,
  note: note ?? null,
  coverUrl: coverUrl ?? null,
  url,
});

const toJSON = ({
  description,
  entries,
  kind,
  owner,
  sort,
  stats,
  title,
  totalGames,
  url,
}: ListDetails) => ({
  exportedAt: new Date().toISOString(),
  // `kind` disambiguates the title: GOTY lists are titled by year alone.
  // `sort` says what `position` means, since it follows the page's ordering.
  list: {
    title,
    kind,
    owner,
    url,
    description,
    sort: sort ?? null,
    totalGames,
  },
  stats: stats ?? null,
  entries: entries.map(toJSONEntry),
});

/**
 * Serialises a resolved list and triggers a download from the browser.
 * @param listDetails - The list details, the viewer's stats and its entries.
 * @param filename - The filename for the downloaded JSON file.
 */
export const downloadListJSON = (
  listDetails: ListDetails,
  filename: string = 'list.json',
): void => {
  const jsonString = JSON.stringify(toJSON(listDetails), null, 2);
  triggerBlobDownload(jsonString, filename, 'application/json;charset=utf-8;');
};
