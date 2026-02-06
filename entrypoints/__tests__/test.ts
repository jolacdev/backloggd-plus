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
