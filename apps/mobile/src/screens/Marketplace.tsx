import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Store, TrendingUp, ArrowDownCircle, ArrowUpCircle } from 'lucide-react-native';
import { StellarWallet } from '../lib/stellar-wallet';
import { useBiometrics } from '../hooks/useBiometrics';
import { useMobileSSI } from '../hooks/useMobileSSI';
import { useTelemetry } from '../hooks/useTelemetry';
import { ShieldAlert, Loader2 } from 'lucide-react-native';

export default function Marketplace() {
  const [publicKey, setPublicKey] = React.useState<string>('');
  const { authenticate } = useBiometrics();
  const { hasKyc, isLoading: isSsiLoading, requestKyc } = useMobileSSI();
  const { reportEvent } = useTelemetry();
  const [isKycRequesting, setIsKycRequesting] = React.useState(false);
  
  React.useEffect(() => {
    StellarWallet.getPublicKey().then(setPublicKey);
  }, []);

  const handleTrade = async (asset: string, type: 'BUY' | 'SELL') => {
    try {
      await reportEvent('TRADE_START', { asset, type });
      
      // REQUIRE BIOMETRICS FOR TRADE
      const { success, error } = await authenticate(`Confirme a ${type === 'BUY' ? 'compra' : 'venda'} de ${asset}`);
      
      if (!success) {
        await reportEvent('BIO_FAILURE', { asset, type, error });
        alert(error || 'Autenticação falhou');
        return;
      }

      await reportEvent('BIO_SUCCESS', { asset, type });
      console.log(`Iniciando ${type} de ${asset}...`);
      // Simulação de trade via Soroban
      alert(`Simulação: Ordem de ${type === 'BUY' ? 'Compra' : 'Venda'} de ${asset} assinada com sucesso após biometria!`);
    } catch (e) {
      alert('Erro ao processar trade');
    }
  };

  const assets = [
    { name: 'Apartamento Jardins SP', symbol: 'RWA-APT1', price: 'R$ 1.250,00', change: '+5.2%' },
    { name: 'Fazenda Soja MT', symbol: 'RWA-MT3', price: 'R$ 850,00', change: '+2.1%' },
    { name: 'Títulos Tesouro US', symbol: 'RWA-UST', price: 'R$ 520,00', change: '-0.3%' },
  ];

  const handleRequestKyc = async () => {
    await reportEvent('KYC_BLOCKED', { context: 'marketplace_trade_attempt' });
    setIsKycRequesting(true);
    await requestKyc();
    setIsKycRequesting(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scrollContent}>
        <Text style={styles.title}>Mercado RWA</Text>
        <Text style={styles.subtitle}>Negocie frações de ativos reais</Text>

        <View style={styles.searchBar}>
          <Text style={styles.searchText}>Wallet: {publicKey ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}` : 'Conectando...'}</Text>
        </View>

        <Text style={styles.sectionTitle}>Ativos em Destaque</Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          {assets.map((asset, index) => (
            <View key={index} style={styles.assetCard}>
              <View style={styles.assetHeader}>
                <View style={styles.assetIcon}>
                  <Text style={styles.assetInitial}>{asset.symbol[4]}</Text>
                </View>
                <View style={styles.assetMeta}>
                  <Text style={styles.assetName}>{asset.name}</Text>
                  <Text style={styles.assetSymbol}>{asset.symbol}</Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.priceText}>{asset.price}</Text>
                  <Text style={[styles.changeText, { color: asset.change.includes('+') ? '#10b981' : '#ef4444' }]}>
                    {asset.change}
                  </Text>
                </View>
              </View>
              <View style={styles.actionButtons}>
                {!hasKyc ? (
                  <TouchableOpacity 
                    style={styles.kycBtn}
                    onPress={handleRequestKyc}
                    disabled={isKycRequesting || isSsiLoading}
                  >
                    {isKycRequesting || isSsiLoading ? (
                      <Loader2 size={16} color="#94a3b8" />
                    ) : (
                      <ShieldAlert size={16} color="#f59e0b" />
                    )}
                    <Text style={styles.kycBtnText}>🔒 Verificar KYC</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity 
                      style={[styles.tradeBtn, { backgroundColor: '#10b981' }]}
                      onPress={() => handleTrade(asset.symbol, 'BUY')}
                    >
                      <ArrowDownCircle size={16} color="#fff" />
                      <Text style={styles.tradeBtnText}>Comprar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.tradeBtn, { backgroundColor: '#334155' }]}
                      onPress={() => handleTrade(asset.symbol, 'SELL')}
                    >
                      <ArrowUpCircle size={16} color="#fff" />
                      <Text style={styles.tradeBtnText}>Vender</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { padding: 20, flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4, marginBottom: 20 },
  searchBar: { backgroundColor: '#1e293b', padding: 12, borderRadius: 12, marginBottom: 30 },
  searchText: { color: '#64748b' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  assetCard: { backgroundColor: '#1e293b', padding: 16, borderRadius: 20, marginBottom: 16 },
  assetHeader: { flexDirection: 'row', alignItems: 'center' },
  assetIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  assetInitial: { color: '#10b981', fontSize: 18, fontWeight: 'bold' },
  assetMeta: { flex: 1, marginLeft: 12 },
  assetName: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  assetSymbol: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  priceContainer: { alignItems: 'flex-end' },
  priceText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  changeText: { fontSize: 12, marginTop: 2 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 12 },
  tradeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 8 },
  tradeBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  kycBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', gap: 8 },
  kycBtnText: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold' },
});
