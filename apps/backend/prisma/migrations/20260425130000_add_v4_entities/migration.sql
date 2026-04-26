-- CreateTable
CREATE TABLE "public"."RwaAsset" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assetClass" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "whitelistRequired" BOOLEAN NOT NULL DEFAULT true,
    "annualYieldBps" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RwaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SsiCredential" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "disclosure" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SsiCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cadence" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DaoProposal" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "quorumBps" INTEGER NOT NULL,
    "timelockHours" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DaoProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RwaAsset_publicId_key" ON "public"."RwaAsset"("publicId");

-- CreateIndex
CREATE INDEX "RwaAsset_status_assetClass_idx" ON "public"."RwaAsset"("status", "assetClass");

-- CreateIndex
CREATE INDEX "RwaAsset_createdAt_idx" ON "public"."RwaAsset"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SsiCredential_publicId_key" ON "public"."SsiCredential"("publicId");

-- CreateIndex
CREATE INDEX "SsiCredential_status_type_idx" ON "public"."SsiCredential"("status", "type");

-- CreateIndex
CREATE INDEX "SsiCredential_createdAt_idx" ON "public"."SsiCredential"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_publicId_key" ON "public"."SubscriptionPlan"("publicId");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_status_cadence_idx" ON "public"."SubscriptionPlan"("status", "cadence");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_createdAt_idx" ON "public"."SubscriptionPlan"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DaoProposal_publicId_key" ON "public"."DaoProposal"("publicId");

-- CreateIndex
CREATE INDEX "DaoProposal_status_idx" ON "public"."DaoProposal"("status");

-- CreateIndex
CREATE INDEX "DaoProposal_createdAt_idx" ON "public"."DaoProposal"("createdAt");
