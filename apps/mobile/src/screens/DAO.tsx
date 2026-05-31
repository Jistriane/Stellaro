import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, TextInput } from 'react-native';
import { Vote, Clock, ShieldCheck } from 'lucide-react-native';
import { StellarWallet } from '../lib/stellar-wallet';
import { useMobileSSI } from '../hooks/useMobileSSI';
import { useBiometrics } from '../hooks/useBiometrics';
import * as StellarSdk from '@stellar/stellar-sdk';
import { ensureWalletSession, getChainConfig } from '../lib/backend';
import { invokeRead, invokeWrite } from '../lib/soroban-rpc';
import { theme } from '../lib/theme';

export default function DAO() {
  const [publicKey, setPublicKey] = React.useState<string>('');
  const { hasKyc, isLoading: isSsiLoading } = useMobileSSI();
  const { authenticate } = useBiometrics();

  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [rpcUrl, setRpcUrl] = React.useState<string>('');
  const [networkPassphrase, setNetworkPassphrase] = React.useState<string>('');
  const [daoId, setDaoId] = React.useState<string>('');

  const [proposals, setProposals] = React.useState<any[]>([]);
  const [proposalDescription, setProposalDescription] = React.useState('');
  const [voteProposalId, setVoteProposalId] = React.useState('');

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
      setDaoId(cfg.contracts?.daoGovernance || '');

      if (!publicKey || !cfg.contracts?.daoGovernance) {
        setProposals([]);
        return;
      }

      const count = await invokeRead({
        rpcUrl: cfg.rpcUrl,
        networkPassphrase: cfg.networkPassphrase,
        sourcePublicKey: publicKey,
        contractId: cfg.contracts.daoGovernance,
        method: 'proposals_count',
        args: [],
      });
      const total = typeof count === 'number' ? count : Number(count?.toString?.() ?? 0);
      if (!total) {
        setProposals([]);
        return;
      }

      const list = await invokeRead({
        rpcUrl: cfg.rpcUrl,
        networkPassphrase: cfg.networkPassphrase,
        sourcePublicKey: publicKey,
        contractId: cfg.contracts.daoGovernance,
        method: 'list_proposals',
        args: [
          StellarSdk.nativeToScVal(1, { type: 'u32' }),
          StellarSdk.nativeToScVal(Math.min(total, 20), { type: 'u32' }),
        ],
      });
      setProposals(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError(e?.message || 'Falha ao carregar DAO');
      setProposals([]);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);

  React.useEffect(() => {
    if (!publicKey) return;
    load();
  }, [publicKey, load]);

  const handleVote = async (support: boolean) => {
    if (!hasKyc) {
      Alert.alert('KYC Necessário', 'Você precisa de uma credencial verificada para participar da governança.');
      return;
    }

    const proposalIdNum = Number(voteProposalId);
    if (!proposalIdNum || proposalIdNum <= 0) {
      Alert.alert('Erro', 'Informe um Proposal ID válido.');
      return;
    }

    const { success } = await authenticate(`Confirme seu voto (ID ${proposalIdNum})`);
    if (success) {
      try {
        const seed = await StellarWallet.getSecretSeed();
        const txHash = await invokeWrite({
          rpcUrl,
          networkPassphrase,
          signerSecret: seed,
          contractId: daoId,
          method: 'vote',
          args: [
            new (StellarSdk as any).Address(publicKey).toScVal(),
            StellarSdk.nativeToScVal(proposalIdNum, { type: 'u32' }),
            StellarSdk.nativeToScVal(support, { type: 'bool' }),
          ],
        });
        await load();
        Alert.alert('Voto enviado', `TX: ${txHash}`);
      } catch (err: any) {
        Alert.alert('Erro', err?.message || 'Falha ao processar o voto');
      }
    }
  };

  const handlePropose = async () => {
    if (!hasKyc) {
      Alert.alert('KYC Necessário', 'Você precisa de uma credencial verificada para propor.');
      return;
    }
    if (!proposalDescription.trim()) {
      Alert.alert('Erro', 'Descrição obrigatória.');
      return;
    }
    const symbol = proposalDescription.trim().slice(0, 32);
    const { success } = await authenticate('Confirme a criação da proposta');
    if (!success) return;
    try {
      const seed = await StellarWallet.getSecretSeed();
      const txHash = await invokeWrite({
        rpcUrl,
        networkPassphrase,
        signerSecret: seed,
        contractId: daoId,
        method: 'propose',
        args: [
          new (StellarSdk as any).Address(publicKey).toScVal(),
          StellarSdk.xdr.ScVal.scvSymbol(symbol),
        ],
      });
      setProposalDescription('');
      await load();
      Alert.alert('Proposta criada', `TX: ${txHash}`);
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Falha ao criar proposta');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Governança DAO</Text>
        <Text style={styles.subtitle}>Vote e decida o futuro do protocolo</Text>

        <View style={styles.governanceStats}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Seu Poder de Voto</Text>
            <Text style={styles.statValue}>—</Text>
          </View>
          <View style={styles.complianceBadge}>
            <ShieldCheck size={16} color={hasKyc ? theme.colors.gold : theme.colors.inkDim} />
            <Text style={[styles.complianceText, { color: hasKyc ? theme.colors.gold : theme.colors.inkDim }]}>
              {hasKyc ? 'KYC Verificado' : 'KYC Pendente'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Propostas Ativas</Text>

        <View style={styles.formCard}>
          <TextInput
            style={styles.input}
            value={proposalDescription}
            onChangeText={setProposalDescription}
            placeholder="Nova proposta (Symbol até 32 chars)"
            placeholderTextColor={theme.colors.inkFaint}
          />
          <TouchableOpacity
            style={[styles.voteButton, (!hasKyc || isSsiLoading) && styles.voteButtonDisabled]}
            onPress={handlePropose}
            disabled={!hasKyc || isSsiLoading}
          >
            <Text style={styles.voteButtonText}>Propor</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formCard}>
          <TextInput
            style={styles.input}
            value={voteProposalId}
            onChangeText={setVoteProposalId}
            placeholder="Proposal ID (u32)"
            placeholderTextColor={theme.colors.inkFaint}
            keyboardType="numeric"
          />
          <View style={styles.voteRow}>
            <TouchableOpacity
              style={[styles.voteButton, { flex: 1 }, (!hasKyc || isSsiLoading) && styles.voteButtonDisabled]}
              onPress={() => handleVote(true)}
              disabled={!hasKyc || isSsiLoading}
            >
              <Text style={styles.voteButtonText}>Votar Sim</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.voteButtonSecondary, { flex: 1 }, (!hasKyc || isSsiLoading) && styles.voteButtonDisabled]}
              onPress={() => handleVote(false)}
              disabled={!hasKyc || isSsiLoading}
            >
              <Text style={[styles.voteButtonText, styles.voteButtonSecondaryText]}>Votar Não</Text>
            </TouchableOpacity>
          </View>
        </View>

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

        {!isLoading && !error && proposals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Sem propostas</Text>
            <Text style={styles.emptyText}>Nenhuma proposta encontrada no contrato.</Text>
          </View>
        ) : null}

        {proposals.map((prop: any, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.proposalCard}
            onPress={() => setVoteProposalId(String(prop?.id ?? ''))}
          >
            <View style={styles.proposalHeader}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>On-chain</Text>
              </View>
              <View style={styles.timeContainer}>
                <Clock size={14} color={theme.colors.inkDim} />
                <Text style={styles.timeText}>#{String(prop?.id ?? '')}</Text>
              </View>
            </View>
            
            <Text style={styles.proposalTitle}>{String(prop?.description ?? '—')}</Text>
            
            <View style={styles.votesRow}>
              <View style={styles.votesInfo}>
                <Vote size={16} color={theme.colors.inkDim} />
                <Text style={styles.votesText}>
                  Sim: {String(prop?.yes_votes ?? prop?.yesVotes ?? 0)} • Não: {String(prop?.no_votes ?? prop?.noVotes ?? 0)}
                </Text>
              </View>
              <TouchableOpacity 
                style={[
                  styles.voteButton,
                  { backgroundColor: theme.colors.gold },
                  !hasKyc && { backgroundColor: theme.colors.bg3, borderWidth: 1, borderColor: theme.colors.rule },
                ]}
                onPress={() => setVoteProposalId(String(prop?.id ?? ''))}
              >
                <Text style={[styles.voteButtonText, { color: theme.colors.bg }]}>{hasKyc ? 'Votar' : 'Bloqueado'}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
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
  governanceStats: { 
    backgroundColor: theme.colors.bg2, 
    padding: 20, 
    borderRadius: 16, 
    marginBottom: 30, 
    borderLeftWidth: 4, 
    borderLeftColor: theme.colors.gold,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statBox: {},
  statLabel: { color: theme.colors.inkDim, fontSize: 12, fontFamily: theme.fonts.mono, textTransform: 'uppercase', letterSpacing: 1.2 },
  statValue: { color: theme.colors.ink, fontSize: 24, marginTop: 4, fontFamily: theme.fonts.sansMedium },
  complianceBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.colors.rule },
  complianceText: { fontSize: 10, fontFamily: theme.fonts.mono, textTransform: 'uppercase', letterSpacing: 1.2 },
  sectionTitle: { fontSize: 18, color: theme.colors.ink, marginBottom: 20, fontFamily: theme.fonts.sansMedium },
  emptyState: { backgroundColor: theme.colors.bg2, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.rule, marginBottom: 16 },
  emptyTitle: { color: theme.colors.ink, fontSize: 14, fontFamily: theme.fonts.sansMedium },
  emptyText: { color: theme.colors.inkDim, fontSize: 12, marginTop: 6, fontFamily: theme.fonts.sansLight },
  formCard: { backgroundColor: theme.colors.bg2, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.rule, marginBottom: 16, gap: 12 },
  input: { backgroundColor: theme.colors.bg3, borderWidth: 1, borderColor: theme.colors.rule, color: theme.colors.ink, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: theme.fonts.sansRegular },
  voteRow: { flexDirection: 'row', gap: 12 },
  proposalCard: { backgroundColor: theme.colors.bg2, padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.rule },
  proposalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.pill, backgroundColor: theme.colors.bg3, borderWidth: 1, borderColor: theme.colors.line },
  statusText: { color: theme.colors.gold, fontSize: 10, fontFamily: theme.fonts.mono, textTransform: 'uppercase', letterSpacing: 1.2 },
  timeContainer: { flexDirection: 'row', alignItems: 'center' },
  timeText: { color: theme.colors.inkDim, fontSize: 12, marginLeft: 4, fontFamily: theme.fonts.sansLight },
  proposalTitle: { color: theme.colors.ink, fontSize: 16, marginBottom: 16, fontFamily: theme.fonts.sansMedium },
  votesRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  votesInfo: { flexDirection: 'row', alignItems: 'center' },
  votesText: { color: theme.colors.inkDim, fontSize: 12, marginLeft: 6, fontFamily: theme.fonts.sansLight },
  voteButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme.radius.pill, backgroundColor: theme.colors.gold, alignItems: 'center', justifyContent: 'center' },
  voteButtonSecondary: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme.radius.pill, backgroundColor: theme.colors.bg3, borderWidth: 1, borderColor: theme.colors.line, alignItems: 'center', justifyContent: 'center' },
  voteButtonDisabled: { backgroundColor: theme.colors.bg3, borderWidth: 1, borderColor: theme.colors.rule },
  voteButtonText: { color: theme.colors.bg, fontSize: 10, fontFamily: theme.fonts.mono, textTransform: 'uppercase', letterSpacing: 1.2 },
  voteButtonSecondaryText: { color: theme.colors.ink },
});
