import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { getRwaOverview } = vi.hoisted(() => ({
  getRwaOverview: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('@/lib/v4', () => ({
  getRwaOverview,
}));

vi.mock('@/app/rwa/RwaMarketplace', () => ({
  default: (props: { initialAssets: Array<Record<string, unknown>> }) => (
    <div>
      <div>RwaMarketplace Mock</div>
      <pre data-testid="rwa-assets-json">{JSON.stringify(props.initialAssets)}</pre>
    </div>
  ),
}));

import RwaPage from '@/app/rwa/page';

describe('RwaPage', () => {
  it('loads rwa overview and passes mapped asset data to the marketplace', async () => {
    getRwaOverview.mockResolvedValue({
      items: [
        {
          id: 'asset-1',
          name: 'Solar Farm Receivable',
          assetClass: 'infrastructure',
          status: 'active',
          whitelistRequired: true,
          annualYieldBps: 1250,
          ignored: 'noop',
        },
      ],
    });

    const Page = await RwaPage();
    render(Page);

    expect(getRwaOverview).toHaveBeenCalledWith({
      page: 1,
      pageSize: 5,
      status: undefined,
      assetClass: undefined,
      search: undefined,
    });
    expect(screen.getByAltText('Stellaro background')).toBeInTheDocument();
    expect(screen.getByText('RwaMarketplace Mock')).toBeInTheDocument();

    const payload = screen.getByTestId('rwa-assets-json').textContent ?? '';
    expect(payload).toContain('Solar Farm Receivable');
    expect(payload).toContain('infrastructure');
    expect(payload).toContain('active');
    expect(payload).toContain('true');
    expect(payload).toContain('1250');
    expect(payload).not.toContain('ignored');
  });
});