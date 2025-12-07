/**
 * Dashboard Component - Stellaro
 * 
 * Exibe metricas em tempo real:
 * - TVL total (via Reflector)
 * - Portfolio valuation
 * - Gráficos de APY
 * - Alertas de anomalias
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
  // Assets monitorados
  const trackedAssets = ['USDC', 'USDT', 'BTC', 'ETH', 'XLM'];
  const { prices, loading: pricesLoading, error: pricesError } = useReflectorPrices(trackedAssets);

  // Portfolio do usuário (exemplo - seria vindo de estado/BD real)
  const userPortfolio = new Map<string, number>([
    ['USDC', 1000],
    ['XLM', 500],
    ['BTC', 0.1],
  ]);
  const { valuation, loading: valuationLoading, error: valuationError } = usePortfolioValuation(userPortfolio);

  // Detecção de anomalias
  const { anomaly: btcAnomaly, loading: btcAnomalyLoading } = usePriceAnomaly('BTC', 15);
  const { anomaly: ethAnomaly } = usePriceAnomaly('ETH', 15);

  // Estado local
  const [selectedAsset, setSelectedAsset] = useState<string>('USDC');

  // Calcula TVL total
  const totalTvl = Array.from(prices.values()).reduce((sum, price) => sum + price.price * 100, 0); // Multiplicador estimado

  // Dados para gráfico de APY (exemplo estático - seria dinâmico)
  const apyChartData = [
    { name: 'Semana 1', apy: 8.5 },
    { name: 'Semana 2', apy: 8.7 },
    { name: 'Semana 3', apy: 8.9 },
    { name: 'Semana 4', apy: 8.6 },
    { name: 'Semana 5', apy: 9.2 },
    { name: 'Semana 6', apy: 9.5 },
  ];

  const metrics: DashboardMetric[] = [
    {
      label: 'TVL Total',
      value: totalTvl,
      unit: 'USD',
      change: 125000,
      changePercent: 2.5,
    },
    {
      label: 'Seu Portfolio',
      value: valuation?.totalUSD || 0,
      unit: 'USD',
    },
    {
      label: 'APY Médio',
      value: 9.1,
      unit: '%',
      change: 0.6,
      changePercent: 7.1,
    },
    {
      label: 'Total Emprestado',
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
          Powered by Reflector Network - Preços em tempo real
        </p>
      </div>

      {/* Métricas Principais */}
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
                  {metric.value.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  <span className="text-sm font-normal ml-1">{metric.unit}</span>
                </div>
                {metric.changePercent !== undefined && (
                  <p className="text-xs text-green-600 font-medium">
                    +{metric.changePercent.toFixed(1)}% vs. semana anterior
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alertas de Anomalias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {btcAnomaly?.isAnomaly && (
          <Alert variant={btcAnomaly.severity === 'CRITICAL' ? 'destructive' : 'default'}>
            <AlertDescription>
              <strong>⚠️ Anomalia BTC:</strong> Desvio de {btcAnomaly.zScore.toFixed(2)}σ
              detectado. {btcAnomaly.recommendation}
            </AlertDescription>
          </Alert>
        )}
        {ethAnomaly?.isAnomaly && (
          <Alert variant={ethAnomaly.severity === 'CRITICAL' ? 'destructive' : 'default'}>
            <AlertDescription>
              <strong>⚠️ Anomalia ETH:</strong> Desvio de {ethAnomaly.zScore.toFixed(2)}σ
              detectado. {ethAnomaly.recommendation}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Seção de Preços */}
      <Card>
        <CardHeader>
          <CardTitle>Preços em Tempo Real (Reflector Network)</CardTitle>
          <CardDescription>Atualizado a cada 30 segundos</CardDescription>
        </CardHeader>
        <CardContent>
          {pricesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2">Carregando preços...</span>
            </div>
          ) : pricesError ? (
            <div className="text-red-600">Erro ao carregar preços: {pricesError.message}</div>
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
                        Atualizado: {new Date(price.timestamp).toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-xl">
                        ${price.price.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      {price.confidence && (
                        <p className="text-xs text-gray-500">
                          Confiança: {(price.confidence * 100).toFixed(0)}%
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

      {/* Gráfico APY */}
      <Card>
        <CardHeader>
          <CardTitle>APY Histórico</CardTitle>
          <CardDescription>Taxa de yield nos últimos meses</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Portfolio do Usuário */}
      <Card>
        <CardHeader>
          <CardTitle>Seu Portfolio</CardTitle>
          <CardDescription>Valorização em tempo real</CardDescription>
        </CardHeader>
        <CardContent>
          {valuationLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2">Calculando valorização...</span>
            </div>
          ) : valuationError ? (
            <div className="text-red-600">
              Erro ao calcular valorização: {valuationError.message}
            </div>
          ) : valuation ? (
            <div className="space-y-4">
              {/* Total */}
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-3xl font-bold">
                  ${valuation.totalUSD.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              {/* Breakdown */}
              <div className="space-y-2">
                {Array.from(valuation.assets.entries()).map(([asset, data]) => (
                  <div key={asset} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{asset}</p>
                        <p className="text-sm text-gray-600">
                          {data.quantity.toFixed(4)} {asset}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          ${data.value.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-sm text-gray-600">
                          @ ${data.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
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
          | Última atualização:{' '}
          {new Date().toLocaleTimeString('pt-BR')}
        </p>
      </div>
    </div>
  );
}

export default ReflectorDashboard;
