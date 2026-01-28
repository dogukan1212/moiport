-- CreateTable
CREATE TABLE "VatansmsConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "apiId" TEXT,
    "apiKey" TEXT,
    "sender" TEXT,
    "messageType" TEXT NOT NULL DEFAULT 'normal',
    "messageContentType" TEXT NOT NULL DEFAULT 'bilgi',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VatansmsConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "VatansmsConfig_tenantId_key" ON "VatansmsConfig"("tenantId");

