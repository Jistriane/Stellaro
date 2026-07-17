import React from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../lib/theme';
import {
  formatOperationalDateTime,
  getOperationalFailureReason,
  getOperationalTravelRule,
  getOperationalTravelRuleBadgeText,
  getOperationalTravelRuleBadgeTone,
  shortenOperationalValue,
} from '../lib/operational-order';

type Props = {
  visible: boolean;
  onClose: () => void;
  loading: boolean;
  title?: string | null;
  selectedOrder: any | null;
  selectedOrderSettlements: any[];
  selectedOrderHasActiveFlow: boolean;
  orderTimeline: Array<{
    key: string;
    label: string;
    detail: string;
    state: string;
  }>;
  nextActionHint: string;
  orderFailureReason?: string | null;
  settlementFailureSummary: Array<{
    id: string;
    asset?: string;
    status?: string;
    reason?: string | null;
  }>;
  operationalMetadata?: Array<[string, unknown]>;
  retryingSettlementId?: string | null;
  onRefreshOrder?: () => void;
  onRetrySettlement?: (settlementId: string) => void;
  onOpenSupport?: (params: {
    subject: string;
    message: string;
    draftMessage?: string;
  }) => void;
  emptyStateMessage?: string;
};

export function OperationalOrderDetailModal({
  visible,
  onClose,
  loading,
  title,
  selectedOrder,
  selectedOrderSettlements,
  selectedOrderHasActiveFlow,
  orderTimeline,
  nextActionHint,
  orderFailureReason,
  settlementFailureSummary,
  operationalMetadata = [],
  retryingSettlementId = null,
  onRefreshOrder,
  onRetrySettlement,
  onOpenSupport,
  emptyStateMessage = 'Nenhuma ordem selecionada para detalhe.',
}: Props) {
  const getStepAccent = (state: string) => {
    if (state === 'done') return theme.colors.green;
    if (state === 'active') return theme.colors.gold;
    if (state === 'blocked') return theme.colors.danger;
    return theme.colors.inkFaint;
  };

  const travelRule = React.useMemo(() => {
    return getOperationalTravelRule(selectedOrder, selectedOrderSettlements);
  }, [selectedOrder, selectedOrderSettlements]);
  const travelRuleBadge = React.useMemo(() => {
    return getOperationalTravelRuleBadgeText(travelRule);
  }, [travelRule]);
  const travelRuleTone = React.useMemo(() => {
    return getOperationalTravelRuleBadgeTone(travelRule);
  }, [travelRule]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View style={styles.modalTitleBlock}>
            <Text style={styles.modalEyebrow}>Detalhe operacional</Text>
            <Text style={styles.modalTitle}>{title ?? selectedOrder?.pair ?? 'Ordem'}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Fechar</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          {loading ? (
            <View style={styles.card}>
              <ActivityIndicator color={theme.colors.gold} />
              <Text style={styles.emptyText}>Carregando detalhe operacional...</Text>
            </View>
          ) : !selectedOrder ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>{emptyStateMessage}</Text>
            </View>
          ) : (
            <>
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Resumo da ordem</Text>
                  <Text style={styles.badge}>{selectedOrder.status}</Text>
                </View>
                <Text style={styles.line}>Par: {selectedOrder.pair}</Text>
                <Text style={styles.line}>Side: {selectedOrder.side}</Text>
                <Text style={styles.line}>Route: {selectedOrder.route}</Text>
                <Text style={styles.line}>Entrada: {selectedOrder.amountIn}</Text>
                <Text style={styles.line}>Saída: {selectedOrder.amountOut ?? 'a confirmar'}</Text>
                <Text style={styles.line}>
                  Provider ref: {selectedOrder.providerOrderRef ?? 'n/a'}
                </Text>
                <Text style={styles.line}>
                  Wallet destino: {selectedOrder.wallet?.address ?? 'custodia/parceiro'}
                </Text>
                <Text style={styles.line}>
                  Criada em: {formatOperationalDateTime(selectedOrder.createdAt)}
                </Text>
                <Text style={styles.line}>
                  Quote source: {selectedOrder.quote?.source ?? 'n/a'}
                </Text>
                <View style={styles.tipCard}>
                  <Text style={styles.tipTitle}>Próxima ação</Text>
                  <Text style={styles.tipText}>{nextActionHint}</Text>
                </View>
                {travelRuleBadge ? (
                  <View style={styles.inlineRow}>
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
                    {onOpenSupport &&
                    (travelRuleTone === 'danger' || travelRuleTone === 'warning') ? (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() =>
                          onOpenSupport({
                            subject: `Travel rule: ${String(travelRule?.status ?? 'UNKNOWN')}`,
                            message:
                              'Preciso de ajuda com travel rule. Pode verificar o status e orientar próximos passos?',
                            draftMessage: [
                              'Contexto (preenchido automaticamente):',
                              `status=${String(travelRule?.status ?? 'UNKNOWN')}`,
                              travelRule?.reason ? `reason=${String(travelRule.reason)}` : null,
                              selectedOrder?.id ? `orderId=${String(selectedOrder.id)}` : null,
                              selectedOrder?.pair ? `pair=${String(selectedOrder.pair)}` : null,
                              selectedOrder?.wallet?.address
                                ? `wallet=${String(selectedOrder.wallet.address)}`
                                : null,
                              selectedOrder?.providerOrderRef
                                ? `providerOrderRef=${String(selectedOrder.providerOrderRef)}`
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
                        <Text style={styles.actionButtonText}>Abrir suporte</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : null}
                {orderFailureReason ? (
                  <View style={styles.alertCard}>
                    <Text style={styles.alertTitle}>Compliance / bloqueio</Text>
                    <Text style={styles.alertText}>{orderFailureReason}</Text>
                  </View>
                ) : null}
                {settlementFailureSummary.length ? (
                  <View style={styles.alertCard}>
                    <Text style={styles.alertTitle}>Falhas de settlement</Text>
                    {settlementFailureSummary.map((item) => (
                      <Text key={item.id} style={styles.alertText}>
                        {item.asset} · {item.status} · {item.reason}
                      </Text>
                    ))}
                  </View>
                ) : null}
                {operationalMetadata.length ? (
                  <View style={styles.metaGrid}>
                    {operationalMetadata.map(([label, value]) => (
                      <View key={String(label)} style={styles.metaItem}>
                        <Text style={styles.metaLabel}>{label}</Text>
                        <Text style={styles.metaValue}>{String(value)}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>

              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Timeline completa</Text>
                  {selectedOrderHasActiveFlow ? (
                    <Text style={styles.badge}>Auto refresh 15s</Text>
                  ) : null}
                </View>
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
                              style={[styles.timelineLine, { backgroundColor: accent }]}
                            />
                          ) : null}
                        </View>
                        <View style={styles.timelineContent}>
                          <View style={styles.sectionHeader}>
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
              </View>

              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Settlements da ordem</Text>
                  {onRefreshOrder ? (
                    <TouchableOpacity style={styles.actionButton} onPress={onRefreshOrder}>
                      <Text style={styles.actionButtonText}>Atualizar agora</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                {!selectedOrderSettlements.length ? (
                  <Text style={styles.emptyText}>
                    Nenhum settlement associado a esta ordem.
                  </Text>
                ) : (
                  selectedOrderSettlements.map((item: any) => {
                    const actionable = !item.txHash && item.status !== 'CONFIRMED';
                    const failureReason = getOperationalFailureReason(item);

                    return (
                      <View key={item.id} style={styles.settlementCard}>
                        <View style={styles.sectionHeader}>
                          <View style={styles.settlementMeta}>
                            <Text style={styles.settlementTitle}>
                              {item.asset} · {item.chain}
                            </Text>
                            <Text style={styles.settlementSubtitle}>
                              {shortenOperationalValue(item.destinationAddress, 8)}
                            </Text>
                          </View>
                          <Text style={styles.badge}>{item.status}</Text>
                        </View>
                        <Text style={styles.line}>
                          Tx hash:{' '}
                          {item.txHash
                            ? shortenOperationalValue(item.txHash, 10)
                            : 'aguardando envio'}
                        </Text>
                        <Text style={styles.line}>
                          Criado em: {formatOperationalDateTime(item.createdAt)}
                        </Text>
                        <Text style={styles.line}>
                          Broadcast: {formatOperationalDateTime(item.broadcastedAt)}
                        </Text>
                        <Text style={styles.line}>
                          Confirmado em: {formatOperationalDateTime(item.confirmedAt)}
                        </Text>
                        <Text style={styles.line}>
                          Confirmações: {item.confirmations ?? 0}
                        </Text>
                        {failureReason ? (
                          <View style={styles.alertCard}>
                            <Text style={styles.alertTitle}>Falha operacional</Text>
                            <Text style={styles.alertText}>{String(failureReason)}</Text>
                          </View>
                        ) : null}
                        {actionable && onRetrySettlement ? (
                          <TouchableOpacity
                            style={[
                              styles.actionButton,
                              retryingSettlementId === item.id && styles.buttonDisabled,
                            ]}
                            onPress={() => onRetrySettlement(item.id)}
                            disabled={retryingSettlementId === item.id}
                          >
                            {retryingSettlementId === item.id ? (
                              <ActivityIndicator color={theme.colors.gold} size="small" />
                            ) : (
                              <Text style={styles.actionButtonText}>Enviar settlement</Text>
                            )}
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    );
                  })
                )}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: theme.colors.bg },
  modalContent: { padding: 20, gap: 16 },
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
  closeButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.bg3,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: theme.colors.gold,
    fontFamily: theme.fonts.sansMedium,
    fontSize: 12,
  },
  card: {
    backgroundColor: theme.colors.bg2,
    borderRadius: theme.radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.rule,
    gap: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    color: theme.colors.ink,
    fontSize: 16,
    fontFamily: theme.fonts.sansMedium,
    flex: 1,
  },
  badge: {
    color: theme.colors.gold,
    fontSize: 11,
    fontFamily: theme.fonts.mono,
    textTransform: 'uppercase',
  },
  line: {
    color: theme.colors.inkDim,
    fontFamily: theme.fonts.sansRegular,
    fontSize: 13,
    marginTop: 2,
  },
  emptyText: {
    color: theme.colors.inkDim,
    fontFamily: theme.fonts.sansLight,
    fontSize: 13,
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
  inlineRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
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
  actionButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.bg3,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: theme.colors.gold,
    fontSize: 12,
    fontFamily: theme.fonts.sansMedium,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  settlementCard: {
    marginTop: 12,
    backgroundColor: theme.colors.bg3,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.rule,
    padding: 14,
    gap: 6,
  },
  settlementMeta: {
    flex: 1,
    marginRight: 12,
  },
  settlementTitle: {
    color: theme.colors.ink,
    fontSize: 14,
    fontFamily: theme.fonts.sansMedium,
  },
  settlementSubtitle: {
    color: theme.colors.inkDim,
    marginTop: 4,
    fontSize: 12,
    fontFamily: theme.fonts.sansLight,
  },
});
