import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('@/components/TradingView', () => ({
  default: () => <div data-testid="trading-view-widget" />,
}));

vi.mock('../app/trading/MarketSelector', () => ({
  default: () => <div data-testid="market-selector-widget" />,
}));

vi.mock('../app/trading/OrderBox', () => ({
  default: () => <div data-testid="order-box-widget" />,
}));

vi.mock('../app/trading/RiskTools', () => ({
  default: () => <div data-testid="risk-tools-widget" />,
}));

import TradingPage from '@/app/trading/page';

describe('TradingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the trading workspace with mocked widgets', () => {
    render(<TradingPage />);

    expect(screen.getByText('header.title')).toBeInTheDocument();
    expect(screen.getByText('header.platform_normal')).toBeInTheDocument();
    expect(screen.getByText('intro.title')).toBeInTheDocument();
    expect(screen.getByTestId('market-selector-widget')).toBeInTheDocument();
    expect(screen.getByTestId('trading-view-widget')).toBeInTheDocument();
    expect(screen.getByTestId('order-box-widget')).toBeInTheDocument();
    expect(screen.getByTestId('risk-tools-widget')).toBeInTheDocument();
    expect(screen.getAllByText('R$270,500.00')).toHaveLength(2);
    expect(screen.getByText('O-1001')).toBeInTheDocument();
    expect(screen.getByText('H-2001')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'info.fees_link' })).toHaveAttribute('href', '/docs');
  });
});