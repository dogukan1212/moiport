-- CreateTable
CREATE TABLE "NetgsmConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "usercode" TEXT,
    "password" TEXT,
    "msgheader" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NetgsmConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "NetgsmConfig_tenantId_key" ON "NetgsmConfig"("tenantId");
