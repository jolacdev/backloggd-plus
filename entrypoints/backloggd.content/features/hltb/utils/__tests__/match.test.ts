import { HltbGame } from '@globalShared/types/hltb';

import { matchByTitle, matchByYear, normalizeTitle } from '../match';

/**
 * The guarantee under test throughout: **never show the wrong game's times.** Every case
 * here is either a match that must be trusted or an ambiguity that must be refused.
 */

const createGame = (
  game: Partial<HltbGame> & Pick<HltbGame, 'hltbId' | 'name'>,
): HltbGame => ({
  times: { all: 150549, hundred: 236141, main: 97204, plus: 149763 },
  ...game,
});

const godOfWar2005 = createGame({ hltbId: 1, name: 'God of War', year: 2005 });
const godOfWar2018 = createGame({ hltbId: 2, name: 'God of War', year: 2018 });

it.each([
  ['diacritics', 'Pokémon Red', 'pokemon red'],
  ['apostrophes', "Assassin's Creed", 'assassins creed'],
  ['ampersands', 'Ratchet & Clank', 'ratchet and clank'],
  ['punctuation', 'Half-Life 2: Episode  One', 'half life 2 episode one'],
])('normalizeTitle collapses %s', (_unused, title, expected) => {
  expect(normalizeTitle(title)).toBe(expected);
});

describe('matchByTitle', () => {
  it('matches a single exact title', () => {
    expect(matchByTitle('God of War', [godOfWar2018])).toEqual({
      game: godOfWar2018,
      status: 'matched',
    });
  });

  // `game_alias` is sometimes a comma-separated LIST. Backloggd takes its names from IGDB,
  // which uses the edition-qualified forms, so each part has to match on its own.
  it('matches one entry of a comma-separated alias list', () => {
    const minecraft = createGame({
      hltbId: 3,
      alias: 'Minecraft: Java Edition, Minecraft: Bedrock Edition',
      name: 'Minecraft',
    });

    expect(matchByTitle('Minecraft: Bedrock Edition', [minecraft])).toEqual({
      game: minecraft,
      status: 'matched',
    });
  });

  // Only a bare year suffix marks a remake. Treating `Portal 2` or `God of War Ragnarök`
  // as ambiguous would trigger a needless year lookup for every game with a sequel.
  it.each([
    ['a numbered sequel', 'Portal', 'Portal 2'],
    ['a subtitled sequel', 'God of War', 'God of War Ragnarök'],
  ])('does not treat %s as an ambiguity', (_unused, title, siblingName) => {
    const game = createGame({ hltbId: 4, name: title });
    const sibling = createGame({ hltbId: 5, name: siblingName });

    expect(matchByTitle(title, [game, sibling])).toEqual({
      game,
      status: 'matched',
    });
  });

  it('refuses to guess between two identically titled games', () => {
    expect(matchByTitle('God of War', [godOfWar2005, godOfWar2018])).toEqual({
      candidates: [godOfWar2005, godOfWar2018],
      status: 'needs-year',
    });
  });

  // A single exact match is NOT enough here: HowLongToBeat disambiguates remakes with a
  // bare year suffix, so the Backloggd card may well be the 2019 entry.
  it('escalates when a year-suffixed variant sits alongside an exact match', () => {
    const original = createGame({ hltbId: 10, name: 'Resident Evil 2' });
    const remake = createGame({ hltbId: 11, name: 'Resident Evil 2 (2019)' });

    expect(matchByTitle('Resident Evil 2', [original, remake])).toEqual({
      candidates: [original, remake],
      status: 'needs-year',
    });
  });

  it('accepts a clear leader when nothing matches exactly', () => {
    const deluxe = createGame({ hltbId: 6, name: 'Mario Kart 8 Deluxe' });

    expect(
      matchByTitle('Mario Kart 8', [
        deluxe,
        createGame({ hltbId: 7, name: 'Thumper' }),
      ]),
    ).toEqual({ game: deluxe, status: 'matched' });
  });

  it.each([
    [
      'two candidates are equally plausible',
      'Sonic Mania',
      [
        createGame({ hltbId: 8, name: 'Sonic Mania Plus' }),
        createGame({ hltbId: 9, name: 'Sonic Mania Adventures' }),
      ],
    ],
    ['nothing resembles the title', 'Celeste', [godOfWar2018]],
    ['HowLongToBeat returned no entries', 'Celeste', []],
    ['the title is blank', '   ', [godOfWar2018]],
  ])('returns no-match when %s', (_unused, title, candidates) => {
    expect(matchByTitle(title, candidates)).toEqual({ status: 'no-match' });
  });
});

describe('matchByYear', () => {
  const candidates = [godOfWar2005, godOfWar2018];

  it('picks the entry whose release year matches', () => {
    expect(matchByYear(candidates, 2005)).toEqual({
      game: godOfWar2005,
      status: 'matched',
    });
  });

  // Release years drift by a year across regions and storefronts.
  it('tolerates a one-year drift when only one candidate is close', () => {
    expect(matchByYear(candidates, 2019)).toEqual({
      game: godOfWar2018,
      status: 'matched',
    });
  });

  it('refuses whenever the year cannot single out one entry', () => {
    const noYears = [createGame({ hltbId: 3, name: 'God of War' })];
    const sameYear = [
      godOfWar2018,
      createGame({ hltbId: 4, name: 'God of War', year: 2018 }),
    ];

    expect(matchByYear(candidates, undefined)).toEqual({ status: 'no-match' });
    expect(matchByYear(noYears, 2005)).toEqual({ status: 'no-match' });
    expect(matchByYear(sameYear, 2018)).toEqual({ status: 'no-match' });
  });
});
