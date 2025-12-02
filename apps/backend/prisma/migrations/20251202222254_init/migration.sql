-- CreateEnum
CREATE TYPE "public"."WebhookSource" AS ENUM ('celcoin', 'dock', 'sumsub');

-- CreateEnum
CREATE TYPE "public"."WebhookStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."KycStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."KycProvider" AS ENUM ('SUMSUB', 'MANUAL', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."AuditChannel" AS ENUM ('OFFCHAIN', 'ONCHAIN', 'BOTH');

-- CreateEnum
CREATE TYPE "public"."AuditLevel" AS ENUM ('INFO', 'WARN', 'ERROR', 'SECURITY');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Passkey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" BYTEA NOT NULL,
    "signCount" INTEGER NOT NULL DEFAULT 0,
    "transports" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Passkey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WebhookEvent" (
    "id" TEXT NOT NULL,
    "source" "public"."WebhookSource" NOT NULL,
    "eventId" TEXT NOT NULL,
    "signature" TEXT,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "status" "public"."WebhookStatus" NOT NULL DEFAULT 'RECEIVED',

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RiskEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RiskProposal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "actions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RiskExecution" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "proposalId" TEXT,
    "action" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "executed" BOOLEAN NOT NULL DEFAULT false,
    "txHash" TEXT,
    "contractId" TEXT,
    "method" TEXT,
    "network" TEXT,
    "dryRun" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."KycProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "public"."KycProvider" NOT NULL DEFAULT 'SUMSUB',
    "status" "public"."KycStatus" NOT NULL DEFAULT 'PENDING',
    "referenceId" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "channel" "public"."AuditChannel" NOT NULL DEFAULT 'OFFCHAIN',
    "level" "public"."AuditLevel" NOT NULL DEFAULT 'INFO',
    "action" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "metadata" JSONB,
    "network" TEXT,
    "contractId" TEXT,
    "method" TEXT,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OnchainEvent" (
    "id" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "topic0" TEXT,
    "topic1" TEXT,
    "topic2" TEXT,
    "topic3" TEXT,
    "payload" JSONB NOT NULL,
    "txHash" TEXT NOT NULL,
    "ledgerSeq" INTEGER NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnchainEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LedgerMirror" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerMirror_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DashboardSnapshot" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Passkey_credentialId_key" ON "public"."Passkey"("credentialId");

-- CreateIndex
CREATE INDEX "Passkey_userId_idx" ON "public"."Passkey"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_address_key" ON "public"."Wallet"("address");

-- CreateIndex
CREATE INDEX "Wallet_userId_idx" ON "public"."Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_eventId_key" ON "public"."WebhookEvent"("eventId");

-- CreateIndex
CREATE INDEX "WebhookEvent_source_eventId_idx" ON "public"."WebhookEvent"("source", "eventId");

-- CreateIndex
CREATE INDEX "RiskEvent_userId_type_createdAt_idx" ON "public"."RiskEvent"("userId", "type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RiskProposal_proposalId_key" ON "public"."RiskProposal"("proposalId");

-- CreateIndex
CREATE INDEX "RiskProposal_userId_createdAt_idx" ON "public"."RiskProposal"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "RiskExecution_userId_createdAt_idx" ON "public"."RiskExecution"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "KycProfile_userId_status_idx" ON "public"."KycProfile"("userId", "status");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "public"."AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_channel_level_createdAt_idx" ON "public"."AuditLog"("channel", "level", "createdAt");

-- CreateIndex
CREATE INDEX "OnchainEvent_network_contractId_ledgerSeq_idx" ON "public"."OnchainEvent"("network", "contractId", "ledgerSeq");

-- CreateIndex
CREATE INDEX "OnchainEvent_txHash_idx" ON "public"."OnchainEvent"("txHash");

-- CreateIndex
CREATE INDEX "LedgerMirror_scope_idx" ON "public"."LedgerMirror"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerMirror_scope_key_key" ON "public"."LedgerMirror"("scope", "key");

-- CreateIndex
CREATE INDEX "DashboardSnapshot_key_windowStart_windowEnd_idx" ON "public"."DashboardSnapshot"("key", "windowStart", "windowEnd");

-- AddForeignKey
ALTER TABLE "public"."Passkey" ADD CONSTRAINT "Passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KycProfile" ADD CONSTRAINT "KycProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
