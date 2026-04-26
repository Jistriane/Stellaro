import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { getAccountBalances, AssetBalance } from '../lib/stellar';
import { Wallet, TrendingUp, ShieldCheck, ArrowUpRight } from 'lucide-react-native';

const TEST_PUBLIC_KEY = 'GDW... (Placeholder)';

export default function Dashboard() {
  const [balances, setBalances] = useState<AssetBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we would get this from a wallet/session
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // Simulating data for preview
    const data = [
      { code: 'XLM', balance: '1250.50' },
      { code: 'STLT', balance: '500.00' },
      { code: 'RWA-APT1', balance: '10.0', issuer: 'G...' },
    ];
    setBalances(data);
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, Investidor</Text>
            <Text style={styles.subGreeting}>Sua carteira está segura</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <View style={styles.profilePlaceholder} />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Patrimônio Total</Text>
          <Text style={styles.balanceValue}>R$ 12.450,00</Text>
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
});
