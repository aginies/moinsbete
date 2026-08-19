-- Add ASN incident link to CachedAirCrashArticle
ALTER TABLE "CachedAirCrashArticle" ADD COLUMN "asnId" TEXT;
ALTER TABLE "CachedAirCrashArticle" ADD COLUMN "asnUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CachedAirCrashArticle_asnId_key" ON "CachedAirCrashArticle"("asnId");
