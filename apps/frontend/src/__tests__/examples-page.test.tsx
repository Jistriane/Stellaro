import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => ({
    title: 'Code examples',
    subtitle: 'Practical snippets for Stellaro integrations',
    ready_to_use: 'Ready to use',
    ready_to_use_desc: 'Production-friendly snippets.',
    copy_paste: 'Copy and paste',
    copy_paste_desc: 'Start quickly with boilerplate.',
    multiple_langs: 'Multiple languages',
    multiple_langs_desc: 'TypeScript-focused examples.',
    'resources.title': 'Resources',
    'resources.description': 'More docs and starter materials.',
  }[key] ?? key),
}));

import ExamplesPage from '@/app/examples/page';

describe('ExamplesPage', () => {
  it('filters categories and copies code snippets', () => {
    const clipboardSpy = vi.fn();
    Object.assign(navigator, {
      clipboard: { writeText: clipboardSpy },
    });

    render(<ExamplesPage />);

    expect(screen.getByText('Code examples')).toBeInTheDocument();
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'DeFi' }));
    expect(screen.getByText('Call Contract Function')).toBeInTheDocument();
    expect(screen.queryByText('Request Loan')).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Copy Code' })[0]);
    expect(clipboardSpy).toHaveBeenCalled();
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });
});