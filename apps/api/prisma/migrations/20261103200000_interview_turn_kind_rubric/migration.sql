-- AlterTable
ALTER TABLE "interview_turns" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'main';
ALTER TABLE "interview_turns" ADD COLUMN "rubric" JSONB;
