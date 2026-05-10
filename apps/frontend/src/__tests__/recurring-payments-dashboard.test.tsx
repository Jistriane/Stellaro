import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecurringPaymentsDashboard from '@/app/recurring-payments/RecurringPaymentsDashboard';

describe('RecurringPaymentsDashboard', () => {
  it('normalizes amount values and renders without crashing', () => {
    render(
      <RecurringPaymentsDashboard
        initialSubscriptions={[
          {
            id: 'sub-1',
            name: 'String Amount Plan',
            amount: '125.5',
            currency: 'STLT',
            cadence: 'monthly',
            status: 'active',
            nextBilling: '2026-05-25T00:00:00.000Z',
          },
          {
            id: 'sub-2',
            name: 'Null Amount Plan',
            amount: null,
            currency: 'STLT',
            cadence: 'monthly',
            status: 'active',
            nextBilling: '2026-05-25T00:00:00.000Z',
          },
          {
            id: 'sub-3',
            name: 'Paused Plan',
            amount: '100',
            currency: 'STLT',
            cadence: 'monthly',
            status: 'paused',
            nextBilling: '2026-05-25T00:00:00.000Z',
          },
        ]}
      />,
    );

    expect(screen.getByText('String Amount Plan')).toBeInTheDocument();
    expect(screen.getByText('125.50 STLT')).toBeInTheDocument();
    expect(screen.getByText('0.00 STLT')).toBeInTheDocument();

    // Only active subscriptions are summed in monthly recurring spend.
    expect(screen.getByText('125.50')).toBeInTheDocument();
  });

  it('supports comma-based amount strings', () => {
    render(
      <RecurringPaymentsDashboard
        initialSubscriptions={[
          {
            id: 'sub-4',
            name: 'Comma Amount Plan',
            amount: '42,75',
            currency: 'STLT',
            cadence: 'monthly',
            status: 'active',
            nextBilling: '2026-05-25T00:00:00.000Z',
          },
        ]}
      />,
    );

    expect(screen.getByText('42.75 STLT')).toBeInTheDocument();
    expect(screen.getByText('42.75')).toBeInTheDocument();
  });
});
