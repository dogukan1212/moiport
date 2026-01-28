/*
  Warnings:

  - You are about to alter the column `maxStorage` on the `Tenant` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.

*/
-- CreateTable
CREATE TABLE "StorageFolder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StorageFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "StorageFolder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StorageFolder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StorageFolder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StorageFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "path" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'LOCAL',
    "folderId" TEXT,
    "tenantId" TEXT NOT NULL,
    "uploaderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StorageFile_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "StorageFolder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StorageFile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StorageFile_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "maxStorage" BIGINT DEFAULT 536870912000,
    "storageUsed" BIGINT NOT NULL DEFAULT 0,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "wordpressModuleEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Tenant" ("address", "autoRenew", "createdAt", "email", "id", "logoUrl", "maxStorage", "maxUsers", "name", "payrollAutoGenerate", "payrollCalculationEndDay", "payrollCalculationStartDay", "payrollExpenseVisibilityDaysBefore", "payrollPaymentDay", "phone", "slug", "subscriptionEndsAt", "subscriptionPlan", "subscriptionStatus", "title", "twoFactorEnabled", "updatedAt", "wordpressModuleEnabled") SELECT "address", "autoRenew", "createdAt", "email", "id", "logoUrl", "maxStorage", "maxUsers", "name", "payrollAutoGenerate", "payrollCalculationEndDay", "payrollCalculationStartDay", "payrollExpenseVisibilityDaysBefore", "payrollPaymentDay", "phone", "slug", "subscriptionEndsAt", "subscriptionPlan", "subscriptionStatus", "title", "twoFactorEnabled", "updatedAt", "wordpressModuleEnabled" FROM "Tenant";
DROP TABLE "Tenant";
ALTER TABLE "new_Tenant" RENAME TO "Tenant";
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "StorageFolder_tenantId_parentId_idx" ON "StorageFolder"("tenantId", "parentId");

-- CreateIndex
CREATE INDEX "StorageFolder_tenantId_customerId_idx" ON "StorageFolder"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "StorageFile_tenantId_folderId_idx" ON "StorageFile"("tenantId", "folderId");
