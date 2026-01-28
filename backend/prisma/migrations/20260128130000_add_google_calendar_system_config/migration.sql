-- AlterTable
ALTER TABLE "SystemConfig" ADD COLUMN "googleOAuthClientId" TEXT;
ALTER TABLE "SystemConfig" ADD COLUMN "googleOAuthClientSecret" TEXT;
ALTER TABLE "SystemConfig" ADD COLUMN "googleOAuthRedirectUri" TEXT;
ALTER TABLE "SystemConfig" ADD COLUMN "googleCalendarIsActive" BOOLEAN NOT NULL DEFAULT false;
