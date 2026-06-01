import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import BridgePage from '@/app/bridge/page';

describe('BridgePage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without mocked bridge data', async () => {
    render(<BridgePage />);

    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('subtitle')).toBeInTheDocument();
    expect(screen.getByText(/interface de bridge fica indisponível/i)).toBeInTheDocument();
  });
});
