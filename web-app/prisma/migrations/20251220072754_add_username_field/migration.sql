/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Add username column as nullable first
ALTER TABLE "users" ADD COLUMN "username" TEXT;

-- Step 2: Set username based on email for existing users
UPDATE "users" SET "username" = SPLIT_PART("email", '@', 1) WHERE "username" IS NULL;

-- Step 3: Make username NOT NULL and unique
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;

-- Step 4: Make email optional
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;

-- Step 5: Create unique index
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
