"use client";

import Image from "next/image";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import {
  Code,
  Copy,
  Check,
  ExternalLink,
  Zap,
  Wallet,
  DollarSign,
  TrendingUp,
  Lock,
  Vote,
} from "lucide-react";

interface CodeExample {
  id: string;
  title: string;
  description: string;
  category: string;
  language: string;
  code: string;
  icon: React.ReactNode;
}

export default function ExamplesPage() {
  const t = useTranslations("examples");
  const [activeCategory, setActiveCategory] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const examples: CodeExample[] = [
    {
      id: "ex-1",
      title: "Connect Wallet",
      description: "Example of how to connect a Web3 wallet to Stellaro",
      category: "wallet",
      language: "typescript",
      icon: <Wallet className="w-6 h-6" />,
      code: `import { useAccount, useConnect } from 'wagmi'

export function ConnectWallet() {
  const { address } = useAccount()
  const { connect, connectors } = useConnect()

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/85 to-background/60" />
      <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_20%_15%,rgba(var(--stellaro-accent-rgb),0.14),transparent_60%),radial-gradient(900px_circle_at_80%_10%,rgba(197,135,230,0.10),transparent_55%)]" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <div>
      {address ? (
        <p>Connected: {address}</p>
      ) : (
        <button onClick={() => connect({ connector: connectors[0] })}>
          Connect Wallet
        </button>
      )}
    </div>
  )
}`,
    },
    {
      id: "ex-2",
      title: "Execute Transaction",
      description: "Example of executing a simple transaction",
      category: "trading",
      language: "typescript",
      icon: <TrendingUp className="w-6 h-6" />,
      code: `import { useSendTransaction } from 'wagmi'

export function SendTransaction() {
  const { sendTransaction } = useSendTransaction()

  const handleSend = async () => {
    await sendTransaction({
      to: '0x...',
      value: '1000000000000000000', // 1 token
      data: '0x',
    })
  }

  return <button onClick={handleSend}>Send Transaction</button>
}`,
    },
    {
      id: "ex-3",
      title: "Call Contract Function",
      description: "Example of calling a smart contract function",
      category: "defi",
      language: "typescript",
      icon: <Code className="w-6 h-6" />,
      code: `import { useContractWrite } from 'wagmi'
import { contractABI } from './abi'

export function DepositToken() {
  const { write } = useContractWrite({
    address: '0x...',
    abi: contractABI,
    functionName: 'deposit',
  })

  return (
    <button onClick={() => write({ args: ['100'] })}>
      Deposit 100 Tokens
    </button>
  )
}`,
    },
    {
      id: "ex-4",
      title: "Read Contract Data",
      description: "Example of reading smart contract data",
      category: "defi",
      language: "typescript",
      icon: <Lock className="w-6 h-6" />,
      code: `import { useContractRead } from 'wagmi'
import { contractABI } from './abi'

export function GetBalance() {
  const { data: balance } = useContractRead({
    address: '0x...',
    abi: contractABI,
    functionName: 'balanceOf',
    args: ['0x...'],
  })

  return <p>Balance: {balance?.toString()}</p>
}`,
    },
    {
      id: "ex-5",
      title: "Request Loan",
      description: "Example of a loan request with collateral",
      category: "loans",
      language: "typescript",
      icon: <DollarSign className="w-6 h-6" />,
      code: `import { useContractWrite } from 'wagmi'

export function RequestLoan() {
  const { write } = useContractWrite({
    address: LOANS_CONTRACT,
    abi: loansABI,
    functionName: 'requestLoan',
  })

  const handleRequest = () => {
    write({
      args: [
        '1000000000000000000', // 1 token
        '2000000000000000000', // collateral
        86400 * 30, // 30 days
      ],
    })
  }

  return <button onClick={handleRequest}>Request Loan</button>
}`,
    },
    {
      id: "ex-6",
      title: "Participate in Voting",
      description: "Example of voting on a governance proposal",
      category: "governance",
      language: "typescript",
      icon: <Vote className="w-6 h-6" />,
      code: `import { useContractWrite } from 'wagmi'

export function VoteOnProposal() {
  const { write } = useContractWrite({
    address: GOVERNANCE_CONTRACT,
    abi: governanceABI,
    functionName: 'vote',
  })

  const handleVote = (support: boolean) => {
    write({
      args: [42, support ? 1 : 0],
    })
  }

  return (
    <div>
      <button onClick={() => handleVote(true)}>Vote Yes</button>
      <button onClick={() => handleVote(false)}>Vote No</button>
    </div>
  )
}`,
    },
    {
      id: "ex-7",
      title: "Monitor Events",
      description: "Example of listening to contract events",
      category: "defi",
      language: "typescript",
      icon: <Zap className="w-6 h-6" />,
      code: `import { useEffect } from 'react'
import { ethers } from 'ethers'

export function MonitorEvents() {
  useEffect(() => {
    const provider = new ethers.providers.WebSocketProvider(RPC_URL)
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider)

    contract.on('Transfer', (from, to, value) => {
      console.log('Transfer:', { from, to, value })
    })

    return () => contract.removeAllListeners()
  }, [])

  return <p>Monitoring events...</p>
}`,
    },
    {
      id: "ex-8",
      title: "Calculate Yield",
      description: "Example of APY calculation",
      category: "trading",
      language: "typescript",
      icon: <TrendingUp className="w-6 h-6" />,
      code: `export function CalculateAPY() {
  const calculateAPY = (
    principal: number,
    interest: number,
    period: number
  ) => {
    return ((interest / principal) / period) * 365 * 100
  }

  const apy = calculateAPY(1000, 50, 30)

  return (
    <div>
      <p>APY: {apy.toFixed(2)}%</p>
      <p>Estimated annual return: {(apy * 10).toFixed(2)}</p>
    </div>
  )
}`,
    },
  ];

  const filteredExamples =
    activeCategory === "all"
      ? examples
      : examples.filter((ex) => ex.category === activeCategory);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const categoryLabels: Record<string, string> = {
    all: "All",
    wallet: "Wallet",
    trading: "Trading",
    defi: "DeFi",
    loans: "Loans",
    governance: "Governance",
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/85 to-background/60" />
      <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_20%_15%,rgba(var(--stellaro-accent-rgb),0.14),transparent_60%),radial-gradient(900px_circle_at_80%_10%,rgba(197,135,230,0.10),transparent_55%)]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="space-y-4 mb-12">
          <h1 className="text-4xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground text-lg">{t("subtitle")}</p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Code className="w-4 h-4" />
                {t("ready_to_use")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("ready_to_use_desc")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ExternalLink className="w-4 h-4" />
                {t("copy_paste")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("copy_paste_desc")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="w-4 h-4" />
                {t("multiple_langs")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("multiple_langs_desc")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex gap-2 flex-wrap">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <Button
                key={key}
                variant={activeCategory === key ? "default" : "outline"}
                onClick={() => setActiveCategory(key)}
                size="sm"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Code Examples Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredExamples.map((example) => (
            <Card key={example.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-secondary/30 border border-border/60">
                    {example.icon}
                  </div>
                  <span className="text-xs font-mono px-2 py-1 rounded bg-secondary text-muted-foreground">
                    {example.language}
                  </span>
                </div>
                <CardTitle className="text-lg">{example.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  {example.description}
                </p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="bg-secondary/20 border border-border/60 rounded-lg p-4 mb-4 overflow-x-auto flex-1">
                  <pre className="text-xs text-muted-foreground font-mono leading-relaxed">
                    <code>{example.code}</code>
                  </pre>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(example.code, example.id)}
                  className="w-full"
                >
                  {copiedId === example.id ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Code
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Resources */}
        <div className="mt-12 p-6 rounded-lg bg-card/50 border border-border/60">
          <h2 className="text-xl font-bold mb-4">{t("resources.title")}</h2>
          <p className="text-muted-foreground mb-4">
            {t("resources.description")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              GitHub Repository
            </Button>
            <Button variant="outline" className="w-full">
              <Code className="w-4 h-4 mr-2" />
              API Reference
            </Button>
            <Button variant="outline" className="w-full">
              <Zap className="w-4 h-4 mr-2" />
              Starter Kit
            </Button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
