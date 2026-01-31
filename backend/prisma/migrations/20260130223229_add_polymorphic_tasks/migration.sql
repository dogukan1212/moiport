-- AlterTable
ALTER TABLE "Task" ADD COLUMN "referenceId" TEXT;
ALTER TABLE "Task" ADD COLUMN "referenceType" TEXT;
ALTER TABLE "Task" ADD COLUMN "tags" TEXT;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "enabledModules" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "industry" TEXT DEFAULT 'AGENCY';
ALTER TABLE "Tenant" ADD COLUMN "industrySubType" TEXT;

-- CreateTable
CREATE TABLE "HealthPatient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "country" TEXT,
    "passportNumber" TEXT,
    "nationality" TEXT,
    "birthDate" DATETIME,
    "gender" TEXT,
    "bloodType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HealthPatient_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HealthPatient_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HealthTreatment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "procedureName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "cost" REAL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "notes" TEXT,
    "doctorName" TEXT,
    "hospitalName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HealthTreatment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HealthTreatment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "HealthPatient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HealthTransfer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "vehicleType" TEXT,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "plateNumber" TEXT,
    "pickupLocation" TEXT NOT NULL,
    "dropoffLocation" TEXT NOT NULL,
    "pickupTime" DATETIME NOT NULL,
    "flightNumber" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HealthTransfer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HealthTransfer_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "HealthPatient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HealthAccommodation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "hotelName" TEXT NOT NULL,
    "roomType" TEXT,
    "checkInDate" DATETIME NOT NULL,
    "checkOutDate" DATETIME NOT NULL,
    "confirmationNumber" TEXT,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'BOOKED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HealthAccommodation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HealthAccommodation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "HealthPatient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StorageFile" (
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
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StorageFile_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "StorageFolder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StorageFile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StorageFile_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StorageFile" ("createdAt", "folderId", "id", "mimeType", "name", "originalName", "path", "provider", "size", "tenantId", "updatedAt", "uploaderId") SELECT "createdAt", "folderId", "id", "mimeType", "name", "originalName", "path", "provider", "size", "tenantId", "updatedAt", "uploaderId" FROM "StorageFile";
DROP TABLE "StorageFile";
ALTER TABLE "new_StorageFile" RENAME TO "StorageFile";
CREATE INDEX "StorageFile_tenantId_folderId_idx" ON "StorageFile"("tenantId", "folderId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "HealthPatient_customerId_key" ON "HealthPatient"("customerId");

-- CreateIndex
CREATE INDEX "Task_tenantId_referenceType_referenceId_idx" ON "Task"("tenantId", "referenceType", "referenceId");
