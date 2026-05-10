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
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Stellaro DeFi Dashboard</h1>
        <p className="text-gray-600">
          Powered by Reflector Network - Real-time Prices
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold">
                  {metric.value.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  <span className="text-sm font-normal ml-1">{metric.unit}</span>
                </div>
                {metric.changePercent !== undefined && (
                  <p className="text-xs text-green-600 font-medium">
                    +{metric.changePercent.toFixed(1)}% vs. previous week
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Anomaly alerts */}
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

      {/* Prices Section */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Prices (Reflector Network)</CardTitle>
          <CardDescription>Updated every 30 seconds</CardDescription>
        </CardHeader>
        <CardContent>
          {pricesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2">Loading prices...</span>
            </div>
          ) : pricesError ? (
            <div className="text-red-600">Error loading prices: {pricesError.message}</div>
          ) : (
            <div className="space-y-2">
              {Array.from(prices.entries()).map(([asset, price]) => (
                <div
                  key={asset}
                  onClick={() => setSelectedAsset(asset)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedAsset === asset
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-lg">{asset}</p>
                      <p className="text-xs text-gray-500">
                        Updated: {new Date(price.timestamp).toLocaleTimeString('en-US')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-xl">
                        ${price.price.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      {price.confidence && (
                        <p className="text-xs text-gray-500">
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

      {/* APY chart */}
      <Card>
        <CardHeader>
          <CardTitle>Historical APY</CardTitle>
          <CardDescription>Yield rate over the last months</CardDescription>
        </CardHeader>
        <CardContent>
          {isMounted ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={apyChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`, 'APY']} />
              <Legend />
              <Line
                type="monotone"
                dataKey="apy"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] rounded-lg border border-dashed border-gray-200" />
          )}
        </CardContent>
      </Card>

      {/* User Portfolio */}
      <Card>
        <CardHeader>
          <CardTitle>Your Portfolio</CardTitle>
          <CardDescription>Real-time valuation</CardDescription>
        </CardHeader>
        <CardContent>
          {valuationLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2">Calculating valuation...</span>
            </div>
          ) : valuationError ? (
            <div className="text-red-600">
              Error calculating valuation: {valuationError.message}
            </div>
          ) : valuation ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <p className="text-sm text-gray-600">Total value</p>
                <p className="text-2xl font-bold">
                  ${valuation.totalUSD.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-gray-500">
                  Updated {new Date(valuation.lastUpdate).toLocaleTimeString('en-US')}
                </p>
              </div>

              <div className="space-y-2">
                {Array.from(valuation.assets.entries()).map(([asset, data]) => (
                  <div key={asset} className="flex justify-between items-center border border-gray-100 rounded-lg p-3">
                    <div>
                      <p className="font-semibold">{asset}</p>
                      <p className="text-sm text-gray-600">
                        {data.quantity.toFixed(4)} {asset} @ ${data.price.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-bold">
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
            <div className="text-sm text-gray-500">No portfolio data available.</div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 pt-4 border-t">
        <p>
          Dashboard powered by{' '}
          <a
            href="https://reflector.network"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
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
