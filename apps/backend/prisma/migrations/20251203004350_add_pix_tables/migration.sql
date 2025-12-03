-- CreateTable
CREATE TABLE "public"."PixPayment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "txId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stellarAddress" TEXT NOT NULL,
    "qrCode" TEXT,
    "pixKey" TEXT,
    "status" TEXT NOT NULL,
    "mintTxHash" TEXT,
    "expiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "mintedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PixPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PixWithdrawal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "pixKey" TEXT NOT NULL,
    "pixKeyType" TEXT NOT NULL,
    "stellarAddress" TEXT NOT NULL,
    "burnTxHash" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PixWithdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PixPayment_txId_key" ON "public"."PixPayment"("txId");

-- CreateIndex
CREATE INDEX "PixPayment_userId_idx" ON "public"."PixPayment"("userId");

-- CreateIndex
CREATE INDEX "PixPayment_status_idx" ON "public"."PixPayment"("status");

-- CreateIndex
CREATE INDEX "PixPayment_createdAt_idx" ON "public"."PixPayment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PixWithdrawal_transferId_key" ON "public"."PixWithdrawal"("transferId");

-- CreateIndex
CREATE INDEX "PixWithdrawal_userId_idx" ON "public"."PixWithdrawal"("userId");

-- CreateIndex
CREATE INDEX "PixWithdrawal_status_idx" ON "public"."PixWithdrawal"("status");

-- CreateIndex
CREATE INDEX "PixWithdrawal_createdAt_idx" ON "public"."PixWithdrawal"("createdAt");
