-- CreateTable
CREATE TABLE "SaviezVousFact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "SaviezVousFact_createdAt_idx" ON "SaviezVousFact"("createdAt");
