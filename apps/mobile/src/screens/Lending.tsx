import React from 'react';
import { SafeAreaView, ScrollView, Text, View, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Landmark, Info, ArrowRight } from 'lucide-react-native';
import { StellarWallet } from '../lib/stellar-wallet';
import { useMobileSSI } from '../hooks/useMobileSSI';
import { useBiometrics } from '../hooks/useBiometrics';
import * as StellarSdk from '@stellar/stellar-sdk';
import { ensureWalletSession, getChainConfig } from '../lib/backend';
import { invokeRead, invokeWrite } from '../lib/soroban-rpc';
import { theme } from '../lib/theme';

export default function Lending() {
  const [publicKey, setPublicKey] = React.useState<string>('');
  const { hasKyc, isLoading: isSsiLoading } = useMobileSSI();
  const { authenticate } = useBiometrics();

  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [rpcUrl, setRpcUrl] = React.useState<string>('');
  const [networkPassphrase, setNetworkPassphrase] = React.useState<string>('');
  const [loansPoolId, setLoansPoolId] = React.useState<string>('');

  const [ltvBps, setLtvBps] = React.useState<number | null>(null);
  const [interestBps, setInterestBps] = React.useState<number | null>(null);
  const [totalLiquidity, setTotalLiquidity] = React.useState<string>('—');
  const [myLenderPos, setMyLenderPos] = React.useState<string>('—');
  const [myDebt, setMyDebt] = React.useState<string>('—');

  const [amount, setAmount] = React.useState('0');
  const [collateralValue, setCollateralValue] = React.useState('0');
  
  React.useEffect(() => {
    StellarWallet.getPublicKey().then(setPublicKey);
  }, []);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await ensureWalletSession();
      const cfg = await getChainConfig();
      setRpcUrl(cfg.rpcUrl);
      setNetworkPassphrase(cfg.networkPassphrase);
      setLoansPoolId(cfg.contracts?.loansPool || '');

      if (!publicKey || !cfg.contracts?.loansPool) return;

      const params = await invokeRead({
        rpcUrl: cfg.rpcUrl,
        networkPassphrase: cfg.networkPassphrase,
        sourcePublicKey: publicKey,
        contractId: cfg.contracts.loansPool,
        method: 'params',
        args: [],
      });
      if (Array.isArray(params) && params.length >= 2) {
        setLtvBps(Number(params[0]));
        setInterestBps(Number(params[1]));
      }

      const liq = await invokeRead({
        rpcUrl: cfg.rpcUrl,
        networkPassphrase: cfg.networkPassphrase,
        sourcePublicKey: publicKey,
        contractId: cfg.contracts.loansPool,
        method: 'total_liquidity',
        args: [],
      });
      setTotalLiquidity(String(liq));

      const lenderPos = await invokeRead({
        rpcUrl: cfg.rpcUrl,
        networkPassphrase: cfg.networkPassphrase,
        sourcePublicKey: publicKey,
        contractId: cfg.contracts.loansPool,
        method: 'lender_position',
        args: [new (StellarSdk as any).Address(publicKey).toScVal()],
      });
      setMyLenderPos(String(lenderPos));

      const debt = await invokeRead({
        rpcUrl: cfg.rpcUrl,
        networkPassphrase: cfg.networkPassphrase,
        sourcePublicKey: publicKey,
        contractId: cfg.contracts.loansPool,
        method: 'position',
        args: [new (StellarSdk as any).Address(publicKey).toScVal()],
      });
      setMyDebt(String(debt));
    } catch (e: any) {
      setError(e?.message || 'Falha ao carregar lending');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);

  React.useEffect(() => {
    if (!publicKey) return;
    load();
  }, [publicKey, load]);

  const requireKyc = async (context: string) => {
    if (hasKyc) return true;
    Alert.alert('KYC Necessário', `Operação bloqueada (${context}). Finalize seu KYC e emissão da VC on-chain.`);
    return false;
  };

  const submit = async (method: 'deposit' | 'withdraw' | 'borrow' | 'repay') => {
    if (!rpcUrl || !networkPassphrase || !loansPoolId) {
      Alert.alert('Erro', 'Configuração de rede indisponível.');
      return;
    }
    if (!(await requireKyc(method))) return;

    const { success, error: authErr } = await authenticate(`Confirme a operação: ${method}`);
    if (!success) {
      Alert.alert('Falha', authErr || 'Autenticação falhou');
      return;
    }

    try {
      const seed = await StellarWallet.getSecretSeed();
      const from = new (StellarSdk as any).Address(publicKey).toScVal();
      const amt = StellarSdk.nativeToScVal(BigInt(amount || '0'), { type: 'u128' });
      const args =
        method === 'borrow'
          ? [
              from,
              amt,
              StellarSdk.nativeToScVal(BigInt(collateralValue || '0'), { type: 'u128' }),
            ]
          : [from, amt];

      const txHash = await invokeWrite({
        rpcUrl,
        networkPassphrase,
        signerSecret: seed,
        contractId: loansPoolId,
        method,
        args,
      });
      await load();
      Alert.alert('Sucesso', `TX: ${txHash}`);
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha na transação');
    }
  };

  const pools = [
    { name: 'LoansPool', apy: interestBps !== null ? `${(interestBps / 100).toFixed(2)}%` : '—', liquidity: totalLiquidity },
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
          <Text style={styles.value}>{myLenderPos}</Text>
          <Text style={[styles.label, { marginTop: 12 }]}>Sua Dívida</Text>
          <Text style={styles.value}>{myDebt}</Text>
          <Text style={[styles.label, { marginTop: 12 }]}>Params</Text>
          <Text style={styles.paramsText}>
            LTV: {ltvBps !== null ? `${(ltvBps / 100).toFixed(2)}%` : '—'} • Juros: {interestBps !== null ? `${(interestBps / 100).toFixed(2)}%` : '—'}
          </Text>
        </View>

        <View style={styles.formCard}>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="Amount (u128)"
            placeholderTextColor={theme.colors.inkFaint}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={collateralValue}
            onChangeText={setCollateralValue}
            placeholder="Collateral value (u128) para borrow"
            placeholderTextColor={theme.colors.inkFaint}
            keyboardType="numeric"
          />
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.gold },
                (!hasKyc || isSsiLoading) && { backgroundColor: theme.colors.bg3, borderWidth: 1, borderColor: theme.colors.rule },
              ]}
              onPress={() => submit('deposit')}
              disabled={!hasKyc || isSsiLoading}
            >
              <Text style={[styles.buttonText, { color: theme.colors.bg }]}>Depositar</Text>
              <ArrowRight size={16} color={theme.colors.bg} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.bg3, borderWidth: 1, borderColor: theme.colors.line },
                (!hasKyc || isSsiLoading) && { backgroundColor: theme.colors.bg3, borderWidth: 1, borderColor: theme.colors.rule },
              ]}
              onPress={() => submit('withdraw')}
              disabled={!hasKyc || isSsiLoading}
            >
              <Text style={styles.buttonText}>Sacar</Text>
              <ArrowRight size={16} color={theme.colors.ink} />
            </TouchableOpacity>
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.nebula },
                (!hasKyc || isSsiLoading) && { backgroundColor: theme.colors.bg3, borderWidth: 1, borderColor: theme.colors.rule },
              ]}
              onPress={() => submit('borrow')}
              disabled={!hasKyc || isSsiLoading}
            >
              <Text style={[styles.buttonText, { color: theme.colors.bg }]}>Borrow</Text>
              <ArrowRight size={16} color={theme.colors.bg} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.aurora },
                (!hasKyc || isSsiLoading) && { backgroundColor: theme.colors.bg3, borderWidth: 1, borderColor: theme.colors.rule },
              ]}
              onPress={() => submit('repay')}
              disabled={!hasKyc || isSsiLoading}
            >
              <Text style={[styles.buttonText, { color: theme.colors.bg }]}>Repay</Text>
              <ArrowRight size={16} color={theme.colors.bg} />
            </TouchableOpacity>
          </View>
          {isLoading ? <Text style={styles.statusText}>Carregando…</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        {pools.map((pool, index) => (
          <View key={index} style={styles.poolCard}>
            <View style={styles.poolHeader}>
              <View style={styles.iconContainer}>
                <Landmark size={24} color={theme.colors.gold} />
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
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.bg3, borderWidth: 1, borderColor: theme.colors.rule }]} disabled>
                <Text style={styles.buttonText}>Pool</Text>
                <ArrowRight size={16} color={theme.colors.ink} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.infoButton}>
                <Info size={16} color={theme.colors.inkDim} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  scrollContent: { padding: 20 },
  title: { fontSize: 24, color: theme.colors.ink, fontFamily: theme.fonts.sansMedium },
  subtitle: { fontSize: 14, color: theme.colors.inkDim, marginTop: 4, marginBottom: 30, fontFamily: theme.fonts.sansLight },
  totalDeposited: { backgroundColor: theme.colors.bg2, padding: 20, borderRadius: 16, marginBottom: 30, borderWidth: 1, borderColor: theme.colors.rule },
  label: { color: theme.colors.inkDim, fontSize: 12, fontFamily: theme.fonts.mono, textTransform: 'uppercase', letterSpacing: 1.2 },
  value: { color: theme.colors.ink, fontSize: 28, marginTop: 4, fontFamily: theme.fonts.sansMedium },
  paramsText: { color: theme.colors.inkDim, fontSize: 12, marginTop: 6, fontFamily: theme.fonts.sansLight },
  walletAddr: { color: theme.colors.gold, fontSize: 12, marginTop: 4, fontFamily: theme.fonts.mono, letterSpacing: 1.2 },
  formCard: { backgroundColor: theme.colors.bg2, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.rule, marginBottom: 20, gap: 12 },
  input: { backgroundColor: theme.colors.bg3, borderWidth: 1, borderColor: theme.colors.rule, color: theme.colors.ink, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: theme.fonts.sansRegular },
  actionsRow: { flexDirection: 'row', gap: 12 },
  statusText: { color: theme.colors.inkDim, fontSize: 12, fontFamily: theme.fonts.sansLight },
  errorText: { color: theme.colors.danger, fontSize: 12, fontFamily: theme.fonts.sansLight },
  poolCard: { backgroundColor: theme.colors.bg2, padding: 20, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.rule },
  poolHeader: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.bg3, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.rule },
  poolInfo: { flex: 1, marginLeft: 16 },
  poolName: { color: theme.colors.ink, fontSize: 16, fontFamily: theme.fonts.sansMedium },
  liquidity: { color: theme.colors.inkDim, fontSize: 12, marginTop: 2, fontFamily: theme.fonts.sansLight },
  apyContainer: { alignItems: 'flex-end' },
  apyLabel: { color: theme.colors.inkDim, fontSize: 10, fontFamily: theme.fonts.mono, textTransform: 'uppercase', letterSpacing: 1.2 },
  apyValue: { color: theme.colors.green, fontSize: 18, fontFamily: theme.fonts.sansMedium },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.rule },
  actionButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  buttonText: { color: theme.colors.ink, marginRight: 8, fontFamily: theme.fonts.mono, textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 10 },
  infoButton: { padding: 4 },
});
