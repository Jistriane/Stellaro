import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeftRight, RefreshCcw } from 'lucide-react-native';
import { OperationalOrderDetailModal } from '../components/OperationalOrderDetailModal';
import {
  createExchangeOrder,
  getExchangeOrder,
  getExchangeOrders,
  getExchangeProviderStatus,
  getExchangeQuote,
  getSettlementProviderStatus,
  getSettlements,
  retrySettlement,
  startSupportChat,
} from '../lib/backend';
import {
  formatOperationalDateTime,
  getOperationalMetadata,
  getOperationalNextActionHint,
  getOperationalSettlements,
  getOperationalTimeline,
  getOperationalTravelRule,
  getOperationalTravelRuleBadgeText,
  getOperationalTravelRuleBadgeTone,
  getSettlementFailureSummary,
  hasOperationalActiveFlow,
  shortenOperationalValue,
} from '../lib/operational-order';
import { notify } from '../lib/notify';
import { theme } from '../lib/theme';

const PAIRS = [
  { from: 'BRL', to: 'USDT' },
  { from: 'BRL', to: 'USDC' },
  { from: 'BRL', to: 'BTC' },
  { from: 'BRL', to: 'ETH' },
  { from: 'BRL', to: 'USD' },
  { from: 'BRL', to: 'EUR' },
];

