import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { getDaoOverview } = vi.hoisted(() => ({
  getDaoOverview: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('@/lib/v4', () => ({
  getDaoOverview,
}));

vi.mock('@/app/dao/DaoGovernanceDashboard', () => ({
  default: (props: { initialProposals: Array<Record<string, unknown>> }) => (
    <div>
      <div>DaoGovernanceDashboard Mock</div>
      <pre data-testid="dao-proposals-json">{JSON.stringify(props.initialProposals)}</pre>
    </div>
  ),
}));

import DaoPage from '@/app/dao/page';

describe('DaoPage', () => {
  it('loads DAO overview and falls back to mock proposals when backend returns none', async () => {
    getDaoOverview.mockResolvedValue({ proposals: [] });

    const Page = await DaoPage();
    render(Page);

    expect(getDaoOverview).toHaveBeenCalledWith({ page: 1, pageSize: 5 });
    expect(screen.getByAltText('Stellaro background')).toBeInTheDocument();
    expect(screen.getByText('DaoGovernanceDashboard Mock')).toBeInTheDocument();

    const payload = screen.getByTestId('dao-proposals-json').textContent ?? '';
    expect(payload).toContain('Increase stability fee by 0.5%');
    expect(payload).toContain('Approve RWA liquidity partnership');
    expect(payload).toContain('set_stability_fee');
    expect(payload).toContain('whitelist_rwa_provider');
    expect(payload).toContain('Active');
  });
});