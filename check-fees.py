#!/usr/bin/env python3
"""
Stellar Mainnet Smart Fee Calculator para Soroban Contracts
Calcula fees corretamente antes de fazer deploy
"""

import requests
import sys

HORIZON_URL = "https://horizon.stellar.org"
MAINNET_PASSPHRASE = "Public Global Stellar Network ; September 2015"

def get_ledger_info():
    """Obter informações do ledger"""
    try:
        resp = requests.get(f"{HORIZON_URL}/ledgers?limit=1&order=desc")
        data = resp.json()
        
        if "records" in data and len(data["records"]) > 0:
            ledger = data["records"][0]
            return {
                "sequence": ledger["sequence"],
                "base_fee": ledger["base_fee"],
                "base_reserve": ledger["base_reserves"]["base_reserve"],
                "operating_reserve": ledger["base_reserves"]["operation_reserve"],
            }
    except Exception as e:
        print(f"Erro ao obter ledger info: {e}")
    
    return None

def get_account_info(public_key):
    """Obter informações da conta"""
    try:
        resp = requests.get(f"{HORIZON_URL}/accounts/{public_key}")
        data = resp.json()
        
        return {
            "balance": float(data["balances"][0]["balance"]),
            "sequence": int(data["sequence"]),
            "native_balance": data["balances"][0],
        }
    except Exception as e:
        print(f"Erro ao obter account info: {e}")
    
    return None

def main():
    account = "GCKZ35K7GMUJBFKBOS2YM7FUHATM5FHHFGH7AVNGC5TXLFGV265G33QX"
    
    print("🔍 Stellar Mainnet Fee Calculator")
    print("=" * 60)
    print()
    
    # Ledger info
    ledger_info = get_ledger_info()
    if ledger_info:
        print("📊 Informações do Ledger:")
        print(f"  Sequence: {ledger_info['sequence']}")
        print(f"  Base Fee: {ledger_info['base_fee']} stroops (~0.00001 XLM)")
        print(f"  Base Reserve: {ledger_info['base_reserve']} XLM")
        print()
    
    # Account info
    account_info = get_account_info(account)
    if account_info:
        print(f"💰 Conta: {account[:20]}...")
        print(f"  Saldo: {account_info['balance']} XLM")
        print(f"  Sequence: {account_info['sequence']}")
        print()
        
        # Reserve calculation
        base_reserve = 0.5  # Base reserve por entry
        num_signers = 1  # Só a conta
        num_data_entries = 0
        
        minimum_reserve = 2.0 + (num_signers * 0.5) + (num_data_entries * 0.5)
        available = account_info['balance'] - minimum_reserve
        
        print(f"💸 Cálculo de Reserve:")
        print(f"  Minimum Reserve: {minimum_reserve} XLM")
        print(f"  Disponível para gastos: {available:.4f} XLM")
        print()
        
        # Fee estimation
        print(f"📈 Estimativa de Fees para Deploy Soroban:")
        print()
        
        contracts = {
            "Stablecoin": 20,
            "RiskLock": 8.3,
            "Loans Pool (JÁ DEPLOYADO)": 13,
            "Portfolio": 7.7,
            "Governance": 9.4,
            "ZK Verifier": 23,
        }
        
        total_needed = 0
        for name, size_kb in contracts.items():
            # Aproximadamente 200 stroops por byte de WASM
            # Size em KB * 1024 bytes * 200 stroops/byte / 10,000,000 stroops per XLM
            fee_xlm = (size_kb * 1024 * 200) / 10_000_000
            total_needed += fee_xlm
            
            status = "✅ JÁ FEITO" if "JÁ" in name else f"  ({fee_xlm:.2f} XLM)"
            print(f"  {name:30} {status}")
        
        print()
        print(f"  Total necessário (5 restantes): ~{total_needed - 12.79:.2f} XLM")
        print(f"  Disponível agora: {available:.2f} XLM")
        
        if available < (total_needed - 12.79):
            print()
            print(f"⚠️  INSUFICIENTE!")
            print(f"   Faltam: {(total_needed - 12.79) - available:.2f} XLM")
            print()
            print(f"✅ Solução: Transferir ~15 XLM para:")
            print(f"   {account}")
        else:
            print()
            print(f"✅ SUFICIENTE para completar deployment!")

if __name__ == "__main__":
    main()
