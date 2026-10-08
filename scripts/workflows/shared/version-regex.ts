// Shared stable-version rules for package and release validation scripts.
const versionPattern = /(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)/;

/** A regular expression for validating package versions (X.Y.Z). */
export const packageVersionRegex = new RegExp(`^${versionPattern.source}$`);
/** A regular expression for validating release tags (vX.Y.Z). */
export const releaseTagRegex = new RegExp(`^v${versionPattern.source}$`);
