-- CreateTable
CREATE TABLE "KycProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'SUMSUB',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "referenceId" TEXT,
    "data" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KycProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'OFFCHAIN',
    "level" TEXT NOT NULL DEFAULT 'INFO',
    "action" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "metadata" JSONB,
    "network" TEXT,
    "contractId" TEXT,
    "method" TEXT,
    "txHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OnchainEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "network" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "topic0" TEXT,
    "topic1" TEXT,
    "topic2" TEXT,
    "topic3" TEXT,
    "payload" JSONB NOT NULL,
    "txHash" TEXT NOT NULL,
    "ledgerSeq" INTEGER NOT NULL,
    "ts" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LedgerMirror" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DashboardSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "windowStart" DATETIME NOT NULL,
    "windowEnd" DATETIME NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "KycProfile_userId_status_idx" ON "KycProfile"("userId", "status");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_channel_level_createdAt_idx" ON "AuditLog"("channel", "level", "createdAt");

-- CreateIndex
CREATE INDEX "OnchainEvent_network_contractId_ledgerSeq_idx" ON "OnchainEvent"("network", "contractId", "ledgerSeq");

-- CreateIndex
CREATE INDEX "OnchainEvent_txHash_idx" ON "OnchainEvent"("txHash");

-- CreateIndex
CREATE INDEX "LedgerMirror_scope_idx" ON "LedgerMirror"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerMirror_scope_key_key" ON "LedgerMirror"("scope", "key");

-- CreateIndex
CREATE INDEX "DashboardSnapshot_key_windowStart_windowEnd_idx" ON "DashboardSnapshot"("key", "windowStart", "windowEnd");
