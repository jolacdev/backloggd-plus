/**
 * Require a Conventional Commit PR title so Release Please can classify the squash commit.
 * Runs in .github/workflows/ci.yml for pull requests; the workflow provides PR_TITLE.
 * Uses Node's built-in TypeScript support; no dependencies to install.
 */
import assert from 'node:assert/strict';

// Accept the supported types, an optional scope, and an optional breaking-change marker.
assert.match(
  process.env.PR_TITLE ?? '',
  /^(feat|fix|perf|refactor|docs|test|build|ci|chore|revert|deps)(\([^\r\n()]+\))?!?: .+$/,
  'Use a Conventional Commit PR title, e.g. fix(export): restore pagination',
);
