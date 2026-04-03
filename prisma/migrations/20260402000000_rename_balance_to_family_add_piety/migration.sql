-- Rename balance to family
ALTER TABLE "session_evaluations" RENAME COLUMN "balance" TO "family";

-- Add piety column with default value
ALTER TABLE "session_evaluations" ADD COLUMN "piety" INTEGER NOT NULL DEFAULT 3;

-- Add unique constraint to prevent duplicate topics per student
ALTER TABLE "sessions" ADD CONSTRAINT "unique_student_topic" UNIQUE ("studentId", "formationTopic");
