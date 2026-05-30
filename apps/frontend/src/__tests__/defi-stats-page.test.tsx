import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => ({
    'stats.title': 'DeFi stats',
    'stats.subtitle': 'Protocol and lending performance',
    'stats.tvl': 'TVL',
    'stats.loans': 'Loans',
    'stats.apy': 'APY',
    'stats.utilization': 'Utilization',
  }[key] ?? key),
}));

vi.mock('recharts', () => {
  const MockChart = () => <div />;
  return {
    ResponsiveContainer: MockChart,
    BarChart: MockChart,
    Bar: MockChart,
    LineChart: MockChart,
    Line: MockChart,
    XAxis: MockChart,
    YAxis: MockChart,
    CartesianGrid: MockChart,
    Tooltip: MockChart,
    Legend: MockChart,
    AreaChart: MockChart,
    Area: MockChart,
  };
});

import DefiStatsPage from '@/app/defi/stats/page';

describe('DefiStatsPage', () => {
  it('renders mocked protocol stats cards and summary blocks', async () => {
    render(<DefiStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('DeFi stats')).toBeInTheDocument();
    });

    expect(screen.getByText('Protocol and lending performance')).toBeInTheDocument();
    expect(screen.getByText('$275.0K')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('8.3%')).toBeInTheDocument();
    expect(screen.getByText('73.5%')).toBeInTheDocument();
    expect(screen.getByText('Loan Types Distribution')).toBeInTheDocument();
    expect(screen.getByText('Pool Health Summary')).toBeInTheDocument();
  });
});