"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Zap,
  HelpCircle,
  Code,
  Wallet,
  DollarSign,
  TrendingUp,
  Vote,
  Lock,
} from "lucide-react";

interface DocSection {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  articles: { id: string; title: string; preview: string }[];
}

export default function DocsPage() {
  const t = useTranslations("docs");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("getting_started");

  const sections: DocSection[] = [
    {
      id: "getting_started",
      icon: <BookOpen className="w-5 h-5" />,
      title: t("getting_started.title"),
      description: t("getting_started.description"),
      articles: [
        {
          id: "intro",
          title: "O que é Stellaro?",
          preview:
            "Stellaro é uma infraestrutura de crédito DeFi na rede Stellar com ofertas de financiamento, gestão de risco e operação de carteiras tokenizadas.",
        },
        {
          id: "setup",
          title: "Configurar Sua Conta",
          preview:
            "Aprenda como criar uma conta, conectar sua carteira e completar a verificação KYC.",
        },
        {
          id: "dashboard",
          title: "Entendendo o Dashboard",
          preview:
            "Guia completo sobre como navegador e usar o painel principal da aplicação.",
        },
      ],
    },
    {
      id: "wallets",
      icon: <Wallet className="w-5 h-5" />,
      title: t("sections.wallets"),
      description: "Gerencie suas carteiras e ativos digitais",
      articles: [
        {
          id: "connect",
          title: "Conectar Carteira",
          preview: "Como conectar diferentes tipos de carteiras ao Stellaro.",
        },
        {
          id: "assets",
          title: "Gerenciar Ativos",
          preview: "Adicione, remova e rastreie seus ativos digitais.",
        },
        {
          id: "transactions",
          title: "Histórico de Transações",
          preview: "Como visualizar e exportar seu histórico de transações.",
        },
      ],
    },
    {
      id: "loans",
      icon: <DollarSign className="w-5 h-5" />,
      title: t("sections.loans"),
      description: "Solicite empréstimos e gerencie colateral",
      articles: [
        {
          id: "request",
          title: "Solicitar Empréstimo",
          preview:
            "Passo a passo para solicitar um empréstimo com garantia de colateral.",
        },
        {
          id: "collateral",
          title: "Gerenciar Colateral",
          preview: "Como adicionar, retirar e monitorar seu colateral.",
        },
        {
          id: "repayment",
          title: "Pagamento de Empréstimos",
          preview: "Calendário de pagamento e opções de reembolso.",
        },
      ],
    },
    {
      id: "trading",
      icon: <TrendingUp className="w-5 h-5" />,
      title: t("sections.trading"),
      description: "Faça trading e execute estratégias de liquidez",
      articles: [
        {
          id: "spot",
          title: "Trading Spot",
          preview: "Realize operações de compra e venda de ativos.",
        },
        {
          id: "pools",
          title: "Pools de Liquidez",
          preview:
            "Como fornecer liquidez e ganhar comissões nas pools DeFi.",
        },
        {
          id: "orders",
          title: "Gerenciar Ordens",
          preview: "Crie, monitore e cancele suas ordens de trading.",
        },
      ],
    },
    {
      id: "governance",
      icon: <Vote className="w-5 h-5" />,
      title: t("sections.governance"),
      description: "Participe da governança do protocolo",
      articles: [
        {
          id: "voting",
          title: "Como Votar",
          preview:
            "Participe das decisões da DAO votando em propostas importantes.",
        },
        {
          id: "proposals",
          title: "Criar Propostas",
          preview:
            "Sugestões para melhorias e mudanças no protocolo Stellaro.",
        },
        {
          id: "rewards",
          title: "Recompensas de Governança",
          preview: "Ganhe tokens por participar ativamente da governança.",
        },
      ],
    },
    {
      id: "security",
      icon: <Lock className="w-5 h-5" />,
      title: t("sections.security"),
      description: "Proteja sua conta e seus ativos",
      articles: [
        {
          id: "2fa",
          title: "Autenticação de Dois Fatores",
          preview: "Configure 2FA para proteger sua conta com um nível extra.",
        },
        {
          id: "kyc",
          title: "Verificação KYC",
          preview:
            "Como completar a verificação de identidade Know Your Customer.",
        },
        {
          id: "best_practices",
          title: "Melhores Práticas de Segurança",
          preview:
            "Dicas essenciais para manter seus ativos seguros no Stellaro.",
        },
      ],
    },
  ];

  const activeDoc = sections.find((s) => s.id === activeSection);
  const filteredArticles = activeDoc?.articles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="space-y-4 mb-8">
          <h1 className="text-4xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground text-lg">{t("subtitle")}</p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <Input
            placeholder={t("search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {sections.map((section) => (
            <Button
              key={section.id}
              variant={activeSection === section.id ? "default" : "outline"}
              onClick={() => setActiveSection(section.id)}
              className="h-auto py-4 flex flex-col items-center gap-2"
            >
              {section.icon}
              <span className="text-xs text-center font-medium">
                {section.title}
              </span>
            </Button>
          ))}
        </div>

        {/* Content Area */}
        {activeDoc && (
          <div className="space-y-6">
            {/* Section Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-secondary">
                    {activeDoc.icon}
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{activeDoc.title}</CardTitle>
                    <p className="text-muted-foreground mt-1">
                      {activeDoc.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Articles Grid */}
            {filteredArticles && filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredArticles.map((article) => (
                  <Card
                    key={article.id}
                    className="hover:border-primary cursor-pointer transition-colors"
                  >
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-2">{article.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {article.preview}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-500 hover:text-blue-600"
                      >
                        Ler Mais →
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t("no_results")}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Code className="w-4 h-4" />
                {t("api.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t("api.description")}
              </p>
              <Button variant="outline" size="sm">
                Ver API Docs
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <HelpCircle className="w-4 h-4" />
                {t("faq.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t("faq.description")}
              </p>
              <Button variant="outline" size="sm">
                Acessar FAQ
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="w-4 h-4" />
                Guias Rápidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Tutoriais passo a passo para tarefas comuns
              </p>
              <Button variant="outline" size="sm">
                Explorar
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="w-4 h-4" />
                Blog
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Artigos e atualizações sobre Stellaro
              </p>
              <Button variant="outline" size="sm">
                Ler Blog
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
