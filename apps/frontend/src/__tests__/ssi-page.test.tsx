import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { getSsiOverview } = vi.hoisted(() => ({
  getSsiOverview: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('@/lib/v4', () => ({
  getSsiOverview,
}));

vi.mock('@/app/ssi/SsiWallet', () => ({
  default: (props: { initialCredentials: Array<Record<string, unknown>> }) => (
    <div>
      <div>SsiWallet Mock</div>
      <pre data-testid="ssi-credentials-json">{JSON.stringify(props.initialCredentials)}</pre>
    </div>
  ),
}));

import SsiPage from '@/app/ssi/page';

describe('SsiPage', () => {
  it('loads ssi overview and maps credentials with fallbacks for missing fields', async () => {
    getSsiOverview.mockResolvedValue({
      credentials: [
        {
          id: 'cred-1',
          type: 'KYCVerified',
          issuer: 'Stellaro Compliance',
          status: 'revoked',
          createdAt: '2026-05-30T10:00:00.000Z',
        },
        {},
      ],
    });

    const Page = await SsiPage();
    render(Page);

    expect(getSsiOverview).toHaveBeenCalledWith({
      page: 1,
      pageSize: 5,
      status: undefined,
      type: undefined,
      search: undefined,
    });
    expect(screen.getByAltText('Stellaro background')).toBeInTheDocument();
    expect(screen.getByText('SsiWallet Mock')).toBeInTheDocument();

    const payload = screen.getByTestId('ssi-credentials-json').textContent ?? '';
    expect(payload).toContain('KYCVerified');
    expect(payload).toContain('Stellaro Compliance');
    expect(payload).toContain('revoked');
    expect(payload).toContain('cred-1');
    expect(payload).toContain('vc-2');
    expect(payload).toContain('VerifiableCredential');
    expect(payload).toContain('Unknown Issuer');
    expect(payload).toContain('active');
  });
});