import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => ({
    hero_title: 'Build real-world assets on Stellar',
    hero_subtitle: 'Unified rails for payments, governance and compliance.',
  }[key] ?? key),
}));

import HomeHero from '@/components/HomeHero';

describe('HomeHero', () => {
  it('renders translated hero content and brand assets', () => {
    render(<HomeHero />);

    expect(screen.getByAltText('Stellaro cover')).toBeInTheDocument();
    expect(screen.getByAltText('Stellaro logo')).toBeInTheDocument();
    expect(screen.getByText('Build real-world assets on Stellar')).toBeInTheDocument();
    expect(screen.getByText('Unified rails for payments, governance and compliance.')).toBeInTheDocument();
    expect(screen.getByText('Stellaro')).toBeInTheDocument();
  });
});