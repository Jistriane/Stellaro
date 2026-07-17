export function formatOperationalDateTime(value?: string | Date | null) {
  if (!value) return 'n/a';
  return new Date(value).toLocaleString('pt-BR');
}

export function shortenOperationalValue(value?: string | null, size = 8) {
  if (!value) return 'n/a';
  if (value.length <= size * 2) return value;
  return `${value.slice(0, size)}...${value.slice(-size)}`;
}

export function getOperationalFailureReason(value: any) {
  if (!value) return null;
  return (
    value?.metadata?.failureReason ||
    value?.metadata?.reason ||
    value?.reason ||
    value?.error ||
    null
  );
}

export function getOperationalSettlements(order: any, settlements?: any[]) {
  if (Array.isArray(order?.settlements)) return order.settlements;
  if (!order?.id || !Array.isArray(settlements)) return [];
  return settlements.filter((item: any) => item.orderId === order.id);
}

export function hasOperationalActiveFlow(order: any, settlements: any[]) {
  if (!order) return false;
  const activeOrderStates = ['SUBMITTED', 'ROUTED', 'EXECUTING', 'SETTLING'];
  if (activeOrderStates.includes(order.status)) return true;
  return settlements.some((item: any) =>
    ['PENDING', 'BROADCASTED'].includes(item.status),
  );
}

export function getSettlementFailureSummary(settlements: any[]) {
  return settlements
    .map((item: any) => ({
      id: item.id,
      reason: getOperationalFailureReason(item),
      status: item.status,
      asset: item.asset,
    }))
    .filter((item: any) => item.reason);
}

export function getOperationalMetadata(order: any) {
  if (!order) return [];
  const orderMetadata = order.metadata ?? {};
  const quoteMetadata = order.quote?.metadata ?? {};
  const travelRule = orderMetadata?.travelRule ?? null;
  const pairs = [
    ['clientRequestId', orderMetadata?.clientRequestId],
    ['providerOrderRef', order.providerOrderRef],
    ['quoteSource', order.quote?.source],
    ['quoteSpreadBps', order.quote?.spreadBps],
    ['quoteProviderRef', quoteMetadata?.providerRef],
    ['walletAddress', order.wallet?.address],
    ['travelRuleStatus', travelRule?.status],
    ['travelRuleReason', travelRule?.reason],
  ];

  return pairs.filter(
    ([, value]) => value !== undefined && value !== null && value !== '',
  );
}

export function getOperationalTravelRule(order: any, settlements: any[]) {
  const orderMetadata = order?.metadata ?? {};
  const fromOrder = orderMetadata?.travelRule ?? null;
  if (fromOrder?.status) return fromOrder;

  const fromSettlement = settlements.find(
    (item: any) => item?.metadata?.travelRule?.status,
  )?.metadata?.travelRule;

  if (fromSettlement?.status) return fromSettlement;

  if (!order?.wallet?.address) {
    return {
      status: 'NOT_REQUIRED',
      reason: 'no_destination_wallet',
    };
  }

  return null;
}

export function getOperationalTravelRuleBadgeText(travelRule: any) {
  const status = String(travelRule?.status ?? '').toUpperCase();
  if (!status) return null;
  if (status === 'CLEARED' || status === 'NOT_REQUIRED') return 'TR: OK';
  if (status === 'PENDING') return 'TR: PENDENTE';
  if (status === 'MANUAL_REVIEW') return 'TR: REVISÃO';
  if (status === 'BLOCKED') return 'TR: BLOQUEADO';
  return `TR: ${status}`;
}

export function getOperationalTravelRuleBadgeTone(travelRule: any) {
  const status = String(travelRule?.status ?? '').toUpperCase();
  if (status === 'CLEARED' || status === 'NOT_REQUIRED') return 'ok';
  if (status === 'PENDING') return 'pending';
  if (status === 'MANUAL_REVIEW') return 'warning';
  if (status === 'BLOCKED') return 'danger';
  return 'neutral';
}

