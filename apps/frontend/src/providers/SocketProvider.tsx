"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "@/store/app";

export type SocketStatus = "disconnected" | "connecting" | "connected" | "error";

type Ctx = {
  status: SocketStatus;
  lastError?: string;
};

const SocketCtx = createContext<Ctx>({ status: "disconnected" });

export function SocketProvider({ children }: { children: React.ReactNode }) {
  // Verificar se está em ambiente de browser antes de acessar o store
  const isClient = typeof window !== 'undefined';
  
  if (!isClient) {
    return <>{children}</>;
  }

  const { loggedIn, publicKey } = useAppStore((s) => s.auth);
  const setBalances = useAppStore((s) => s.setBalances);
  const setRisk = useAppStore((s) => s.setRisk);
  const upsertOrder = useAppStore((s) => s.upsertOrder);
  const pushEvent = useAppStore((s) => s.pushEvent);
  const resetOnDisconnect = useAppStore((s) => s.resetOnDisconnect);

  const [status, setStatus] = useState<SocketStatus>("disconnected");
  const [lastError, setLastError] = useState<string | undefined>(undefined);
  const wsRef = useRef<WebSocket | null>(null);

  const wsUrl = useMemo(() => {
    return process.env.NEXT_PUBLIC_WS_URL || "";
  }, []);

  useEffect(() => {
    if (!loggedIn) {
      setStatus("disconnected");
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    if (!wsUrl) {
      setStatus("disconnected");
      setLastError(undefined);
      return;
    }

    setStatus("connecting");
    const url = `${wsUrl}?pubkey=${encodeURIComponent(publicKey || "")}`;
    
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setStatus("connected");
      ws.onerror = () => {
        setLastError("ws_error");
        setStatus("error");
      };
      ws.onclose = () => {
        setStatus("disconnected");
        resetOnDisconnect();
      };
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          switch (data.type) {
            case "BALANCE_UPDATED":
              setBalances({ xlm: data.payload?.xlm, stlt: data.payload?.stlt });
              pushEvent("BALANCE_UPDATED");
              break;
            case "RISK_SCORE":
              setRisk({ score: data.payload?.score });
              pushEvent("RISK_SCORE");
              break;
            case "ORDER_EVENT":
              upsertOrder(data.payload);
              pushEvent(data.payload?.status === "filled" ? "ORDER_FILLED" : "ORDER_UPDATED");
              break;
            default:
              // desconhecido; apenas loga
              break;
          }
        } catch {}
      };
    } catch (err) {
      console.error("WebSocket connection error:", err);
      setStatus("error");
      setLastError("ws_init_error");
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [loggedIn, publicKey, wsUrl, setBalances, setRisk, upsertOrder, pushEvent, resetOnDisconnect]);

  const value = useMemo(() => ({ status, lastError }), [status, lastError]);
  return <SocketCtx.Provider value={value}>{children}</SocketCtx.Provider>;
}

export function useSocket() {
  return useContext(SocketCtx);
}
