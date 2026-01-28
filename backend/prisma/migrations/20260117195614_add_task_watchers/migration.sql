-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "order" INTEGER NOT NULL DEFAULT 0,
    "mirrorGroupId" TEXT,
    "projectId" TEXT,
    "assigneeId" TEXT,
    "tenantId" TEXT NOT NULL,
    "dueDate" DATETIME,
    "labels" TEXT,
    "checklist" TEXT,
    "checklistTotal" INTEGER NOT NULL DEFAULT 0,
    "checklistCompleted" INTEGER NOT NULL DEFAULT 0,
    "members" TEXT,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "watchers" TEXT,
    "watcherCount" INTEGER NOT NULL DEFAULT 0,
    "attachments" TEXT,
    "attachmentCount" INTEGER NOT NULL DEFAULT 0,
    "coverColor" TEXT,
    "comments" TEXT,
    "activities" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("activities", "assigneeId", "attachmentCount", "attachments", "checklist", "checklistCompleted", "checklistTotal", "comments", "coverColor", "createdAt", "description", "dueDate", "id", "labels", "memberCount", "members", "mirrorGroupId", "order", "priority", "projectId", "status", "tenantId", "title", "updatedAt") SELECT "activities", "assigneeId", "attachmentCount", "attachments", "checklist", "checklistCompleted", "checklistTotal", "comments", "coverColor", "createdAt", "description", "dueDate", "id", "labels", "memberCount", "members", "mirrorGroupId", "order", "priority", "projectId", "status", "tenantId", "title", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