export function getOperationalTimeline(order: any, settlements: any[]) {
  if (!order) return [];
  const hasSettlement = settlements.length > 0;
  const hasBroadcastedSettlement = settlements.some((item: any) =>
    ['BROADCASTED', 'CONFIRMED'].includes(item.status),
  );
  const hasConfirmedSettlement = settlements.some(
    (item: any) => item.status === 'CONFIRMED',
  );
  const hasFailedSettlement = settlements.some(
    (item: any) => item.status === 'FAILED',
  );

  const resolveStepState = (
    done: boolean,
    active: boolean,
    blocked = false,
  ) => {
    if (blocked) return 'blocked';
    if (done) return 'done';
    if (active) return 'active';
    return 'pending';
  };

  const travelRule = getOperationalTravelRule(order, settlements);
  const travelRuleStatus = String(travelRule?.status ?? '');
  const travelRuleIsDone =
    travelRuleStatus === 'CLEARED' || travelRuleStatus === 'NOT_REQUIRED';
  const travelRuleIsBlocked =
    travelRuleStatus === 'BLOCKED' || travelRuleStatus === 'MANUAL_REVIEW';
  const travelRuleIsActive = travelRuleStatus === 'PENDING';

  return [
    {
      key: 'submitted',
      label: 'Ordem submetida',
      detail: formatOperationalDateTime(order.createdAt),
      state: resolveStepState(true, false),
    },
    {
      key: 'routed',
      label: 'Roteamento',
      detail: order.providerOrderRef ? `Ref ${order.providerOrderRef}` : order.route,
      state: resolveStepState(
        ['ROUTED', 'EXECUTING', 'SETTLING', 'SETTLED'].includes(order.status),
        order.status === 'SUBMITTED',
        order.status === 'FAILED',
      ),
    },
    {
      key: 'travel_rule',
      label: 'Travel rule',
      detail: travelRule
        ? `${travelRuleStatus}${travelRule?.reason ? ` · ${travelRule.reason}` : ''}`
        : 'Aguardando verificação',
      state: resolveStepState(
        travelRuleIsDone,
        travelRuleIsActive || (!travelRule && order.status !== 'FAILED'),
        travelRuleIsBlocked || order.status === 'FAILED',
      ),
    },
    {
      key: 'settlement',
      label: 'Settlement criado',
      detail: hasSettlement ? `${settlements.length} item(ns)` : 'Aguardando criação',
      state: resolveStepState(
        hasSettlement,
        order.status === 'SETTLING' && !hasSettlement,
        order.status === 'FAILED',
      ),
    },
    {
      key: 'broadcast',
      label: 'Broadcast on-chain',
      detail: hasBroadcastedSettlement
        ? 'Transação enviada'
        : hasFailedSettlement
          ? 'Falha no envio'
          : 'Aguardando envio',
      state: resolveStepState(
        hasBroadcastedSettlement,
        hasSettlement && !hasBroadcastedSettlement,
        hasFailedSettlement,
      ),
    },
    {
      key: 'confirmed',
      label: 'Liquidação confirmada',
      detail: hasConfirmedSettlement ? 'Confirmada' : 'Aguardando confirmações',
      state: resolveStepState(
        order.status === 'SETTLED' || hasConfirmedSettlement,
        hasBroadcastedSettlement && !hasConfirmedSettlement,
        order.status === 'FAILED',
      ),
    },
  ];
}

export function getOperationalNextActionHint(
  order: any,
  settlements: any[],
  hasActiveFlow: boolean,
) {
  if (!order) {
    return 'Selecione uma ordem para acompanhar o andamento operacional.';
  }
  const travelRule = getOperationalTravelRule(order, settlements);
  const travelRuleStatus = String(travelRule?.status ?? '');
  if (travelRuleStatus === 'MANUAL_REVIEW') {
    return 'A transferência está em revisão manual (travel rule). Abra o suporte para concluir a validação.';
  }
  if (travelRuleStatus === 'BLOCKED') {
    return 'A transferência foi bloqueada por travel rule. Verifique a contraparte e abra o suporte.';
  }
  if (travelRuleStatus === 'PENDING') {
    return 'Aguardando verificação de travel rule. Aguarde ou abra o suporte se persistir.';
  }
  if (order.status === 'FAILED') {
    return 'Verifique bloqueio operacional ou de compliance antes de reenviar o fluxo.';
  }
  const pendingSettlement = settlements.find(
    (item: any) => !item.txHash && item.status !== 'CONFIRMED',
  );
  if (pendingSettlement) {
    return 'Existe settlement aguardando envio. Use o botão de envio para continuar a liquidação.';
  }
  if (order.status === 'SETTLED') {
    return 'Fluxo concluído. Acompanhe apenas confirmações finais e histórico.';
  }
  if (hasActiveFlow) {
    return 'Fluxo em andamento. A tela atualiza automaticamente enquanto a ordem estiver ativa.';
  }
  return 'A ordem está parada em um estado intermediário. Revise settlements e histórico operacional.';
}
