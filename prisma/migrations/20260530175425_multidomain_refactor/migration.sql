/*
  Warnings:

  - You are about to drop the column `bhkType` on the `contacts` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DomainVertical" AS ENUM ('INTERIOR_DESIGN', 'REAL_ESTATE', 'CONSTRUCTION', 'PRODUCT_SALES', 'FINANCIAL_SERVICES', 'HEALTHCARE', 'EDUCATION', 'CUSTOM', 'GENERIC');

-- AlterTable
ALTER TABLE "contacts" DROP COLUMN "bhkType",
ADD COLUMN     "domainQualifier" TEXT;

-- AlterTable
ALTER TABLE "skill_packs" ADD COLUMN     "defaultPromptVars" JSONB,
ADD COLUMN     "extractionSchema" JSONB,
ADD COLUMN     "qualitySignals" JSONB;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "vertical" "DomainVertical" NOT NULL DEFAULT 'GENERIC';
