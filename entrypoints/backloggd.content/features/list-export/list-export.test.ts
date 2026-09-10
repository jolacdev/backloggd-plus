import { downloadListJSON } from './json';
import { ListDetails, parseListPage } from './list-dom';

const { triggerBlobDownloadMock } = vi.hoisted(() => ({
  triggerBlobDownloadMock: vi.fn(),
}));

vi.mock('@content/shared/utils/download', () => ({
  triggerBlobDownload: triggerBlobDownloadMock,
}));

const parseHtml = (html: string): Document =>
  new DOMParser().parseFromString(html, 'text/html');

/** Mirrors the nesting Backloggd renders for one grid-view list entry. */
const entryHtml = ({
  id,
  cardClass = '',
  name,
  noteHtml = '',
  slug,
  statusHtml = '',
}: {
  id: string;
  name: string;
  slug: string;
  cardClass?: string;
  noteHtml?: string;
  statusHtml?: string;
}) => `
  <div class="col-cus-3 col-md-cus-5 mt-2 px-1 rating-hover grid-list-entry">
    <div class="row position-relative">
      <div class="col">
        <a href="/games/${slug}/">
          <div class="card mx-auto game-cover quick-access ${cardClass}" game_id="${id}">
            <a href="/games/${slug}/" class="cover-link" data-turbo-frame="_top"></a>
            <div class="overflow-wrapper">
              <img class="card-img height" src="https://images.igdb.com/${id}.jpg" alt="${name}">
              <div class="overlay"></div>
              ${statusHtml}
            </div>
            <div class="game-text-centered">${name}</div>
          </div>
        </a>
      </div>
      ${noteHtml}
    </div>
  </div>`;

// Backloggd renders this overlay for any game carrying a log, whatever its
// actual status; only `.fade-played` on the card means it was really played.
const statusOverlay = (status: string) =>
  `<div class="status-overlay d-none">
     <div class='status-bubble play-type-bkg ${status.toLowerCase()}'></div>${status}
   </div>`;

const PLAYED_CARD = 'fade-played';

const listHtml = (entries: string, totalGames: number) => `
  <div class="row mx-0 mt-3">
    <div class="col-auto mt-auto px-0 mr-2 list-title"><h1 class="mb-0">My Unranked List</h1></div>
  </div>
  <div class="row mt-2" id="list-entries">
    <div class="col">
      <p class="mb-0 subtitle-text">${totalGames} Games</p>
      <div class="row mx-0 toggle-fade">${entries}</div>
    </div>
  </div>`;

// Grid view keeps the note in a hidden span beside the card.
const gridNote = (note: string) =>
  `<span class="note-content d-none">${note}</span>`;

describe('parseListPage — standard list in grid view', () => {
  const page = parseListPage(
    parseHtml(
      listHtml(
        [
          entryHtml({ id: '2286', name: 'Pokémon X', slug: 'pokemon-x' }),
          entryHtml({
            id: '2287',
            cardClass: PLAYED_CARD,
            name: 'Pokémon Y',
            noteHtml: gridNote('This is an entry note.'),
            slug: 'pokemon-y',
            statusHtml: statusOverlay('Completed'),
          }),
          // Backlogged, but Backloggd still renders a "Completed" overlay.
          entryHtml({
            id: '12515',
            name: 'Pokémon Go',
            slug: 'pokemon-go',
            statusHtml: statusOverlay('Completed'),
          }),
        ].join(''),
        3,
      ),
    ),
  );

  it('reads the list title and total game count', () => {
    expect(page.title).toBe('My Unranked List');
    expect(page.totalGames).toBe(3);
  });

  it('extracts every entry in page order', () => {
    expect(page.entries.map(({ id, name }) => ({ id, name }))).toEqual([
      { id: '2286', name: 'Pokémon X' },
      { id: '2287', name: 'Pokémon Y' },
      { id: '12515', name: 'Pokémon Go' },
    ]);
  });

  it('extracts cover and game URLs', () => {
    expect(page.entries[0].url).toBe('https://backloggd.com/games/pokemon-x/');
    expect(page.entries[0].coverUrl).toBe('https://images.igdb.com/2286.jpg');
  });

  it('extracts entry notes only where present', () => {
    expect(page.entries.map(({ note }) => note)).toEqual([
      undefined,
      'This is an entry note.',
      undefined,
    ]);
  });

  it('leaves categories unset, since only GOTY lists group entries', () => {
    expect(page.entries.every(({ category }) => category === undefined)).toBe(
      true,
    );
  });

  it('reads a played status only from a faded card', () => {
    // Pokémon Go carries a "Completed" overlay but is not faded: Backloggd
    // renders that overlay for any logged game, so it must not be trusted.
    expect(page.entries.map(({ status }) => status)).toEqual([
      undefined,
      'completed',
      undefined,
    ]);
  });

  it('lowercases the status to match the keys used by the list stats', () => {
    const doc = parseHtml(
      listHtml(
        entryHtml({
          id: '1',
          cardClass: PLAYED_CARD,
          name: 'Shelved Game',
          slug: 'shelved-game',
          statusHtml: statusOverlay('Shelved'),
        }),
        1,
      ),
    );

    expect(parseListPage(doc).entries[0].status).toBe('shelved');
  });
});

