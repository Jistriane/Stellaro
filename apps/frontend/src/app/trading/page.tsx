"use client";

import Link from "next/link";
import TradingView from "@/components/TradingView";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MarketSelector from "./MarketSelector";
import OrderBox from "./OrderBox";
import RiskTools from "./RiskTools";
import { useTranslations } from "next-intl";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";

export default function TradingPage() {
  const t = useTranslations('trading');
  
  // Enable real-time updates when the wallet connects
  useRealTimeUpdates();
  // simple mocks
  const orderBook = {
    asks: [
      { price: 270500, qty: 0.01 },
      { price: 270600, qty: 0.05 },
      { price: 270700, qty: 0.12 },
    ],
    bids: [
      { price: 270400, qty: 0.02 },
      { price: 270300, qty: 0.08 },
      { price: 270200, qty: 0.11 },
    ],
  };

  const recentTrades = [
    { side: "buy", price: 270500, qty: 0.01, time: "14:43" },
    { side: "sell", price: 270400, qty: 0.02, time: "14:42" },
    { side: "buy", price: 270450, qty: 0.03, time: "14:41" },
  ];

  const openOrders = [
    { id: "O-1001", type: "LIMIT", qty: 0.01, price: 270000, status: "open" },
    { id: "O-1002", type: "STOP", qty: 0.02, price: 265000, status: "open" },
  ];

  const history = [
    { id: "H-2001", side: "BUY", pair: "BTC/BRL", qty: 0.01, price: 269000, date: "today" },
    { id: "H-2002", side: "SELL", pair: "BTC/BRL", qty: 0.005, price: 271000, date: "yesterday" },
  ];

  function brl(v: number) {
    return v.toLocaleString("en-US", { style: "currency", currency: "BRL" });
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header and intro */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('header.title')}</h1>
        <div className="text-xs text-slate-500">{t('header.platform_normal')}</div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('intro.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-300">
            {t('intro.p1')}
          </p>
        </CardContent>
      </Card>

      {/* Market selection and 24h metrics */}
      <Card>
        <CardHeader>
          <CardTitle>{t('market.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <MarketSelector />
        </CardContent>
      </Card>

      {/* Main grid: chart, book, trades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('chart.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[420px]">
              <TradingView />
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('orderbook.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-slate-400 mb-1">{t('orderbook.asks')}</div>
                  <ul className="space-y-1">
                    {orderBook.asks.map((a, i) => (
                      <li key={i} className="flex justify-between text-rose-300">
                        <span>{brl(a.price)}</span>
                        <span>{a.qty} BTC</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-slate-400 mb-1">{t('orderbook.bids')}</div>
                  <ul className="space-y-1">
                    {orderBook.bids.map((b, i) => (
                      <li key={i} className="flex justify-between text-emerald-300">
                        <span>{brl(b.price)}</span>
                        <span>{b.qty} BTC</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('recent.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs space-y-1">
                {recentTrades.map((t, i) => (
                  <li key={i} className="flex justify-between">
                    <span className={t.side === 'buy' ? 'text-emerald-300' : 'text-rose-300'}>{brl(t.price)}</span>
                    <span className="text-slate-300">{t.qty} BTC</span>
                    <span className="text-slate-500">{t.time}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Order box and risk tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('order_box.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderBox base="BTC" quote="BRL" priceRef={270000} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('risk_tools.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskTools base="BTC" quote="BRL" priceRef={270000} />
          </CardContent>
        </Card>
      </div>

      {/* Balances, orders, and history */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('balances.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-300 space-y-1">
              <div>{t('balances.btc_label')}: 0.027</div>
              <div>{t('balances.brl_label')}: {brl(1230)}</div>
              <div className="flex gap-2 mt-2">
                <button className="px-3 py-1 rounded bg-slate-800">{t('balances.deposit')}</button>
                <button className="px-3 py-1 rounded bg-slate-800">{t('balances.withdraw')}</button>
                <button className="px-3 py-1 rounded bg-slate-800">{t('balances.transfer')}</button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('open_orders.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {openOrders.length === 0 ? (
              <div className="text-sm text-slate-400">{t('open_orders.empty')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-slate-400">
                    <tr>
                      <th className="text-left font-medium">{t('open_orders.table.id')}</th>
                      <th className="text-left font-medium">{t('open_orders.table.type')}</th>
                      <th className="text-left font-medium">{t('open_orders.table.qty')}</th>
                      <th className="text-left font-medium">{t('open_orders.table.price')}</th>
                      <th className="text-left font-medium">{t('open_orders.table.status')}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {openOrders.map((o) => (
                      <tr key={o.id} className="border-t border-slate-800">
                        <td>{o.id}</td>
                        <td>{o.type}</td>
                        <td>{o.qty} BTC</td>
                        <td>{brl(o.price)}</td>
                        <td>{t(`open_orders.status.${o.status}`)}</td>
                        <td className="text-right">
                          <div className="flex justify-end gap-2">
                            <button className="px-2 py-1 rounded bg-slate-800 text-xs">{t('open_orders.actions.edit')}</button>
                            <button className="px-2 py-1 rounded bg-rose-700 text-white text-xs">{t('open_orders.actions.cancel')}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('history.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2 text-sm">
            <div className="text-slate-400">{t('history.quick_filters')}</div>
            <button className="px-3 py-1 rounded bg-slate-800 text-xs">{t('history.export_csv')}</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="text-left font-medium">{t('history.table.id')}</th>
                  <th className="text-left font-medium">{t('history.table.side')}</th>
                  <th className="text-left font-medium">{t('history.table.pair')}</th>
                  <th className="text-left font-medium">{t('history.table.qty')}</th>
                  <th className="text-left font-medium">{t('history.table.price')}</th>
                  <th className="text-left font-medium">{t('history.table.date')}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-t border-slate-800">
                    <td>{h.id}</td>
                    <td>{h.side}</td>
                    <td>{h.pair}</td>
                    <td>{h.qty}</td>
                    <td>{brl(h.price)}</td>
                    <td>{t(`history.dates.${h.date}`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Market info, fees and shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle>{t('info.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-slate-400">{t('info.fees')}</div>
              <div className="text-slate-300">{t('info.fees_line')}</div>
              <Link className="text-indigo-300 underline text-xs" href="/docs">{t('info.fees_link')}</Link>
            </div>
            <div>
              <div className="text-slate-400">{t('info.market')}</div>
              <div className="text-slate-300">{t('info.market_24h', { vol: brl(12000000), max: brl(275000), min: brl(265000) })}</div>
              <div className="text-slate-500 text-xs">{t('info.depth_soon')}</div>
            </div>
            <div>
              <div className="text-slate-400">{t('info.shortcuts')}</div>
              <div className="flex flex-wrap gap-2 mt-1">
                <button className="px-3 py-1 rounded bg-slate-800">{t('info.shortcuts_news')}</button>
                <button className="px-3 py-1 rounded bg-slate-800">{t('info.shortcuts_view_fees')}</button>
                <button className="px-3 py-1 rounded bg-slate-800">{t('info.shortcuts_support')}</button>
                <button className="px-3 py-1 rounded bg-slate-800">{t('info.shortcuts_dark_mode')}</button>
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">{t('info.tips')}</div>
        </CardContent>
      </Card>
    </div>
  );
}

