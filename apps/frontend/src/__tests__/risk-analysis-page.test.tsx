import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => ({
    'analysis.title': 'Risk analysis',
    'analysis.subtitle': 'Detailed credit and collateral overview',
  }[key] ?? key),
}));

vi.mock('recharts', () => {
  const MockChart = () => <div />;
  return {
    ResponsiveContainer: MockChart,
    RadarChart: MockChart,
    Radar: MockChart,
    PolarGrid: MockChart,
    PolarAngleAxis: MockChart,
    PolarRadiusAxis: MockChart,
    BarChart: MockChart,
    Bar: MockChart,
    XAxis: MockChart,
    YAxis: MockChart,
    CartesianGrid: MockChart,
    Tooltip: MockChart,
  };
});

import RiskAnalysisPage from '@/app/risk/analysis/page';

describe('RiskAnalysisPage', () => {
  it('renders mocked analysis data after loading state', async () => {
    render(<RiskAnalysisPage />);

    await waitFor(() => {
      expect(screen.getByText('Risk analysis')).toBeInTheDocument();
    });

    expect(screen.getByText('Detailed credit and collateral overview')).toBeInTheDocument();
    expect(screen.getByText('Credit Score')).toBeInTheDocument();
    expect(screen.getByText('720')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Risk Management Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Maintain collateral ratio above 150% for safety margin')).toBeInTheDocument();
  });
});