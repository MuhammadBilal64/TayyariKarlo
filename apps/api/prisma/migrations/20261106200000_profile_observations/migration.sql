-- CreateTable
CREATE TABLE "profile_observations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceSessionId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "dimensionKey" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_observations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "profile_observations_userId_createdAt_idx" ON "profile_observations"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "profile_observations_sourceSessionId_idx" ON "profile_observations"("sourceSessionId");

-- AddForeignKey
ALTER TABLE "profile_observations" ADD CONSTRAINT "profile_observations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
