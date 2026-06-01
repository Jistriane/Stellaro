import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getWalletBalances } = vi.hoisted(() => ({
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
  getWalletBalances,
}));

import PortfolioPage from '@/app/portfolio/page';

describe('PortfolioPage', () => {
  beforeEach(() => {
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

    expect(screen.getByText('$ 0')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'reports.view_full' })).toHaveAttribute('href', '/wallet');
    expect(getWalletBalances).toHaveBeenCalled();
  });
});
