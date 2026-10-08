// @vitest-environment node
import { logger } from './logger';
import { preferencesStorageItem } from './storage';

const flushLogs = async () =>
  await new Promise((resolve) => setImmediate(resolve));

describe('guarded extension logging', () => {
  beforeEach(() => fakeBrowser.reset());

  it.each(['debug', 'error', 'log', 'warn'] as const)(
    'keeps %s silent by default and follows saved changes on every call',
    async (level) => {
      const output = vi
        .spyOn(console, level)
        .mockImplementation(() => undefined);
      logger[level]('default');
      await flushLogs();
      expect(output).not.toHaveBeenCalled();
      await preferencesStorageItem.setValue({ isLoggingEnabled: true });
      logger[level]('enabled', { game: 'Pokémon Scarlet' });
      await flushLogs();
      expect(output).toHaveBeenCalledWith('[Toolkittd]', 'enabled', {
        game: 'Pokémon Scarlet',
      });
      await preferencesStorageItem.setValue({ isLoggingEnabled: false });
      logger[level]('disabled');
      await flushLogs();
      expect(output).toHaveBeenCalledTimes(1);
    },
  );

  it('keeps the preference after time passes without feature or cache resets', async () => {
    await preferencesStorageItem.setValue({ isLoggingEnabled: true });
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 20 * 365 * 86400000);
    expect(await preferencesStorageItem.getValue()).toEqual({
      isLoggingEnabled: true,
    });
  });

  it('stays silent and does not reject when preferences cannot be read', async () => {
    const output = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    vi.spyOn(preferencesStorageItem, 'getValue').mockRejectedValue(
      new Error('Storage unavailable'),
    );
    logger.error('Storage failed');
    await flushLogs();
    expect(output).not.toHaveBeenCalled();
  });
});
