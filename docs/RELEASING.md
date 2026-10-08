# Releases: Quick View

## Normal flow

After completing the one-time setup below:

1. **Local:** develop, run `pnpm test` / `pnpm lint:no-fix`, and check the affected UI.
2. **GitHub:** squash-merge your PR into `master` with a Conventional title, e.g. `feat(export): ...`. CI tests and packages both browsers.
3. **Release Please:** creates/updates a bot PR with the version and changelog. Review and squash-merge it; do not bump versions or create tags manually.
4. **Actions > Release:** creates a draft release for the tag, validates the tagged commit, and attaches Chrome/Firefox/source ZIPs.
5. **GitHub > Releases:** wait for **Actions > Release** to succeed, test the draft's ZIPs, then select **Publish release**. This starts **Publish to Firefox**, which validates the release and, after any configured environment approval, submits its Firefox ZIP, sources, and release notes to AMO.
6. **Firefox Add-ons:** check the version's review status in the AMO developer dashboard. GitHub publication and Firefox store availability are separate steps.

Workflows are in `.github/workflows/`: `ci.yml` checks and packages changes, `release.yml` prepares GitHub release drafts, and `publish.yml` submits published releases to Firefox. Their scripts mirror these names under `scripts/workflows/{ci,release,publish}/`; local `pnpm check:*` commands use the CI scripts too.

## Versioning

Use these prefixes in PR titles; squash commits drive the release version:

| Version bump              | Prefix                                                 | Example PR title                  |
| ------------------------- | ------------------------------------------------------ | --------------------------------- |
| Major (`1.1.0` → `2.0.0`) | Any type followed by `!:`                              | `feat!: change the export format` |
| Minor (`1.1.0` → `1.2.0`) | `feat:`                                                | `feat: add JSON export`           |
| Patch (`1.1.0` → `1.1.1`) | `fix:`, `perf:`, `refactor:`, `deps:`                  | `fix: restore export pagination`  |
| No release by itself      | `docs:`, `test:`, `build:`, `ci:`, `chore:`, `revert:` | `docs: clarify release steps`     |

An optional scope is allowed: `fix(export): ...` or `feat(export)!: ...`. The highest bump since the previous release wins. A `BREAKING CHANGE:` commit footer also requests a major bump.

## GitHub setup (once)

Configure these in the GitHub repository:

1. **Settings > General:** keep `master` as the default branch. Under **Pull Requests**, enable **Allow squash merging** and select a default squash message that uses the PR title.
2. **Settings > Actions > General:** enable Actions and allow the actions used by our workflows. Under **Workflow permissions**, enable **Allow GitHub Actions to create and approve pull requests**. The workflows already request their required token permissions; the default can stay read-only. [GitHub settings reference](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository).
3. **Release bot:** GitHub supplies `GITHUB_TOKEN` automatically. With this default, select **Approve workflows to run** on the bot's release PR when prompted. The optional App below removes this approval step. [Why approval is needed](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).

**Recommended protections: Settings > Rules > Rulesets:** require a PR and the checks **Tests and lint**, **Package (chrome)**, and **Package (firefox)** before merging into `master`. For tags matching `v*`, restrict updates and deletions; allow creation so Release Please can create new tags.

Release rules are already in `release-please-config.json`; `.release-please-manifest.json` records the release version and is updated by the bot. Neither needs a GitHub setting.

### Optional GitHub App: automatic bot PR checks

1. In your **account Settings > Developer settings > GitHub Apps**, [create an App](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app). Use the repository URL as its homepage, disable webhooks, and grant **Contents**, **Pull requests**, and **Issues** repository permissions as **Read and write**.
2. Install the App on this repository only. From its settings, copy the **Client ID** and generate a **private key** (a downloaded PEM file).
3. In **repository Settings > Secrets and variables > Actions**, add:
   - **Variable** `RELEASE_APP_CLIENT_ID`: the App's Client ID.
   - **Secret** `RELEASE_APP_PRIVATE_KEY`: the entire PEM file contents.

The workflow uses these to generate a temporary App token. Leave both unset to use the default bot flow.

## Firefox setup (once)

Set `firefox-production` as a GitHub Environment that groups AMO secrets and execution rules. In `publish.yml`, `validate_release` checks the release first; `submit` then uses this environment. GitHub checks its rules before starting that job or granting access to its secrets.

1. **Firefox Add-ons (AMO):** sign in with an account that can update the existing listing, whose extension ID remains `backloggd-plus@jolacdev`. Generate an **API key** and **API secret** on the [API credentials page](https://addons.mozilla.org/developers/addon/api/key/).
2. **GitHub repository > Settings > Environments > New environment:** create `firefox-production`, matching the name in `publish.yml`.
   - **Deployment branches and tags:** choose **Selected branches and tags**. Add **Branch** `master` for manual runs and **Tag** `v*` for release publication runs.
   - **Required reviewers**, optional: every submission or dry run waits for approval in **Actions**. Without reviewers, the job starts automatically once its branch/tag rules pass. [Environment setup reference](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments).
3. Under that environment's **Environment secrets**, add:

   | Secret name          | Value from AMO |
   | -------------------- | -------------- |
   | `FIREFOX_JWT_ISSUER` | API key        |
   | `FIREFOX_JWT_SECRET` | API secret     |

   The publishing library generates JWT authentication tokens from these credentials. [Mozilla authentication reference](https://mozilla.github.io/addons-server/topics/api/auth.html).

### Test credentials and enable publishing

1. Use a published GitHub release prepared by **Actions > Release** for the credential check. If none exists yet, leave `FIREFOX_PUBLISH_ENABLED` unset or `false`, wait for **Release** to finish preparing a draft, and publish it. This provides verified release files without submitting to Firefox yet.
2. In **repository Settings > Secrets and variables > Actions > Variables**, add `FIREFOX_PUBLISH_ENABLED` with value `true`. It must be a **repository variable**, since validation runs before the Firefox environment is entered.
3. Open **Actions > Publish to Firefox > Run workflow**. Select branch `master`, enter the prepared, published tag (e.g. `v1.1.0`), and leave **dry_run** checked. A successful run checks credentials without uploading or submitting.
4. If that version has not already been submitted to AMO, run it again with the same tag and **dry_run** unchecked to submit it. Check its review status in the AMO developer dashboard.

Once configured, publishing a GitHub release submits it to Firefox automatically while the variable is `true`. Setting it to `false` disables both automatic and manual publishing runs.

## Failures and checks

- **Release fails:** rerun failed jobs in the original run. Artifacts expire after one day; expired ZIPs need rebuilding. **Run workflow** does not recover an existing draft.
- **Firefox fails:** check AMO for an existing submission, then retry manually with the published tag and **dry_run** unchecked.
- **Broken published version:** ship a higher version; preserve published tags/assets.
- **Tailwind/source changes:** run `pnpm zip:firefox` then `pnpm check:firefox-sources`, and inspect the packaged UI; reproducibility checks do not detect missing classes.

Future work: [ROADMAP.md](../ROADMAP.md). Mozilla build instructions: [Firefox reviewer instructions](FIREFOX_REVIEWER_INSTRUCTIONS.md).
