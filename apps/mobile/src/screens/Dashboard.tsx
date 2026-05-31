import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { ArrowUpRight, Wallet, ShieldCheck, ArrowDownLeft } from 'lucide-react-native';
import { StellarWallet } from '../lib/stellar-wallet';
import { getHorizonUrl } from '../lib/stellar';
import { theme } from '../lib/theme';

// Removed hardcoded TEST_PUBLIC_KEY

export default function Dashboard() {
  const [balance, setBalance] = useState<number>(0);
  const [balances, setBalances] = useState<Array<{ code: string; issuer?: string; balance: string }>>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [language, setLanguage] = useState<'PT' | 'EN' | 'ES'>('PT');
  const [showCard, setShowCard] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [accountStatus, setAccountStatus] = useState<'unknown' | 'active' | 'unfunded'>('unknown');

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
        const horizonUrl = getHorizonUrl();
        const response = await fetch(`${horizonUrl}/accounts/${pk}`);
        if (response.status === 404) {
          setAccountStatus('unfunded');
          setBalances([]);
          setBalance(0);
          setHistory([]);
          return;
        }
        if (!response.ok) {
          throw new Error(`Horizon error: ${response.status}`);
        }
        const account = await response.json();
        setAccountStatus('active');
        
        if (account.balances) {
          const normalized = (account.balances as any[]).map((b) => ({
            code: b.asset_type === 'native' ? 'XLM' : b.asset_code,
            issuer: b.asset_issuer,
            balance: b.balance,
          }));
          setBalances(normalized);
          const xlm = normalized.find((b) => b.code === 'XLM');
          setBalance(xlm ? parseFloat(xlm.balance) : 0);
        }

        // Fetch real history
        const historyRes = await fetch(`${horizonUrl}/accounts/${pk}/payments?limit=5&order=desc`);
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          if (historyData._embedded) {
            setHistory(historyData._embedded.records);
          }
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
        {accountStatus === 'unfunded' && publicKey ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Carteira ainda não ativada</Text>
            <Text style={styles.noticeBody}>
              Esta carteira ainda não existe na rede (Mainnet). Envie um pequeno valor de XLM para criar/ativar a conta:
            </Text>
            <Text style={styles.noticeAddress}>{publicKey}</Text>
          </View>
        ) : null}

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t.balance}</Text>
          <Text style={styles.balanceValue}>
            {isPrivate ? '••••' : `${balance.toFixed(2)} XLM`}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionIconContainer}>
              <ArrowUpRight size={24} color={theme.colors.bg} />
            </View>
            <Text style={styles.actionText}>Enviar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.actionIconContainer, { backgroundColor: theme.colors.aurora }]}>
              <Wallet size={24} color={theme.colors.bg} />
            </View>
            <Text style={styles.actionText}>Receber</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.actionIconContainer, { backgroundColor: theme.colors.nebula }]}>
              <ShieldCheck size={24} color={theme.colors.bg} />
            </View>
            <Text style={styles.actionText}>Seguro</Text>
          </TouchableOpacity>
        </View>

        {/* Assets List */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>Cartão Virtual Stellaro</Text>
          <TouchableOpacity 
            style={styles.virtualCard}
            onPress={() => setShowCard(!showCard)}
          >
            <View style={styles.cardInfo}>
              <Text style={styles.cardBrand}>STELLARO PLATINUM</Text>
              <Text style={styles.cardNumber}>
                {showCard ? '—' : '•••• •••• •••• ••••'}
              </Text>
              <Text style={styles.cardHolder}>{publicKey ? `WALLET ${publicKey.slice(0, 6)}...${publicKey.slice(-4)}` : 'WALLET'}</Text>
            </View>
            <View style={styles.cardChip} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.walletButton} disabled>
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
            </View>
          </View>
        ))}

        {/* Transaction History */}
        <View style={styles.sectionHeaderActivity}>
          <Text style={styles.sectionTitle}>Atividade Recente</Text>
        </View>

        {history.length === 0 ? (
          <Text style={styles.noHistoryText}>Nenhuma transação recente encontrada.</Text>
        ) : (
          history.map((item, index) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyIcon}>
                <ArrowDownLeft size={20} color={theme.colors.inkDim} />
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
    backgroundColor: theme.colors.bg,
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
  noticeCard: {
    backgroundColor: theme.colors.bg2,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  noticeTitle: {
    fontSize: 16,
    color: theme.colors.ink,
    fontFamily: theme.fonts.sansMedium,
    marginBottom: 6,
  },
  noticeBody: {
    fontSize: 13,
    color: theme.colors.inkDim,
    fontFamily: theme.fonts.sansLight,
    marginBottom: 10,
    lineHeight: 18,
  },
  noticeAddress: {
    fontSize: 12,
    color: theme.colors.ink,
    fontFamily: theme.fonts.mono,
  },
  greeting: {
    fontSize: 24,
    color: theme.colors.ink,
    fontFamily: theme.fonts.sansMedium,
  },
  subGreeting: {
    fontSize: 14,
    color: theme.colors.inkDim,
    marginTop: 4,
    fontFamily: theme.fonts.sansLight,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.bg2,
    padding: 2,
  },
  profilePlaceholder: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: theme.colors.bg3,
  },
  balanceCard: {
    backgroundColor: theme.colors.bg2,
    borderRadius: theme.radius.cardLg,
    padding: 24,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: theme.colors.rule,
  },
  balanceLabel: {
    fontSize: 14,
    color: theme.colors.inkDim,
    marginBottom: 8,
    fontFamily: theme.fonts.mono,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  balanceValue: {
    fontSize: 32,
    color: theme.colors.ink,
    marginBottom: 12,
    fontFamily: theme.fonts.sansMedium,
  },
  balanceChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    color: theme.colors.green,
    marginLeft: 4,
    fontSize: 14,
    fontFamily: theme.fonts.sansMedium,
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
    backgroundColor: theme.colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    color: theme.colors.ink,
    fontSize: 12,
    fontFamily: theme.fonts.sansMedium,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionHeaderActivity: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 30,
  },
  headerText: {
    flex: 1,
  },
  langSelector: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  langText: {
    color: theme.colors.inkDim,
    fontSize: 12,
    fontFamily: theme.fonts.mono,
    letterSpacing: 1.2,
  },
  langActive: {
    color: theme.colors.gold,
    fontFamily: theme.fonts.mono,
  },
  privacyToggle: {
    backgroundColor: theme.colors.bg2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.rule,
  },
  privacyText: {
    color: theme.colors.inkDim,
    fontSize: 12,
    fontFamily: theme.fonts.mono,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  zkHint: {
    color: theme.colors.green,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 12,
    fontFamily: theme.fonts.sansLight,
  },
  v4StatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 12,
  },
  v4Stat: {
    flex: 1,
    backgroundColor: theme.colors.bg2,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.rule,
  },
  v4StatLabel: {
    color: theme.colors.inkDim,
    fontSize: 12,
    marginBottom: 4,
    fontFamily: theme.fonts.mono,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  v4StatValue: {
    color: theme.colors.ink,
    fontSize: 18,
    fontFamily: theme.fonts.sansMedium,
  },
  cardSection: {
    marginBottom: 30,
  },
  virtualCard: {
    backgroundColor: theme.colors.bg3,
    padding: 24,
    borderRadius: 20,
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  cardInfo: {
    flex: 1,
  },
  cardBrand: {
    color: theme.colors.inkDim,
    fontSize: 10,
    marginBottom: 20,
    fontFamily: theme.fonts.mono,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  cardNumber: {
    color: theme.colors.ink,
    fontSize: 18,
    letterSpacing: 2,
    marginBottom: 20,
    fontFamily: theme.fonts.mono,
  },
  cardHolder: {
    color: theme.colors.ink,
    fontSize: 12,
    fontFamily: theme.fonts.sansRegular,
  },
  cardChip: {
    width: 40,
    height: 30,
    backgroundColor: theme.colors.goldSoft,
    borderRadius: 4,
  },
  walletButton: {
    marginTop: 12,
    backgroundColor: theme.colors.gold,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  walletButtonText: {
    color: theme.colors.bg,
    fontSize: 14,
    fontFamily: theme.fonts.sansMedium,
  },
  sectionTitle: {
    fontSize: 18,
    color: theme.colors.ink,
    fontFamily: theme.fonts.sansMedium,
  },
  seeAll: {
    color: theme.colors.gold,
    fontSize: 14,
    fontFamily: theme.fonts.sansRegular,
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bg2,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.rule,
  },
  assetIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.bg3,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: theme.colors.rule,
  },
  assetIconText: {
    color: theme.colors.ink,
    fontSize: 18,
    fontFamily: theme.fonts.sansMedium,
  },
  assetInfo: {
    flex: 1,
  },
  assetCode: {
    fontSize: 16,
    color: theme.colors.ink,
    fontFamily: theme.fonts.sansMedium,
  },
  assetName: {
    fontSize: 12,
    color: theme.colors.inkDim,
    marginTop: 2,
    fontFamily: theme.fonts.sansLight,
  },
  assetValues: {
    alignItems: 'flex-end',
  },
  assetBalance: {
    fontSize: 16,
    color: theme.colors.ink,
    fontFamily: theme.fonts.sansMedium,
  },
  assetFiat: {
    fontSize: 12,
    color: theme.colors.inkDim,
    marginTop: 2,
    fontFamily: theme.fonts.sansLight,
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
    backgroundColor: theme.colors.bg2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: theme.colors.rule,
  },
  historyInfo: {
    flex: 1,
  },
  historyType: {
    color: theme.colors.ink,
    fontSize: 14,
    fontFamily: theme.fonts.sansMedium,
  },
  historyDate: {
    color: theme.colors.inkDim,
    fontSize: 12,
    marginTop: 2,
    fontFamily: theme.fonts.sansLight,
  },
  historyAmount: {
    color: theme.colors.ink,
    fontSize: 14,
    fontFamily: theme.fonts.sansMedium,
  },
  noHistoryText: {
    color: theme.colors.inkDim,
    fontSize: 14,
    fontFamily: theme.fonts.sansLight,
  },
});
