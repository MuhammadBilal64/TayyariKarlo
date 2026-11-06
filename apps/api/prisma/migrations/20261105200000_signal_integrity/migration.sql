-- CreateTable
CREATE TABLE "signal_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "scenarioVersion" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "experienceLevel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "phase" TEXT NOT NULL DEFAULT 'briefing',
    "simulatedTimeSeconds" INTEGER NOT NULL DEFAULT 0,
    "hiddenState" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signal_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signal_events" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "simulatedTimeSeconds" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signal_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signal_hypotheses" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "claim" TEXT NOT NULL,
    "supportingEvidenceKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "missingEvidence" TEXT,
    "confidence" INTEGER,
    "sequence" INTEGER NOT NULL,
    "supersedesId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signal_hypotheses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signal_decisions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "decisionKey" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "expectedEffect" TEXT NOT NULL,
    "verificationPlan" TEXT NOT NULL,
    "supportingEvidenceKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "outcomeSummary" TEXT,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signal_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signal_evaluations" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "rubricVersion" TEXT NOT NULL,
    "dimensions" JSONB NOT NULL,
    "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "gaps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recommendedPractice" TEXT NOT NULL,
    "overallSummary" TEXT NOT NULL,
    "scenarioExplanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signal_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signal_replays" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "keepOrChange" TEXT NOT NULL,
    "revisedDecisionKey" TEXT,
    "reasoning" TEXT NOT NULL,
    "comparisonNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signal_replays_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "signal_sessions_userId_status_idx" ON "signal_sessions"("userId", "status");

-- CreateIndex
CREATE INDEX "signal_events_sessionId_idx" ON "signal_events"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "signal_events_sessionId_sequence_key" ON "signal_events"("sessionId", "sequence");

-- CreateIndex
CREATE INDEX "signal_hypotheses_sessionId_idx" ON "signal_hypotheses"("sessionId");

-- CreateIndex
CREATE INDEX "signal_decisions_sessionId_idx" ON "signal_decisions"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "signal_evaluations_sessionId_key" ON "signal_evaluations"("sessionId");

-- CreateIndex
CREATE INDEX "signal_replays_sessionId_idx" ON "signal_replays"("sessionId");

-- AddForeignKey
ALTER TABLE "signal_sessions" ADD CONSTRAINT "signal_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signal_events" ADD CONSTRAINT "signal_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "signal_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signal_hypotheses" ADD CONSTRAINT "signal_hypotheses_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "signal_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signal_decisions" ADD CONSTRAINT "signal_decisions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "signal_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signal_evaluations" ADD CONSTRAINT "signal_evaluations_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "signal_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signal_replays" ADD CONSTRAINT "signal_replays_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "signal_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signal_replays" ADD CONSTRAINT "signal_replays_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "signal_decisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
