/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,periodStart]` on the table `tenant_usage` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "call_logs" ADD COLUMN     "qaScore" JSONB;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardingStep" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "vapiAssistantId" TEXT,
ADD COLUMN     "vapiPhoneNumber" TEXT,
ALTER COLUMN "vertical" SET DEFAULT 'CUSTOM';

-- CreateIndex
CREATE UNIQUE INDEX "tenant_usage_tenantId_periodStart_key" ON "tenant_usage"("tenantId", "periodStart");
