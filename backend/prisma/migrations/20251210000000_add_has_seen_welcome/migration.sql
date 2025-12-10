-- AlterTable
ALTER TABLE "users" ADD COLUMN "hasSeenWelcome" BOOLEAN NOT NULL DEFAULT false;

-- Update existing users to have seen the welcome message
-- This ensures existing users don't see the welcome notification again
UPDATE "users" SET "hasSeenWelcome" = true;
