import { Landmark, Info, ArrowRight } from 'lucide-react-native';
import { StellarWallet } from '../lib/stellar-wallet';

export default function Lending() {
  const [publicKey, setPublicKey] = React.useState<string>('');
  
  React.useEffect(() => {
    StellarWallet.getPublicKey().then(setPublicKey);
  }, []);

  const handleDeposit = async (poolName: string) => {
    try {
      console.log(`Iniciando depósito em ${poolName}...`);
      // Em produção, aqui chamaríamos o backend para obter o XDR da transação de depósito
      // const xdr = await api.getDepositXdr(publicKey, poolName, amount);
      // const signedXdr = await StellarWallet.signTransaction(xdr);
      // await api.submitTransaction(signedXdr);
      alert(`Simulação: Depósito em ${poolName} assinado com sucesso pela carteira ${publicKey.slice(0, 8)}!`);
    } catch (e) {
      alert('Erro ao realizar depósito');
    }
  };

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
          <Text style={styles.label}>Sua Carteira Ativa</Text>
          <Text style={styles.walletAddr}>{publicKey ? `${publicKey.slice(0, 12)}...${publicKey.slice(-12)}` : 'Carregando...'}</Text>
          <Text style={[styles.label, { marginTop: 15 }]}>Seu Saldo em Pools</Text>
          <Text style={styles.value}>R$ 5.230,00</Text>
        </View>

        {pools.map((pool, index) => (
          <View key={index} style={styles.poolCard}>
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
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleDeposit(pool.name)}
              >
                <Text style={styles.buttonText}>Depositar</Text>
                <ArrowRight size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.infoButton}>
                <Info size={16} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>
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
  walletAddr: { color: '#3b82f6', fontSize: 12, marginTop: 4, fontFamily: 'monospace' },
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
