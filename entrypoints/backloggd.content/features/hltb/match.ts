import { HltbGame } from '@globalShared/hltb';

export type MatchOutcome =
  | { candidates: HltbGame[]; status: 'needs-year' }
  | { game: HltbGame; status: 'matched' }
  | { status: 'no-match' };

const FUZZY_MIN_MARGIN = 0.15;
const FUZZY_MIN_SCORE = 0.85;
const YEAR_TOLERANCE = 1;

const COVERAGE_WEIGHT = 0.6;
const JACCARD_WEIGHT = 0.4;

const YEAR_SUFFIX_PATTERN = /^(?:19|20)\d{2}$/;

// HLTB combines these versions even when its aliases contain only the combined title.
// Explicit pairs keep DLC, bundles, and arbitrary titles containing "and" separate.
const POKEMON_VERSION_PAIRS = [
  'red and blue',
  'gold and silver',
  'ruby and sapphire',
  'firered and leafgreen',
  'diamond and pearl',
  'heartgold and soulsilver',
  'black and white',
  'black 2 and white 2',
  'x and y',
  'omega ruby and alpha sapphire',
  'sun and moon',
  'ultra sun and ultra moon',
  'sword and shield',
  'brilliant diamond and shining pearl',
  'scarlet and violet',
];

const expandPokemonVersions = (title: string): string[] => {
  if (!title.startsWith('pokemon ')) return [title];
  const pair = title.slice('pokemon '.length);
  if (!POKEMON_VERSION_PAIRS.includes(pair)) return [title];
  return [title, ...pair.split(' and ').map((version) => `pokemon ${version}`)];
};

/** Normalize punctuation and diacritics while preserving Unicode names and edition tokens. */
export const normalizeTitle = (title: string): string =>
  title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // Combining diacritical marks left by NFD.
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’`´]/g, '') // Apostrophes stay inside a token.
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

const tokenize = (normalized: string) => [
  ...new Set(normalized.split(' ').filter((token) => token.length > 0)),
];

const getComparableTitles = (game: HltbGame) => {
  const aliasParts = game.alias ? game.alias.split(',') : [];

  return [
    ...new Set(
      [game.name, game.alias, ...aliasParts]
        .filter((title): title is string => Boolean(title))
        .map(normalizeTitle)
        .flatMap(expandPokemonVersions)
        .filter((title) => title.length > 0),
    ),
  ];
};

const scoreSimilarity = (queryTokens: string[], candidateTokens: string[]) => {
  if (queryTokens.length === 0 || candidateTokens.length === 0) return 0;

  // A close title must still identify the same sequel and edition.
  const identityTokens = (tokens: string[]) =>
    tokens
      .filter(
        (token) =>
          (/^\d+$/.test(token) && !YEAR_SUFFIX_PATTERN.test(token)) ||
          /^(remaster(?:ed)?|remake|definitive|deluxe|edition|hd)$/.test(token),
      )
      .sort()
      .join(' ');
  if (identityTokens(queryTokens) !== identityTokens(candidateTokens)) return 0;

  const candidateSet = new Set(candidateTokens);
  const matched = queryTokens.filter((token) => candidateSet.has(token)).length;
  const union = new Set([...queryTokens, ...candidateTokens]).size;

  return (
    (matched / queryTokens.length) * COVERAGE_WEIGHT +
    (matched / union) * JACCARD_WEIGHT
  );
};

const isYearDisambiguatedVariant = (
  normalizedTitle: string,
  candidateTitle: string,
) =>
  candidateTitle.startsWith(`${normalizedTitle} `) &&
  YEAR_SUFFIX_PATTERN.test(candidateTitle.slice(normalizedTitle.length + 1));

const matchFuzzy = (
  normalizedTitle: string,
  candidates: HltbGame[],
): MatchOutcome => {
  const queryTokens = tokenize(normalizedTitle);

  const [best, runnerUp] = candidates
    .map((game) => ({
      game,
      score: Math.max(
        0,
        ...getComparableTitles(game).map((candidateTitle) =>
          scoreSimilarity(queryTokens, tokenize(candidateTitle)),
        ),
      ),
    }))
    .sort((a, b) => b.score - a.score);

  if (!best || best.score < FUZZY_MIN_SCORE) return { status: 'no-match' };

  // Two plausible candidates and no way to choose: refuse rather than guess.
  if (runnerUp && best.score - runnerUp.score < FUZZY_MIN_MARGIN) {
    return { status: 'no-match' };
  }

  return { game: best.game, status: 'matched' };
};

/** Prefer exact titles/aliases, and use a year tiebreak for same-title releases. */
export const matchByTitle = (
  title: string,
  candidates: HltbGame[],
): MatchOutcome => {
  const normalizedTitle = normalizeTitle(title);
  if (!normalizedTitle || candidates.length === 0) {
    return { status: 'no-match' };
  }

  const ambiguous = candidates.filter((game) =>
    getComparableTitles(game).some(
      (candidateTitle) =>
        candidateTitle === normalizedTitle ||
        isYearDisambiguatedVariant(normalizedTitle, candidateTitle),
    ),
  );

  if (ambiguous.length === 1) return { game: ambiguous[0], status: 'matched' };
  if (ambiguous.length > 1) {
    return { candidates: ambiguous, status: 'needs-year' };
  }

  return matchFuzzy(normalizedTitle, candidates);
};

/** Accept one exact year, or one candidate within a year when no unique exact year exists. */
export const matchByYear = (
  candidates: HltbGame[],
  year: number | undefined,
): MatchOutcome => {
  if (candidates.length === 0 || year === undefined) {
    return { status: 'no-match' };
  }

  const exact = candidates.filter((game) => game.year === year);
  const withinTolerance = candidates.filter(
    (game) =>
      game.year !== undefined && Math.abs(game.year - year) <= YEAR_TOLERANCE,
  );
  const survivors = exact.length === 1 ? exact : withinTolerance;

  return survivors.length === 1
    ? { game: survivors[0], status: 'matched' }
    : { status: 'no-match' };
};
