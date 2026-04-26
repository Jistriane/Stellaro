import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Landmark, Info, ArrowRight } from 'lucide-react-native';

export default function Lending() {
  const pools = [
    { name: 'STLT Stable Pool', apy: '12.5%', liquidity: '$4.2M' },
    { name: 'XLM Yield Pool', apy: '8.2%', liquidity: '$1.8M' },
    { name: 'RWA Real Estate', apy: '15.0%', liquidity: '$500K' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Lending Pools</Text>
        <Text style={styles.subtitle}>Deposite e ganhe rendimentos on-chain</Text>

        <View style={styles.totalDeposited}>
          <Text style={styles.label}>Seu Saldo em Pools</Text>
          <Text style={styles.value}>R$ 5.230,00</Text>
        </View>

        {pools.map((pool, index) => (
          <TouchableOpacity key={index} style={styles.poolCard}>
            <View style={styles.poolHeader}>
              <View style={styles.iconContainer}>
                <Landmark size={24} color="#10b981" />
              </View>
              <View style={styles.poolInfo}>
                <Text style={styles.poolName}>{pool.name}</Text>
                <Text style={styles.liquidity}>Liquidez: {pool.liquidity}</Text>
              </View>
              <View style={styles.apyContainer}>
                <Text style={styles.apyLabel}>APY</Text>
                <Text style={styles.apyValue}>{pool.apy}</Text>
              </View>
            </View>
            <View style={styles.footer}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.buttonText}>Depositar</Text>
                <ArrowRight size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.infoButton}>
                <Info size={16} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4, marginBottom: 30 },
  totalDeposited: { backgroundColor: '#1e293b', padding: 20, borderRadius: 16, marginBottom: 30 },
  label: { color: '#94a3b8', fontSize: 12 },
  value: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 4 },
  poolCard: { backgroundColor: '#1e293b', padding: 20, borderRadius: 20, marginBottom: 16 },
  poolHeader: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  poolInfo: { flex: 1, marginLeft: 16 },
  poolName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  liquidity: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  apyContainer: { alignItems: 'flex-end' },
  apyLabel: { color: '#94a3b8', fontSize: 10 },
  apyValue: { color: '#10b981', fontSize: 18, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#334155' },
  actionButton: { backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', marginRight: 8 },
  infoButton: { padding: 4 },
});
