import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Clock3, RefreshCcw } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OperationalOrderDetailModal } from '../components/OperationalOrderDetailModal';
import {
  getExchangeOrder,
  getUnifiedHistory,
  retrySettlement,
  startSupportChat,
} from '../lib/backend';
import {
  getOperationalMetadata,
  getOperationalNextActionHint,
  getOperationalSettlements,
  getOperationalTimeline,
  getOperationalTravelRuleBadgeText,
  getSettlementFailureSummary,
  hasOperationalActiveFlow,
} from '../lib/operational-order';
import { theme } from '../lib/theme';

export default function History() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [items, setItems] = React.useState<any[]>([]);
  const [providers, setProviders] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [detailVisible, setDetailVisible] = React.useState(false);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState<any | null>(null);
  const [selectedSourceItem, setSelectedSourceItem] = React.useState<any | null>(null);
  const [retryingSettlementId, setRetryingSettlementId] = React.useState<string | null>(null);

  const load = React.useCallback(async (mode: 'load' | 'refresh' = 'load') => {
    try {
      if (mode === 'load') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      setError(null);
      const response = await getUnifiedHistory(30);
      setItems(Array.isArray(response.history?.items) ? response.history.items : []);
      setProviders(response.history?.providers ?? null);
    } catch (err: any) {
      setError(err?.message || 'Falha ao carregar histórico.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const renderDetails = React.useCallback((item: any) => {
    if (item.type === 'order') {
      const trBadge = getOperationalTravelRuleBadgeText(
        item.data?.metadata?.travelRule,
      );
      return `${item.data?.amountIn ?? '-'} -> ${item.data?.amountOut ?? 'pendente'} · rota ${item.data?.route ?? 'n/a'}${trBadge ? ` · ${trBadge}` : ''}`;
    }
    if (item.type === 'settlement') {
      const trBadge = getOperationalTravelRuleBadgeText(
        item.data?.metadata?.travelRule,
      );
      return `${item.data?.asset ?? '-'} · ${item.data?.txHash ? `tx ${String(item.data.txHash).slice(0, 10)}...` : 'aguardando broadcast'}${trBadge ? ` · ${trBadge}` : ''}`;
    }
    if (item.type === 'pix_deposit' || item.type === 'pix_withdrawal') {
      return `BRL ${item.data?.amount ?? '-'}`;
    }
    if (item.type === 'support') {
      return item.data?.subject ?? 'Conversa assistiva';
    }
    return null;
  }, []);

  const isOperationalItem = React.useCallback((item: any) => {
    return item?.type === 'order' || item?.type === 'settlement';
  }, []);

  const loadOrderDetail = React.useCallback(async (orderId: string) => {
    setLoadingDetail(true);
    try {
      const response = await getExchangeOrder(orderId);
      setSelectedOrder(response.order ?? null);
      return response.order ?? null;
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const openOperationalDetail = React.useCallback(
    async (item: any) => {
      if (!isOperationalItem(item)) return;
      const orderId = item.type === 'order' ? item.id : item.data?.orderId;
      setSelectedSourceItem(item);
      setDetailVisible(true);
      if (!orderId) {
        setSelectedOrder(null);
        return;
      }
      try {
        await loadOrderDetail(orderId);
      } catch (err: any) {
        setSelectedOrder(null);
        setError(err?.message || 'Falha ao carregar detalhe operacional.');
      }
    },
    [isOperationalItem, loadOrderDetail],
  );

  const selectedOrderSettlements = React.useMemo(() => {
    return getOperationalSettlements(selectedOrder);
  }, [selectedOrder]);

  const selectedOrderHasActiveFlow = React.useMemo(() => {
    return hasOperationalActiveFlow(selectedOrder, selectedOrderSettlements);
  }, [selectedOrder, selectedOrderSettlements]);

  React.useEffect(() => {
    if (!detailVisible || !selectedOrderHasActiveFlow || !selectedOrder?.id) return;
    const timer = setInterval(() => {
      loadOrderDetail(selectedOrder.id).catch(() => undefined);
    }, 15000);
    return () => clearInterval(timer);
  }, [detailVisible, loadOrderDetail, selectedOrder, selectedOrderHasActiveFlow]);

  const orderFailureReason = selectedOrder?.complianceBlockReason ?? null;
  const settlementFailureSummary = getSettlementFailureSummary(
    selectedOrderSettlements,
  );
  const operationalMetadata = React.useMemo(() => {
    return getOperationalMetadata(selectedOrder);
  }, [selectedOrder]);

  const orderTimeline = React.useMemo(() => {
    return getOperationalTimeline(selectedOrder, selectedOrderSettlements);
  }, [selectedOrder, selectedOrderSettlements]);

  const nextActionHint = React.useMemo(() => {
    return getOperationalNextActionHint(
      selectedOrder,
      selectedOrderSettlements,
      selectedOrderHasActiveFlow,
    );
  }, [selectedOrder, selectedOrderHasActiveFlow, selectedOrderSettlements]);

  const handleRetrySettlement = React.useCallback(
    async (settlementId: string) => {
      setRetryingSettlementId(settlementId);
      try {
        await retrySettlement(settlementId);
        if (selectedOrder?.id) {
          await loadOrderDetail(selectedOrder.id);
        }
        await load('refresh');
      } catch (err: any) {
        setError(err?.message || 'Falha ao reenviar settlement.');
      } finally {
        setRetryingSettlementId(null);
      }
    },
    [load, loadOrderDetail, selectedOrder],
  );

  const openSupport = React.useCallback(
    async (params: { subject: string; message: string; draftMessage?: string }) => {
      try {
        const response = await startSupportChat({
          subject: params.subject,
          message: params.message,
        });
        navigation.navigate('Suporte', {
          threadId: response.thread?.id,
          draftSubject: params.subject,
          draftMessage: params.draftMessage,
        });
      } catch (error: any) {
        setError(error?.message || 'Falha ao abrir suporte.');
      }
    },
    [navigation],
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Histórico Unificado</Text>
            <Text style={styles.subtitle}>
              Orders, PIX e suporte em uma linha do tempo só.
            </Text>
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={() => load('refresh')}>
            <RefreshCcw size={16} color={theme.colors.gold} />
          </TouchableOpacity>
        </View>

        {providers ? (
          <View style={styles.providersCard}>
            <Text style={styles.sectionTitle}>Status Operacional</Text>
            {Object.entries(providers).map(([key, value]: [string, any]) => (
              <View key={key} style={styles.providerRow}>
                <Text style={styles.providerName}>{key}</Text>
                <Text style={styles.providerValue}>
                  {value?.mode ?? 'unknown'} {value?.fallbackActive ? '· fallback' : '· live'}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={theme.colors.gold} />
            <Text style={styles.stateText}>Carregando histórico...</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.stateCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>Nenhum evento disponível ainda.</Text>
          </View>
        ) : null}

        {items.map((item) => (
          <TouchableOpacity
            key={`${item.type}-${item.id}`}
            style={styles.card}
            onPress={() => openOperationalDetail(item)}
            disabled={!isOperationalItem(item)}
            activeOpacity={isOperationalItem(item) ? 0.9 : 1}
          >
            <View style={styles.row}>
              <View style={styles.iconWrapper}>
                <Clock3 size={16} color={theme.colors.gold} />
              </View>
              <View style={styles.meta}>
                <Text style={styles.itemTitle}>{item.summary}</Text>
                <Text style={styles.itemSub}>
                  {String(item.type).toUpperCase()} · {String(item.status)}
                </Text>
                {renderDetails(item) ? (
                  <Text style={styles.itemDetail}>{renderDetails(item)}</Text>
                ) : null}
                {isOperationalItem(item) ? (
                  <Text style={styles.itemAction}>Toque para abrir o detalhe operacional</Text>
                ) : null}
              </View>
              <Text style={styles.dateText}>
                {new Date(item.createdAt).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <OperationalOrderDetailModal
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        loading={loadingDetail}
        title={selectedOrder?.pair ?? selectedSourceItem?.summary ?? 'Evento'}
        selectedOrder={selectedOrder}
        selectedOrderSettlements={selectedOrderSettlements}
        selectedOrderHasActiveFlow={selectedOrderHasActiveFlow}
        orderTimeline={orderTimeline}
        nextActionHint={nextActionHint}
        orderFailureReason={orderFailureReason}
        settlementFailureSummary={settlementFailureSummary}
        operationalMetadata={operationalMetadata as Array<[string, unknown]>}
        retryingSettlementId={retryingSettlementId}
        onRefreshOrder={() => {
          if (selectedOrder?.id) {
            loadOrderDetail(selectedOrder.id);
          }
        }}
        onRetrySettlement={handleRetrySettlement}
        onOpenSupport={openSupport}
        emptyStateMessage="Nao foi possivel carregar uma ordem associada a este evento."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: 20, gap: 16 },
  modalContainer: { flex: 1, backgroundColor: theme.colors.bg },
  modalContent: { padding: 20, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.rule,
  },
  modalTitleBlock: { flex: 1, marginRight: 12 },
  modalEyebrow: {
    color: theme.colors.inkDim,
    fontSize: 11,
    fontFamily: theme.fonts.mono,
    textTransform: 'uppercase',
  },
  modalTitle: {
    color: theme.colors.ink,
    marginTop: 4,
    fontSize: 22,
    fontFamily: theme.fonts.sansMedium,
  },
  title: { color: theme.colors.ink, fontSize: 24, fontFamily: theme.fonts.sansMedium },
  subtitle: { color: theme.colors.inkDim, marginTop: 4, fontSize: 14, fontFamily: theme.fonts.sansLight },
  sectionTitle: { color: theme.colors.ink, fontSize: 16, fontFamily: theme.fonts.sansMedium },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.bg2,
    borderWidth: 1,
    borderColor: theme.colors.rule,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateCard: {
    backgroundColor: theme.colors.bg2,
    padding: 18,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.rule,
    alignItems: 'center',
    gap: 12,
  },
  providersCard: {
    backgroundColor: theme.colors.bg2,
    padding: 16,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.rule,
    gap: 10,
  },
  providerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  providerName: {
    color: theme.colors.ink,
    fontSize: 13,
    fontFamily: theme.fonts.mono,
    textTransform: 'uppercase',
  },
  providerValue: {
    color: theme.colors.gold,
    fontSize: 12,
    fontFamily: theme.fonts.sansRegular,
  },
  stateText: { color: theme.colors.inkDim, fontFamily: theme.fonts.sansLight, fontSize: 13 },
  errorText: { color: theme.colors.danger, fontFamily: theme.fonts.sansRegular, fontSize: 13 },
  card: {
    backgroundColor: theme.colors.bg2,
    borderRadius: theme.radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.rule,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.bg3,
    borderWidth: 1,
    borderColor: theme.colors.rule,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  meta: { flex: 1, marginRight: 12 },
  itemTitle: { color: theme.colors.ink, fontSize: 14, fontFamily: theme.fonts.sansMedium },
  itemSub: { color: theme.colors.inkDim, marginTop: 4, fontSize: 12, fontFamily: theme.fonts.sansLight },
  itemDetail: {
    color: theme.colors.gold,
    marginTop: 6,
    fontSize: 12,
    fontFamily: theme.fonts.sansRegular,
  },
  itemAction: {
    color: theme.colors.inkDim,
    marginTop: 6,
    fontSize: 11,
    fontFamily: theme.fonts.sansLight,
  },
  dateText: { color: theme.colors.gold, fontSize: 12, fontFamily: theme.fonts.mono },
  closeText: {
    color: theme.colors.gold,
    fontSize: 11,
    fontFamily: theme.fonts.sansMedium,
  },
  modalLine: {
    color: theme.colors.inkDim,
    marginTop: 6,
    fontSize: 13,
    fontFamily: theme.fonts.sansRegular,
  },
  tipCard: {
    marginTop: 10,
    backgroundColor: theme.colors.bg3,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  tipTitle: {
    color: theme.colors.gold,
    fontFamily: theme.fonts.sansMedium,
    fontSize: 13,
  },
  tipText: {
    color: theme.colors.inkDim,
    fontFamily: theme.fonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
  },
  alertCard: {
    marginTop: 10,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.28)',
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  alertTitle: {
    color: theme.colors.danger,
    fontFamily: theme.fonts.sansMedium,
    fontSize: 13,
  },
  alertText: {
    color: theme.colors.ink,
    fontFamily: theme.fonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
  },
  providerBadge: {
    color: theme.colors.gold,
    fontSize: 11,
    fontFamily: theme.fonts.mono,
    textTransform: 'uppercase',
  },
  refreshPill: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.bg3,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshPillText: {
    color: theme.colors.gold,
    fontSize: 12,
    fontFamily: theme.fonts.sansMedium,
  },
  disabledButton: {
    opacity: 0.6,
  },
  settlementCard: {
    marginTop: 12,
    backgroundColor: theme.colors.bg3,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.rule,
    padding: 14,
  },
  timelineList: { gap: 0 },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
    minHeight: 58,
  },
  timelineRail: {
    width: 18,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 6,
    opacity: 0.4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 12,
  },
  timelineTitle: {
    color: theme.colors.ink,
    fontFamily: theme.fonts.sansMedium,
    fontSize: 14,
    flex: 1,
  },
  timelineState: {
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  timelineDetail: {
    color: theme.colors.inkDim,
    fontFamily: theme.fonts.sansLight,
    fontSize: 12,
    marginTop: 4,
  },
});
