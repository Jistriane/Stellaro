import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { getV4Overview } = vi.hoisted(() => ({
  getV4Overview: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next/link', () => ({
  default: (props: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={props.href} className={props.className}>{props.children}</a>
  ),
}));

vi.mock('@/lib/v4', () => ({
  getV4Overview,
}));

import V4LandingPage from '@/app/v4/page';

describe('V4LandingPage', () => {
  it('renders overview metrics and module cards from backend overview', async () => {
    getV4Overview.mockResolvedValue({
      readiness: 0.84,
      status: 'integration-ready',
      modules: [
        { href: '/rwa', title: 'RWA', status: 'active', items: 12, readiness: 0.9 },
        { href: '/ssi', title: 'SSI', status: 'active', items: 7, readiness: 0.8 },
      ],
      nextSteps: ['Step A', 'Step B', 'Step C', 'Step D'],
    });

    const Page = await V4LandingPage();
    render(Page);

    expect(getV4Overview).toHaveBeenCalled();
    expect(screen.getByAltText('Stellaro background')).toBeInTheDocument();
    expect(screen.getByText('84%')).toBeInTheDocument();
    expect(screen.getByText('integration-ready')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Read documentation' })).toHaveAttribute('href', '/docs');

    expect(screen.getByText('RWA')).toBeInTheDocument();
    expect(screen.getByText('SSI')).toBeInTheDocument();
    const moduleLinks = screen.getAllByRole('link', { name: 'Open module' });
    expect(moduleLinks).toHaveLength(2);
    expect(moduleLinks[0]).toHaveAttribute('href', '/rwa');
    expect(moduleLinks[1]).toHaveAttribute('href', '/ssi');
    expect(screen.getByText('Step A')).toBeInTheDocument();
    expect(screen.getByText('Step D')).toBeInTheDocument();
  });
});