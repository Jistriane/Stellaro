import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => ({
    title: 'Analytics dashboard',
    subtitle: 'Performance and protocol trends',
    loading: 'Loading analytics...',
    tvl: 'Total value locked',
    apy: 'APY',
    loans: 'Active loans',
    defaultRate: 'Default rate',
    tvlHistory: 'TVL history',
    assetDistribution: 'Asset distribution',
    performanceMetrics: 'Performance metrics',
    utilization: 'Utilization',
    liquidationRatio: 'Liquidation ratio',
    healthyStatus: 'Healthy status',
    reserveRatio: 'Reserve ratio',
    surplusCollateral: 'Surplus collateral',
  }[key] ?? key),
}));

vi.mock('recharts', () => {
  const MockChart = () => <div />;
  return {
    ResponsiveContainer: MockChart,
    LineChart: MockChart,
    Line: MockChart,
    BarChart: MockChart,
    Bar: MockChart,
    XAxis: MockChart,
    YAxis: MockChart,
    CartesianGrid: MockChart,
    Tooltip: MockChart,
    Legend: MockChart,
    PieChart: MockChart,
    Pie: MockChart,
    Cell: MockChart,
  };
});

import DashboardAnalyticsPage from '@/app/dashboard/analytics/page';

describe('DashboardAnalyticsPage', () => {
  it('renders KPIs and keeps timeframe actions interactive', async () => {
    render(<DashboardAnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('Analytics dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('Performance and protocol trends')).toBeInTheDocument();
    expect(screen.getByText('$275.0K')).toBeInTheDocument();
    expect(screen.getByText('8.3%')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '7D' }));
    fireEvent.click(screen.getByRole('button', { name: '90D' }));

    expect(screen.getByRole('button', { name: '30D' })).toBeInTheDocument();
    expect(screen.getByText('TVL history')).toBeInTheDocument();
    expect(screen.getByText('Performance metrics')).toBeInTheDocument();
  });
});