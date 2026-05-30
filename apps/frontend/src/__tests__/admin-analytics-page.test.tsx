import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
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
    PieChart: MockChart,
    Pie: MockChart,
    Cell: MockChart,
  };
});

import AnalyticsDashboard from '@/app/admin/analytics/page';

describe('AnalyticsDashboard (admin)', () => {
  it('renders headline metrics and collateral composition labels', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('DAO Analytics Hub')).toBeInTheDocument();
    });

    expect(screen.getByText('TVL Global')).toBeInTheDocument();
    expect(screen.getByText('$15.45M')).toBeInTheDocument();
    expect(screen.getByText('Active Debt')).toBeInTheDocument();
    expect(screen.getByText('$8.20M')).toBeInTheDocument();
    expect(screen.getByText('RWA Collateral Composition')).toBeInTheDocument();
    expect(screen.getByText('Real Estate')).toBeInTheDocument();
    expect(screen.getByText('Corp Debt')).toBeInTheDocument();
  });
});