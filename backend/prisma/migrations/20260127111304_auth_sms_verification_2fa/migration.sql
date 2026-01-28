-- AlterTable
ALTER TABLE "User" ADD COLUMN "phoneVerifiedAt" DATETIME;

-- CreateTable
CREATE TABLE "UserVerification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TwoFactorAuth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TwoFactorAuth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuthOtp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purpose" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "tenantId" TEXT,
    "userId" TEXT,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" DATETIME NOT NULL,
    "consumedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SystemConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facebookAppId" TEXT,
    "facebookAppSecret" TEXT,
    "facebookVerifyToken" TEXT,
    "paytrMerchantId" TEXT,
    "paytrMerchantKey" TEXT,
    "paytrMerchantSalt" TEXT,
    "paytrIsActive" BOOLEAN NOT NULL DEFAULT false,
    "paytrTestMode" BOOLEAN NOT NULL DEFAULT true,
    "netgsmUsercode" TEXT,
    "netgsmPassword" TEXT,
    "netgsmMsgheader" TEXT,
    "netgsmIsActive" BOOLEAN NOT NULL DEFAULT false,
    "registrationSmsVerificationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SystemConfig" ("facebookAppId", "facebookAppSecret", "facebookVerifyToken", "id", "updatedAt") SELECT "facebookAppId", "facebookAppSecret", "facebookVerifyToken", "id", "updatedAt" FROM "SystemConfig";
DROP TABLE "SystemConfig";
ALTER TABLE "new_SystemConfig" RENAME TO "SystemConfig";
CREATE TABLE "new_Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "address" TEXT,
    "title" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "payrollCalculationStartDay" INTEGER DEFAULT 1,
    "payrollCalculationEndDay" INTEGER DEFAULT 30,
    "payrollPaymentDay" INTEGER DEFAULT 15,
    "payrollExpenseVisibilityDaysBefore" INTEGER DEFAULT 7,
    "payrollAutoGenerate" BOOLEAN NOT NULL DEFAULT true,
    "subscriptionPlan" TEXT DEFAULT 'STARTER',
    "subscriptionStatus" TEXT DEFAULT 'ACTIVE',
    "subscriptionEndsAt" DATETIME,
    "maxUsers" INTEGER DEFAULT 5,
    "maxStorage" INTEGER DEFAULT 1024,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "wordpressModuleEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Tenant" ("address", "autoRenew", "createdAt", "email", "id", "logoUrl", "maxStorage", "maxUsers", "name", "payrollAutoGenerate", "payrollCalculationEndDay", "payrollCalculationStartDay", "payrollExpenseVisibilityDaysBefore", "payrollPaymentDay", "phone", "slug", "subscriptionEndsAt", "subscriptionPlan", "subscriptionStatus", "title", "updatedAt", "wordpressModuleEnabled") SELECT "address", "autoRenew", "createdAt", "email", "id", "logoUrl", "maxStorage", "maxUsers", "name", "payrollAutoGenerate", "payrollCalculationEndDay", "payrollCalculationStartDay", "payrollExpenseVisibilityDaysBefore", "payrollPaymentDay", "phone", "slug", "subscriptionEndsAt", "subscriptionPlan", "subscriptionStatus", "title", "updatedAt", "wordpressModuleEnabled" FROM "Tenant";
DROP TABLE "Tenant";
ALTER TABLE "new_Tenant" RENAME TO "Tenant";
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "UserVerification_token_key" ON "UserVerification"("token");

-- CreateIndex
CREATE INDEX "UserVerification_userId_purpose_idx" ON "UserVerification"("userId", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorAuth_token_key" ON "TwoFactorAuth"("token");

-- CreateIndex
CREATE INDEX "TwoFactorAuth_userId_idx" ON "TwoFactorAuth"("userId");

-- CreateIndex
CREATE INDEX "AuthOtp_purpose_expiresAt_idx" ON "AuthOtp"("purpose", "expiresAt");

-- CreateIndex
CREATE INDEX "AuthOtp_tenantId_userId_idx" ON "AuthOtp"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "AuthOtp_email_idx" ON "AuthOtp"("email");

-- CreateIndex
CREATE INDEX "AuthOtp_phone_idx" ON "AuthOtp"("phone");
