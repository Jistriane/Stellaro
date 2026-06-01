import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { viewLoansPool, getWalletBalances, getContractIds } = vi.hoisted(() => ({
  viewLoansPool: vi.fn(),
  getWalletBalances: vi.fn(),
  getContractIds: vi.fn(),
}));

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
  viewLoansPool,
  getWalletBalances,
  getContractIds,
}));

import LoansPage from '@/app/loans/page';

describe('LoansPage', () => {
  beforeEach(() => {
    viewLoansPool.mockResolvedValue({
      ltv_bps: 6500,
      interest_bps: 1200,
      accounts: 7,
      total_deposits: '12345',
      total_borrowed: '6789',
    });
    getWalletBalances.mockResolvedValue({
      xlm: '15.5',
      stlt: '2500',
    });
    getContractIds.mockReturnValue({
      LOANSPOOL_CONTRACT_ID: 'C_LOANSPOOL_MAINNET',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the pool summary after loading data', async () => {
    render(<LoansPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('header.title')).toBeInTheDocument();
    });

    expect(screen.getByText('pool.title')).toBeInTheDocument();
    expect(viewLoansPool).toHaveBeenCalled();
    expect(getWalletBalances).toHaveBeenCalled();
  });
});
