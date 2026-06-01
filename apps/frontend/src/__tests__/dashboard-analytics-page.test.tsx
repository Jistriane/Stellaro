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
    performanceMetrics: 'Performance metrics',
  }[key] ?? key),
}));

import DashboardAnalyticsPage from '@/app/dashboard/analytics/page';

describe('DashboardAnalyticsPage', () => {
  it('renders KPIs and keeps timeframe actions interactive', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          tvl: '$275.0K',
          volume24h: '$1.2M',
          mintBurnRatio: '0.98',
        }),
      })) as any,
    );

    render(<DashboardAnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('Analytics dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('Performance and protocol trends')).toBeInTheDocument();
    expect(screen.getByText('$275.0K')).toBeInTheDocument();
    expect(screen.getByText('$1.2M')).toBeInTheDocument();
    expect(screen.getByText('0.98')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '7D' }));
    fireEvent.click(screen.getByRole('button', { name: '90D' }));

    expect(screen.getByRole('button', { name: '30D' })).toBeInTheDocument();
    expect(screen.getByText('Performance metrics')).toBeInTheDocument();
  });
});
