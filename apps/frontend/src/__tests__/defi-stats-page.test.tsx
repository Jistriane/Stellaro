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
  }[key] ?? key),
}));

import DefiStatsPage from '@/app/defi/stats/page';

describe('DefiStatsPage', () => {
  it('renders stats backed by /analytics/overview', async () => {
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

    render(<DefiStatsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('DeFi stats').length).toBeGreaterThan(0);
    });

    expect(screen.getByText('Protocol and lending performance')).toBeInTheDocument();
    expect(screen.getByText('$275.0K')).toBeInTheDocument();
    expect(screen.getByText('$1.2M')).toBeInTheDocument();
    expect(screen.getByText('0.98')).toBeInTheDocument();
  });
});
