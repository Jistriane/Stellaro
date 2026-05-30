import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next/link', () => ({
  default: (props: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={props.href} className={props.className}>{props.children}</a>
  ),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/WalletPanel', () => ({
  default: () => <div>WalletPanel Mock</div>,
}));

vi.mock('@/components/TradingView', () => ({
  default: (props: { symbols: string[][]; locale: string; theme: string; height: number }) => (
    <div>
      TradingView Mock {JSON.stringify(props.symbols)} {props.locale} {props.theme} {props.height}
    </div>
  ),
}));

vi.mock('@/components/BalanceChart', () => ({
  default: () => <div>BalanceChart Mock</div>,
}));

vi.mock('@/components/HomeHero', () => ({
  default: () => <div>HomeHero Mock</div>,
}));

import HomePage from '@/app/page';

describe('HomePage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders hero, widgets and launchpad links', () => {
    render(<HomePage />);

    expect(screen.getByAltText('Stellaro background')).toBeInTheDocument();
    expect(screen.getByText('HomeHero Mock')).toBeInTheDocument();
    expect(screen.getByText('WalletPanel Mock')).toBeInTheDocument();
    expect(screen.getByText('Real-time Market')).toBeInTheDocument();
    expect(screen.getByText(/TradingView Mock/)).toHaveTextContent('[[');
    expect(screen.getByText('BalanceChart Mock')).toBeInTheDocument();
    expect(screen.getByText('Stellaro v4.0 Launchpad')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'v4 Overview Map of the new modules and implementation status.' })).toHaveAttribute('href', '/v4');
    expect(screen.getByRole('link', { name: 'RWA Tokenization, allowlisting, and legal documentation.' })).toHaveAttribute('href', '/rwa');
    expect(screen.getByRole('link', { name: 'SSI / VCs Credential wallet and presentation flows.' })).toHaveAttribute('href', '/ssi');
    expect(screen.getByRole('link', { name: 'Recurring Payments Stablecoin subscriptions with an audit trail.' })).toHaveAttribute('href', '/recurring-payments');
    expect(screen.getByText('footer.brand')).toBeInTheDocument();
  });
});