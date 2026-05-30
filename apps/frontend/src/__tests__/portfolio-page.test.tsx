import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getContractIds, viewPortfolio, getWalletBalances } = vi.hoisted(() => ({
  getContractIds: vi.fn(),
  viewPortfolio: vi.fn(),
  getWalletBalances: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next/link', () => ({
  default: (props: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={props.href} className={props.className}>{props.children}</a>
  ),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
}));

vi.mock('@/hooks/useRealTimeUpdates', () => ({
  useRealTimeUpdates: () => undefined,
}));

vi.mock('@/lib/soroban', () => ({
  getContractIds,
  viewPortfolio,
  getWalletBalances,
}));

import PortfolioPage from '@/app/portfolio/page';

describe('PortfolioPage', () => {
  beforeEach(() => {
    getContractIds.mockReturnValue({
      PORTFOLIO_CONTRACT_ID: 'portfolio-xyz',
    });
    viewPortfolio.mockResolvedValue({
      allocation: [
        { asset: 'STLT', pct_bps: 7400 },
        { asset: 'XLM', pct_bps: 2600 },
      ],
    });
    getWalletBalances.mockResolvedValue({
      stlt: '100',
      xlm: '20',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the portfolio summary after loading data', async () => {
    render(<PortfolioPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('header.title')).toBeInTheDocument();
    });

    expect(screen.getByText('portfolio-xyz')).toBeInTheDocument();
    expect(screen.getByText('R$ 135')).toBeInTheDocument();
    expect(screen.getByText('$ 27')).toBeInTheDocument();
    expect(screen.getByText('distribution.protocol_ref_title')).toBeInTheDocument();
    expect(screen.getByText('distribution.qty_label {"qty":"100","brl":"100","usd":"20"}')).toBeInTheDocument();
    expect(screen.getByText('distribution.qty_label {"qty":"20","brl":"35","usd":"7"}')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'reports.view_full' })).toHaveAttribute('href', '/wallet');
    expect(viewPortfolio).toHaveBeenCalled();
    expect(getWalletBalances).toHaveBeenCalled();
  });
});