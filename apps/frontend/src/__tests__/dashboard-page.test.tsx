import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next/link', () => ({
  default: (props: { href: string; children: React.ReactNode }) => <a href={props.href}>{props.children}</a>,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
}));

vi.mock('@/hooks/useRealTimeUpdates', () => ({
  useRealTimeUpdates: () => undefined,
}));

vi.mock('@/lib/soroban', () => ({
  viewLoansPool: vi.fn(async () => ({ ltv_bps: 6500, interest_bps: 1200 })),
  getWalletBalances: vi.fn(async () => ({ xlm: '4.5678', stlt: '12.34' })),
  hasValidVc: vi.fn(async () => true),
}));

import DashboardPage from '../app/dashboard/page';

describe('DashboardPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dashboard after loading data', async () => {
    render(<DashboardPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('greeting.welcome_back')).toBeInTheDocument();
    });

    expect(screen.getByText('12.34')).toBeInTheDocument();
    expect(screen.getAllByText('$ 0.00').length).toBeGreaterThan(0);
    expect(screen.getByText('4.5678')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'quick_access.deposit_pix' })).toHaveAttribute('href', '/pix');
    expect(screen.getByRole('link', { name: 'quick_access.governance' })).toHaveAttribute('href', '/governance');
  });
});
