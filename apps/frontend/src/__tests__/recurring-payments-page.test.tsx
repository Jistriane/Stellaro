import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { getSubscriptionOverview } = vi.hoisted(() => ({
  getSubscriptionOverview: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('@/lib/v4', () => ({
  getSubscriptionOverview,
}));

vi.mock('@/app/recurring-payments/RecurringPaymentsDashboard', () => ({
  default: (props: { initialSubscriptions: Array<Record<string, unknown>> }) => (
    <div>
      <div>RecurringPaymentsDashboard Mock</div>
      <pre data-testid="subscriptions-json">{JSON.stringify(props.initialSubscriptions)}</pre>
    </div>
  ),
}));

import RecurringPaymentsPage from '@/app/recurring-payments/page';

describe('RecurringPaymentsPage', () => {
  it('loads subscription overview and passes normalized subscriptions to the dashboard', async () => {
    getSubscriptionOverview.mockResolvedValue({
      plans: [
        { id: 'plan-1', name: 'Treasury Plan', amount: '80', currency: 'BRLx', cadence: 'weekly', status: 'paused' },
        { id: 'plan-2', name: 'Fallback Plan' },
      ],
    });

    const Page = await RecurringPaymentsPage();
    render(Page);

    expect(getSubscriptionOverview).toHaveBeenCalledWith({ page: 1, pageSize: 5 });
    expect(screen.getByAltText('Stellaro background')).toBeInTheDocument();
    expect(screen.getByText('RecurringPaymentsDashboard Mock')).toBeInTheDocument();

    const payload = screen.getByTestId('subscriptions-json').textContent ?? '';
    expect(payload).toContain('Treasury Plan');
    expect(payload).toContain('BRLx');
    expect(payload).toContain('weekly');
    expect(payload).toContain('paused');
    expect(payload).toContain('Fallback Plan');
    expect(payload).toContain('25');
    expect(payload).toContain('STLT');
    expect(payload).toContain('monthly');
    expect(payload).toContain('active');
  });
});