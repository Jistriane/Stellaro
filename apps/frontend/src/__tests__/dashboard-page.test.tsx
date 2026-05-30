import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const refreshBalance = vi.fn();
const setBalances = vi.fn();

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
  getContractIds: vi.fn(() => ({
    STELLAR_PUBLIC_KEY: 'G' + 'D'.repeat(55),
    PORTFOLIO_CONTRACT_ID: 'portfolio-123',
  })),
  viewLoansPool: vi.fn(async () => ({ ltv_bps: 6500, interest_bps: 1200 })),
  viewPortfolio: vi.fn(async () => ({
    allocation: [
      { asset: 'STLT', pct_bps: 6000 },
      { asset: 'XLM', pct_bps: 4000 },
    ],
  })),
  viewGovernance: vi.fn(async () => ({ proposals_open: 3, admin: 'admin.governance' })),
  getWalletBalances: vi.fn(async () => ({ xlm: '4.5678', stlt: '12.34' })),
}));

import DashboardPage from '../app/dashboard/page';

describe('DashboardPage', () => {
  beforeEach(() => {
    refreshBalance.mockReset();
    setBalances.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dashboard after loading data', async () => {
    render(<DashboardPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('greeting.welcome_back')).toBeInTheDocument();
    });

    expect(screen.getByText('R$ 12.34')).toBeInTheDocument();
    expect(screen.getByText('$ 2.47')).toBeInTheDocument();
    expect(screen.getByText('4.5678')).toBeInTheDocument();
    expect(screen.getByText('governance.open_proposals {"count":3}')).toBeInTheDocument();
    expect(screen.getByText('portfolio-123')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'quick_access.deposit_pix' })).toHaveAttribute('href', '/pix');
    expect(screen.getByRole('link', { name: 'quick_access.governance' })).toHaveAttribute('href', '/governance');
  });
});
