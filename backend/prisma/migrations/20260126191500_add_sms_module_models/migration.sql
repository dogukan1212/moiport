-- CreateTable
CREATE TABLE "SmsSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'VATANSMS',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SmsSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SmsTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SmsTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SmsTrigger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "recipientType" TEXT NOT NULL DEFAULT 'CUSTOMER_PHONE',
    "templateKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SmsTrigger_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SmsLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "event" TEXT,
    "to" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "providerMessageId" TEXT,
    "error" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SmsLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SmsSettings_tenantId_key" ON "SmsSettings"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "SmsTemplate_tenantId_key_key" ON "SmsTemplate"("tenantId", "key");

-- CreateIndex
CREATE INDEX "SmsTemplate_tenantId_idx" ON "SmsTemplate"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "SmsTrigger_tenantId_event_key" ON "SmsTrigger"("tenantId", "event");

-- CreateIndex
CREATE INDEX "SmsTrigger_tenantId_idx" ON "SmsTrigger"("tenantId");

-- CreateIndex
CREATE INDEX "SmsLog_tenantId_createdAt_idx" ON "SmsLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "SmsLog_tenantId_referenceType_referenceId_idx" ON "SmsLog"("tenantId", "referenceType", "referenceId");
