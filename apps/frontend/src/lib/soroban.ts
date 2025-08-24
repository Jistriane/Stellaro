// Camada de consultas (leituras). Priorizar dados reais quando possível.
// TODO: integrar leituras de contratos via Soroban RPC/Backend.

export type ContractIds = {
  STABLECOIN_CONTRACT_ID?: string;
  RISKLOCK_CONTRACT_ID?: string;
  LOANSPOOL_CONTRACT_ID?: string;
  PORTFOLIO_CONTRACT_ID?: string;
  GOVERNANCE_CONTRACT_ID?: string;
  STELLAR_PUBLIC_KEY?: string;
};

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

// Stubs de views. Evitar valores fictícios.
export async function viewStablecoin() {
  return {
    risk_threshold_bps: undefined,
    paused: undefined,
    supply: undefined,
    symbol: "STLT",
    asset: "STLT-BRL",
  } as {
    risk_threshold_bps?: number;
    paused?: boolean;
    supply?: string;
    symbol: string;
    asset: string;
  };
}

export async function viewLoansPool() {
  return {
    ltv_bps: undefined,
    interest_bps: undefined,
    total_deposits: undefined,
    total_borrowed: undefined,
    accounts: undefined,
  } as {
    ltv_bps?: number;
    interest_bps?: number;
    total_deposits?: string;
    total_borrowed?: string;
    accounts?: number;
  };
}

export async function viewPortfolio() {
  return {
    allocation: [],
    limit_bps: undefined,
  } as {
    allocation: { asset: string; pct_bps: number }[];
    limit_bps?: number;
  };
}

export async function viewGovernance() {
  return {
    admin: getContractIds().STELLAR_PUBLIC_KEY,
    proposals_open: undefined,
  } as {
    admin?: string;
    proposals_open?: number;
  };
}

// Retorna saldos reais via Horizon quando pubkey é fornecida. Caso contrário, retorna zeros sem inventar dados.
export async function getWalletBalances(pubkey?: string) {
  const ids = getContractIds();
  if (!pubkey) {
    return { publicKey: undefined, xlm: "0", stlt: "0" } as { publicKey?: string; xlm: string; stlt: string };
  }
  const horizon = "https://horizon.stellar.org"; // TODO: permitir testnet via configuração global
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
