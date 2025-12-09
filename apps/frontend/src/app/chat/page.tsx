"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
    <div className="p-6 space-y-6">
      {/* Header, greeting and status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-700 grid place-items-center text-black font-bold">E</div>
          <div>
            <h1 className="text-xl font-semibold">{t("header_title")}</h1>
            <div className="text-xs text-slate-400">
              {channelStatus === "online" && t("status_online")}
              {channelStatus === "handover" && t("status_handover")}
              {channelStatus === "offline" && t("status_offline")}
              {eta && t("eta", { eta })}
            </div>
          </div>
        </div>
        <div className="text-xs text-slate-500">{t("hours")}</div>
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
                className="px-3 py-1.5 rounded bg-slate-800 text-xs"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Message history */}
          <div ref={scrollRef} className="h-[420px] overflow-auto bg-slate-900 rounded p-3 space-y-3">
            {messages.map((m, idx) => (
              <div key={idx} className={`max-w-[85%] ${m.role === "user" ? "ml-auto text-sky-100" : m.role === "assistant" ? "text-emerald-100" : "text-slate-300"}`}>
                <div className={`px-3 py-2 rounded ${m.role === "user" ? "bg-sky-900/60" : m.role === "assistant" ? "bg-emerald-900/50" : "bg-slate-800/60"}`}>
                  <div className="text-xs opacity-70 mb-1">[{m.time}] {m.role === "user" ? userName : m.role === "assistant" ? "elizaos" : t("system_label")}</div>
                  <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            ))}
            {typing && (
              <div className="max-w-[85%] text-emerald-100">
                <div className="px-3 py-2 rounded bg-emerald-900/50 text-xs">{t("typing")}</div>
              </div>
            )}
          </div>

          {/* Message input + attachments */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <label className="text-xs text-slate-400">
              <span className="px-3 py-2 rounded bg-slate-800 cursor-pointer inline-block">{t("attach")}</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={onAttach}
              />
            </label>
            {selectedFileName && (
              <div className="text-xs text-slate-500">{t("selected_file", { file: selectedFileName })}</div>
            )}
            <div className="flex-1 flex gap-2">
              <input
                className="flex-1 rounded bg-slate-800 px-3 py-2 text-sm outline-none border border-slate-700"
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
              <button onClick={onSend} className="px-4 py-2 rounded bg-primary text-slate-900 text-sm font-medium">
                {t("send")}
              </button>
            </div>
          </div>

          {/* Escalation actions and status */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <button onClick={requestHuman} className="px-3 py-1.5 rounded bg-slate-800">{t("escalate")}</button>
            <span>{t("who_answers")} {channelStatus === "online" ? t("who_online") : channelStatus === "handover" ? t("who_handover") : t("who_offline")}</span>
            <span>{t("human_available")}</span>
          </div>

          {/* Useful links */}
          <div className="flex flex-wrap gap-2 text-xs">
            <a href="/help" className="px-3 py-1.5 rounded bg-slate-800">{t("links.help")}</a>
            <a href="/help" className="px-3 py-1.5 rounded bg-slate-800">{t("links.faq")}</a>
            <a href="/docs" className="px-3 py-1.5 rounded bg-slate-800">{t("links.articles")}</a>
            <a href="/pix" className="px-3 py-1.5 rounded bg-slate-800">{t("links.pix_status")}</a>
          </div>

          {/* Security and Privacy */}
          <div className="text-xs text-amber-300/90 bg-amber-900/20 border border-amber-800/50 rounded px-3 py-2">
            ⚠️ {t("privacy")} <a href="/docs" className="underline">{t("privacy_link")}</a>
          </div>

          {/* Service evaluation */}
          <div className="flex flex-col gap-2">
            <div className="text-xs text-slate-400">{t("feedback_title")}</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFeedback("up")}
                className={`px-2 py-1 rounded text-sm ${feedback === "up" ? "bg-primary text-black" : "bg-slate-800"}`}
              >👍</button>
              <button
                onClick={() => setFeedback("down")}
                className={`px-2 py-1 rounded text-sm ${feedback === "down" ? "bg-primary text-black" : "bg-slate-800"}`}
              >👎</button>
              {feedback && <span className="text-xs text-slate-400">{t("thanks")}</span>}
            </div>
            <input
              className="rounded bg-slate-800 px-3 py-2 text-xs outline-none border border-slate-700"
              placeholder={t("feedback_placeholder")}
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
            />
          </div>

          <div className="text-[10px] text-slate-500">{t("footnote")}</div>
        </CardContent>
      </Card>
    </div>
  );
}