describe('parseListPage — resilience', () => {
  it('drops entries without a game id', () => {
    const doc = parseHtml(`<div id="list-entries">
      <div class="detail-list-entry"><div class="card game-cover"></div></div>
      ${entryHtml({ id: '7', name: 'Kept', slug: 'kept' })}
    </div>`);

    expect(parseListPage(doc).entries.map(({ id }) => id)).toEqual(['7']);
  });

  it('returns empty results for an unrelated document', () => {
    const page = parseListPage(parseHtml('<p>nothing here</p>'));

    expect(page.entries).toEqual([]);
    expect(page.totalGames).toBe(0);
    expect(page.title).toBe('');
  });
});
// Backloggd renders this progress panel twice: once for mobile, once for the
// desktop sidebar, with duplicate ids.
const statsHtml = (repeat: number) =>
  `
  <button class="button-link list-progress-expand">
    <div class="row my-1">
      <div class="col my-auto pr-0" id="list-progress-label">
        <p class="subtitle-text mb-0 text-left">You've played<br> 4 / 21 games</p>
      </div>
    </div>
    <div class="row d-none list-progress-extra">
      <div class="col">
        <div class="row mt-2"><div class="col">
          <p class="mb-0 list-progress-type-label">3 Completed</p>
          <div class="progress-js list-progress-type" id="completed" progress="0.75"></div>
        </div></div>
        <div class="row mt-2"><div class="col">
          <p class="mb-0 list-progress-type-label">0 Retired</p>
          <div class="progress-js list-progress-type" id="retired" progress="0.0"></div>
        </div></div>
        <div class="row mt-2"><div class="col">
          <p class="mb-0 list-progress-type-label">1 Abandoned</p>
          <div class="progress-js list-progress-type" id="abandoned" progress="0.25"></div>
        </div></div>
        <div class="row mt-2"><div class="col-auto mx-auto">
          <p class="mb-0" id="list-progress-avg-rating">Your avg rating <span id="avg-rating">3.50</span></p>
        </div></div>
      </div>
    </div>
  </button>`.repeat(repeat);

describe('parseListPage — viewer stats', () => {
  const parseStats = (html: string) =>
    parseListPage(parseHtml(listHtml('', 21) + html)).stats;

  it('reads played count, per-status counts and average rating', () => {
    expect(parseStats(statsHtml(1))).toEqual({
      averageRating: 3.5,
      playedGames: 4,
      statuses: { abandoned: 1, completed: 3, retired: 0 },
    });
  });

  it('reads the panel once even though Backloggd renders it twice', () => {
    expect(parseStats(statsHtml(2))).toEqual(parseStats(statsHtml(1)));
  });

  it('is undefined when the progress panel is absent', () => {
    expect(parseStats('')).toBeUndefined();
  });

  it('leaves the average rating null when the user has rated nothing', () => {
    const html = statsHtml(1).replace('>3.50<', '><');

    expect(parseStats(html)?.averageRating).toBeNull();
  });
});

describe('parseListPage — description', () => {
  it('reads the list description', () => {
    const doc = parseHtml(
      '<div id="list-desc"><div class="collapse-text-body"> Description for Unranked List. </div></div>',
    );

    expect(parseListPage(doc).description).toBe(
      'Description for Unranked List.',
    );
  });
});

