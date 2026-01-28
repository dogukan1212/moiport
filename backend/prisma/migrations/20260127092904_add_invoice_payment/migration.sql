-- CreateTable
CREATE TABLE "InvoicePayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'PAYTR',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "paytrLinkId" TEXT,
    "paytrLinkUrl" TEXT,
    "paytrMerchantOid" TEXT,
    "rawCallback" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "paidAt" DATETIME,
    CONSTRAINT "InvoicePayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InvoicePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "InvoicePayment_tenantId_invoiceId_idx" ON "InvoicePayment"("tenantId", "invoiceId");

-- CreateIndex
CREATE INDEX "InvoicePayment_tenantId_status_idx" ON "InvoicePayment"("tenantId", "status");

-- CreateIndex
CREATE INDEX "InvoicePayment_tenantId_paytrLinkId_idx" ON "InvoicePayment"("tenantId", "paytrLinkId");

-- CreateIndex
CREATE INDEX "InvoicePayment_tenantId_paytrMerchantOid_idx" ON "InvoicePayment"("tenantId", "paytrMerchantOid");
