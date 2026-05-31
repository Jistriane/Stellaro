import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: (props: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={props.href} className={props.className}>{props.children}</a>
  ),
}));

import ModuleFilters from '@/components/ModuleFilters';

describe('ModuleFilters', () => {
  it('renders filter fields with defaults and reset link', () => {
    render(
      <ModuleFilters
        basePath="/modules"
        pageSize={25}
        values={{ q: 'vault', status: 'active' }}
        fields={[
          { name: 'q', label: 'Busca', placeholder: 'Digite' },
          {
            name: 'status',
            label: 'Status',
            options: [
              { value: 'active', label: 'Ativo' },
              { value: 'paused', label: 'Pausado' },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByDisplayValue('vault')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Ativo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aplicar filtros' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Limpar' })).toHaveAttribute('href', '/modules?page=1&pageSize=25');
  });
});