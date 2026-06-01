"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  const t = useTranslations("notifications");

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/92 to-background/75" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">{t("title")}</h1>
              <p className="text-muted-foreground">{t("subtitle")}</p>
            </div>
            <Bell className="w-8 h-8 text-muted-foreground" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Para evitar dados simulados, esta tela depende de um backend que persista e liste notificações reais.
                No estado atual, o backend expõe apenas envio avulso (`POST /notifications/send`), sem histórico/listagem.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
