import { render, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const refreshAvailable = vi.fn();

vi.mock('@/state/wallet', () => ({
  useWalletStore: (selector: (state: { refreshAvailable: typeof refreshAvailable }) => unknown) =>
    selector({ refreshAvailable }),
}));

import WalletDetectionEnforcer from '@/components/WalletDetectionEnforcer';

describe('WalletDetectionEnforcer', () => {
  const originalReadyState = Object.getOwnPropertyDescriptor(document, 'readyState');

  beforeEach(() => {
    vi.useFakeTimers();
    refreshAvailable.mockClear();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      value: 'loading',
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();

    if (originalReadyState) {
      Object.defineProperty(document, 'readyState', originalReadyState);
    }
  });

  it('triggers immediate and scheduled refresh checks', () => {
    const { unmount } = render(<WalletDetectionEnforcer />);

    expect(refreshAvailable).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(refreshAvailable).toHaveBeenCalledTimes(2);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(refreshAvailable).toHaveBeenCalledTimes(3);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(refreshAvailable).toHaveBeenCalledTimes(4);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(refreshAvailable).toHaveBeenCalledTimes(5);

    unmount();
  });

  it('clears pending timeouts on unmount', () => {
    const { unmount } = render(<WalletDetectionEnforcer />);

    unmount();

    act(() => {
      vi.runAllTimers();
    });

    expect(refreshAvailable).toHaveBeenCalledTimes(1);
  });
});