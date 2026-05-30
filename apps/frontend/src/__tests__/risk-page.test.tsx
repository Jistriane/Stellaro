import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('@/app/risk/RiskGuardianDashboard', () => ({
  default: () => <div>RiskGuardianDashboard Mock</div>,
}));

import RiskPage from '@/app/risk/page';

describe('RiskPage', () => {
  it('renders risk background and dashboard shell', () => {
    render(<RiskPage />);

    expect(screen.getByAltText('Stellaro background')).toBeInTheDocument();
    expect(screen.getByText('RiskGuardianDashboard Mock')).toBeInTheDocument();
  });
});