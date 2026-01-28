-- AlterTable
ALTER TABLE "SystemConfig" ADD COLUMN "smtp2goUsername" TEXT;
ALTER TABLE "SystemConfig" ADD COLUMN "smtp2goPassword" TEXT;
ALTER TABLE "SystemConfig" ADD COLUMN "smtp2goFromEmail" TEXT;
ALTER TABLE "SystemConfig" ADD COLUMN "smtp2goFromName" TEXT;
ALTER TABLE "SystemConfig" ADD COLUMN "smtp2goIsActive" BOOLEAN NOT NULL DEFAULT false;

