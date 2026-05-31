"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";

type Role = "user" | "assistant" | "system";
type Message = { role: Role; content: string; time: string };

export default function ChatPage() {
  const t = useTranslations("chat");

  // Enable real-time updates when the wallet connects
  useRealTimeUpdates();

  const locale = useLocale();
  // Mock user identity
  const userName = "Jistriane";

  // Estado do chat
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: t("assistant_started", { name: userName }),
    time: nowTime(),
  }]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [channelStatus, setChannelStatus] = useState<"online" | "offline" | "handover">("online");
  const [eta, setEta] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [feedback, setFeedback] = useState<"up" | "down" | undefined>(undefined);
  const [feedbackComment, setFeedbackComment] = useState("");

  // Quick suggestions
  const quickSuggestions = useMemo(
    () => (t.raw("suggestions") as string[]) ?? [],
    [t]
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function nowTime() {
    try {
      return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date());
    } catch {
      return "";
    }
  }

  function pushMessage(role: Role, content: string) {
    setMessages((prev) => [...prev, { role, content, time: nowTime() }]);
  }

  function onSend() {
    const value = text.trim();
    if (!value) return;
    pushMessage("user", value);
    setText("");
    mockAssistantReply(value);
  }

  function mockAssistantReply(userText: string) {
    setTyping(true);
    // Suggest useful links based on keywords (mock)
    const hints: string[] = [];
    const lower = userText.toLowerCase();
    if (lower.includes("pix")) hints.push(t("hint_pix"));
    if (lower.includes("cart")) hints.push(t("hint_cards"));
    setTimeout(() => {
      pushMessage("assistant", t("assistant_reply", { text: userText }));
      if (hints.length) pushMessage("assistant", hints.join(" \n"));
      setTyping(false);
    }, 800);
  }

  function onAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelectedFileName(f.name);
    pushMessage("user", t("selected_file", { file: f.name }));
  }

  function requestHuman() {
    setChannelStatus("handover");
    setEta("2 min");
    pushMessage("system", t("system_handover_start"));
    setTimeout(() => {
      pushMessage("system", t("system_handover_connected"));
      setChannelStatus("online");
      setEta(null);
    }, 3000);
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/85 to-background/60" />
      <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_20%_15%,rgba(var(--stellaro-accent-rgb),0.14),transparent_60%),radial-gradient(900px_circle_at_80%_10%,rgba(197,135,230,0.10),transparent_55%)]" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
      
      {/* Header, greeting and status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary grid place-items-center text-primary-foreground font-bold">E</div>
          <div>
            <h1 className="text-xl font-semibold">{t("header_title")}</h1>
            <div className="text-xs text-muted-foreground">
              {channelStatus === "online" && t("status_online")}
              {channelStatus === "handover" && t("status_handover")}
              {channelStatus === "offline" && t("status_offline")}
              {eta && t("eta", { eta })}
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">{t("hours")}</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("conversation")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-2">
            {quickSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setText(s);
                  pushMessage("user", s);
                  setText("");
                  mockAssistantReply(s);
                }}
                className="px-3 py-1.5 rounded bg-secondary/30 border border-border/60 text-xs"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Message history */}
          <div ref={scrollRef} className="h-[420px] overflow-auto bg-card/50 border border-border/60 rounded p-3 space-y-3">
            {messages.map((m, idx) => (
              <div key={idx} className={`max-w-[85%] ${m.role === "user" ? "ml-auto text-foreground" : m.role === "assistant" ? "text-foreground" : "text-muted-foreground"}`}>
                <div className={`px-3 py-2 rounded border ${m.role === "user" ? "bg-primary/10 border-primary/25" : m.role === "assistant" ? "bg-secondary/20 border-border/60" : "bg-secondary/30 border-border/60"}`}>
                  <div className="text-xs opacity-70 mb-1">[{m.time}] {m.role === "user" ? userName : m.role === "assistant" ? "elizaos" : t("system_label")}</div>
                  <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            ))}
            {typing && (
              <div className="max-w-[85%] text-foreground">
                <div className="px-3 py-2 rounded border border-border/60 bg-secondary/20 text-xs">{t("typing")}</div>
              </div>
            )}
          </div>

          {/* Message input + attachments */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <label className="text-xs text-muted-foreground">
              <span className="px-3 py-2 rounded bg-secondary/30 border border-border/60 cursor-pointer inline-block">{t("attach")}</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={onAttach}
              />
            </label>
            {selectedFileName && (
              <div className="text-xs text-muted-foreground">{t("selected_file", { file: selectedFileName })}</div>
            )}
            <div className="flex-1 flex gap-2">
              <input
                className="flex-1 rounded bg-secondary/30 px-3 py-2 text-sm outline-none border border-border/60 text-foreground"
                placeholder={t("placeholder")}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
              />
              <button onClick={onSend} className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium">
                {t("send")}
              </button>
            </div>
          </div>

          {/* Escalation actions and status */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <button onClick={requestHuman} className="px-3 py-1.5 rounded bg-secondary/30 border border-border/60">{t("escalate")}</button>
            <span>{t("who_answers")} {channelStatus === "online" ? t("who_online") : channelStatus === "handover" ? t("who_handover") : t("who_offline")}</span>
            <span>{t("human_available")}</span>
          </div>

          {/* Useful links */}
          <div className="flex flex-wrap gap-2 text-xs">
            <Link href="/help" className="px-3 py-1.5 rounded bg-secondary/30 border border-border/60">{t("links.help")}</Link>
            <Link href="/help" className="px-3 py-1.5 rounded bg-secondary/30 border border-border/60">{t("links.faq")}</Link>
            <Link href="/docs" className="px-3 py-1.5 rounded bg-secondary/30 border border-border/60">{t("links.articles")}</Link>
            <Link href="/pix" className="px-3 py-1.5 rounded bg-secondary/30 border border-border/60">{t("links.pix_status")}</Link>
          </div>

          {/* Security and Privacy */}
          <div className="text-xs text-primary bg-primary/10 border border-primary/25 rounded px-3 py-2">
            ⚠️ {t("privacy")} <Link href="/docs" className="underline">{t("privacy_link")}</Link>
          </div>

          {/* Service evaluation */}
          <div className="flex flex-col gap-2">
            <div className="text-xs text-muted-foreground">{t("feedback_title")}</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFeedback("up")}
                className={`px-2 py-1 rounded border text-sm ${feedback === "up" ? "bg-primary border-primary/30 text-primary-foreground" : "bg-secondary/30 border-border/60"}`}
              >👍</button>
              <button
                onClick={() => setFeedback("down")}
                className={`px-2 py-1 rounded border text-sm ${feedback === "down" ? "bg-primary border-primary/30 text-primary-foreground" : "bg-secondary/30 border-border/60"}`}
              >👎</button>
              {feedback && <span className="text-xs text-muted-foreground">{t("thanks")}</span>}
            </div>
            <input
              className="rounded bg-secondary/30 px-3 py-2 text-xs outline-none border border-border/60 text-foreground"
              placeholder={t("feedback_placeholder")}
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
            />
          </div>

          <div className="text-[10px] text-muted-foreground">{t("footnote")}</div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