export default function Trade() {
  const navigation = useNavigation<any>();
  const [amount, setAmount] = React.useState('1000');
  const [selectedPair, setSelectedPair] = React.useState(PAIRS[0]);
  const [side, setSide] = React.useState<'BUY' | 'SELL'>('BUY');
  const [quote, setQuote] = React.useState<any | null>(null);
  const [quoteTimeLeft, setQuoteTimeLeft] = React.useState<number | null>(null);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = React.useState<any | null>(null);
  const [settlements, setSettlements] = React.useState<any[]>([]);
  const [exchangeProviderStatus, setExchangeProviderStatus] = React.useState<any>(null);
  const [settlementProviderStatus, setSettlementProviderStatus] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingOrderDetail, setLoadingOrderDetail] = React.useState(false);
  const [retryingSettlementId, setRetryingSettlementId] = React.useState<string | null>(null);
  const [detailVisible, setDetailVisible] = React.useState(false);

  const loadOrderDetail = React.useCallback(async (orderId: string) => {
    setLoadingOrderDetail(true);
    try {
      const response = await getExchangeOrder(orderId);
      setSelectedOrder(response.order);
      setSelectedOrderId(orderId);
    } catch (error: any) {
      console.warn('Falha ao carregar detalhe da ordem:', error?.message || error);
      setSelectedOrder(null);
    } finally {
      setLoadingOrderDetail(false);
    }
  }, []);

  const loadOperationalData = React.useCallback(
    async (focusOrderId?: string) => {
      setRefreshing(true);
      try {
        const [
          ordersResponse,
          exchangeProviderResponse,
          settlementsResponse,
          settlementProviderResponse,
        ] = await Promise.all([
          getExchangeOrders(),
          getExchangeProviderStatus(),
          getSettlements(20),
          getSettlementProviderStatus(),
        ]);

        const nextOrders = Array.isArray(ordersResponse.orders)
          ? ordersResponse.orders
          : [];
        const nextSettlements = Array.isArray(settlementsResponse.settlements)
          ? settlementsResponse.settlements
          : [];

        setOrders(nextOrders);
        setSettlements(nextSettlements);
        setExchangeProviderStatus(exchangeProviderResponse);
        setSettlementProviderStatus(settlementProviderResponse);

        const preferredOrderId = focusOrderId ?? selectedOrderId;
        const resolvedOrderId =
          nextOrders.find((item) => item.id === preferredOrderId)?.id ??
          nextOrders[0]?.id ??
          null;

        if (resolvedOrderId) {
          await loadOrderDetail(resolvedOrderId);
        } else {
          setSelectedOrderId(null);
          setSelectedOrder(null);
        }
      } catch (error: any) {
        console.warn('Falha ao carregar visão operacional:', error?.message || error);
      } finally {
        setRefreshing(false);
      }
    },
    [loadOrderDetail, selectedOrderId],
  );

  React.useEffect(() => {
    loadOperationalData().catch((error: any) => {
      console.warn('Falha ao iniciar trade:', error?.message || error);
    });
  }, [loadOperationalData]);

  React.useEffect(() => {
    if (!quote?.expiresAt) {
      setQuoteTimeLeft(null);
      return;
    }

    const updateRemainingTime = () => {
      const diffMs = new Date(quote.expiresAt).getTime() - Date.now();
      setQuoteTimeLeft(Math.max(0, Math.ceil(diffMs / 1000)));
    };

    updateRemainingTime();
    const timer = setInterval(updateRemainingTime, 1000);
    return () => clearInterval(timer);
  }, [quote?.expiresAt]);

  const handleQuote = async () => {
    setLoading(true);
    try {
      const response = await getExchangeQuote({
        from: selectedPair.from,
        to: selectedPair.to,
        amount,
        side,
      });
      setQuote(response.quote);
    } catch (error: any) {
      notify('Quote indisponível', error?.message || 'Falha ao gerar quote.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!quote?.id) {
      notify('Quote necessária', 'Gere uma quote antes de enviar a ordem.');
      return;
    }
    if (quoteTimeLeft !== null && quoteTimeLeft <= 0) {
      notify('Quote expirada', 'Gere uma nova quote antes de executar a ordem.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await createExchangeOrder({
        quoteId: quote.id,
        clientRequestId: `mobile-${Date.now()}`,
      });
      notify('Ordem enviada', `Status atual: ${response.order.status}`);
      setQuote(null);
      await loadOperationalData(response.order.id);
    } catch (error: any) {
      notify('Falha ao criar ordem', error?.message || 'Erro desconhecido.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetrySettlement = async (settlementId: string) => {
    setRetryingSettlementId(settlementId);
    try {
      const response = await retrySettlement(settlementId);
      notify(
        'Settlement reenviado',
        `Novo status: ${response.settlement.status}`,
      );
      await loadOperationalData(selectedOrderId ?? undefined);
    } catch (error: any) {
      notify(
        'Falha no settlement',
        error?.message || 'Não foi possível reenviar o settlement.',
      );
    } finally {
      setRetryingSettlementId(null);
    }
  };

  const quoteExpired = quoteTimeLeft !== null && quoteTimeLeft <= 0;
  const selectedOrderSettlements = getOperationalSettlements(
    selectedOrder,
    settlements,
  );

  const selectedOrderHasActiveFlow = React.useMemo(() => {
    return hasOperationalActiveFlow(selectedOrder, selectedOrderSettlements);
  }, [selectedOrder, selectedOrderSettlements]);

  React.useEffect(() => {
    if (!selectedOrderHasActiveFlow) return;
    const timer = setInterval(() => {
      loadOperationalData(selectedOrderId ?? undefined).catch((error: any) => {
        console.warn('Falha no refresh operacional:', error?.message || error);
      });
    }, 15000);
    return () => clearInterval(timer);
  }, [loadOperationalData, selectedOrderHasActiveFlow, selectedOrderId]);

  const orderFailureReason = selectedOrder?.complianceBlockReason ?? null;
  const settlementFailureSummary = getSettlementFailureSummary(
    selectedOrderSettlements,
  );
  const travelRule = React.useMemo(() => {
    return getOperationalTravelRule(selectedOrder, selectedOrderSettlements);
  }, [selectedOrder, selectedOrderSettlements]);
  const travelRuleBadge = React.useMemo(() => {
    return getOperationalTravelRuleBadgeText(travelRule);
  }, [travelRule]);
  const travelRuleTone = React.useMemo(() => {
    return getOperationalTravelRuleBadgeTone(travelRule);
  }, [travelRule]);

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

  const getStepAccent = (state: string) => {
    if (state === 'done') return theme.colors.green;
    if (state === 'active') return theme.colors.gold;
    if (state === 'blocked') return theme.colors.danger;
    return theme.colors.inkFaint;
  };

  const openOrderDetail = async (orderId: string) => {
    if (selectedOrderId !== orderId) {
      await loadOrderDetail(orderId);
    }
    setDetailVisible(true);
  };

  const openSettlementDetail = async (settlement: any) => {
    const orderId = settlement.orderId ?? settlement.order?.id;
    if (orderId) {
      await openOrderDetail(orderId);
      return;
    }
    setDetailVisible(true);
  };

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
        notify(
          'Suporte aberto',
          'Uma thread foi criada com o contexto operacional. Veja a aba Suporte.',
        );
      } catch (error: any) {
        notify(
          'Falha ao abrir suporte',
          error?.message || 'Não foi possível abrir uma thread de suporte.',
        );
      }
    },
    [navigation],
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>FX & Crypto Exchange</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={() => loadOperationalData()}>
            {refreshing ? (
              <ActivityIndicator color={theme.colors.gold} size="small" />
            ) : (
              <RefreshCcw size={16} color={theme.colors.gold} />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          Cotação, execução e roteamento para pares BRL, USD, EUR e cripto.
        </Text>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Operação</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusBlock}>
              <Text style={styles.statusName}>Exchange</Text>
              <Text style={styles.statusValue}>
                {exchangeProviderStatus?.mode ?? 'carregando'}
              </Text>
              <Text style={styles.statusHint}>
                {exchangeProviderStatus?.fallbackActive
                  ? 'Fallback ativo'
                  : 'Routing pronto'}
              </Text>
            </View>
            <View style={styles.statusBlock}>
              <Text style={styles.statusName}>Settlement</Text>
              <Text style={styles.statusValue}>
                {settlementProviderStatus?.mode ?? 'carregando'}
              </Text>
              <Text style={styles.statusHint}>
                {settlementProviderStatus?.fallbackActive
                  ? 'Fallback ativo'
                  : 'Broadcast pronto'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Par</Text>
          <View style={styles.pairGrid}>
            {PAIRS.map((pair) => {
              const active =
                pair.from === selectedPair.from && pair.to === selectedPair.to;
              return (
                <TouchableOpacity
                  key={`${pair.from}-${pair.to}`}
                  style={[styles.pairChip, active && styles.pairChipActive]}
                  onPress={() => setSelectedPair(pair)}
                >
                  <Text style={[styles.pairChipText, active && styles.pairChipTextActive]}>
                    {pair.from}/{pair.to}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>Side</Text>
          <View style={styles.sideRow}>
            {(['BUY', 'SELL'] as const).map((value) => {
              const active = value === side;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.sideButton, active && styles.sideButtonActive]}
                  onPress={() => setSide(value)}
                >
                  <Text style={[styles.sideButtonText, active && styles.sideButtonTextActive]}>
                    {value === 'BUY' ? 'Comprar' : 'Vender'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>Valor</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="1000"
            placeholderTextColor={theme.colors.inkFaint}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleQuote} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={theme.colors.bg} />
            ) : (
              <>
                <ArrowLeftRight size={16} color={theme.colors.bg} />
                <Text style={styles.primaryButtonText}>Gerar Quote</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {quote ? (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quote ativa</Text>
              <Text style={[styles.badge, quoteExpired && styles.badgeDanger]}>
                {quoteExpired
                  ? 'Expirada'
                  : `Valida por ${quoteTimeLeft ?? 0}s`}
              </Text>
            </View>
            <Text style={styles.quoteLine}>Par: {quote.pair}</Text>
            <Text style={styles.quoteLine}>Entrada: {quote.amountIn}</Text>
            <Text style={styles.quoteLine}>Saída estimada: {quote.amountOut}</Text>
            <Text style={styles.quoteLine}>Rate: {quote.rate}</Text>
            <Text style={styles.quoteLine}>Fee: {quote.feeAmount}</Text>
            <Text style={styles.quoteLine}>Fonte: {quote.source}</Text>
            <Text style={styles.quoteLine}>
              Expira em: {formatOperationalDateTime(quote.expiresAt)}
            </Text>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (submitting || quoteExpired) && styles.buttonDisabled,
              ]}
              onPress={handleCreateOrder}
              disabled={submitting || quoteExpired}
            >
              {submitting ? (
                <ActivityIndicator color={theme.colors.bg} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {quoteExpired ? 'Regere quote para executar' : 'Executar Ordem'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ordens recentes</Text>
          {orders.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma ordem encontrada ainda.</Text>
          ) : (
            orders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={[
                  styles.orderRow,
                  selectedOrderId === order.id && styles.orderRowSelected,
                ]}
                onPress={() => loadOrderDetail(order.id)}
                onLongPress={() => openOrderDetail(order.id)}
              >
                <View style={styles.orderMeta}>
                  <Text style={styles.orderTitle}>{order.pair}</Text>
                  <Text style={styles.orderSub}>
                    {order.side} · {order.route} · {order.status}
                  </Text>
                  <Text style={styles.orderHint}>
                    {formatOperationalDateTime(order.createdAt)} · {order.settlements?.length ?? 0}{' '}
                    settlement(s)
                  </Text>
                  {order?.metadata?.travelRule?.status ? (
                    <View style={styles.badgeRow}>
                      <Text
                        style={[
                          styles.smallBadge,
                          order.metadata.travelRule.status === 'BLOCKED' &&
                            styles.smallBadgeDanger,
                          order.metadata.travelRule.status === 'MANUAL_REVIEW' &&
                            styles.smallBadgeWarning,
                          order.metadata.travelRule.status === 'PENDING' &&
                            styles.smallBadgePending,
                        ]}
                      >
                        {getOperationalTravelRuleBadgeText(order.metadata.travelRule)}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.orderValue}>{order.amountIn}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ordem selecionada</Text>
            {loadingOrderDetail ? (
              <ActivityIndicator color={theme.colors.gold} size="small" />
            ) : selectedOrder?.status ? (
              <Text style={styles.badge}>{selectedOrder.status}</Text>
            ) : null}
          </View>
          {!selectedOrder ? (
            <Text style={styles.emptyText}>
              Selecione uma ordem para ver o lifecycle operacional.
            </Text>
          ) : (
            <>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => openOrderDetail(selectedOrder.id)}
              >
                <Text style={styles.secondaryButtonText}>
                  Abrir detalhe operacional
                </Text>
              </TouchableOpacity>
              <Text style={styles.quoteLine}>Par: {selectedOrder.pair}</Text>
              <Text style={styles.quoteLine}>Route: {selectedOrder.route}</Text>
              <Text style={styles.quoteLine}>Entrada: {selectedOrder.amountIn}</Text>
              <Text style={styles.quoteLine}>
                Saída: {selectedOrder.amountOut ?? 'a confirmar'}
              </Text>
              <Text style={styles.quoteLine}>
                Provider ref: {selectedOrder.providerOrderRef ?? 'n/a'}
              </Text>
              <Text style={styles.quoteLine}>
                Wallet destino: {selectedOrder.wallet?.address ?? 'custodia/parceiro'}
              </Text>
              <Text style={styles.quoteLine}>
                Criada em: {formatOperationalDateTime(selectedOrder.createdAt)}
              </Text>
              <View style={styles.tipCard}>
                <Text style={styles.tipTitle}>Próxima ação</Text>
                <Text style={styles.tipText}>{nextActionHint}</Text>
              </View>
              {orderFailureReason ? (
                <View style={styles.alertCard}>
                  <Text style={styles.alertTitle}>Bloqueio de compliance</Text>
                  <Text style={styles.alertText}>{orderFailureReason}</Text>
                </View>
              ) : null}
              {settlementFailureSummary.length ? (
                <View style={styles.alertCard}>
                  <Text style={styles.alertTitle}>Falhas de settlement</Text>
                  {settlementFailureSummary.map((item: any) => (
                    <Text key={item.id} style={styles.alertText}>
                      {item.asset} · {item.status} · {item.reason}
                    </Text>
                  ))}
                </View>
              ) : null}
              {travelRuleBadge ? (
                <View style={styles.badgeRow}>
                  <Text
                    style={[
                      styles.smallBadge,
                      travelRuleTone === 'danger' && styles.smallBadgeDanger,
                      travelRuleTone === 'warning' && styles.smallBadgeWarning,
                      travelRuleTone === 'pending' && styles.smallBadgePending,
                    ]}
                  >
                    {travelRuleBadge}
                  </Text>
                </View>
              ) : null}
              {selectedOrderSettlements?.length ? (
                <View style={styles.inlineList}>
                  {selectedOrderSettlements.map((item: any) => (
                    <Text key={item.id} style={styles.inlineChip}>
                      {item.asset} · {item.status}
                    </Text>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>
                  Esta ordem ainda não possui settlement associado.
                </Text>
              )}
            </>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Timeline operacional</Text>
            {selectedOrderHasActiveFlow ? (
              <Text style={styles.badge}>Auto refresh 15s</Text>
            ) : null}
          </View>
          {!selectedOrder ? (
            <Text style={styles.emptyText}>
              A timeline aparece quando uma ordem estiver selecionada.
            </Text>
          ) : (
            <View style={styles.timelineList}>
              {orderTimeline.map((step, index) => {
                const accent = getStepAccent(step.state);
                const isLast = index === orderTimeline.length - 1;
                return (
                  <View key={step.key} style={styles.timelineRow}>
                    <View style={styles.timelineRail}>
                      <View
                        style={[
                          styles.timelineDot,
                          { borderColor: accent, backgroundColor: accent },
                        ]}
                      />
                      {!isLast ? (
                        <View
                          style={[
                            styles.timelineLine,
                            { backgroundColor: accent },
                          ]}
                        />
                      ) : null}
                    </View>
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineHeader}>
                        <Text style={styles.timelineTitle}>{step.label}</Text>
                        <Text style={[styles.timelineState, { color: accent }]}>
                          {step.state}
                        </Text>
                      </View>
                      <Text style={styles.timelineDetail}>{step.detail}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Settlements recentes</Text>
          {settlements.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum settlement disponível ainda.</Text>
          ) : (
            settlements.map((settlement) => {
              const actionable = !settlement.txHash && settlement.status !== 'CONFIRMED';
              const trBadge = getOperationalTravelRuleBadgeText(
                settlement?.metadata?.travelRule,
              );
              const trTone = getOperationalTravelRuleBadgeTone(
                settlement?.metadata?.travelRule,
              );
              return (
                <TouchableOpacity
                  key={settlement.id}
                  style={styles.settlementCard}
                  onPress={() => openSettlementDetail(settlement)}
                  activeOpacity={0.9}
                >
                  <View style={styles.settlementHeader}>
                    <View style={styles.settlementMeta}>
                      <Text style={styles.orderTitle}>
                        {settlement.asset} · {settlement.chain}
                      </Text>
                      <Text style={styles.orderSub}>
                        {shortenOperationalValue(settlement.destinationAddress, 6)}
                      </Text>
                    </View>
                    <Text style={styles.badge}>{settlement.status}</Text>
                  </View>
                  <Text style={styles.quoteLine}>
                    Ordem: {settlement.order?.pair ?? 'n/a'}
                  </Text>
                  <Text style={styles.quoteLine}>
                    Tx hash: {settlement.txHash ? shortenOperationalValue(settlement.txHash, 8) : 'aguardando envio'}
                  </Text>
                  <Text style={styles.quoteLine}>
                    Criado em: {formatOperationalDateTime(settlement.createdAt)}
                  </Text>
                  {trBadge ? (
                    <View style={styles.badgeRow}>
                      <Text
                        style={[
                          styles.smallBadge,
                          trTone === 'danger' && styles.smallBadgeDanger,
                          trTone === 'warning' && styles.smallBadgeWarning,
                          trTone === 'pending' && styles.smallBadgePending,
                        ]}
                      >
                        {trBadge}
                      </Text>
                      {trTone === 'danger' || trTone === 'warning' ? (
                        <TouchableOpacity
                          style={styles.secondaryButton}
                          onPress={() =>
                            openSupport({
                              subject: `Travel rule: ${String(
                                settlement?.metadata?.travelRule?.status ?? 'UNKNOWN',
                              )}`,
                              message:
                                'Preciso de ajuda com travel rule no settlement. Pode verificar o status e orientar próximos passos?',
                              draftMessage: [
                                'Contexto (preenchido automaticamente):',
                                `settlementId=${String(settlement.id)}`,
                                settlement?.orderId
                                  ? `orderId=${String(settlement.orderId)}`
                                  : null,
                                settlement?.asset ? `asset=${String(settlement.asset)}` : null,
                                settlement?.chain ? `chain=${String(settlement.chain)}` : null,
                                settlement?.destinationAddress
                                  ? `destination=${String(settlement.destinationAddress)}`
                                  : null,
                                settlement?.metadata?.travelRule?.status
                                  ? `status=${String(settlement.metadata.travelRule.status)}`
                                  : null,
                                settlement?.metadata?.travelRule?.reason
                                  ? `reason=${String(settlement.metadata.travelRule.reason)}`
                                  : null,
                                '',
                                'Mensagem adicional:',
                                '',
                              ]
                                .filter(Boolean)
                                .join('\n'),
                            })
                          }
                        >
                          <Text style={styles.secondaryButtonText}>Abrir suporte</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ) : null}
                  {actionable ? (
                    <TouchableOpacity
                      style={[
                        styles.secondaryButton,
                        retryingSettlementId === settlement.id && styles.buttonDisabled,
                      ]}
                      onPress={() => handleRetrySettlement(settlement.id)}
                      disabled={retryingSettlementId === settlement.id}
                    >
                      {retryingSettlementId === settlement.id ? (
                        <ActivityIndicator color={theme.colors.gold} size="small" />
                      ) : (
                        <Text style={styles.secondaryButtonText}>
                          Enviar settlement
                        </Text>
                      )}
                    </TouchableOpacity>
                  ) : null}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
      <OperationalOrderDetailModal
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        loading={loadingOrderDetail}
        title={selectedOrder?.pair ?? 'Ordem'}
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
            loadOperationalData(selectedOrder.id);
          }
        }}
        onRetrySettlement={handleRetrySettlement}
        onOpenSupport={openSupport}
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
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  modalTitle: {
    color: theme.colors.ink,
    fontFamily: theme.fonts.sansMedium,
    fontSize: 22,
    marginTop: 4,
  },
  modalCloseText: {
    color: theme.colors.gold,
    fontFamily: theme.fonts.sansMedium,
    fontSize: 13,
  },
  title: { color: theme.colors.ink, fontSize: 24, fontFamily: theme.fonts.sansMedium },
  subtitle: { color: theme.colors.inkDim, fontSize: 14, fontFamily: theme.fonts.sansLight },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.bg2,
    borderWidth: 1,
    borderColor: theme.colors.rule,
  },
  card: {
    backgroundColor: theme.colors.bg2,
    borderRadius: theme.radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.rule,
    gap: 12,
  },
  statusCard: {
    backgroundColor: theme.colors.bg3,
    borderRadius: theme.radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
    gap: 12,
  },
  statusRow: { flexDirection: 'row', gap: 12 },
  statusBlock: { flex: 1 },
  statusName: {
    color: theme.colors.ink,
    fontSize: 14,
    fontFamily: theme.fonts.sansMedium,
  },
  statusLabel: {
    color: theme.colors.inkDim,
    fontSize: 11,
    fontFamily: theme.fonts.mono,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  statusValue: {
    color: theme.colors.gold,
    fontSize: 18,
    marginTop: 6,
    fontFamily: theme.fonts.sansMedium,
  },
  statusHint: {
    color: theme.colors.inkDim,
    fontSize: 12,
    marginTop: 6,
    fontFamily: theme.fonts.sansLight,
    lineHeight: 18,
  },
  sectionTitle: { color: theme.colors.ink, fontSize: 16, fontFamily: theme.fonts.sansMedium },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    color: theme.colors.gold,
    fontSize: 11,
    fontFamily: theme.fonts.mono,
    textTransform: 'uppercase',
  },
  badgeDanger: {
    color: theme.colors.danger,
  },
  badgeRow: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  smallBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.bg3,
    borderWidth: 1,
    borderColor: theme.colors.line,
    color: theme.colors.gold,
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    overflow: 'hidden',
    textTransform: 'uppercase',
  },
  smallBadgePending: {
    borderColor: 'rgba(212,168,106,0.5)',
    backgroundColor: 'rgba(212,168,106,0.08)',
  },
  smallBadgeWarning: {
    borderColor: 'rgba(197,135,230,0.55)',
    backgroundColor: 'rgba(197,135,230,0.1)',
    color: theme.colors.nebula,
  },
  smallBadgeDanger: {
    borderColor: 'rgba(239,68,68,0.4)',
    backgroundColor: 'rgba(239,68,68,0.16)',
    color: theme.colors.danger,
  },
  pairGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pairChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.bg3,
    borderWidth: 1,
    borderColor: theme.colors.rule,
  },
  pairChipActive: {
    backgroundColor: theme.colors.gold,
    borderColor: theme.colors.gold,
  },
  pairChipText: { color: theme.colors.inkDim, fontFamily: theme.fonts.mono, fontSize: 12 },
  pairChipTextActive: { color: theme.colors.bg },
  sideRow: { flexDirection: 'row', gap: 12 },
  sideButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.rule,
    alignItems: 'center',
    backgroundColor: theme.colors.bg3,
  },
  sideButtonActive: { backgroundColor: theme.colors.gold, borderColor: theme.colors.gold },
  sideButtonText: { color: theme.colors.ink, fontFamily: theme.fonts.sansMedium },
  sideButtonTextActive: { color: theme.colors.bg },
  input: {
    backgroundColor: theme.colors.bg3,
    borderWidth: 1,
    borderColor: theme.colors.rule,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.colors.ink,
    fontFamily: theme.fonts.sansRegular,
  },
  primaryButton: {
    backgroundColor: theme.colors.gold,
    borderRadius: theme.radius.pill,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: { color: theme.colors.bg, fontFamily: theme.fonts.sansMedium, fontSize: 14 },
  buttonDisabled: { opacity: 0.7 },
  quoteLine: { color: theme.colors.inkDim, fontSize: 13, fontFamily: theme.fonts.sansRegular },
  emptyText: { color: theme.colors.inkDim, fontFamily: theme.fonts.sansLight, fontSize: 13 },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.rule,
  },
  orderRowSelected: {
    backgroundColor: theme.colors.bg3,
    borderRadius: 12,
    paddingHorizontal: 10,
  },
  orderMeta: { flex: 1, marginRight: 12 },
  orderTitle: { color: theme.colors.ink, fontSize: 14, fontFamily: theme.fonts.sansMedium },
  orderSub: { color: theme.colors.inkDim, fontSize: 12, marginTop: 4, fontFamily: theme.fonts.sansLight },
  orderHint: { color: theme.colors.gold, fontSize: 11, marginTop: 6, fontFamily: theme.fonts.mono },
  orderValue: { color: theme.colors.gold, fontSize: 13, fontFamily: theme.fonts.mono },
  inlineList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  inlineChip: {
    color: theme.colors.gold,
    backgroundColor: theme.colors.bg3,
    borderWidth: 1,
    borderColor: theme.colors.rule,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    fontFamily: theme.fonts.mono,
    overflow: 'hidden',
  },
  tipCard: {
    marginTop: 4,
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
    marginTop: 4,
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
  metaGrid: {
    marginTop: 4,
    gap: 8,
  },
  metaItem: {
    backgroundColor: theme.colors.bg3,
    borderWidth: 1,
    borderColor: theme.colors.rule,
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  metaLabel: {
    color: theme.colors.inkDim,
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  metaValue: {
    color: theme.colors.ink,
    fontFamily: theme.fonts.sansRegular,
    fontSize: 12,
  },
  timelineList: {
    gap: 0,
  },
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
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
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
  settlementCard: {
    backgroundColor: theme.colors.bg3,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.rule,
    padding: 14,
    gap: 8,
  },
  settlementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  settlementMeta: { flex: 1 },
  secondaryButton: {
    marginTop: 4,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.gold,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg2,
  },
  secondaryButtonText: {
    color: theme.colors.gold,
    fontFamily: theme.fonts.sansMedium,
    fontSize: 13,
  },
});