const listDetails: ListDetails = {
  description: 'Description for Unranked List.',
  kind: 'standard',
  owner: 'forefo8216',
  sort: 'user',
  title: 'My Unranked List',
  totalGames: 21,
  url: 'https://backloggd.com/u/forefo8216/list/my-unranked-list/',
  entries: [
    {
      id: '2286',
      coverUrl: 'https://cdn/co1z8y.jpg',
      name: 'Pokémon X',
      position: 1,
      url: 'https://backloggd.com/games/pokemon-x/',
    },
    {
      id: '2287',
      category: 'Game of the Year',
      name: 'Pokémon Y',
      note: 'This is an entry note.',
      position: 2,
      url: 'https://backloggd.com/games/pokemon-y/',
    },
  ],
  stats: {
    averageRating: 3.5,
    playedGames: 4,
    statuses: { abandoned: 1, completed: 3 },
  },
};

const getDownloadedJSON = () => {
  const [json, filename, mimeType] = triggerBlobDownloadMock.mock.calls[0];
  return { filename, mimeType, parsed: JSON.parse(json as string) };
};

describe('downloadListJSON', () => {
  it('downloads a JSON blob under the given filename', () => {
    downloadListJSON(listDetails, 'list.json');

    const { filename, mimeType } = getDownloadedJSON();

    expect(filename).toBe('list.json');
    expect(mimeType).toBe('application/json;charset=utf-8;');
  });

  it('nests the list details, the viewer stats and the entries', () => {
    downloadListJSON(listDetails);

    const { parsed } = getDownloadedJSON();

    expect(Object.keys(parsed)).toEqual([
      'exportedAt',
      'list',
      'stats',
      'entries',
    ]);
    expect(parsed.list).toEqual({
      description: 'Description for Unranked List.',
      kind: 'standard',
      owner: 'forefo8216',
      sort: 'user',
      title: 'My Unranked List',
      totalGames: 21,
      url: 'https://backloggd.com/u/forefo8216/list/my-unranked-list/',
    });
    expect(parsed.stats).toEqual(listDetails.stats);
    expect(Date.parse(parsed.exportedAt)).not.toBeNaN();
  });

  it('gives every entry the same keys, nulling absent fields', () => {
    downloadListJSON(listDetails);

    const { parsed } = getDownloadedJSON();
    const [first, second] = parsed.entries;

    expect(Object.keys(first)).toEqual(Object.keys(second));
    expect(first).toEqual({
      id: '2286',
      category: null,
      coverUrl: 'https://cdn/co1z8y.jpg',
      name: 'Pokémon X',
      note: null,
      position: 1,
      status: null,
      url: 'https://backloggd.com/games/pokemon-x/',
    });
    expect(second.category).toBe('Game of the Year');
    expect(second.note).toBe('This is an entry note.');
  });

  it('writes null stats when the progress panel was not found', () => {
    downloadListJSON({ ...listDetails, stats: undefined });

    expect(getDownloadedJSON().parsed.stats).toBeNull();
  });
});

/**
 * Trimmed from a real GOTY list page (`/u/forefo8216/list/goty/2025`), keeping
 * what the parser depends on: the `data-route` marker, the header, and one
 * primary plus two supporting entries. Category and position headers are
 * duplicated for mobile and desktop exactly as Backloggd renders them.
 */
