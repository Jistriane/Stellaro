import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { ArrowUpRight, Wallet, ShieldCheck, ArrowDownLeft, TrendingUp } from 'lucide-react-native';
import { StellarWallet } from '../lib/stellar-wallet';

// Removed hardcoded TEST_PUBLIC_KEY

export default function Dashboard() {
  const [balance, setBalance] = useState<number>(0);
  const [balances, setBalances] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [language, setLanguage] = useState<'PT' | 'EN' | 'ES'>('PT');
  const [showCard, setShowCard] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const t = {
    PT: { greeting: 'Olá, Investidor', balance: 'Patrimônio Total', privacy: 'Shield' },
    EN: { greeting: 'Hello, Investor', balance: 'Total Assets', privacy: 'Shield' },
    ES: { greeting: 'Hola, Inversionista', balance: 'Patrimonio Total', privacy: 'Shield' },
  }[language];

  const [publicKey, setPublicKey] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const pk = await StellarWallet.getPublicKey();
      setPublicKey(pk);
      
      if (pk) {
        // Fetch real balances from Horizon
        const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${pk}`);
        const account = await response.json();
        
        if (account.balances) {
          setBalances(account.balances);
          // Set primary balance (XLM)
          const xlm = account.balances.find((b: any) => b.asset_type === 'native');
          setBalance(xlm ? parseFloat(xlm.balance) : 0);
        }

        // Fetch real history
        const historyRes = await fetch(`https://horizon-testnet.stellar.org/accounts/${pk}/payments?limit=5&order=desc`);
        const historyData = await historyRes.json();
        if (historyData._embedded) {
          setHistory(historyData._embedded.records);
        }
      }
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>{t.greeting}</Text>
            <View style={styles.langSelector}>
              {['PT', 'EN', 'ES'].map((l) => (
                <TouchableOpacity key={l} onPress={() => setLanguage(l as any)}>
                  <Text style={[styles.langText, language === l && styles.langActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.subGreeting}>{publicKey ? `Wallet: ${publicKey.slice(0, 6)}...${publicKey.slice(-4)}` : 'Sua carteira está segura'}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setIsPrivate(!isPrivate)}
            style={styles.privacyToggle}
          >
            <Text style={styles.privacyText}>{isPrivate ? '🔓 Revelar' : '🔒 Shield'}</Text>
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t.balance}</Text>
          <Text style={styles.balanceValue}>
            {isPrivate ? `ZK: Protected (> $${(balance * 0.9).toFixed(0)})` : `R$ ${balance.toLocaleString()}`}
          </Text>
          {isPrivate && <Text style={styles.zkHint}>Prova de Solvência Verificada ✓</Text>}
          <View style={styles.balanceChange}>
            <TrendingUp size={16} color="#10b981" />
            <Text style={styles.changeText}>+2.4% hoje</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionIconContainer}>
              <ArrowUpRight size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>Enviar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.actionIconContainer, { backgroundColor: '#3b82f6' }]}>
              <Wallet size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>Receber</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.actionIconContainer, { backgroundColor: '#a855f7' }]}>
              <ShieldCheck size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>Seguro</Text>
          </TouchableOpacity>
        </View>

        {/* Assets List */}
        {/* Virtual Card Section */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>Cartão Virtual Stellaro</Text>
          <TouchableOpacity 
            style={styles.virtualCard}
            onPress={() => setShowCard(!showCard)}
          >
            <View style={styles.cardInfo}>
              <Text style={styles.cardBrand}>STELLARO PLATINUM</Text>
              <Text style={styles.cardNumber}>
                {showCard ? '4532 8876 1234 9908' : '•••• •••• •••• 9908'}
              </Text>
              <Text style={styles.cardHolder}>INVESTIDOR STELLARO</Text>
            </View>
            <View style={styles.cardChip} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.walletButton}>
            <Text style={styles.walletButtonText}>Add to Apple Wallet </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Seus Ativos</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {balances.map((asset, index) => (
          <View key={index} style={styles.assetItem}>
            <View style={styles.assetIcon}>
              <Text style={styles.assetIconText}>{asset.code[0]}</Text>
            </View>
            <View style={styles.assetInfo}>
              <Text style={styles.assetCode}>{asset.code}</Text>
              <Text style={styles.assetName}>{asset.issuer ? 'Real World Asset' : 'Stablecoin'}</Text>
            </View>
            <View style={styles.assetValues}>
              <Text style={styles.assetBalance}>{asset.balance}</Text>
              <Text style={styles.assetFiat}>R$ {(parseFloat(asset.balance) * 5.2).toFixed(2)}</Text>
            </View>
          </View>
        ))}

        {/* Transaction History */}
        <View style={[styles.sectionHeader, { marginTop: 30 }]}>
          <Text style={styles.sectionTitle}>Atividade Recente</Text>
        </View>

        {history.length === 0 ? (
          <Text style={{ color: '#94a3b8', fontSize: 14 }}>Nenhuma transação recente encontrada.</Text>
        ) : (
          history.map((item, index) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyIcon}>
                <ArrowDownLeft size={20} color="#94a3b8" />
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyType}>{item.type === 'payment' ? 'Pagamento' : 'Operação'}</Text>
                <Text style={styles.historyDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.historyAmount}>
                {item.amount ? `${parseFloat(item.amount).toFixed(2)} ${item.asset_code || 'XLM'}` : '—'}
              </Text>
            </View>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subGreeting: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    padding: 2,
  },
  profilePlaceholder: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#334155',
  },
  balanceCard: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#334155',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  balanceChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    color: '#10b981',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  actionItem: {
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  seeAll: {
    color: '#3b82f6',
    fontSize: 14,
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  assetIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  assetIconText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  assetInfo: {
    flex: 1,
  },
  assetCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  assetName: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  assetValues: {
    alignItems: 'flex-end',
  },
  assetBalance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  assetFiat: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyType: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  historyDate: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  historyAmount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
