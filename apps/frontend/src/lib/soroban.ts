// Query layer (reads). Prioritize real data when possible.
// TODO: integrate contract reads via Soroban RPC/Backend.

export type ContractIds = {
  STABLECOIN_CONTRACT_ID?: string;
  RISKLOCK_CONTRACT_ID?: string;
  LOANSPOOL_CONTRACT_ID?: string;
  PORTFOLIO_CONTRACT_ID?: string;
  GOVERNANCE_CONTRACT_ID?: string;
  STELLAR_PUBLIC_KEY?: string;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function getContractIds(): ContractIds {
  return {
    STABLECOIN_CONTRACT_ID: process.env.NEXT_PUBLIC_STABLECOIN_CONTRACT_ID || process.env.STABLECOIN_CONTRACT_ID,
    RISKLOCK_CONTRACT_ID: process.env.NEXT_PUBLIC_RISKLOCK_CONTRACT_ID || process.env.RISKLOCK_CONTRACT_ID,
    LOANSPOOL_CONTRACT_ID: process.env.NEXT_PUBLIC_LOANSPOOL_CONTRACT_ID || process.env.LOANSPOOL_CONTRACT_ID,
    PORTFOLIO_CONTRACT_ID: process.env.NEXT_PUBLIC_PORTFOLIO_CONTRACT_ID || process.env.PORTFOLIO_CONTRACT_ID,
    GOVERNANCE_CONTRACT_ID: process.env.NEXT_PUBLIC_GOVERNANCE_CONTRACT_ID || process.env.GOVERNANCE_CONTRACT_ID,
    STELLAR_PUBLIC_KEY: process.env.NEXT_PUBLIC_STELLAR_PUBLIC_KEY || process.env.STELLAR_PUBLIC_KEY,
  };
}

type StellarNetworkEnv = "public" | "mainnet" | "testnet";
type ChainProviderMode = "public-testnet" | "local";

function normalizeNetwork(value?: string | null): "public" | "testnet" {
  const v = String(value || "").toLowerCase() as StellarNetworkEnv | string;
  if (v === "public" || v === "mainnet") return "public";
  return "testnet";
}

function getChainProviderMode(): ChainProviderMode {
  return String(process.env.NEXT_PUBLIC_CHAIN_PROVIDER_MODE || "").toLowerCase() === "local"
    ? "local"
    : "public-testnet";
}

export function getHorizonBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_HORIZON_URL || process.env.HORIZON_URL;
  if (configured) return configured;

  if (getChainProviderMode() === "local") {
    return "http://localhost:8000";
  }

  const raw = process.env.NEXT_PUBLIC_STELLAR_NETWORK || process.env.STELLAR_NETWORK;
  const network = normalizeNetwork(raw);
  return network === "public" ? "https://horizon.stellar.org" : "https://horizon-testnet.stellar.org";
}

export async function getChainConfig(): Promise<{
  network: string;
  rpcUrl: string;
  horizonUrl: string;
  networkPassphrase: string;
  contracts: Record<string, string | null>;
}> {
  const response = await fetch(`${apiUrl}/chain/config`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Falha ao carregar configuração da chain no backend");
  }
  return (await response.json()) as {
    network: string;
    rpcUrl: string;
    horizonUrl: string;
    networkPassphrase: string;
    contracts: Record<string, string | null>;
  };
}

export async function viewStablecoin(): Promise<{
  contractId: string | null;
  supply: number | null;
  decimals: number | null;
  symbol: string;
  asset: string;
  timestamp: string | null;
}> {
  const response = await fetch(`${apiUrl}/chain/stablecoin/state`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Falha ao carregar estado da stablecoin no backend");
  }
  const body = (await response.json()) as {
    contractId: string | null;
    supply: number;
    decimals: number;
    timestamp: string;
  };
  return {
    contractId: body.contractId ?? null,
    supply: typeof body.supply === "number" ? body.supply : null,
    decimals: typeof body.decimals === "number" ? body.decimals : null,
    symbol: "STLT",
    asset: "STLT",
    timestamp: body.timestamp ?? null,
  };
}

