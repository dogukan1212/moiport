-- AlterTable
ALTER TABLE "FacebookLeadMapping" ADD COLUMN "defaultAssigneeId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "allowedModules" TEXT;

-- CreateTable
CREATE TABLE "WordpressSite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT,
    "siteUrl" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" DATETIME,
    "siteAnalysis" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WordpressSite_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WordpressSite_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaytrConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "merchantId" TEXT,
    "merchantKey" TEXT,
    "merchantSalt" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaytrConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPrice" REAL NOT NULL,
    "yearlyPrice" REAL,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "maxUsers" INTEGER,
    "maxStorage" INTEGER,
    "features" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'PAYTR',
    "paytrUserId" TEXT,
    "paytrCardToken" TEXT,
    "last4" TEXT,
    "brand" TEXT,
    "expiry" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentMethod_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubscriptionPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "planCode" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "period" TEXT NOT NULL DEFAULT 'MONTHLY',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'PAYTR',
    "providerToken" TEXT,
    "providerReference" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" DATETIME,
    CONSTRAINT "SubscriptionPayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "score" INTEGER NOT NULL DEFAULT 0,
    "value" REAL DEFAULT 0,
    "isWhatsappArchived" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "pipelineId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "facebookFormId" TEXT,
    "customerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Lead_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Lead_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Lead" ("company", "createdAt", "customerId", "email", "facebookFormId", "id", "name", "phone", "pipelineId", "score", "source", "stageId", "status", "tenantId", "updatedAt", "value") SELECT "company", "createdAt", "customerId", "email", "facebookFormId", "id", "name", "phone", "pipelineId", "score", "source", "stageId", "status", "tenantId", "updatedAt", "value" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
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
    "wordpressModuleEnabled" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Tenant" ("address", "createdAt", "email", "id", "logoUrl", "maxStorage", "maxUsers", "name", "payrollAutoGenerate", "payrollCalculationEndDay", "payrollCalculationStartDay", "payrollExpenseVisibilityDaysBefore", "payrollPaymentDay", "phone", "slug", "subscriptionEndsAt", "subscriptionPlan", "subscriptionStatus", "title", "updatedAt") SELECT "address", "createdAt", "email", "id", "logoUrl", "maxStorage", "maxUsers", "name", "payrollAutoGenerate", "payrollCalculationEndDay", "payrollCalculationStartDay", "payrollExpenseVisibilityDaysBefore", "payrollPaymentDay", "phone", "slug", "subscriptionEndsAt", "subscriptionPlan", "subscriptionStatus", "title", "updatedAt" FROM "Tenant";
DROP TABLE "Tenant";
ALTER TABLE "new_Tenant" RENAME TO "Tenant";
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
CREATE TABLE "new_WhatsappConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT,
    "phoneNumberId" TEXT,
    "accessToken" TEXT,
    "apiVersion" TEXT DEFAULT 'v21.0',
    "provider" TEXT NOT NULL DEFAULT 'meta',
    "twilioAccountSid" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoReplyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoReplyTemplates" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WhatsappConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WhatsappConfig_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WhatsappConfig" ("accessToken", "apiVersion", "customerId", "id", "isActive", "phoneNumberId", "provider", "tenantId", "twilioAccountSid", "updatedAt") SELECT "accessToken", "apiVersion", "customerId", "id", "isActive", "phoneNumberId", "provider", "tenantId", "twilioAccountSid", "updatedAt" FROM "WhatsappConfig";
DROP TABLE "WhatsappConfig";
ALTER TABLE "new_WhatsappConfig" RENAME TO "WhatsappConfig";
CREATE TABLE "new_WordpressPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "wpPostId" INTEGER NOT NULL,
    "postUrl" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "status" TEXT NOT NULL,
    "tags" TEXT,
    "categories" TEXT,
    "featuredImageUrl" TEXT,
    "scheduledAt" DATETIME,
    "publishedAt" DATETIME,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WordpressPost_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WordpressPost_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "WordpressSite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WordpressPost" ("categories", "content", "createdAt", "deletedAt", "featuredImageUrl", "id", "postUrl", "publishedAt", "scheduledAt", "siteId", "status", "tags", "tenantId", "title", "updatedAt", "wpPostId") SELECT "categories", "content", "createdAt", "deletedAt", "featuredImageUrl", "id", "postUrl", "publishedAt", "scheduledAt", "siteId", "status", "tags", "tenantId", "title", "updatedAt", "wpPostId" FROM "WordpressPost";
DROP TABLE "WordpressPost";
ALTER TABLE "new_WordpressPost" RENAME TO "WordpressPost";
CREATE INDEX "WordpressPost_tenantId_siteId_idx" ON "WordpressPost"("tenantId", "siteId");
CREATE UNIQUE INDEX "WordpressPost_siteId_wpPostId_key" ON "WordpressPost"("siteId", "wpPostId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PaytrConfig_tenantId_key" ON "PaytrConfig"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");
