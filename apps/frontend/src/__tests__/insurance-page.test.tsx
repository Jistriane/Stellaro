import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('@/components/ModuleLaunchPage', () => ({
  default: (props: Record<string, unknown>) => (
    <div>
      <div>ModuleLaunchPage Mock</div>
      <pre data-testid="insurance-module-json">{JSON.stringify(props)}</pre>
    </div>
  ),
}));

vi.mock('@/components/QuickCreateForm', () => ({
  default: (props: Record<string, unknown>) => (
    <div>
      <div>QuickCreateForm Mock</div>
      <pre data-testid="insurance-form-json">{JSON.stringify(props)}</pre>
    </div>
  ),
}));

import InsurancePage from '@/app/insurance/page';

describe('InsurancePage', () => {
  it('renders the module launch page and quick create form with expected insurance metadata', async () => {
    const Page = await InsurancePage();
    render(Page);

    expect(screen.getByAltText('Stellaro background')).toBeInTheDocument();
    expect(screen.getByText('ModuleLaunchPage Mock')).toBeInTheDocument();
    expect(screen.getByText('QuickCreateForm Mock')).toBeInTheDocument();

    const modulePayload = screen.getByTestId('insurance-module-json').textContent ?? '';
    expect(modulePayload).toContain('Insurance Pool');
    expect(modulePayload).toContain('integrated-with-soroban');
    expect(modulePayload).toContain('Risk Coverage');
    expect(modulePayload).toContain('/v4');
    expect(modulePayload).toContain('/docs');

    const formPayload = screen.getByTestId('insurance-form-json').textContent ?? '';
    expect(formPayload).toContain('Deposit into the Insurance Pool');
    expect(formPayload).toContain('/insurance/deposit');
    expect(formPayload).toContain('Amount (STLT)');
    expect(formPayload).toContain('Your Secret Key (Test)');
  });
});