const GOTY_PAGE_HTML = `
<body data-authenticated="true" data-route="list#goty_list">
  <div class="row d-md-none my-2">
    <div class="col">
      <a href="/u/forefo8216/list/goty/2025/edit/" class="btn btn-general-outline btn-small w-100">Edit choices</a>
    </div>
  </div>
  <div class="row mt-3 mb-2">
    <div class="col-12 col-md">
      <div class="row"><div class="col-auto pr-1"><h1 class="mt-md-2 mb-1 goty-list-year">2025</h1></div>
      <div class="col pl-1 mt-auto"><h2 class="goty-list-subtitle">top picks</h2></div></div>
    </div>
    <div class="col-auto my-auto goty-list-creation-info d-md-none">
      <div class="row"><div class="col-auto pr-1"><p>Curated by <a href="/u/forefo8216/">forefo8216</a></p></div></div>
    </div>
    <div class="col-auto my-auto goty-list-creation-info d-none d-md-block">
      <div class="row"><div class="col-auto pr-1 ml-auto"><p>4 Categories</p></div></div>
      <div class="row mt-1">
        <div class="col-auto ml-auto">
          <a href="/u/forefo8216/list/goty/2025/edit/" class="btn btn-general-outline">Edit choices</a>
        </div>
      </div>
    </div>
  </div>
  <div class="row mb-1" id="list-desc-row">
    <div class="col" id="list-desc">
      <div class="collapse-text-body " id="list-desc-260198">
              Optional GOTY list description.
      </div>
    </div>
  </div>

  <div class="container backloggd-container lg-container goty-list-entry h-100" id="primary-goty-entry">
    <div class="row mb-2 goty-entry-category-header d-md-none">
      <div class="col-auto px-1 my-auto"><p class="mb-0 goty-category">GAME OF THE YEAR</p></div>
      <div class="col-auto my-auto ml-auto"><p class="mb-0 goty-position">01</p></div>
    </div>
    <div class="row">
      <div class="col-auto my-auto ml-auto d-none d-md-block"><p class="mb-0 goty-position">01</p></div>
      <div class="col col-cus-3">
        <a href="/games/clair-obscur-expedition-33/">
          <div class="card mx-auto game-cover overlay-hide" game_id="305152">
            <div class="overflow-wrapper">
              <img class="card-img height" src="https://images.igdb.com/co9gan.jpg" alt="Clair Obscur: Expedition 33">
            </div>
          </div>
        </a>
      </div>
      <div class="col-12 col-md my-auto">
        <div class="row mb-2 goty-entry-category-header d-none d-md-flex">
          <div class="col-auto px-1 my-auto"><p class="mb-0 goty-category">GAME OF THE YEAR</p></div>
        </div>
        <div class="row"><div class="col-auto">
          <a href="/games/clair-obscur-expedition-33/"><h2 class="game-title mb-0">Clair Obscur: Expedition 33</h2></a>
        </div></div>
        <div class="row mx-n1 goty-details mt-1">
          <div class="col-auto px-1"><a href="/company/sandfall-interactive/"><p class="mb-0">Sandfall Interactive</p></a></div>
        </div>
      </div>
    </div>
  </div>

  <div class="row mb-3 mt-5"><div class="col"><h3 id="supporting-categories-title">Supporting <small>categories</small></h3></div></div>
  <div class="row mb-4 mx-n2">
    <div class="col-12 mb-3">
      <div class="container backloggd-container lg-container goty-list-entry h-100">
        <div class="row goty-entry-category-header mb-2 d-md-none">
          <div class="col-auto my-auto pl-0 pr-2"><p class="mb-0 goty-category">BEST GAMEPLAY</p></div>
          <div class="col-auto my-auto ml-auto"><p class="mb-0 goty-position">02</p></div>
        </div>
        <div class="row">
          <div class="col-auto mb-auto ml-auto d-none d-md-block"><p class="mb-0 goty-position">02</p></div>
          <div class="col-3 col-md-1 pr-1">
            <a href="/games/hollow-knight-silksong/">
              <div class="card mx-auto game-cover overlay-hide" game_id="115289">
                <div class="overflow-wrapper">
                  <img class="card-img height" src="https://images.igdb.com/cobebu.jpg" alt="Hollow Knight: Silksong">
                </div>
              </div>
            </a>
          </div>
          <div class="col my-auto my-md-0">
            <div class="row goty-entry-category-header mb-2 d-none d-md-flex">
              <div class="col-auto my-auto pl-0 pr-2"><p class="mb-0 goty-category">BEST GAMEPLAY</p></div>
            </div>
            <div class="row"><div class="col my-auto">
              <div class="row mb-1"><div class="col-auto">
                <a href="/games/hollow-knight-silksong/"><h3 class="game-title mb-0">Hollow Knight: Silksong</h3></a>
              </div></div>
              <div class="row mx-n1 goty-publishers mb-1">
                <div class="col-auto px-1"><a href="/company/team-cherry/"><p class="mb-0">Team Cherry</p></a></div>
              </div>
            </div></div>
          </div>
        </div>
      </div>
    </div>
    <div class="col-12 mb-3">
      <div class="container backloggd-container lg-container goty-list-entry h-100">
        <div class="row goty-entry-category-header mb-2 d-md-none">
          <div class="col-auto my-auto pl-0 pr-2"><p class="mb-0 goty-category">BEST MULTIPLAYER</p></div>
          <div class="col-auto my-auto ml-auto"><p class="mb-0 goty-position">03</p></div>
        </div>
        <div class="row">
          <div class="col-auto mb-auto ml-auto d-none d-md-block"><p class="mb-0 goty-position">03</p></div>
          <div class="col-3 col-md-1 pr-1">
            <a href="/games/peak--1/">
              <div class="card mx-auto game-cover overlay-hide" game_id="349524">
                <div class="overflow-wrapper">
                  <img class="card-img height" src="https://images.igdb.com/cocokj.jpg" alt="Peak">
                </div>
              </div>
            </a>
          </div>
          <div class="col my-auto my-md-0">
            <div class="row goty-entry-category-header mb-2 d-none d-md-flex">
              <div class="col-auto my-auto pl-0 pr-2"><p class="mb-0 goty-category">BEST MULTIPLAYER</p></div>
            </div>
            <div class="row"><div class="col my-auto">
              <div class="row mb-1"><div class="col-auto">
                <a href="/games/peak--1/"><h3 class="game-title mb-0">Peak</h3></a>
              </div></div>
            </div></div>
            <div class="row mt-2">
              <div class="col list-detail-note readmore-container" id="note1349383">
                <div class="readmore-content" data-readmore-max-height="75">
                    Custom note.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>`;

