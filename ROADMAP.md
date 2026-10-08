# Roadmap

Planned work; these items are outside the current release automation scope.

## Product

- [ ] Add HowLongToBeat (HLTB) integration to Backloggd game pages to display estimated completion times.
- [ ] Add export support for Backloggd 1.18's Library section (`/u/{username}/library/`), including platform-grouped entries. This is separate from the classic games-log export fixed for 1.18.

## Development and release automation

- [ ] Configure Dependabot for grouped dependency and GitHub Actions updates, respecting the two-week dependency age policy.
- [ ] Add packaged-extension browser tests for popup preferences, Turbo navigation, and CSV/JSON downloads, with failure reports.
- [ ] Add `web-ext lint` to check Firefox packages before AMO submission.
- [ ] Automate Chrome Web Store publishing once its account and first listing are ready; use API v2 and a protected environment.
- [ ] Add release checksums to verify ZIP integrity.
- [ ] Add manual recovery of an existing draft release by tag if rerunning jobs in the original release run proves insufficient; rebuild the exact tagged commit.
- [ ] Normalize ZIP ordering and timestamps if byte-identical archives are needed for recovery or verification.
- [ ] Detect already uploaded or pending store versions automatically if manual submission recovery becomes frequent; cover that logic with focused tests.

## GitHub Configuration

- [ ] Issues templates for bug reports and feature requests.
- [ ] Check to enable release immutability.
