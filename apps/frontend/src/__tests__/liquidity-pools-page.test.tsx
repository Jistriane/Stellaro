import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => ({
    'pools.title': 'Liquidity pools',
    'pools.subtitle': 'Manage and track pool positions',
  }[key] ?? key),
}));

vi.mock('recharts', () => {
  const MockChart = () => <div />;
  return {
    ResponsiveContainer: MockChart,
    AreaChart: MockChart,
    Area: MockChart,
    XAxis: MockChart,
    YAxis: MockChart,
    CartesianGrid: MockChart,
    Tooltip: MockChart,
    BarChart: MockChart,
    Bar: MockChart,
  };
});

import LiquidityPoolsPage from '@/app/liquidity/pools/page';

describe('LiquidityPoolsPage', () => {
  it('renders pool KPIs and switches selected pool tab', async () => {
    render(<LiquidityPoolsPage />);

    await waitFor(() => {
      expect(screen.getByText('Liquidity pools')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Liquidity')).toBeInTheDocument();
    expect(screen.getByText('STLT-XLM')).toBeInTheDocument();
    expect(screen.getByText('XLM-USDC')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'XLM-USDC' }));
    expect(screen.getByText('Pool TVL')).toBeInTheDocument();
    expect(screen.getByText('Your Share')).toBeInTheDocument();
    expect(screen.getByText('Fee 0.05%')).toBeInTheDocument();
    expect(screen.getByText('22.3%')).toBeInTheDocument();
  });
});