describe('parseListPage — GOTY list page', () => {
  const page = parseListPage(parseHtml(GOTY_PAGE_HTML));

  it('uses the year as the title and the entry count as the total', () => {
    // GOTY pages carry no "N Games" counter and never paginate.
    expect(page.title).toBe('2025');
    expect(page.totalGames).toBe(3);
    expect(page.description).toBe('Optional GOTY list description.');
  });

  it('reads the primary pick and the supporting picks in display order', () => {
    expect(
      page.entries.map(({ id, category, name }) => [category, id, name]),
    ).toEqual([
      ['GAME OF THE YEAR', '305152', 'Clair Obscur: Expedition 33'],
      ['BEST GAMEPLAY', '115289', 'Hollow Knight: Silksong'],
      ['BEST MULTIPLAYER', '349524', 'Peak'],
    ]);
  });

  it('reads each category once despite the duplicated mobile header', () => {
    // A naive querySelectorAll would see six category nodes for three entries.
    expect(page.entries).toHaveLength(3);
    expect(page.entries.every(({ category }) => !!category)).toBe(true);
  });

  it('extracts covers, game URLs and notes', () => {
    expect(page.entries[0].url).toBe(
      'https://backloggd.com/games/clair-obscur-expedition-33/',
    );
    expect(page.entries[0].coverUrl).toBe('https://images.igdb.com/co9gan.jpg');
    expect(page.entries.map(({ note }) => note)).toEqual([
      undefined,
      undefined,
      'Custom note.',
    ]);
  });

  it('has no viewer stats, because GOTY pages render no progress panel', () => {
    expect(page.stats).toBeUndefined();
  });

  it('does not mistake the supporting-categories heading for a category', () => {
    expect(
      page.entries.some(({ category }) => category?.includes('Supporting')),
    ).toBe(false);
  });
});

describe('downloadListJSON — GOTY list', () => {
  it('records the list kind so a bare year title is unambiguous', () => {
    const page = parseListPage(parseHtml(GOTY_PAGE_HTML));

    downloadListJSON({
      description: page.description,
      kind: 'goty',
      owner: 'forefo8216',
      stats: page.stats,
      title: page.title,
      totalGames: page.totalGames,
      url: 'https://backloggd.com/u/forefo8216/list/goty/2025/',
      entries: page.entries.map((entry, index) => ({
        ...entry,
        position: index + 1,
      })),
    });

    const { parsed } = getDownloadedJSON();

    expect(parsed.list).toEqual({
      description: 'Optional GOTY list description.',
      kind: 'goty',
      owner: 'forefo8216',
      sort: null, // GOTY pages have no sort variants.
      title: '2025',
      totalGames: 3,
      url: 'https://backloggd.com/u/forefo8216/list/goty/2025/',
    });
    expect(parsed.stats).toBeNull();
    expect(parsed.entries[0].category).toBe('GAME OF THE YEAR');
  });
});
