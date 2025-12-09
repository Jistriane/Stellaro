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
          title: "What is Stellaro?",
          preview:
            "Stellaro is a DeFi credit infrastructure on the Stellar network with financing offers, risk management, and tokenized wallet operations.",
        },
        {
          id: "setup",
          title: "Set Up Your Account",
          preview:
            "Learn how to create an account, connect your wallet, and complete KYC verification.",
        },
        {
          id: "dashboard",
          title: "Understanding the Dashboard",
          preview:
            "Complete guide on how to navigate and use the application's main dashboard.",
        },
      ],
    },
    {
      id: "wallets",
      icon: <Wallet className="w-5 h-5" />,
      title: t("sections.wallets"),
      description: "Manage your wallets and digital assets",
      articles: [
        {
          id: "connect",
          title: "Connect Wallet",
          preview: "How to connect different wallet types to Stellaro.",
        },
        {
          id: "assets",
          title: "Manage Assets",
          preview: "Add, remove, and track your digital assets.",
        },
        {
          id: "transactions",
          title: "Transaction History",
          preview: "How to view and export your transaction history.",
        },
      ],
    },
    {
      id: "loans",
      icon: <DollarSign className="w-5 h-5" />,
      title: t("sections.loans"),
      description: "Request loans and manage collateral",
      articles: [
        {
          id: "request",
          title: "Request a Loan",
          preview:
            "Step-by-step guide to request a loan with collateral.",
        },
        {
          id: "collateral",
          title: "Manage Collateral",
          preview: "How to add, withdraw, and monitor your collateral.",
        },
        {
          id: "repayment",
          title: "Loan Repayments",
          preview: "Payment schedule and repayment options.",
        },
      ],
    },
    {
      id: "trading",
      icon: <TrendingUp className="w-5 h-5" />,
      title: t("sections.trading"),
      description: "Trade and execute liquidity strategies",
      articles: [
        {
          id: "spot",
          title: "Spot Trading",
          preview: "Execute buy and sell orders.",
        },
        {
          id: "pools",
          title: "Liquidity Pools",
          preview:
            "How to provide liquidity and earn fees in DeFi pools.",
        },
        {
          id: "orders",
          title: "Manage Orders",
          preview: "Create, monitor, and cancel your trading orders.",
        },
      ],
    },
    {
      id: "governance",
      icon: <Vote className="w-5 h-5" />,
      title: t("sections.governance"),
      description: "Participate in protocol governance",
      articles: [
        {
          id: "voting",
          title: "How to Vote",
          preview:
            "Take part in DAO decisions by voting on key proposals.",
        },
        {
          id: "proposals",
          title: "Create Proposals",
          preview:
            "Suggestions for improvements and changes to the Stellaro protocol.",
        },
        {
          id: "rewards",
          title: "Governance Rewards",
          preview: "Earn tokens by actively participating in governance.",
        },
      ],
    },
    {
      id: "security",
      icon: <Lock className="w-5 h-5" />,
      title: t("sections.security"),
      description: "Protect your account and assets",
      articles: [
        {
          id: "2fa",
          title: "Two-Factor Authentication",
          preview: "Set up 2FA to protect your account with an extra layer.",
        },
        {
          id: "kyc",
          title: "KYC Verification",
          preview:
            "How to complete Know Your Customer identity verification.",
        },
        {
          id: "best_practices",
          title: "Security Best Practices",
          preview:
            "Essential tips to keep your assets safe on Stellaro.",
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
                        Read More →
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
                View API Docs
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
                Open FAQ
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="w-4 h-4" />
                Quick Guides
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Step-by-step tutorials for common tasks
              </p>
              <Button variant="outline" size="sm">
                Explore
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
                Articles and updates about Stellaro
              </p>
              <Button variant="outline" size="sm">
                Read Blog
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
