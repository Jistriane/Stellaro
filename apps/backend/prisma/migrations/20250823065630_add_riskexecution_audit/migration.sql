-- AlterTable
ALTER TABLE "RiskExecution" ADD COLUMN "contractId" TEXT;
ALTER TABLE "RiskExecution" ADD COLUMN "dryRun" BOOLEAN DEFAULT false;
ALTER TABLE "RiskExecution" ADD COLUMN "method" TEXT;
ALTER TABLE "RiskExecution" ADD COLUMN "network" TEXT;
ALTER TABLE "RiskExecution" ADD COLUMN "txHash" TEXT;
