import { HltbGame } from '@globalShared/types/hltb';

import { MatchOutcome } from '../types';

/**
 * Ties a Backloggd game to a HowLongToBeat entry. Showing nothing beats showing the wrong
 * game's times: the reference extension takes `data[0]` from a title search, which is how
 * it puts God of War (2018)'s times on God of War (2005). Every path here either clears an
 * explicit bar or returns `no-match`.
 *
 * All pure — no DOM, no network — so the whole decision tree is testable.
 */

/** Two candidates within this margin are indistinguishable, and both are rejected. */
const FUZZY_MIN_MARGIN = 0.15;
const FUZZY_MIN_SCORE = 0.85;
/** Release years drift by a year across regions and storefronts. */
const YEAR_TOLERANCE = 1;

const COVERAGE_WEIGHT = 0.6;
const JACCARD_WEIGHT = 0.4;

/**
 * HowLongToBeat disambiguates a remake from the original with a bare year suffix —
 * `Resident Evil 2` vs `Resident Evil 2 (2019)`. Sequels (`Portal 2`) and subtitles
 * (`God of War Ragnarök`) deliberately do not count, or every game with a sequel would
 * trigger a needless year lookup.
 */
const YEAR_SUFFIX_PATTERN = /^(?:19|20)\d{2}$/;

/**
 * Strips diacritics and punctuation so `Pokémon` and `Pokemon` compare equal. Edition and
 * platform suffixes are deliberately **not** stripped — they distinguish genuinely
 * separate HowLongToBeat entries.
 */
export const normalizeTitle = (title: string): string =>
  title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // Combining diacritical marks left by NFD.
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’`´]/g, '') // Apostrophes stay inside a token.
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const tokenize = (normalized: string) =>
  normalized.split(' ').filter((token) => token.length > 0);

/**
 * NOTE: `game_alias` is sometimes a comma-separated LIST, not a single title — Minecraft's,
 * verified live, is `"Minecraft: Java Edition, Minecraft: Bedrock Edition, ..."`. Backloggd
 * names come from IGDB, which uses those edition-qualified forms, so each part has to be
 * comparable on its own.
 */
const getComparableTitles = (game: HltbGame) => {
  const aliasParts = game.alias ? game.alias.split(',') : [];

  return [
    ...new Set(
      [game.name, game.alias, ...aliasParts]
        .filter((title): title is string => Boolean(title))
        .map(normalizeTitle)
        .filter((title) => title.length > 0),
    ),
  ];
};

/**
 * Blends how much of the Backloggd title the candidate covers with how much extra it
 * carries. Coverage is weighted higher so `Resident Evil 2` still scores well against
 * `Resident Evil 2 (2019)`, while an unrelated title scores near zero.
 */
const scoreSimilarity = (queryTokens: string[], candidateTokens: string[]) => {
  if (queryTokens.length === 0 || candidateTokens.length === 0) return 0;

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

/**
 * Stage one: title only, which is all a library card gives us. Returns `needs-year` when
 * several entries share the title exactly (God of War 2005 and 2018) or a year-suffixed
 * variant sits beside an exact match (Resident Evil 2 and its 2019 remake) — in that
 * second case one exact match is *not* enough, since the card may well be the remake.
 */
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

/**
 * Stage two: settle a `needs-year` outcome against the Backloggd release year. Refuses
 * unless exactly one candidate fits, and refuses when no year is available — an unmatched
 * game beats a confidently wrong one.
 */
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
