-- CreateTable
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "level" TEXT NOT NULL DEFAULT 'INFO',
    "source" TEXT NOT NULL DEFAULT 'SYSTEM',
    "message" TEXT NOT NULL,
    "details" TEXT,
    "tenantId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FacebookConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT,
    "accessToken" TEXT,
    "userAccessToken" TEXT,
    "pageId" TEXT,
    "pageName" TEXT,
    "instagramBusinessAccountId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FacebookConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FacebookConfig_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FacebookConfig" ("accessToken", "id", "instagramBusinessAccountId", "isActive", "pageId", "pageName", "tenantId", "updatedAt", "userAccessToken") SELECT "accessToken", "id", "instagramBusinessAccountId", "isActive", "pageId", "pageName", "tenantId", "updatedAt", "userAccessToken" FROM "FacebookConfig";
DROP TABLE "FacebookConfig";
ALTER TABLE "new_FacebookConfig" RENAME TO "FacebookConfig";
CREATE TABLE "new_Pipeline" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pipeline_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pipeline_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Pipeline" ("createdAt", "id", "name", "tenantId", "updatedAt") SELECT "createdAt", "id", "name", "tenantId", "updatedAt" FROM "Pipeline";
DROP TABLE "Pipeline";
ALTER TABLE "new_Pipeline" RENAME TO "Pipeline";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT,
    "salary" REAL DEFAULT 0,
    "iban" TEXT,
    "phone" TEXT,
    "startDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tckn" TEXT,
    "address" TEXT,
    "birthDate" DATETIME,
    "jobTitle" TEXT,
    "department" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "bankName" TEXT,
    "bankBranch" TEXT,
    "bankAccountNumber" TEXT,
    "maritalStatus" TEXT,
    "childrenCount" INTEGER,
    "bloodType" TEXT,
    "educationLevel" TEXT,
    "contractType" TEXT,
    "socialSecurityNumber" TEXT,
    "taxNumber" TEXT,
    "weeklyHours" INTEGER,
    "probationMonths" INTEGER,
    "confidentialityYears" INTEGER,
    "nonCompeteMonths" INTEGER,
    "penaltyAmount" REAL,
    "equipmentList" TEXT,
    "benefits" TEXT,
    "performancePeriod" TEXT,
    "workplace" TEXT,
    "bonusPolicy" TEXT,
    "leavePolicy" TEXT,
    "noticePeriodWeeks" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "User_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("address", "avatar", "bankAccountNumber", "bankBranch", "bankName", "benefits", "birthDate", "bloodType", "bonusPolicy", "childrenCount", "confidentialityYears", "contractType", "createdAt", "department", "educationLevel", "email", "emergencyContactName", "emergencyContactPhone", "equipmentList", "iban", "id", "isActive", "jobTitle", "leavePolicy", "maritalStatus", "name", "nonCompeteMonths", "noticePeriodWeeks", "password", "penaltyAmount", "performancePeriod", "phone", "probationMonths", "role", "salary", "socialSecurityNumber", "startDate", "taxNumber", "tckn", "tenantId", "updatedAt", "weeklyHours", "workplace") SELECT "address", "avatar", "bankAccountNumber", "bankBranch", "bankName", "benefits", "birthDate", "bloodType", "bonusPolicy", "childrenCount", "confidentialityYears", "contractType", "createdAt", "department", "educationLevel", "email", "emergencyContactName", "emergencyContactPhone", "equipmentList", "iban", "id", "isActive", "jobTitle", "leavePolicy", "maritalStatus", "name", "nonCompeteMonths", "noticePeriodWeeks", "password", "penaltyAmount", "performancePeriod", "phone", "probationMonths", "role", "salary", "socialSecurityNumber", "startDate", "taxNumber", "tckn", "tenantId", "updatedAt", "weeklyHours", "workplace" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WhatsappConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WhatsappConfig_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WhatsappConfig" ("accessToken", "apiVersion", "id", "isActive", "phoneNumberId", "provider", "tenantId", "twilioAccountSid", "updatedAt") SELECT "accessToken", "apiVersion", "id", "isActive", "phoneNumberId", "provider", "tenantId", "twilioAccountSid", "updatedAt" FROM "WhatsappConfig";
DROP TABLE "WhatsappConfig";
ALTER TABLE "new_WhatsappConfig" RENAME TO "WhatsappConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
