-- CreateTable
CREATE TABLE "WordpressPost" (
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

-- CreateIndex
CREATE INDEX "WordpressPost_tenantId_siteId_idx" ON "WordpressPost"("tenantId", "siteId");

-- CreateIndex
CREATE UNIQUE INDEX "WordpressPost_siteId_wpPostId_key" ON "WordpressPost"("siteId", "wpPostId");

