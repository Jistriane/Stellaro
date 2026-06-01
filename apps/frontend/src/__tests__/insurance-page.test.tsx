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

import InsurancePage from '@/app/insurance/page';

describe('InsurancePage', () => {
  it('renders the module launch page and disables direct deposit via api', async () => {
    const Page = await InsurancePage();
    render(Page);

    expect(screen.getByAltText('Stellaro background')).toBeInTheDocument();
    expect(screen.getByText('ModuleLaunchPage Mock')).toBeInTheDocument();

    const modulePayload = screen.getByTestId('insurance-module-json').textContent ?? '';
    expect(modulePayload).toContain('Insurance Pool');
    expect(modulePayload).toContain('integrated-with-soroban');
    expect(modulePayload).toContain('Risk Coverage');
    expect(modulePayload).toContain('/v4');
    expect(modulePayload).toContain('/docs');

    expect(screen.getByText(/Depósitos no pool de seguro estão desabilitados/i)).toBeInTheDocument();
  });
});
