-- AlterTable - Add badges array to User table
ALTER TABLE "users" ADD COLUMN "badges" TEXT[] DEFAULT ARRAY[]::TEXT[];
