/**
 * Verbose tracing for the HowLongToBeat integration.
 *
 * `console.debug` is hidden unless the console's log level includes "Verbose", so this is
 * invisible in normal use while always available without a rebuild — filter the console by
 * `[Backloggd+]` to follow a whole resolution. Centralised so `no-console` needs exactly
 * one exemption.
 */
export const debugLog = (scope: string, message: string, data?: unknown) => {
  const label = `[Backloggd+] ${scope} · ${message}`;

  // eslint-disable-next-line no-console
  if (data === undefined) console.debug(label);
  // eslint-disable-next-line no-console
  else console.debug(label, data);
};
