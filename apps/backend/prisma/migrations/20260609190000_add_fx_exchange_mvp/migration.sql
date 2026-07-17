-- FX + Crypto Exchange MVP entities

-- Enums
CREATE TYPE "QuoteSide" AS ENUM ('BUY', 'SELL');
CREATE TYPE "QuoteSource" AS ENUM ('EXCHANGE_PARTNER', 'AGGREGATOR', 'OTC');
CREATE TYPE "OrderStatus" AS ENUM (
  'SUBMITTED',
  'ROUTED',
  'EXECUTING',
  'SETTLING',
  'SETTLED',
  'FAILED',
  'EXPIRED',
  'MANUAL_REVIEW',
  'CANCELLED'
);
CREATE TYPE "SettlementStatus" AS ENUM (
  'PENDING',
  'BROADCASTED',
  'CONFIRMED',
  'FAILED'
);
CREATE TYPE "LedgerDirection" AS ENUM ('DEBIT', 'CREDIT');
CREATE TYPE "TravelRuleStatus" AS ENUM (
  'NOT_REQUIRED',
  'PENDING',
  'CLEARED',
  'BLOCKED',
  'MANUAL_REVIEW'
);
CREATE TYPE "SupportThreadStatus" AS ENUM (
  'OPEN',
  'WAITING_USER',
  'ESCALATED',
  'RESOLVED'
);

-- Quotes
CREATE TABLE "Quote" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "pair" TEXT NOT NULL,
  "baseAsset" TEXT NOT NULL,
  "quoteAsset" TEXT NOT NULL,
  "side" "QuoteSide" NOT NULL,
  "amountIn" TEXT NOT NULL,
  "amountOut" TEXT NOT NULL,
  "rate" TEXT NOT NULL,
  "feeAmount" TEXT NOT NULL DEFAULT '0',
  "spreadBps" INTEGER NOT NULL DEFAULT 0,
  "source" "QuoteSource" NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- Orders
CREATE TABLE "ExchangeOrder" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "walletId" TEXT,
  "quoteId" TEXT NOT NULL,
  "pair" TEXT NOT NULL,
  "baseAsset" TEXT NOT NULL,
  "quoteAsset" TEXT NOT NULL,
  "side" "QuoteSide" NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'SUBMITTED',
  "route" "QuoteSource" NOT NULL,
  "providerOrderRef" TEXT,
  "amountIn" TEXT NOT NULL,
  "amountOut" TEXT,
  "platformFee" TEXT NOT NULL DEFAULT '0',
  "networkFee" TEXT NOT NULL DEFAULT '0',
  "slippageBps" INTEGER,
  "complianceBlockReason" TEXT,
  "metadata" JSONB,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "settledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExchangeOrder_pkey" PRIMARY KEY ("id")
);

-- Settlement
CREATE TABLE "Settlement" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "chain" TEXT NOT NULL,
  "asset" TEXT NOT NULL,
  "destinationAddress" TEXT NOT NULL,
  "txHash" TEXT,
  "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
  "confirmations" INTEGER NOT NULL DEFAULT 0,
  "broadcastedAt" TIMESTAMP(3),
  "confirmedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- Travel rule
CREATE TABLE "TravelRuleCheck" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "walletAddress" TEXT,
  "vaspCode" TEXT,
  "direction" TEXT NOT NULL,
  "asset" TEXT,
  "amount" TEXT,
  "status" "TravelRuleStatus" NOT NULL DEFAULT 'PENDING',
  "providerRef" TEXT,
  "reason" TEXT,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TravelRuleCheck_pkey" PRIMARY KEY ("id")
);

-- Fiat ledger
CREATE TABLE "LedgerEntry" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "referenceType" TEXT NOT NULL,
  "referenceId" TEXT NOT NULL,
  "currency" TEXT NOT NULL,
  "direction" "LedgerDirection" NOT NULL,
  "amount" TEXT NOT NULL,
  "description" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- Support
CREATE TABLE "SupportThread" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'elizaos',
  "status" "SupportThreadStatus" NOT NULL DEFAULT 'OPEN',
  "subject" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportThread_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportMessage" (
  "id" TEXT NOT NULL,
  "threadId" TEXT NOT NULL,
  "senderType" TEXT NOT NULL,
  "messageText" TEXT NOT NULL,
  "sources" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "Quote_userId_createdAt_idx" ON "Quote"("userId", "createdAt");
CREATE INDEX "Quote_pair_expiresAt_idx" ON "Quote"("pair", "expiresAt");

CREATE INDEX "ExchangeOrder_userId_createdAt_idx" ON "ExchangeOrder"("userId", "createdAt");
CREATE INDEX "ExchangeOrder_status_idx" ON "ExchangeOrder"("status");
CREATE INDEX "ExchangeOrder_quoteId_idx" ON "ExchangeOrder"("quoteId");

CREATE UNIQUE INDEX "Settlement_txHash_key" ON "Settlement"("txHash");
CREATE INDEX "Settlement_orderId_idx" ON "Settlement"("orderId");
CREATE INDEX "Settlement_status_idx" ON "Settlement"("status");

CREATE INDEX "TravelRuleCheck_userId_createdAt_idx" ON "TravelRuleCheck"("userId", "createdAt");
CREATE INDEX "TravelRuleCheck_status_idx" ON "TravelRuleCheck"("status");

CREATE INDEX "LedgerEntry_userId_createdAt_idx" ON "LedgerEntry"("userId", "createdAt");
CREATE INDEX "LedgerEntry_referenceType_referenceId_idx" ON "LedgerEntry"("referenceType", "referenceId");

CREATE INDEX "SupportThread_userId_createdAt_idx" ON "SupportThread"("userId", "createdAt");
CREATE INDEX "SupportMessage_threadId_createdAt_idx" ON "SupportMessage"("threadId", "createdAt");

-- Foreign keys
ALTER TABLE "Quote"
ADD CONSTRAINT "Quote_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExchangeOrder"
ADD CONSTRAINT "ExchangeOrder_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExchangeOrder"
ADD CONSTRAINT "ExchangeOrder_walletId_fkey"
FOREIGN KEY ("walletId") REFERENCES "Wallet"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ExchangeOrder"
ADD CONSTRAINT "ExchangeOrder_quoteId_fkey"
FOREIGN KEY ("quoteId") REFERENCES "Quote"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Settlement"
ADD CONSTRAINT "Settlement_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "ExchangeOrder"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TravelRuleCheck"
ADD CONSTRAINT "TravelRuleCheck_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LedgerEntry"
ADD CONSTRAINT "LedgerEntry_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupportThread"
ADD CONSTRAINT "SupportThread_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupportMessage"
ADD CONSTRAINT "SupportMessage_threadId_fkey"
FOREIGN KEY ("threadId") REFERENCES "SupportThread"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