export async function viewLoansPool(): Promise<{
  contractId: string | null;
  ltv_bps: number | null;
  interest_bps: number | null;
  max_loan_amount: string | null;
  total_liquidity: string | null;
  timestamp: string | null;
}> {
  const response = await fetch(`${apiUrl}/chain/loans-pool/params`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Falha ao carregar parâmetros do LoansPool no backend");
  }
  const body = (await response.json()) as {
    contractId: string | null;
    params: Record<string, unknown> | null;
    totalLiquidity: unknown;
    timestamp: string;
  };
  const params = body.params ?? {};
  const ltv_bps =
    typeof params.ltv_bps === "number"
      ? params.ltv_bps
      : typeof params.ltv_bps === "string"
        ? Number(params.ltv_bps)
        : null;
  const interest_bps =
    typeof params.interest_bps === "number"
      ? params.interest_bps
      : typeof params.interest_bps === "string"
        ? Number(params.interest_bps)
        : null;
  const max_loan_amount =
    typeof params.max_loan_amount === "string"
      ? params.max_loan_amount
      : params.max_loan_amount != null
        ? String(params.max_loan_amount)
        : null;
  return {
    contractId: body.contractId ?? null,
    ltv_bps: Number.isFinite(ltv_bps) ? (ltv_bps as number) : null,
    interest_bps: Number.isFinite(interest_bps) ? (interest_bps as number) : null,
    max_loan_amount,
    total_liquidity: body.totalLiquidity != null ? String(body.totalLiquidity) : null,
    timestamp: body.timestamp ?? null,
  };
}

export async function viewPortfolio() {
  throw new Error("Portfolio deve ser carregado via backend (sem dados mockados).");
}

export async function viewGovernance() {
  throw new Error("Governança deve ser carregada via backend (sem dados mockados).");
}

/**
 * Verifica se o usuário logado possui uma Verifiable Credential válida.
 */
export async function hasValidVc(pubkey: string): Promise<boolean> {
  if (!pubkey) return false;
  const response = await fetch(`${apiUrl}/ssi/verify/${encodeURIComponent(pubkey)}`, { cache: "no-store" });
  if (!response.ok) return false;
  const payload = (await response.json()) as unknown;
  if (typeof payload === "boolean") return payload;
  if (payload && typeof payload === "object" && "valid" in payload) {
    return Boolean((payload as any).valid);
  }
  return Boolean(payload);
}

// Returns real balances via Horizon when pubkey is provided. Otherwise, returns zeros without making up data.
export async function getWalletBalances(pubkey?: string) {
  const ids = getContractIds();
  if (!pubkey) {
    return { publicKey: undefined, xlm: "0", stlt: "0" } as { publicKey?: string; xlm: string; stlt: string };
  }
  const horizon = getHorizonBaseUrl();
  try {
    const res = await fetch(`${horizon}/accounts/${encodeURIComponent(pubkey)}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Horizon ${res.status}`);
    const data = (await res.json()) as {
      balances: Array<{
        asset_type: string;
        balance: string;
        asset_code?: string;
        asset_issuer?: string;
      }>;
    };
    const native = data.balances.find((b) => b.asset_type === "native");
    const xlm = native?.balance ?? "0";
    const stlt = data.balances.find((b) => b.asset_code === "STLT" && (!!ids.STELLAR_PUBLIC_KEY ? b.asset_issuer === ids.STELLAR_PUBLIC_KEY : true))?.balance ?? "0";
    return { publicKey: pubkey, xlm, stlt };
  } catch {
    return { publicKey: pubkey, xlm: "0", stlt: "0" };
  }
}

/**
 * Cria uma nova proposta na DAO.
 */
export async function createProposal(
  title: string,
  action: string,
  target: string,
  description: string
) {
  void title;
  void action;
  void target;
  void description;
  throw new Error("Criação de proposta requer transação real assinada pela wallet (sem simulações).");
}

/**
 * Enfileira uma proposta aprovada para execução (Timelock).
 */
export async function queueProposal(proposalId: string) {
  void proposalId;
  throw new Error("Queue de proposta requer transação real assinada pela wallet (sem simulações).");
}

/**
 * Executa uma proposta que já passou pelo período de Timelock.
 */
export async function executeProposal(proposalId: string) {
  void proposalId;
  throw new Error("Execução de proposta requer transação real assinada pela wallet (sem simulações).");
}
