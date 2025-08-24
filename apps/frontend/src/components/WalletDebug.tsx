"use client";
import { useEffect, useState } from "react";
import { detectAvailable, forceWalletDetection } from "../lib/wallets/connectors";
import type { WalletConnectorInfo } from "../lib/wallets/connectors";

export default function WalletDebug() {
  const [wallets, setWallets] = useState<WalletConnectorInfo[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const updateWallets = () => {
    const detected = detectAvailable();
    setWallets(detected);
    setLastUpdate(new Date());
  };

  const forceDetection = async () => {
    setIsDetecting(true);
    console.log('[WalletDebug] Forcing wallet detection...');
    await forceWalletDetection();
    updateWallets();
    setIsDetecting(false);
  };

  useEffect(() => {
    updateWallets();
    
    // Atualiza a cada 2 segundos para debug
    const interval = setInterval(updateWallets, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">🔧 Wallet Detection Debug</h3>
      
      <div className="mb-4 flex gap-2">
        <button 
          onClick={updateWallets}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Refresh
        </button>
        <button 
          onClick={forceDetection}
          disabled={isDetecting}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
        >
          {isDetecting ? 'Detecting...' : 'Force Detection'}
        </button>
      </div>

      {lastUpdate && (
        <p className="text-xs text-gray-500 mb-3">
          Last update: {lastUpdate.toLocaleTimeString()}
        </p>
      )}

      <div className="space-y-2">
        {wallets.map((wallet) => (
          <div 
            key={wallet.id}
            className={`p-3 rounded border-l-4 ${
              wallet.available 
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                : 'border-red-500 bg-red-50 dark:bg-red-900/20'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{wallet.name}</span>
              <span className={`px-2 py-1 rounded text-xs ${
                wallet.available 
                  ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                  : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
              }`}>
                {wallet.available ? '✅ Available' : '❌ Not Found'}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              ID: {wallet.id}
            </p>
            {wallet.providerHint && (
              <p className="text-xs text-gray-500 mt-1">
                Hint: {wallet.providerHint}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
        <p><strong>Debug Tips:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Open browser console to see detailed detection logs</li>
          <li>Install wallet extensions and refresh this page</li>
          <li>Check if wallet extensions are enabled and unlocked</li>
          <li>Some wallets may need to be opened/activated before detection</li>
        </ul>
      </div>
    </div>
  );
}
