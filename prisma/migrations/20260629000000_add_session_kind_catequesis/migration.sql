-- Add SessionType enum (TOPIC | CATEQUESIS)
CREATE TYPE "SessionType" AS ENUM ('TOPIC', 'CATEQUESIS');

-- Add Session.kind; existing rows default to TOPIC
ALTER TABLE "sessions" ADD COLUMN "kind" "SessionType" NOT NULL DEFAULT 'TOPIC';

-- Drop the (studentId, formationTopic) unique constraint so a student can have
-- several catequesis sessions. Topic uniqueness (kind=TOPIC) is enforced in
-- application code (createSession).
ALTER TABLE "sessions" DROP CONSTRAINT "unique_student_topic";
