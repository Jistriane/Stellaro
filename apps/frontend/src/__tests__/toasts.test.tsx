import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { useAppStoreMock, clearEventsMock } = vi.hoisted(() => ({
  clearEventsMock: vi.fn(),
  useAppStoreMock: vi.fn(),
}));

vi.mock('@/store/app', () => ({
  useAppStore: useAppStoreMock,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, opts?: { default?: string }) => {
    const dict: Record<string, string> = {
      EVENT_FILLED: 'Order filled',
      EVENT_OPENED: 'Order opened',
    };
    return dict[key] ?? opts?.default ?? key;
  },
}));

import Toasts from '@/components/Toasts';

describe('Toasts', () => {
  it('renders recent events and clears queue from store', () => {
    vi.useFakeTimers();
    try {
      const storeState: { lastEvents: string[]; clearEvents: () => void } = {
        lastEvents: ['EVENT_FILLED', 'EVENT_OPENED'],
        clearEvents: () => {
          storeState.lastEvents = [];
          clearEventsMock();
        },
      };

      useAppStoreMock.mockImplementation(
        (selector: (state: { lastEvents: string[]; clearEvents: () => void }) => unknown) => selector(storeState),
      );

      render(<Toasts />);

      expect(screen.getByText('Order filled')).toBeInTheDocument();
      expect(clearEventsMock).toHaveBeenCalled();
      act(() => {
        vi.runOnlyPendingTimers();
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
