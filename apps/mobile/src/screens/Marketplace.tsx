import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react-native';
import { StellarWallet } from '../lib/stellar-wallet';
import { useBiometrics } from '../hooks/useBiometrics';
import { useMobileSSI } from '../hooks/useMobileSSI';
import { useTelemetry } from '../hooks/useTelemetry';
import { ShieldAlert, Loader2 } from 'lucide-react-native';
import * as StellarSdk from '@stellar/stellar-sdk';
import { ensureWalletSession, getChainConfig } from '../lib/backend';
import { invokeRead, invokeWrite } from '../lib/soroban-rpc';
import { theme } from '../lib/theme';

export default function Marketplace() {
  const [publicKey, setPublicKey] = React.useState<string>('');
  const { authenticate } = useBiometrics();
  const { hasKyc, isLoading: isSsiLoading } = useMobileSSI();
  const { reportEvent } = useTelemetry();
  const [isKycRequesting, setIsKycRequesting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [rpcUrl, setRpcUrl] = React.useState<string>('');
  const [networkPassphrase, setNetworkPassphrase] = React.useState<string>('');
  const [marketplaceId, setMarketplaceId] = React.useState<string>('');
  const [assetId, setAssetId] = React.useState<string>('');

  const [auctions, setAuctions] = React.useState<any[]>([]);

  const [auctionAmount, setAuctionAmount] = React.useState('1');
  const [auctionMinBid, setAuctionMinBid] = React.useState('1');
  const [auctionDuration, setAuctionDuration] = React.useState('3600');

  const [bidAuctionId, setBidAuctionId] = React.useState('');
  const [bidAmount, setBidAmount] = React.useState('');
  
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
      setMarketplaceId(cfg.contracts?.rwaMarketplace || '');
      setAssetId(cfg.contracts?.rwaTokenizer || '');

      if (!publicKey || !cfg.contracts?.rwaMarketplace) {
        setAuctions([]);
        return;
      }

      const count = await invokeRead({
        rpcUrl: cfg.rpcUrl,
        networkPassphrase: cfg.networkPassphrase,
        sourcePublicKey: publicKey,
        contractId: cfg.contracts.rwaMarketplace,
        method: 'auction_count',
        args: [],
      });

      const total = typeof count === 'number' ? count : Number(count?.toString?.() ?? 0);
      if (!total) {
        setAuctions([]);
        return;
      }

      const list = await invokeRead({
        rpcUrl: cfg.rpcUrl,
        networkPassphrase: cfg.networkPassphrase,
        sourcePublicKey: publicKey,
        contractId: cfg.contracts.rwaMarketplace,
        method: 'list_auctions',
        args: [
          StellarSdk.nativeToScVal(1, { type: 'u32' }),
          StellarSdk.nativeToScVal(Math.min(total, 20), { type: 'u32' }),
        ],
      });

      setAuctions(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError(e?.message || 'Falha ao carregar marketplace');
      setAuctions([]);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);

  React.useEffect(() => {
    if (!publicKey) return;
    load();
  }, [publicKey, load]);

  const handleStartAuction = async () => {
    if (!marketplaceId || !rpcUrl || !networkPassphrase) {
      alert('Configuração de rede indisponível');
      return;
    }
    if (!assetId) {
      alert('Asset RWA não configurado');
      return;
    }
    if (!hasKyc) {
      await reportEvent('KYC_BLOCKED', { context: 'marketplace_start_auction' });
      alert('KYC necessário para operar com RWA');
      return;
    }

    try {
      await reportEvent('TRADE_START', { action: 'start_auction' });
      const { success, error } = await authenticate('Confirme a criação do leilão');
      if (!success) {
        await reportEvent('BIO_FAILURE', { action: 'start_auction', error });
        alert(error || 'Autenticação falhou');
        return;
      }

      const seed = await StellarWallet.getSecretSeed();
      const txHash = await invokeWrite({
        rpcUrl,
        networkPassphrase,
        signerSecret: seed,
        contractId: marketplaceId,
        method: 'start_auction',
        args: [
          new (StellarSdk as any).Address(publicKey).toScVal(),
          new (StellarSdk as any).Address(assetId).toScVal(),
          StellarSdk.nativeToScVal(BigInt(auctionAmount || '0'), { type: 'i128' }),
          StellarSdk.nativeToScVal(BigInt(auctionMinBid || '0'), { type: 'i128' }),
          StellarSdk.nativeToScVal(BigInt(auctionDuration || '0'), { type: 'u64' }),
        ],
      });
      await reportEvent('BIO_SUCCESS', { action: 'start_auction', txHash });
      await load();
      alert(`Leilão criado. TX: ${txHash}`);
    } catch (e: any) {
      alert(e?.message || 'Erro ao criar leilão');
    }
  };

  const handleRequestKyc = async () => {
    await reportEvent('KYC_BLOCKED', { context: 'marketplace' });
    setIsKycRequesting(true);
    alert('Finalize o KYC pelo Web App para operar com dados reais.');
    setIsKycRequesting(false);
  };

  const handleBid = async () => {
    if (!marketplaceId || !rpcUrl || !networkPassphrase) {
      alert('Configuração de rede indisponível');
      return;
    }
    if (!hasKyc) {
      await reportEvent('KYC_BLOCKED', { context: 'marketplace_place_bid' });
      alert('KYC necessário para operar com RWA');
      return;
    }

    const auctionIdNum = Number(bidAuctionId);
    if (!auctionIdNum || auctionIdNum <= 0) {
      alert('Auction ID inválido');
      return;
    }
    if (!bidAmount) {
      alert('Informe o valor do lance');
      return;
    }

    try {
      await reportEvent('TRADE_START', { action: 'place_bid', auctionId: auctionIdNum });
      const { success, error } = await authenticate('Confirme seu lance');
      if (!success) {
        await reportEvent('BIO_FAILURE', { action: 'place_bid', error });
        alert(error || 'Autenticação falhou');
        return;
      }

      const seed = await StellarWallet.getSecretSeed();
      const txHash = await invokeWrite({
        rpcUrl,
        networkPassphrase,
        signerSecret: seed,
        contractId: marketplaceId,
        method: 'place_bid',
        args: [
          new (StellarSdk as any).Address(publicKey).toScVal(),
          StellarSdk.nativeToScVal(auctionIdNum, { type: 'u32' }),
          StellarSdk.nativeToScVal(BigInt(bidAmount), { type: 'i128' }),
        ],
      });
      await reportEvent('BIO_SUCCESS', { action: 'place_bid', txHash });
      await load();
      alert(`Lance enviado. TX: ${txHash}`);
    } catch (e: any) {
      alert(e?.message || 'Erro ao enviar lance');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scrollContent}>
        <Text style={styles.title}>Mercado RWA</Text>
        <Text style={styles.subtitle}>Leilões on-chain na Stellar (Soroban)</Text>

        <View style={styles.searchBar}>
          <Text style={styles.searchText}>Wallet: {publicKey ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}` : 'Conectando...'}</Text>
        </View>

        <Text style={styles.sectionTitle}>Criar Leilão</Text>

        {!hasKyc ? (
          <TouchableOpacity
            style={styles.kycBtn}
            onPress={handleRequestKyc}
            disabled={isKycRequesting || isSsiLoading}
          >
            {isKycRequesting || isSsiLoading ? (
              <Loader2 size={16} color={theme.colors.inkDim} />
            ) : (
              <ShieldAlert size={16} color={theme.colors.gold} />
            )}
            <Text style={styles.kycBtnText}>🔒 Verificar KYC</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.formCard}>
            <TextInput
              style={styles.input}
              value={auctionAmount}
              onChangeText={setAuctionAmount}
              placeholder="Amount (i128)"
              placeholderTextColor={theme.colors.inkFaint}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              value={auctionMinBid}
              onChangeText={setAuctionMinBid}
              placeholder="Min bid (i128)"
              placeholderTextColor={theme.colors.inkFaint}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              value={auctionDuration}
              onChangeText={setAuctionDuration}
              placeholder="Duration seconds (u64)"
              placeholderTextColor={theme.colors.inkFaint}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[styles.tradeBtn, { backgroundColor: theme.colors.gold }]}
              onPress={handleStartAuction}
            >
              <ArrowDownCircle size={16} color={theme.colors.bg} />
              <Text style={[styles.tradeBtnText, { color: theme.colors.bg }]}>Criar</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>Fazer Lance</Text>
        <View style={styles.formCard}>
          <TextInput
            style={styles.input}
            value={bidAuctionId}
            onChangeText={setBidAuctionId}
            placeholder="Auction ID (u32)"
            placeholderTextColor={theme.colors.inkFaint}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={bidAmount}
            onChangeText={setBidAmount}
            placeholder="Bid amount (i128)"
            placeholderTextColor={theme.colors.inkFaint}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={[styles.tradeBtn, { backgroundColor: theme.colors.bg3, borderWidth: 1, borderColor: theme.colors.line }]}
            onPress={handleBid}
            disabled={!hasKyc}
          >
            <ArrowUpCircle size={16} color={theme.colors.ink} />
            <Text style={styles.tradeBtnText}>Lance</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Leilões</Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Carregando…</Text>
              <Text style={styles.emptyText}>Consultando contratos na mainnet via Soroban RPC.</Text>
            </View>
          ) : null}
          {error ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Falha</Text>
              <Text style={styles.emptyText}>{error}</Text>
            </View>
          ) : null}
          {!isLoading && !error && auctions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Sem leilões</Text>
              <Text style={styles.emptyText}>Nenhum leilão encontrado no contrato.</Text>
            </View>
          ) : null}
          {auctions.map((a: any, index) => (
            <View key={index} style={styles.assetCard}>
              <View style={styles.assetHeader}>
                <View style={styles.assetIcon}>
                  <Text style={styles.assetInitial}>{String(a?.id ?? '?')}</Text>
                </View>
                <View style={styles.assetMeta}>
                  <Text style={styles.assetName}>Auction #{String(a?.id ?? '')}</Text>
                  <Text style={styles.assetSymbol}>
                    Status: {String(a?.status ?? '')} • Ends: {String(a?.end_time ?? a?.endTime ?? '')}
                  </Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.priceText}>Min: {String(a?.min_bid ?? a?.minBid ?? '—')}</Text>
                  <Text style={styles.changeText}>High: {String(a?.highest_bid ?? a?.highestBid ?? '—')}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  scrollContent: { padding: 20, flex: 1 },
  title: { fontSize: 24, color: theme.colors.ink, fontFamily: theme.fonts.sansMedium },
  subtitle: { fontSize: 14, color: theme.colors.inkDim, marginTop: 4, marginBottom: 20, fontFamily: theme.fonts.sansLight },
  searchBar: { backgroundColor: theme.colors.bg2, padding: 12, borderRadius: 12, marginBottom: 30, borderWidth: 1, borderColor: theme.colors.rule },
  searchText: { color: theme.colors.inkFaint, fontFamily: theme.fonts.mono, textTransform: 'uppercase', letterSpacing: 1.2 },
  sectionTitle: { fontSize: 18, color: theme.colors.ink, marginBottom: 20, fontFamily: theme.fonts.sansMedium },
  emptyState: { backgroundColor: theme.colors.bg2, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.rule },
  emptyTitle: { color: theme.colors.ink, fontSize: 14, fontFamily: theme.fonts.sansMedium },
  emptyText: { color: theme.colors.inkDim, fontSize: 12, marginTop: 6, fontFamily: theme.fonts.sansLight },
  formCard: { backgroundColor: theme.colors.bg2, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.rule, gap: 12, marginBottom: 16 },
  input: { backgroundColor: theme.colors.bg3, borderWidth: 1, borderColor: theme.colors.rule, color: theme.colors.ink, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: theme.fonts.sansRegular },
  assetCard: { backgroundColor: theme.colors.bg2, padding: 16, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.rule },
  assetHeader: { flexDirection: 'row', alignItems: 'center' },
  assetIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.colors.bg3, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.rule },
  assetInitial: { color: theme.colors.gold, fontSize: 18, fontFamily: theme.fonts.sansMedium },
  assetMeta: { flex: 1, marginLeft: 12 },
  assetName: { color: theme.colors.ink, fontSize: 14, fontFamily: theme.fonts.sansMedium },
  assetSymbol: { color: theme.colors.inkDim, fontSize: 12, marginTop: 2, fontFamily: theme.fonts.sansLight },
  priceContainer: { alignItems: 'flex-end' },
  priceText: { color: theme.colors.ink, fontSize: 14, fontFamily: theme.fonts.sansMedium },
  changeText: { fontSize: 12, marginTop: 2, color: theme.colors.inkDim, fontFamily: theme.fonts.sansLight },
  tradeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: theme.radius.pill, gap: 8 },
  tradeBtnText: { color: theme.colors.ink, fontSize: 14, fontFamily: theme.fonts.sansMedium },
  kycBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: theme.radius.pill, backgroundColor: theme.colors.bg3, borderWidth: 1, borderColor: theme.colors.rule, gap: 8 },
  kycBtnText: { color: theme.colors.inkDim, fontSize: 12, fontFamily: theme.fonts.mono, textTransform: 'uppercase', letterSpacing: 1.2 },
});
