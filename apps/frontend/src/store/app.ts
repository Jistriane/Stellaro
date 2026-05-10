import { create } from "zustand";

export type Locale = "pt" | "en";

export type AuthState = {
  loggedIn: boolean;
  publicKey?: string;
  locale: Locale;
};

export type BalanceState = {
  xlm?: string;
  stlt?: string;
  updatedAt?: number;
};

export type RiskState = {
  score?: number;
  updatedAt?: number;
};

export type Order = {
  id: string;
  side: "buy" | "sell";
  symbol: string;
  price: number;
  qty: number;
  status: "open" | "filled" | "canceled";
  ts: number;
};

export type AppState = {
  auth: AuthState;
  balances: BalanceState;
  risk: RiskState;
  openOrders: Order[];
  lastEvents: string[]; // keeps latest event codes (for toasts)

  // actions
  setLocale: (locale: Locale) => void;
  setLoggedIn: (loggedIn: boolean, publicKey?: string) => void;
  setBalances: (b: Partial<BalanceState>) => void;
  setRisk: (r: Partial<RiskState>) => void;
  upsertOrder: (o: Order) => void;
  removeOrder: (id: string) => void;
  pushEvent: (code: string) => void;
  clearEvents: () => void;
  resetOnDisconnect: () => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  auth: { loggedIn: false, locale: "en" },
  balances: {},
  risk: {},
  openOrders: [],
  lastEvents: [],

  setLocale: (locale) => set((s) => ({ auth: { ...s.auth, locale } })),
  setLoggedIn: (loggedIn, publicKey) => set((s) => ({ auth: { ...s.auth, loggedIn, publicKey } })),
  setBalances: (b) => set((s) => ({ balances: { ...s.balances, ...b, updatedAt: Date.now() } })),
  setRisk: (r) => set((s) => ({ risk: { ...s.risk, ...r, updatedAt: Date.now() } })),
  upsertOrder: (o) => set((s) => {
    const idx = s.openOrders.findIndex((x) => x.id === o.id);
    const list = [...s.openOrders];
    if (idx >= 0) list[idx] = o; else list.unshift(o);
    return { openOrders: list };
  }),
  removeOrder: (id) => set((s) => ({ openOrders: s.openOrders.filter((x) => x.id !== id) })),
  pushEvent: (code) => set((s) => ({ lastEvents: [code, ...s.lastEvents].slice(0, 20) })),
  clearEvents: () => set({ lastEvents: [] }),
  resetOnDisconnect: () => set({
    auth: { ...get().auth, loggedIn: false, publicKey: undefined },
    balances: {},
    risk: {},
    openOrders: [],
  }),
}));
