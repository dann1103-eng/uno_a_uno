-- Add SUBSTITUTE to Role enum
ALTER TYPE "Role" ADD VALUE 'SUBSTITUTE';

-- Make Student.mentorId optional
ALTER TABLE "students" ALTER COLUMN "mentorId" DROP NOT NULL;

-- Make Session.mentorId optional (for deleted mentors)
ALTER TABLE "sessions" ALTER COLUMN "mentorId" DROP NOT NULL;

-- Update Session FK to SET NULL on mentor delete
ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "sessions_mentorId_fkey";
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
