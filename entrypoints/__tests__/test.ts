// https://github.com/wxt-dev/examples/blob/main/examples/vitest-unit-testing/entrypoints/__tests__/background.test.ts
// https://github.com/aklinker1/github-better-line-counts

import { describe, expect, it, vi } from 'vitest';

describe('vitest config: mockReset & restoreMocks', () => {
  it('spies Math.random calls', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const value = Math.random();

    expect(value).toBe(0.5);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('resets Math.random spy call history between tests', () => {
    const spy = vi.spyOn(Math, 'random');

    expect(spy).not.toHaveBeenCalled();
  });
});
