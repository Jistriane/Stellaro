import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { usePathnameMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: usePathnameMock,
}));

vi.mock('next/link', () => ({
  default: (props: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={props.href} className={props.className}>{props.children}</a>
  ),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => ({
    home: 'Início',
    dashboard: 'Painel',
    analytics: 'Análises',
  }[key] ?? key),
}));

import Breadcrumbs from '@/components/Breadcrumbs';

describe('Breadcrumbs', () => {
  it('renders translated crumbs and strips locale segment', () => {
    usePathnameMock.mockReturnValue('/pt/dashboard/analytics');

    render(<Breadcrumbs />);

    const homeLink = screen.getByRole('link', { name: 'Início' });
    const dashboardLink = screen.getByRole('link', { name: 'Painel' });
    expect(homeLink).toHaveAttribute('href', '/');
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    expect(screen.getByText('Análises')).toBeInTheDocument();
  });
});