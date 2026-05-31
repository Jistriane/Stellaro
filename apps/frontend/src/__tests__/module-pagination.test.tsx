import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: (props: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={props.href} className={props.className}>{props.children}</a>
  ),
}));

import ModulePagination from '@/components/ModulePagination';

describe('ModulePagination', () => {
  it('shows prev and next links with preserved query params', () => {
    render(
      <ModulePagination
        basePath="/rwa"
        page={2}
        pageSize={10}
        total={35}
        query={{ status: 'active', search: 'tokenized', empty: '' }}
      />,
    );

    expect(screen.getByText('Página', { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/\(\s*35\s*itens\)/i)).toBeInTheDocument();

    const prev = screen.getByRole('link', { name: 'Anterior' });
    const next = screen.getByRole('link', { name: 'Próxima' });
    expect(prev.getAttribute('href')).toContain('/rwa?page=1&pageSize=10');
    expect(prev.getAttribute('href')).toContain('status=active');
    expect(next.getAttribute('href')).toContain('/rwa?page=3&pageSize=10');
    expect(next.getAttribute('href')).toContain('search=tokenized');
  });

  it('renders disabled labels on bounds', () => {
    render(<ModulePagination basePath="/rwa" page={1} pageSize={10} total={8} />);

    expect(screen.getAllByText('Anterior').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Próxima').length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: 'Anterior' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Próxima' })).not.toBeInTheDocument();
  });
});
