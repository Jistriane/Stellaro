/**
 * Dashboard Component - Stellaro
 * 
 * Shows real-time metrics:
 * - Total TVL (via Reflector)
 * - Portfolio valuation
 * - APY charts
 * - Anomaly alerts
 */

'use client';

import React, { useState } from 'react';
import { useReflectorPrices, usePortfolioValuation, usePriceAnomaly } from '@/hooks/useReflectorPrices';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface DashboardMetric {
  label: string;
  value: number;
  unit: string;
  change?: number;
  changePercent?: number;
}

export function ReflectorDashboard() {
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Monitored assets
  const trackedAssets = ['USDC', 'USDT', 'BTC', 'ETH', 'XLM'];
  const { prices, loading: pricesLoading, error: pricesError } = useReflectorPrices(trackedAssets);

  // User portfolio (mock - would come from real state/db)
  const userPortfolio = new Map<string, number>([
    ['USDC', 1000],
    ['XLM', 500],
    ['BTC', 0.1],
  ]);
  const { valuation, loading: valuationLoading, error: valuationError } = usePortfolioValuation(userPortfolio);

  // Anomaly detection
  const { anomaly: btcAnomaly, loading: btcAnomalyLoading } = usePriceAnomaly('BTC', 15);
  const { anomaly: ethAnomaly } = usePriceAnomaly('ETH', 15);

  // Local state
  const [selectedAsset, setSelectedAsset] = useState<string>('USDC');

  // Calculate total TVL (rough multiplier)
  const totalTvl = Array.from(prices.values()).reduce((sum, price) => sum + price.price * 100, 0);

  // APY chart data (static example - would be dynamic)
  const apyChartData = [
    { name: 'Week 1', apy: 8.5 },
    { name: 'Week 2', apy: 8.7 },
    { name: 'Week 3', apy: 8.9 },
    { name: 'Week 4', apy: 8.6 },
    { name: 'Week 5', apy: 9.2 },
    { name: 'Week 6', apy: 9.5 },
  ];

  const metrics: DashboardMetric[] = [
    {
      label: 'Total TVL',
      value: totalTvl,
      unit: 'USD',
      change: 125000,
      changePercent: 2.5,
    },
    {
      label: 'Your Portfolio',
      value: valuation?.totalUSD || 0,
      unit: 'USD',
    },
    {
      label: 'Average APY',
      value: 9.1,
      unit: '%',
      change: 0.6,
      changePercent: 7.1,
    },
    {
      label: 'Total Borrowed',
      value: 5234100,
      unit: 'USD',
    },
  ];

  return (
    <div className="w-full space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Stellaro DeFi Dashboard</h1>
        <p className="text-muted-foreground">
          Powered by Reflector Network - Real-time Prices
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-foreground">
                  {metric.value.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  <span className="text-sm font-normal ml-1 text-muted-foreground">{metric.unit}</span>
                </div>
                {metric.changePercent !== undefined && (
                  <p className="text-xs text-primary font-medium">
                    +{metric.changePercent.toFixed(1)}% vs. previous week
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {btcAnomaly?.isAnomaly && (
          <Alert variant={btcAnomaly.severity === 'CRITICAL' ? 'destructive' : 'default'}>
            <AlertDescription>
              <strong>⚠️ BTC anomaly:</strong> Deviation of {btcAnomaly.zScore.toFixed(2)}σ
              detected. {btcAnomaly.recommendation}
            </AlertDescription>
          </Alert>
        )}
        {ethAnomaly?.isAnomaly && (
          <Alert variant={ethAnomaly.severity === 'CRITICAL' ? 'destructive' : 'default'}>
            <AlertDescription>
              <strong>⚠️ ETH anomaly:</strong> Deviation of {ethAnomaly.zScore.toFixed(2)}σ
              detected. {ethAnomaly.recommendation}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Real-time Prices (Reflector Network)</CardTitle>
          <CardDescription>Updated every 30 seconds</CardDescription>
        </CardHeader>
        <CardContent>
          {pricesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading prices...</span>
            </div>
          ) : pricesError ? (
            <div className="text-destructive">Error loading prices: {pricesError.message}</div>
          ) : (
            <div className="space-y-2">
              {Array.from(prices.entries()).map(([asset, price]) => (
                <div
                  key={asset}
                  onClick={() => setSelectedAsset(asset)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                    selectedAsset === asset
                      ? 'bg-primary/10 border-primary/40'
                      : 'bg-secondary/30 hover:bg-secondary/50 border-border/60'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-lg text-foreground">{asset}</p>
                      <p className="text-xs text-muted-foreground">
                        Updated: {new Date(price.timestamp).toLocaleTimeString('en-US')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-xl text-foreground">
                        ${price.price.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      {price.confidence && (
                        <p className="text-xs text-muted-foreground">
                          Confidence: {(price.confidence * 100).toFixed(0)}%
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historical APY</CardTitle>
          <CardDescription>Yield rate over the last months</CardDescription>
        </CardHeader>
        <CardContent>
          {isMounted ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={apyChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'APY']}
                  contentStyle={{
                    backgroundColor: 'rgba(10, 12, 16, 0.85)',
                    border: '1px solid rgba(244, 236, 220, 0.10)',
                    borderRadius: 14,
                    color: 'rgb(244, 236, 220)',
                    backdropFilter: 'blur(12px)',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="apy"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 4, stroke: 'hsl(var(--primary))', fill: 'rgba(0,0,0,0)' }}
                  activeDot={{ r: 6, stroke: 'hsl(var(--primary))', fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] rounded-lg border border-dashed border-border/60" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Portfolio</CardTitle>
          <CardDescription>Real-time valuation</CardDescription>
        </CardHeader>
        <CardContent>
          {valuationLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Calculating valuation...</span>
            </div>
          ) : valuationError ? (
            <div className="text-destructive">
              Error calculating valuation: {valuationError.message}
            </div>
          ) : valuation ? (
            <div className="space-y-4">
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/30">
                <p className="text-sm text-muted-foreground">Total value</p>
                <p className="text-2xl font-bold text-foreground">
                  ${valuation.totalUSD.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  Updated {new Date(valuation.lastUpdate).toLocaleTimeString('en-US')}
                </p>
              </div>

              <div className="space-y-2">
                {Array.from(valuation.assets.entries()).map(([asset, data]) => (
                  <div key={asset} className="flex justify-between items-center border border-border/60 bg-secondary/20 rounded-lg p-3">
                    <div>
                      <p className="font-semibold text-foreground">{asset}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.quantity.toFixed(4)} {asset} @ ${data.price.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-bold text-foreground">
                      ${data.value.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No portfolio data available.</div>
          )}
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground pt-4 border-t border-border/60">
        <p>
          Dashboard powered by{' '}
          <a
            href="https://reflector.network"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Reflector Network
          </a>{' '}
          | Last update:{' '}
          {new Date().toLocaleTimeString('en-US')}
        </p>
      </div>
    </div>
  );
}

export default ReflectorDashboard;
